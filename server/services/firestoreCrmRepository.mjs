// server/services/firestoreCrmRepository.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuditLogger } from './auditLogger.mjs';
import { FirebaseAdminService } from './firebaseAdminService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');
const LEADS_FILE = path.resolve(BACKUPS_DIR, 'tecnolobia_crm_leads.json');
const DRAFTS_FILE = path.resolve(BACKUPS_DIR, 'tecnolobia_ai_sales_drafts.json');
const LATEST_BACKUP_FILE = path.resolve(BACKUPS_DIR, 'firestore_backup_latest.json');

/**
 * المراحل السبع المعتمدة لدورة حياة العميل في TECHNOLOPIA CRM
 */
export const CRM_LEAD_STAGES = {
  NEW_LEAD: 'NEW_LEAD',             // 1. عميل محتمل جديد
  CONTACTED: 'CONTACTED',           // 2. تم التواصل المبدئي
  INTERESTED: 'INTERESTED',         // 3. أبدى اهتماماً بالخدمة
  PROPOSAL_SENT: 'PROPOSAL_SENT',   // 4. تم إرسال عرض السعر
  NEGOTIATION: 'NEGOTIATION',       // 5. مرحلة التفاوض
  WON: 'WON',                       // 6. تم التعاقد بنجاح (صفقة رابحة)
  LOST: 'LOST'                      // 7. صفقة مفقودة / غير مكتملة
};

/**
 * مصفوفة الانتقالات المشروعة بين مراحل البيع لمنع القفزات غير المنطقية
 */
export const VALID_STAGE_TRANSITIONS = {
  NEW_LEAD: ['CONTACTED', 'LOST'],
  CONTACTED: ['INTERESTED', 'LOST', 'NEW_LEAD'],
  INTERESTED: ['PROPOSAL_SENT', 'NEGOTIATION', 'LOST', 'CONTACTED'],
  PROPOSAL_SENT: ['NEGOTIATION', 'WON', 'LOST', 'INTERESTED'],
  NEGOTIATION: ['WON', 'LOST', 'PROPOSAL_SENT'],
  WON: ['NEGOTIATION', 'WON'], // مرحلة إتمام تعاقد
  LOST: ['NEW_LEAD', 'CONTACTED'] // إمكانية إعادة التنشيط
};

export const FIRESTORE_CRM_COLLECTIONS = {
  CRM_LEADS: 'tecnolobia_crm_leads',
  AI_SALES_DRAFTS: 'tecnolobia_ai_sales_drafts',
  AI_AUDIT_LOGS: 'tecnolobia_ai_audit_logs',
  LEGACY_CLIENTS: 'tecnolobia_clients'
};

/**
 * محاكي تخزين Firestore المعزول في الذاكرة لبيئة الاختبارات والتطوير الآمن
 * يطبق دلالات Firestore بدقة دون إجراء أي كتابة على قاعدة بيانات الإنتاج الحية
 */
class IsolatedInMemoryFirestoreStore {
  constructor() {
    this.collections = new Map();
  }

  getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name);
  }

  set(collName, docId, data) {
    const col = this.getCollection(collName);
    col.set(docId, JSON.parse(JSON.stringify(data)));
  }

  get(collName, docId) {
    const col = this.getCollection(collName);
    const doc = col.get(docId);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  list(collName) {
    const col = this.getCollection(collName);
    return Array.from(col.values()).map(d => JSON.parse(JSON.stringify(d)));
  }

  delete(collName, docId) {
    const col = this.getCollection(collName);
    return col.delete(docId);
  }

  clear(collName) {
    if (collName) {
      this.getCollection(collName).clear();
    } else {
      this.collections.clear();
    }
  }

  count(collName) {
    return this.getCollection(collName).size;
  }
}

/**
 * مستودع Firestore الموحد لإدارة علاقات العملاء وفرص النمو
 * (Unified Cloud Firestore CRM Data Engine)
 */
export class FirestoreCrmRepository {
  static #isolatedStore = new IsolatedInMemoryFirestoreStore();
  static #useIsolatedMode = null;
  static #initialized = false;

  /**
   * تفعيل أو تعطيل وضع الاختبار المعزول (Isolated Test Mode)
   */
  static setIsolatedMode(enabled = true) {
    this.#useIsolatedMode = Boolean(enabled);
    if (enabled && !this.#initialized) {
      this.initFromLocalBackupIfEmpty();
    }
  }

