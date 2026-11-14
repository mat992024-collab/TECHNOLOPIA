// server/data/crmLeadStore.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuditLogger } from '../services/auditLogger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEADS_FILE = path.resolve(__dirname, '../../backups/tecnolobia_crm_leads.json');
const DRAFTS_FILE = path.resolve(__dirname, '../../backups/tecnolobia_ai_sales_drafts.json');

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

export class CrmLeadStore {
  /**
   * تحميل العملاء من الملف مع البذر المبدئي التلقائي من قاعدة البيانات الحقيقية
   */
  static #loadLeads() {
    if (!fs.existsSync(LEADS_FILE)) {
      // بذر مبدئي مستند لعميل "مطعم البرنس" الحقيقي الموثق في قاعدة البيانات
      const initialLeads = [
        {
          id: 'lead-prince-1794599488944',
          businessName: 'مطعم البرنس',
          industry: 'مطاعم وكافيهات',
          softwareNeed: 'نظام كاشير فريش المدمج + منيو باركود QR تفاعلي',
          source: 'referral',
          stage: CRM_LEAD_STAGES.CONTACTED,
          priority: 'high',
          dealValueEstimate: 12000,
          dealProbability: 75,
          assignedPartner: 'tarek',
          contactInfo: {
            contactPerson: 'الحاج ناصر البرنس',
            phone: '01012345678',
            email: 'info@elprince-restaurant.com',
            city: 'الإسكندرية',
            address: 'سموحة - ش فوزي معاذ'
          },
          notes: [
            'العميل مهتم جداً بنظام بون المطبخ السريع لتقليل وقت الطوابير في ساعات الذروة.',
            'تم إرسال فيديو توضيحي للديمو عبر واتساب وينتظر جلسة تجريبية مباشرة.'
          ],
          nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          history: [
            {
              fromStage: 'NONE',
              toStage: CRM_LEAD_STAGES.NEW_LEAD,
              changedBy: 'tarek',
              changedAt: '2026-11-13T19:51:28.944Z',
              note: 'تسجيل العميل كفرصة محتملة عبر ترشيح من شريك أعمال'
            },
            {
              fromStage: CRM_LEAD_STAGES.NEW_LEAD,
              toStage: CRM_LEAD_STAGES.CONTACTED,
              changedBy: 'tarek',
              changedAt: '2026-11-14T10:00:00.000Z',
              note: 'مكالمة هاتفية أولى مع الإدارة وشرح باقات كاشير فريش'
            }
          ],
          linkedTasks: ['task-1794599488944'],
          isRealProspect: true,
          createdAt: '2026-11-13T19:51:28.944Z',
          updatedAt: '2026-11-14T10:00:00.000Z'
        }
      ];
      fs.writeFileSync(LEADS_FILE, JSON.stringify(initialLeads, null, 2), 'utf8');
      return initialLeads;
    }

    try {
      const data = fs.readFileSync(LEADS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static #saveLeads(leads) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
  }

  /**
   * استرجاع جميع العملاء مع إمكانية الفلترة وعزل بيانات الشريك الخاصة
   */
  static getLeads(filters = {}, partner = null) {
    let leads = this.#loadLeads();
    const partnerId = partner?.partnerId || partner?.id;

    // عزل العملاء الخاصين: إذا كان العميل خاصاً بشريك، لا يظهر للشريك الآخر
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

    // تنقية الملاحظات الخاصة بحيث يرى كل شريك ملاحظاته الخاصة فقط
    if (partnerId) {
      leads = leads.map(l => this.#sanitizeLeadForPartner(l, partnerId));
    }

    return leads;
  }

  /**
   * تنقية العميل من الملاحظات السرية الخاصة بشريك آخر
   */
  static #sanitizeLeadForPartner(lead, partnerId) {
    const sanitized = { ...lead };
    if (Array.isArray(sanitized.privateNotes)) {
      sanitized.privateNotes = sanitized.privateNotes.filter(n => n.partnerId === partnerId);
    }
    return sanitized;
  }

  /**
   * استرجاع عميل محدد بمعرفه مع التحقق من صلاحيات العزل
   */
  static getLeadById(id, partner = null) {
    const leads = this.#loadLeads();
    const found = leads.find(l => l.id === id);
    if (!found) return null;

    const partnerId = partner?.partnerId || partner?.id;
    if (partnerId && found.isPrivate && found.ownerPartnerId !== partnerId && found.assignedPartner !== partnerId) {
      const err = new Error(`غير مصرح: العميل (${id}) مسجل كفرصة خاصة بالشريك الآخر.`);
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      err.status = 403;
      throw err;
    }

    return partnerId ? this.#sanitizeLeadForPartner(found, partnerId) : found;
  }

  /**
   * إنشاء عميل محتمل جديد (Lead Discovery Registration)
   */
  static createLead(payload, partner) {
    if (!payload.businessName || typeof payload.businessName !== 'string' || !payload.businessName.trim()) {
      const err = new Error('اسم المنشأة/العميل مطلوب (businessName)');
      err.code = 'INVALID_LEAD_DATA';
      throw err;
    }

    if (!payload.contactInfo?.phone && !payload.phone) {
      const err = new Error('رقم هاتف العميل مطلوب للتواصل المشروع');
      err.code = 'INVALID_LEAD_DATA';
      throw err;
    }

    const phone = payload.contactInfo?.phone || payload.phone;
    const leads = this.#loadLeads();

    // التحقق من عدم تكرار العميل بنفس رقم الهاتف
    const existing = leads.find(l => l.contactInfo?.phone === phone);
    if (existing) {
      const err = new Error(`العميل (${payload.businessName}) مسجل مسبقاً بنفس رقم الهاتف (${phone}). المعرف: ${existing.id}`);
      err.code = 'DUPLICATE_LEAD';
      throw err;
    }

    const dealValueEstimate = Number(payload.dealValueEstimate) || Number(payload.expectedBudget) || 0;
    const collectedAmount = Number(payload.collectedAmount) || 0;

    const newLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessName: payload.businessName.trim(),
      industry: payload.industry || 'عام وتجاري',
      softwareNeed: payload.softwareNeed || 'استشارة وحل برمجي',
      source: payload.source || 'direct_visit',
      stage: CRM_LEAD_STAGES.NEW_LEAD,
      priority: payload.priority || 'medium',
      dealValueEstimate,
      collectedAmount,
      invoicedAmount: Number(payload.invoicedAmount) || 0,
      outstandingBalance: Math.max(0, dealValueEstimate - collectedAmount),
      isContractSigned: false,
      isPaymentCollected: Boolean(collectedAmount >= dealValueEstimate && dealValueEstimate > 0),
      isPrivate: Boolean(payload.isPrivate),
      ownerPartnerId: payload.ownerPartnerId || (partner?.partnerId || partner?.id) || 'mohamed',
      dealProbability: Number(payload.dealProbability) || 20,
      assignedPartner: payload.assignedPartner || (partner?.partnerId || partner?.id) || 'mohamed',
      contactInfo: {
        contactPerson: payload.contactInfo?.contactPerson || payload.contactPerson || '',
        phone: String(phone).trim(),
        email: payload.contactInfo?.email || payload.email || '',
        city: payload.contactInfo?.city || payload.city || 'الإسكندرية',
        address: payload.contactInfo?.address || payload.address || ''
      },
      notes: payload.notes ? (Array.isArray(payload.notes) ? payload.notes : [payload.notes]) : [],
      privateNotes: payload.privateNotes || [],
      nextFollowUpDate: payload.nextFollowUpDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      history: [
        {
          fromStage: 'NONE',
          toStage: CRM_LEAD_STAGES.NEW_LEAD,
          changedBy: partner?.partnerId || partner?.id || 'mohamed',
          changedAt: new Date().toISOString(),
          note: payload.initialNote || 'تسجيل فرصة عميل جديدة في النظام'
        }
      ],
      linkedTasks: [],
      isRealProspect: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    leads.push(newLead);
    this.#saveLeads(leads);

    AuditLogger.log({
      partnerId: partner?.partnerId || partner?.id || 'anonymous',
      eventType: 'CRM_LEAD_CREATED',
      inputPayload: {
        leadId: newLead.id,
        businessName: newLead.businessName,
        industry: newLead.industry,
        dealValueEstimate: newLead.dealValueEstimate
      },
      outputSummary: `تم إنشاء فرصة عميل محتمل جديدة (${newLead.businessName}) بالمرحلة ${newLead.stage}`,
      status: 'SUCCESS'
    });

    return newLead;
  }

  /**
   * تحديث مرحلة العميل في دورة البيع (Stage Transition) مع التدقيق الزمني
   */
  static updateLeadStage(id, targetStage, note, partner) {
    if (!Object.values(CRM_LEAD_STAGES).includes(targetStage)) {
      const err = new Error(`المرحلة المطلوبة (${targetStage}) غير معتمدة في المنظومة.`);
      err.code = 'INVALID_STAGE';
      throw err;
    }

    const leads = this.#loadLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      const err = new Error(`العميل بالمعرف (${id}) غير موجود.`);
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    const currentLead = leads[index];
    const fromStage = currentLead.stage;

    // التحقق من صحة وقانونية الانتقال
    const allowedTargets = VALID_STAGE_TRANSITIONS[fromStage] || [];
    if (fromStage !== targetStage && !allowedTargets.includes(targetStage)) {
      const err = new Error(`انتقال غير مسموح به من مرحلة (${fromStage}) إلى (${targetStage}). الانتقالات المسموحة: ${allowedTargets.join(', ')}`);
      err.code = 'INVALID_STAGE_TRANSITION';
      throw err;
    }

    currentLead.stage = targetStage;
    currentLead.updatedAt = new Date().toISOString();

    // تحديث نسبة الاحتمالية التقديرية حسب المرحلة إذا لم تكن محددة يدوياً
    if (targetStage === CRM_LEAD_STAGES.WON) {
      currentLead.dealProbability = 100;
      currentLead.isContractSigned = true;
      // تنبيه حوكمة مالي: مرحلة WON تعني إتمام التعاقد فقط ولا تُعد دليلاً على تحصيل النقدية
      currentLead.isPaymentCollected = Boolean(
        currentLead.collectedAmount && 
        currentLead.dealValueEstimate > 0 && 
        currentLead.collectedAmount >= currentLead.dealValueEstimate
      );
    } else if (targetStage === CRM_LEAD_STAGES.LOST) {
      currentLead.dealProbability = 0;
      currentLead.isContractSigned = false;
    } else if (targetStage === CRM_LEAD_STAGES.NEGOTIATION) {
      currentLead.dealProbability = Math.max(currentLead.dealProbability, 80);
    } else if (targetStage === CRM_LEAD_STAGES.PROPOSAL_SENT) {
      currentLead.dealProbability = Math.max(currentLead.dealProbability, 60);
    }

    // تسجيل الانتقال في السجل الزمني للعميل
    currentLead.history.push({
      fromStage,
      toStage: targetStage,
      changedBy: partner?.partnerId || partner?.id || 'partner',
      changedAt: new Date().toISOString(),
      note: note || `ترقية العميل إلى مرحلة ${targetStage}`
    });

    leads[index] = currentLead;
    this.#saveLeads(leads);

    AuditLogger.log({
      partnerId: partner?.partnerId || partner?.id || 'anonymous',
      eventType: 'CRM_STAGE_TRANSITION',
      inputPayload: {
        leadId: id,
        fromStage,
        toStage: targetStage,
        note
      },
      outputSummary: `تم نقل العميل (${currentLead.businessName}) من ${fromStage} إلى ${targetStage}`,
      status: 'SUCCESS'
    });

    return currentLead;
  }

  /**
   * إضافة ملاحظة جديدة للعميل مع دعم الملاحظات السرية المعزولة للشريك
   */
  static addNote(id, noteText, partner, isPrivate = false) {
    if (!noteText || typeof noteText !== 'string' || !noteText.trim()) {
      throw new Error('نص الملاحظة مطلوب');
    }

    const partnerId = partner?.partnerId || partner?.id || 'anonymous';
    const leads = this.#loadLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`العميل بالمعرف (${id}) غير موجود.`);
    }

    const lead = leads[index];
    if (lead.isPrivate && lead.ownerPartnerId !== partnerId && lead.assignedPartner !== partnerId) {
      const err = new Error('غير مصرح: لا تملك صلاحية إضافة ملاحظات على عميل خاص بشريك آخر.');
      err.code = 'FORBIDDEN_LEAD_ACCESS';
      err.status = 403;
      throw err;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (isPrivate) {
      if (!Array.isArray(lead.privateNotes)) lead.privateNotes = [];
      lead.privateNotes.push({
        id: `pnote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partnerId,
        partnerName: partner.name || partnerId,
        timestamp,
        text: noteText.trim()
      });
    } else {
      const formattedNote = `[${timestamp} - ${partner.name}]: ${noteText.trim()}`;
      lead.notes.push(formattedNote);
    }
    lead.updatedAt = new Date().toISOString();

    leads[index] = lead;
    this.#saveLeads(leads);

    AuditLogger.log({
      partnerId,
      eventType: isPrivate ? 'CRM_PRIVATE_NOTE_ADDED' : 'CRM_NOTE_ADDED',
      inputPayload: { leadId: id, isPrivate },
      status: 'SUCCESS'
    });

    return this.#sanitizeLeadForPartner(lead, partnerId);
  }

  /**
   * حساب إحصائيات لوحة متابعة المبيعات (Sales Pipeline Dashboard Metrics)
   */
  static getAnalytics(partner) {
    const leads = this.#loadLeads();
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

      // تفصيل المراحل
      if (stageBreakdown[stage]) {
        stageBreakdown[stage].count += 1;
        stageBreakdown[stage].totalValue += val;
      }

      // توزيع المصادر
      const src = l.source || 'other';
      sourceDistribution[src] = (sourceDistribution[src] || 0) + 1;

      // حسابات القيمة مع الفصل الحاسم بين قيمة التعاقد والتحصيل النقدي الفعلي
      if (stage === CRM_LEAD_STAGES.WON) {
        totalContractedWonValue += val;
        wonCount += 1;
        totalOutstandingReceivables += Math.max(0, val - collected);
      } else if (stage === CRM_LEAD_STAGES.LOST) {
        lostCount += 1;
      } else {
        // الفرص النشطة في خط الأنابيب
        totalPipelineValue += val;
      }

      // أداء الشريك
      const p = l.assignedPartner;
      if (p === 'mohamed' || p === 'both') {
        partnerPerformance.mohamed.assignedCount += 1;
        partnerPerformance.mohamed.collectedCash += collected;
        if (stage === CRM_LEAD_STAGES.WON) {
          partnerPerformance.mohamed.wonCount += 1;
          partnerPerformance.mohamed.wonValue += val;
        } else if (stage !== CRM_LEAD_STAGES.LOST) {
          partnerPerformance.mohamed.pipelineValue += val;
        }
      }
      if (p === 'tarek' || p === 'both') {
        partnerPerformance.tarek.assignedCount += 1;
        partnerPerformance.tarek.collectedCash += collected;
        if (stage === CRM_LEAD_STAGES.WON) {
          partnerPerformance.tarek.wonCount += 1;
          partnerPerformance.tarek.wonValue += val;
        } else if (stage !== CRM_LEAD_STAGES.LOST) {
          partnerPerformance.tarek.pipelineValue += val;
        }
      }

      // المتابعات المتأخرة
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

    const totalClosed = wonCount + lostCount;
    const conversionRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    return {
      totalLeads: leads.length,
      activePipelineCount: leads.filter(l => l.stage !== CRM_LEAD_STAGES.WON && l.stage !== CRM_LEAD_STAGES.LOST).length,
      totalPipelineValue,
      totalWonValue: totalContractedWonValue, // للتوافق العكسي: إجمالي قيمة التعاقدات المغلقة
      totalContractedWonValue,
      totalCollectedCash, // المبالغ المحصلة فعلياً
      outstandingReceivables: totalOutstandingReceivables, // المبالغ المستحقة المتبقية
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
   * إدارة مسودات عروض الأسعار والرسائل التسويقية (Sales Drafts)
   */
  static saveSalesDraft(draftData) {
    let drafts = [];
    if (fs.existsSync(DRAFTS_FILE)) {
      try {
        drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
      } catch {
        drafts = [];
      }
    }

    const draft = {
      id: `sales-draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending_partner_review',
      isPrivate: Boolean(draftData.isPrivate),
      partnerId: draftData.partnerId || 'mohamed',
      createdAt: new Date().toISOString(),
      ...draftData
    };

    drafts.push(draft);
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf8');
    return draft;
  }

  static getSalesDrafts(leadId = null, partner = null) {
    if (!fs.existsSync(DRAFTS_FILE)) return [];
    try {
      let drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
      if (leadId) drafts = drafts.filter(d => d.leadId === leadId);

      const partnerId = partner?.partnerId || partner?.id;
      if (partnerId) {
        // عزل المسودات الخاصة: المسودة الخاصة لا يراها إلا الشريك المنشئ
        drafts = drafts.filter(d => {
          if (!d.isPrivate) return true;
          return d.partnerId === partnerId;
        });
      }
      return drafts;
    } catch {
      return [];
    }
  }

  static updateSalesDraft(draftId, updates, partner) {
    if (!fs.existsSync(DRAFTS_FILE)) {
      const err = new Error('لا توجد مسودات مسجلة');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
    const index = drafts.findIndex(d => d.id === draftId);
    if (index === -1) {
      const err = new Error(`المسودة بالمعرف (${draftId}) غير موجودة.`);
      err.code = 'NOT_FOUND';
      throw err;
    }

    const draft = drafts[index];
    const partnerId = partner?.partnerId || partner?.id;
    if (draft.isPrivate && draft.partnerId !== partnerId) {
      const err = new Error('FORBIDDEN_NOT_DRAFT_OWNER: لا تملك صلاحية تعديل مسودة خاصة بشريك آخر.');
      err.code = 'FORBIDDEN_NOT_DRAFT_OWNER';
      err.status = 403;
      throw err;
    }

    drafts[index] = { ...draft, ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf8');
    return drafts[index];
  }
}