  static isIsolatedMode() {
    if (this.#useIsolatedMode !== null) {
      return this.#useIsolatedMode;
    }
    if (FirebaseAdminService.isCloudMode() || process.env.CRM_LIVE_FIRESTORE === 'true') {
      return false; // في البيئة السحابية أو نمط الاتصال الحي: الحظر الصريح للنمط المعزول والاعتماد الحصري على Firestore
    }
    return true; // في بيئات التطوير والاختبار المحلية: الوضع الافتراضي هو العزل التام في الذاكرة
  }

  /**
   * تنظيف وتجهيز الكائنات لكتابتها في Firestore دون أخطاء undefined أو حقول runtime غير قابلة للترميز
   */
  static cleanForFirestore(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined || typeof val === 'function' || (val && typeof val.then === 'function') || key.startsWith('_')) {
        continue;
      }
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = this.cleanForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }

  static getIsolatedStore() {
    return this.#isolatedStore;
  }

  /**
   * تهيئة المستودع من ملف النسخ الاحتياطي المحلي إذا كان فارغاً
   */
  static initFromLocalBackupIfEmpty() {
    if (this.#initialized) return;
    
    // تحميل بيانات الـ CRM الأساسية في المستودع المعزول
    if (fs.existsSync(LEADS_FILE)) {
      try {
        const raw = fs.readFileSync(LEADS_FILE, 'utf8');
        const leads = JSON.parse(raw);
        if (Array.isArray(leads)) {
          leads.forEach(l => {
            const unified = this.normalizeLeadSchema(l);
            this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, unified.id, unified);
          });
        }
      } catch (err) {
        console.warn('Notice loading initial CRM leads into repository:', err.message);
      }
    }

    // تحميل مسودات المبيعات
    if (fs.existsSync(DRAFTS_FILE)) {
      try {
        const raw = fs.readFileSync(DRAFTS_FILE, 'utf8');
        const drafts = JSON.parse(raw);
        if (Array.isArray(drafts)) {
          drafts.forEach(d => {
            this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.AI_SALES_DRAFTS, d.id, d);
          });
        }
      } catch (err) {
        console.warn('Notice loading initial sales drafts:', err.message);
      }
    }

    this.#initialized = true;
  }

  /**
   * توحيد مخطط بيانات العميل (Schema Normalization)
   * يضمن التوافق التام بين النموذج القديم tecnolobia_clients والنموذج الحديث 7-Stage CRM
   */
  static normalizeLeadSchema(raw) {
    const id = raw.id || raw._id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const businessName = (raw.businessName || raw.name || 'عميل غير مسمى').trim();
    const industry = raw.industry || raw.businessType || 'عام وتجاري';
    const softwareNeed = raw.softwareNeed || raw.requestedService || 'استشارة وحل برمجي';
    const source = raw.source || 'direct_sales';

    // مطابقة مرحلة البيع القديمة إلى المراحل السبع المعتمدة
    let stage = raw.stage || CRM_LEAD_STAGES.NEW_LEAD;
    if (stage === 'lead') stage = CRM_LEAD_STAGES.NEW_LEAD;
    else if (stage === 'contacted') stage = CRM_LEAD_STAGES.CONTACTED;
    else if (stage === 'interested') stage = CRM_LEAD_STAGES.INTERESTED;
    else if (stage === 'quote_sent') stage = CRM_LEAD_STAGES.PROPOSAL_SENT;
    else if (stage === 'negotiation') stage = CRM_LEAD_STAGES.NEGOTIATION;
    else if (['agreed', 'in_progress', 'delivered', 'retained'].includes(stage)) stage = CRM_LEAD_STAGES.WON;
    else if (stage === 'lost') stage = CRM_LEAD_STAGES.LOST;

    if (!Object.values(CRM_LEAD_STAGES).includes(stage)) {
      stage = CRM_LEAD_STAGES.NEW_LEAD;
    }

    const dealValueEstimate = Number(raw.dealValueEstimate) || Number(raw.dealValue) || Number(raw.expectedBudget) || 0;
    const collectedAmount = Number(raw.collectedAmount) || 0;
    const invoicedAmount = Number(raw.invoicedAmount) || 0;
    const outstandingBalance = Math.max(0, dealValueEstimate - collectedAmount);

    const phone = raw.contactInfo?.phone || raw.phone || '';
    const assignedPartner = raw.assignedPartner || raw.assignedTo || 'mohamed';
    const ownerPartnerId = raw.ownerPartnerId || (assignedPartner !== 'both' ? assignedPartner : 'mohamed');

    return {
      id,
      legacyClientId: raw.id?.startsWith('client-') ? raw.id : undefined,
      businessName,
      name: businessName, // للتوافق العكسي
      industry,
      businessType: industry, // للتوافق العكسي
      softwareNeed,
      requestedService: softwareNeed, // للتوافق العكسي
      source,
      stage,
      priority: raw.priority || 'medium',
      dealProbability: Number(raw.dealProbability) || (stage === CRM_LEAD_STAGES.WON ? 100 : 30),
      
      // الفصل المالي الصارم
      dealValueEstimate,
      dealValue: dealValueEstimate, // للتوافق العكسي
      expectedBudget: dealValueEstimate, // للتوافق العكسي
      collectedAmount,
      invoicedAmount,
      outstandingBalance,
      isContractSigned: Boolean(raw.isContractSigned || stage === CRM_LEAD_STAGES.WON),
      isPaymentCollected: Boolean(raw.isPaymentCollected || (collectedAmount >= dealValueEstimate && dealValueEstimate > 0)),

      // حوكمة الشريكين والعزل
      assignedPartner,
      assignedTo: assignedPartner, // للتوافق العكسي
      ownerPartnerId,
      isPrivate: Boolean(raw.isPrivate),

      // معلومات الاتصال
      contactInfo: {
        contactPerson: raw.contactInfo?.contactPerson || raw.contactPerson || businessName,
        phone: String(phone).trim(),
        email: raw.contactInfo?.email || raw.email || '',
        city: raw.contactInfo?.city || raw.city || 'الإسكندرية',
        address: raw.contactInfo?.address || raw.address || ''
      },
      phone: String(phone).trim(), // للتوافق العكسي

      notes: Array.isArray(raw.notes) ? raw.notes : (raw.notes ? [raw.notes] : []),
      privateNotes: Array.isArray(raw.privateNotes) ? raw.privateNotes : [],
      lastContactDate: raw.lastContactDate || raw.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      nextFollowUpDate: raw.nextFollowUpDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      history: Array.isArray(raw.history) && raw.history.length > 0 ? raw.history : [
        {
          fromStage: 'NONE',
          toStage: stage,
          changedBy: ownerPartnerId,
          changedAt: raw.createdAt || new Date().toISOString(),
          note: 'تسجيل العميل في قاعدة بيانات CRM الموحدة'
        }
      ],
      linkedTasks: Array.isArray(raw.linkedTasks) ? raw.linkedTasks : [],
      isRealProspect: true,
      sourceOfTruth: 'firestore',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  /**
   * تنقية العميل من الملاحظات السرية الخاصة بشريك آخر
   */
  static #sanitizeLeadForPartner(lead, partnerId) {
    if (!lead) return null;
    const sanitized = { ...lead };
    if (Array.isArray(sanitized.privateNotes)) {
      sanitized.privateNotes = sanitized.privateNotes.filter(n => n.partnerId === partnerId);
    }
    return sanitized;
  }

  /**
   * استرجاع جميع العملاء مع الفلترة وعزل بيانات الشريك الخاصة
   */
  static getLeads(filters = {}, partner = null) {
    this.initFromLocalBackupIfEmpty();
    let leads = this.#isolatedStore.list(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS);
    const partnerId = partner?.partnerId || partner?.id;

    // عزل العملاء الخاصين
    if (partnerId) {
      leads = leads.filter(l => {
        if (!l.isPrivate) return true;
        return l.ownerPartnerId === partnerId || l.assignedPartner === partnerId;
      });
    }

    if (filters.stage && filters.stage !== 'all') {
      leads = leads.filter(l => l.stage === filters.stage);
    }
    if (filters.assignedPartner && filters.assignedPartner !== 'all') {
      leads = leads.filter(l => l.assignedPartner === filters.assignedPartner || l.assignedPartner === 'both');
    }
    if (filters.priority && filters.priority !== 'all') {
      leads = leads.filter(l => l.priority === filters.priority);
    }
    if (filters.source && filters.source !== 'all') {
      leads = leads.filter(l => l.source === filters.source);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(l => 
        (l.businessName && l.businessName.toLowerCase().includes(q)) ||
        (l.contactInfo?.phone && l.contactInfo.phone.includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q)) ||
        (l.softwareNeed && l.softwareNeed.toLowerCase().includes(q))
      );
    }

    if (partnerId) {
      leads = leads.map(l => this.#sanitizeLeadForPartner(l, partnerId));
    }

    return leads;
  }

  /**
   * استرجاع عميل محدد بالمعرف مع التحقق من الصلاحيات
   */
  static getLeadById(id, partner = null) {
    this.initFromLocalBackupIfEmpty();
    const lead = this.#isolatedStore.get(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, id);
    if (!lead) return null;

    const partnerId = partner?.partnerId || partner?.id;
    if (partnerId && lead.isPrivate && lead.ownerPartnerId !== partnerId && lead.assignedPartner !== partnerId) {
      const err = new Error(`غير مصرح: العميل (${id}) مسجل كفرصة خاصة بالشريك الآخر.`);
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      err.status = 403;
      throw err;
    }

    return partnerId ? this.#sanitizeLeadForPartner(lead, partnerId) : lead;
  }

  /**
   * إنشاء عميل محتمل جديد مع الكشف عن التكرار والمطابقة الصارمة
   * في البيئة السحابية: الحفظ الدائم في Firestore إلزامي قبل إرجاع أي نجاح (Fail-Closed)
   */
  static createLead(payload, partner) {
    this.initFromLocalBackupIfEmpty();

    if (!payload.businessName || typeof payload.businessName !== 'string' || !payload.businessName.trim()) {
      const err = new Error('اسم المنشأة/العميل مطلوب (businessName)');
      err.code = 'INVALID_LEAD_DATA';
      throw err;
    }

    const phone = payload.contactInfo?.phone || payload.phone;
    if (!phone) {
      const err = new Error('رقم هاتف العميل مطلوب للتواصل المشروع');
      err.code = 'INVALID_LEAD_DATA';
      throw err;
    }

    // التحقق من تكرار الهاتف
    const allLeads = this.getLeads({}, partner);
    const existing = allLeads.find(l => l.contactInfo?.phone === String(phone).trim() || l.phone === String(phone).trim());
    if (existing) {
      const err = new Error(`العميل (${payload.businessName}) مسجل مسبقاً بنفس رقم الهاتف (${phone}). المعرف: ${existing.id}`);
      err.code = 'DUPLICATE_LEAD';
      throw err;
    }

    const partnerId = partner?.partnerId || partner?.id || 'mohamed';
    const normalized = this.normalizeLeadSchema({
      ...payload,
      ownerPartnerId: payload.ownerPartnerId || partnerId,
      assignedPartner: payload.assignedPartner || partnerId
    });

    // 1. في البيئة السحابية: الحفظ الدائم في Cloud Firestore إلزامي ولا تراجع عنه (Fail-Closed)
    if (!this.isIsolatedMode() || FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: Cloud mode requires durable Firestore persistence. Mutation rejected.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }

      const collName = FirebaseAdminService.getCollectionName(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS);
      try {
        const payloadToPersist = this.cleanForFirestore(normalized);
        db.collection(collName).doc(normalized.id).set(payloadToPersist);
      } catch (dbErr) {
        const err = new Error(`FIRESTORE_WRITE_FAILED: فشل الحفظ الدائم للعميل في Firestore: ${dbErr.message}`);
        err.code = 'FIRESTORE_WRITE_FAILED';
        err.status = 503;
        throw err;
      }
    }

    // 2. تحديث المخزن المحلي الداخلي
    this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, normalized.id, normalized);

    AuditLogger.log({
      partnerId,
      eventType: 'CRM_LEAD_CREATED',
      inputPayload: {
        leadId: normalized.id,
        businessName: normalized.businessName,
        phone: normalized.contactInfo.phone,
        dealValueEstimate: normalized.dealValueEstimate
      },
      outputSummary: `تم إنشاء عميل جديد (${normalized.businessName}) في مستودع Firestore الموحد.`,
      status: 'SUCCESS'
    });

    return normalized;
  }

  /**
   * تحديث مرحلة العميل في دورة البيع
   * في البيئة السحابية: الحفظ الدائم في Firestore إلزامي (Fail-Closed)
   */
  static updateLeadStage(id, targetStage, note, partner) {
    this.initFromLocalBackupIfEmpty();

    if (!Object.values(CRM_LEAD_STAGES).includes(targetStage)) {
      const err = new Error(`المرحلة المطلوبة (${targetStage}) غير معتمدة في المنظومة.`);
      err.code = 'INVALID_STAGE';
      throw err;
    }

    const currentLead = this.#isolatedStore.get(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, id);
    if (!currentLead) {
      const err = new Error(`العميل بالمعرف (${id}) غير موجود.`);
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    const partnerId = partner?.partnerId || partner?.id || 'mohamed';
    if (partnerId && currentLead.isPrivate && currentLead.ownerPartnerId !== partnerId && currentLead.assignedPartner !== partnerId) {
      const err = new Error('غير مصرح: لا تملك صلاحية تعديل عميل خاص بالشريك الآخر.');
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      err.status = 403;
      throw err;
    }

    const fromStage = currentLead.stage;
    const allowedTargets = VALID_STAGE_TRANSITIONS[fromStage] || [];
    if (fromStage !== targetStage && !allowedTargets.includes(targetStage)) {
      const err = new Error(`انتقال غير مسموح به من مرحلة (${fromStage}) إلى (${targetStage}). الانتقالات المسموحة: ${allowedTargets.join(', ')}`);
      err.code = 'INVALID_STAGE_TRANSITION';
      throw err;
    }

    currentLead.stage = targetStage;
    currentLead.updatedAt = new Date().toISOString();
    currentLead.lastContactDate = new Date().toISOString().split('T')[0];

    // تحديث مؤشرات التعاقد عند الوصول لمرحلة WON
    if (targetStage === CRM_LEAD_STAGES.WON) {
      currentLead.isContractSigned = true;
      currentLead.dealProbability = 100;
    }

    currentLead.history.push({
      fromStage,
      toStage: targetStage,
      changedBy: partnerId,
      changedAt: new Date().toISOString(),
      note: note || `ترقية المرحلة من ${fromStage} إلى ${targetStage}`
    });

    // 1. في البيئة السحابية: تحديث دائم في Cloud Firestore
    if (!this.isIsolatedMode() || FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: Cloud mode requires durable Firestore persistence. Stage update rejected.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }

      const collName = FirebaseAdminService.getCollectionName(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS);
      try {
        const payloadToPersist = this.cleanForFirestore(currentLead);
        db.collection(collName).doc(id).set(payloadToPersist, { merge: true });
      } catch (dbErr) {
        const err = new Error(`FIRESTORE_UPDATE_FAILED: فشل التحديث الدائم لمرحلة العميل في Firestore: ${dbErr.message}`);
        err.code = 'FIRESTORE_UPDATE_FAILED';
        err.status = 503;
        throw err;
      }
    }

    this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, id, currentLead);

    AuditLogger.log({
      partnerId,
      eventType: 'CRM_STAGE_UPDATED',
      inputPayload: { leadId: id, fromStage, toStage: targetStage },
      outputSummary: `تم تحديث مرحلة العميل (${currentLead.businessName}) إلى ${targetStage}`,
      status: 'SUCCESS'
    });

    return currentLead;
  }

  /**
   * إضافة ملاحظة للعميل (عامة أو خاصة)
   */
  static addNote(id, noteText, partner, isPrivate = false) {
    this.initFromLocalBackupIfEmpty();

    if (!noteText || typeof noteText !== 'string' || !noteText.trim()) {
      throw new Error('نص الملاحظة مطلوب ولا يمكن أن يكون فارغاً.');
    }

    const currentLead = this.#isolatedStore.get(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, id);
    if (!currentLead) {
      throw new Error(`العميل بالمعرف (${id}) غير موجود.`);
    }

    const partnerId = partner?.partnerId || partner?.id || 'mohamed';
    if (currentLead.isPrivate && currentLead.ownerPartnerId !== partnerId && currentLead.assignedPartner !== partnerId) {
      const err = new Error('غير مصرح: لا تملك صلاحية إضافة ملاحظات على عميل خاص بشريك آخر.');
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      err.status = 403;
      throw err;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (isPrivate) {
      if (!Array.isArray(currentLead.privateNotes)) currentLead.privateNotes = [];
      currentLead.privateNotes.push({
        id: `pnote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partnerId,
        partnerName: partner?.name || partnerId,
        timestamp,
        text: noteText.trim()
      });
    } else {
      const partnerName = partner?.name || (partnerId === 'mohamed' ? 'المهندس محمد البحر' : 'المهندس طارق حافظ');
      currentLead.notes.push(`[${timestamp} - ${partnerName}]: ${noteText.trim()}`);
    }

    currentLead.updatedAt = new Date().toISOString();

    // في البيئة السحابية: حفظ دائم في Firestore
    if (!this.isIsolatedMode() || FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: Cloud mode requires durable Firestore persistence. Note rejected.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }

      const collName = FirebaseAdminService.getCollectionName(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS);
      try {
        const payloadToPersist = this.cleanForFirestore(currentLead);
        db.collection(collName).doc(id).set(payloadToPersist, { merge: true });
      } catch (dbErr) {
        const err = new Error(`FIRESTORE_NOTE_WRITE_FAILED: فشل الحفظ الدائم للملاحظة: ${dbErr.message}`);
        err.code = 'FIRESTORE_NOTE_WRITE_FAILED';
        err.status = 503;
        throw err;
      }
    }

    this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, id, currentLead);

    AuditLogger.log({
      partnerId,
      eventType: isPrivate ? 'CRM_PRIVATE_NOTE_ADDED' : 'CRM_NOTE_ADDED',
      inputPayload: { leadId: id, isPrivate },
      status: 'SUCCESS'
    });

    return this.#sanitizeLeadForPartner(currentLead, partnerId);
  }

  /**
   * حساب ملخص مسار المبيعات ومؤشرات الأداء
   */
  static getAnalytics(partner = null) {
    this.initFromLocalBackupIfEmpty();
    const leads = this.getLeads({}, partner);
    const now = new Date().toISOString().split('T')[0];

    const stageBreakdown = {};
    Object.values(CRM_LEAD_STAGES).forEach(s => {
      stageBreakdown[s] = { count: 0, totalValue: 0 };
    });

    const sourceDistribution = {};
    let totalPipelineValue = 0;
    let totalContractedWonValue = 0;
    let totalCollectedCash = 0;
    let totalOutstandingReceivables = 0;
    let wonCount = 0;
    let lostCount = 0;
    const overdueFollowUps = [];

    const partnerPerformance = {
      mohamed: { assignedCount: 0, wonCount: 0, pipelineValue: 0, wonValue: 0, collectedCash: 0 },
      tarek: { assignedCount: 0, wonCount: 0, pipelineValue: 0, wonValue: 0, collectedCash: 0 }
    };

    leads.forEach(l => {
      const val = Number(l.dealValueEstimate) || 0;
      const collected = Number(l.collectedAmount) || 0;
      const stage = l.stage;

      totalCollectedCash += collected;

      if (stageBreakdown[stage]) {
        stageBreakdown[stage].count += 1;
        stageBreakdown[stage].totalValue += val;
      }

      sourceDistribution[l.source] = (sourceDistribution[l.source] || 0) + 1;

      if (['NEW_LEAD', 'CONTACTED', 'INTERESTED', 'PROPOSAL_SENT', 'NEGOTIATION'].includes(stage)) {
        totalPipelineValue += val;
        totalOutstandingReceivables += Math.max(0, val - collected);
      }

      if (stage === CRM_LEAD_STAGES.WON) {
        wonCount += 1;
        totalContractedWonValue += val;
        totalOutstandingReceivables += Math.max(0, val - collected);
      } else if (stage === CRM_LEAD_STAGES.LOST) {
        lostCount += 1;
      }

      const assigned = l.assignedPartner;
      if (assigned === 'mohamed' || assigned === 'tarek') {
        partnerPerformance[assigned].assignedCount += 1;
        partnerPerformance[assigned].collectedCash += collected;
        if (stage === CRM_LEAD_STAGES.WON) {
          partnerPerformance[assigned].wonCount += 1;
          partnerPerformance[assigned].wonValue += val;
        } else if (stage !== CRM_LEAD_STAGES.LOST) {
          partnerPerformance[assigned].pipelineValue += val;
        }
      }

      if (l.nextFollowUpDate && l.nextFollowUpDate < now && stage !== CRM_LEAD_STAGES.WON && stage !== CRM_LEAD_STAGES.LOST) {
        overdueFollowUps.push({
          id: l.id,
          businessName: l.businessName,
          phone: l.contactInfo?.phone,
          stage: l.stage,
          assignedPartner: l.assignedPartner,
          nextFollowUpDate: l.nextFollowUpDate
        });
      }
    });

    const closedDeals = wonCount + lostCount;
    const conversionRate = closedDeals > 0 ? Number(((wonCount / closedDeals) * 100).toFixed(1)) : 0;

    return {
      totalLeads: leads.length,
      activePipelineCount: leads.filter(l => !['WON', 'LOST'].includes(l.stage)).length,
      totalPipelineValue,
      totalWonValue: totalContractedWonValue, // للتوافق العكسي: إجمالي قيمة التعاقدات المغلقة
      totalContractedWonValue,
      totalCollectedCash,
      outstandingReceivables: totalOutstandingReceivables, // للتوافق العكسي
      totalOutstandingReceivables,
      financialDistinctionNotice: 'تحذير مالي رقابي: انتقال العميل إلى مرحلة WON يمثل إبرام التعاقد فقط ولا يُعد دليلاً على تحصيل الأموال. التحصيل المالي الفعلي يُقيد حصراً بإيصالات المعاملات النقدية والبنكية.',
      conversionRate,
      wonCount,
      lostCount,
      stageBreakdown,
      sourceDistribution,
      partnerPerformance,
      overdueFollowUpsCount: overdueFollowUps.length,
      overdueFollowUps,
      currentPartnerRole: partner?.role || 'partner'
    };
  }

  /**
   * إدارة مسودات عروض أسعار الذكاء الاصطناعي
   */
  static getSalesDrafts(leadId = null, partner = null) {
    this.initFromLocalBackupIfEmpty();
    let drafts = this.#isolatedStore.list(FIRESTORE_CRM_COLLECTIONS.AI_SALES_DRAFTS);
    if (leadId) drafts = drafts.filter(d => d.leadId === leadId);

    const partnerId = partner?.partnerId || partner?.id;
    if (partnerId) {
      drafts = drafts.filter(d => !d.isPrivate || d.createdByPartner === partnerId || d.partnerId === partnerId);
    }
    return drafts;
  }

  static saveSalesDraft(draftData, partner) {
    this.initFromLocalBackupIfEmpty();
    const partnerId = draftData.partnerId || draftData.createdByPartner || partner?.partnerId || partner?.id || 'mohamed';

    const draft = {
      id: draftData.id || `sales-draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: draftData.leadId,
      businessName: draftData.businessName,
      strategySummary: draftData.strategySummary || draftData.needsAnalysis || '',
      serviceRecommendation: draftData.serviceRecommendation || draftData.recommendedService || '',
      suggestedPricingRange: draftData.suggestedPricingRange || {
        minimumEgp: 5000,
        recommendedEgp: 8000,
        maximumEgp: 12000,
        currency: 'EGP',
        pricingModel: 'Fixed + Support'
      },
      pricingDisclaimer: draftData.pricingDisclaimer || 'تقدير استرشادي غير ملزم لشركة TECHNOLOPIA، يخضع لموافقة الشريكين المؤسسين.',
      pricingNote: draftData.pricingNote || 'تقدير استرشادي غير ملزم لشركة TECHNOLOPIA، يخضع لموافقة الشريكين المؤسسين.',
      outreachPitchMessage: draftData.outreachPitchMessage || '',
      negotiationStrategy: draftData.negotiationStrategy || '',
      status: draftData.status || 'pending_partner_review',
      requiresPartnerApproval: draftData.requiresPartnerApproval !== undefined ? draftData.requiresPartnerApproval : true,
      createdByPartner: partnerId,
      partnerId, // للتوافق العكسي
      isPrivate: Boolean(draftData.isPrivate),
      isOfficialPrice: Boolean(draftData.isOfficialPrice),
      isBindingOffer: Boolean(draftData.isBindingOffer),
      createdAt: draftData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...draftData
    };

    if (!draft.serviceRecommendation && draft.recommendedService) draft.serviceRecommendation = draft.recommendedService;
    if (!draft.recommendedService && draft.serviceRecommendation) draft.recommendedService = draft.serviceRecommendation;
    if (!draft.strategySummary && draft.needsAnalysis) draft.strategySummary = draft.needsAnalysis;

    this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.AI_SALES_DRAFTS, draft.id, draft);

    AuditLogger.log({
      partnerId,
      eventType: 'AI_SALES_DRAFT_CREATED',
      inputPayload: { draftId: draft.id, leadId: draft.leadId },
      outputSummary: `تم إنشاء مسودة عرض سعر غير ملزمة للعميل (${draft.businessName})`,
      status: 'SUCCESS'
    });

    return draft;
  }

  static updateSalesDraft(draftId, updates, partner) {
    this.initFromLocalBackupIfEmpty();
    const draft = this.#isolatedStore.get(FIRESTORE_CRM_COLLECTIONS.AI_SALES_DRAFTS, draftId);
    if (!draft) throw new Error(`المسودة (${draftId}) غير موجودة.`);

    const partnerId = partner?.partnerId || partner?.id || 'mohamed';
    const draftOwner = draft.createdByPartner || draft.partnerId;
    if (draft.isPrivate && draftOwner !== partnerId) {
      const err = new Error('FORBIDDEN_NOT_DRAFT_OWNER: لا تملك صلاحية تعديل مسودة خاصة بشريك آخر.');
      err.code = 'FORBIDDEN_NOT_DRAFT_OWNER';
      err.status = 403;
      throw err;
    }

    const updated = {
      ...draft,
      ...updates,
      updatedAt: new Date().toISOString(),
      reviewedByPartner: partnerId
    };

    this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.AI_SALES_DRAFTS, draftId, updated);
    return updated;
  }

  /**
   * معاينة ترحيل البيانات السحابية (Migration Preview / Dry Run)
   * يفحص السجلات، يكتشف التكرار، ويولد تقريراً تحليلياً شاملاً دون إجراء أي كتابة على قواعد البيانات
   */
  static previewMigration(options = {}) {
    const sourceFilePath = options.sourceFile || LEADS_FILE;
    const backupSnapshotPath = options.backupFile || LATEST_BACKUP_FILE;

    const report = {
      mode: 'DRY_RUN_PREVIEW',
      timestamp: new Date().toISOString(),
      sourceFile: sourceFilePath,
      totalSourceRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicateCount: 0,
      legacyClientRecordsFound: 0,
      duplicates: [],
      validationErrors: [],
      stagesBreakdown: {},
      financialEstimateTotal: 0,
      targetCollection: FIRESTORE_CRM_COLLECTIONS.CRM_LEADS,
      isProductionWriteBlocked: true,
      readyToMigrate: false
    };

    let rawRecords = [];
    if (fs.existsSync(sourceFilePath)) {
      try {
        rawRecords = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
      } catch (err) {
        report.validationErrors.push(`فشل قراءة ملف المصدر: ${err.message}`);
        return report;
      }
    }

    // فحص عملاء النسخة الاحتياطية القديمة لضمان عدم ضياع أي سجل
    let legacyClients = [];
    if (fs.existsSync(backupSnapshotPath)) {
      try {
        const backupData = JSON.parse(fs.readFileSync(backupSnapshotPath, 'utf8'));
        legacyClients = backupData.collections?.tecnolobia_clients || [];
        report.legacyClientRecordsFound = legacyClients.length;
      } catch {
        // ignore
      }
    }

    report.totalSourceRecords = rawRecords.length;

    const seenPhones = new Set();
    const seenIds = new Set();

    rawRecords.forEach((record, index) => {
      const phone = record.contactInfo?.phone || record.phone;
      const id = record.id;

      if (!record.businessName && !record.name) {
        report.invalidRecords += 1;
        report.validationErrors.push(`السجل رقم ${index} يفتقر لاسم المنشأة.`);
        return;
      }

      if (!phone) {
        report.invalidRecords += 1;
        report.validationErrors.push(`العميل (${record.businessName || record.name}) يفتقر لرقم الهاتف.`);
        return;
      }

      if (seenPhones.has(phone)) {
        report.duplicateCount += 1;
        report.duplicates.push({ id, businessName: record.businessName, phone });
        return;
      }
      seenPhones.add(phone);
      seenIds.add(id);

      report.validRecords += 1;
      const stage = record.stage || 'NEW_LEAD';
      report.stagesBreakdown[stage] = (report.stagesBreakdown[stage] || 0) + 1;
      report.financialEstimateTotal += Number(record.dealValueEstimate || record.dealValue || 0);
    });

    report.readyToMigrate = report.validRecords > 0 && report.validationErrors.length === 0;
    return report;
  }

  /**
   * تنفيذ ترحيل آمن وتكراري (Idempotent Migration)
   * يطبق الترحيل فقط على المستودع المعزول أو محاكي Firestore مع توثيق السجلات
   */
  static executeMigration(options = {}) {
    if (options.dryRun !== false) {
      return this.previewMigration(options);
    }

    const preview = this.previewMigration(options);
    if (!preview.readyToMigrate) {
      throw new Error(`تعذر الترحيل: توجد أخطاء في البيانات المصدرية (${preview.validationErrors.join(', ')})`);
    }

    const sourceFilePath = options.sourceFile || LEADS_FILE;
    const rawRecords = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));

    const beforeCount = this.#isolatedStore.count(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS);
    let migratedCount = 0;
    let skippedDuplicates = 0;

    const existingPhones = new Set(
      this.#isolatedStore.list(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS).map(l => l.contactInfo?.phone).filter(Boolean)
    );

    rawRecords.forEach(record => {
      const phone = record.contactInfo?.phone || record.phone;
      if (existingPhones.has(phone) && !options.overwriteDuplicates) {
        skippedDuplicates += 1;
        return;
      }

      const normalized = this.normalizeLeadSchema(record);
      this.#isolatedStore.set(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS, normalized.id, normalized);
      existingPhones.add(phone);
      migratedCount += 1;
    });

    const afterCount = this.#isolatedStore.count(FIRESTORE_CRM_COLLECTIONS.CRM_LEADS);

    const result = {
      success: true,
      mode: 'ISOLATED_IDEMPOTENT_MIGRATION',
      beforeCount,
      afterCount,
      migratedCount,
      skippedDuplicates,
      timestamp: new Date().toISOString(),
      targetCollection: FIRESTORE_CRM_COLLECTIONS.CRM_LEADS
    };

    AuditLogger.log({
      partnerId: options.partnerId || 'system',
      eventType: 'CRM_MIGRATION_EXECUTED',
      inputPayload: { beforeCount, migratedCount, afterCount },
      outputSummary: `تم ترحيل ${migratedCount} عميلاً إلى مستودع Firestore الموحد المعزول بنجاح.`,
      status: 'SUCCESS'
    });

    return result;
  }
}
