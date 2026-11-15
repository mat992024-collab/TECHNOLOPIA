// server/data/crmLeadStore.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  FirestoreCrmRepository, 
  CRM_LEAD_STAGES, 
  VALID_STAGE_TRANSITIONS, 
  FIRESTORE_CRM_COLLECTIONS 
} from '../services/firestoreCrmRepository.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');
const LEADS_FILE = path.resolve(BACKUPS_DIR, 'tecnolobia_crm_leads.json');
const DRAFTS_FILE = path.resolve(BACKUPS_DIR, 'tecnolobia_ai_sales_drafts.json');

export { CRM_LEAD_STAGES, VALID_STAGE_TRANSITIONS, FIRESTORE_CRM_COLLECTIONS };

/**
 * متجر العملاء الموحد لشركة TECHNOLOPIA (CRM Lead Store)
 * يعمل كواجهة تكاملية بين خدمات الخادم ومستودع Firestore الموحد مع حفظ التزامن المحلي
 */
export class CrmLeadStore {
  /**
   * مزامنة التغييرات مع ملف النسخ الاحتياطي المحلي لضمان استمرارية البيانات وعدم الفقدان
   */
  static #syncLocalJson() {
    if (process.env.NODE_ENV === 'test' && !process.env.FORCE_CRM_DISK_SYNC) {
      return;
    }
    if (process.env.STATELESS_MODE || process.env.K_SERVICE) {
      return;
    }
    try {
      const leads = FirestoreCrmRepository.getLeads();
      fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
    } catch (err) {
      console.warn('Notice syncing CRM leads to local JSON backup:', err.message);
    }
  }

  static #syncDraftsJson() {
    if (process.env.NODE_ENV === 'test' && !process.env.FORCE_CRM_DISK_SYNC) {
      return;
    }
    if (process.env.STATELESS_MODE || process.env.K_SERVICE) {
      return;
    }
    try {
      const drafts = FirestoreCrmRepository.getSalesDrafts();
      fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf8');
    } catch (err) {
      console.warn('Notice syncing sales drafts to local JSON backup:', err.message);
    }
  }

  /**
   * استرجاع جميع العملاء مع إمكانية الفلترة وعزل بيانات الشريك الخاصة
   */
  static getLeads(filters = {}, partner = null) {
    return FirestoreCrmRepository.getLeads(filters, partner);
  }

  /**
   * استرجاع عميل محدد بمعرفه مع التحقق من صلاحيات العزل
   */
  static getLeadById(id, partner = null) {
    return FirestoreCrmRepository.getLeadById(id, partner);
  }

  /**
   * إنشاء عميل محتمل جديد (Lead Discovery Registration)
   */
  static createLead(payload, partner) {
    const lead = FirestoreCrmRepository.createLead(payload, partner);
    this.#syncLocalJson();
    return lead;
  }

  /**
   * تحديث مرحلة العميل في دورة البيع مع التدقيق الزمني وقواعد الانتقال
   */
  static updateLeadStage(id, targetStage, note, partner) {
    const updated = FirestoreCrmRepository.updateLeadStage(id, targetStage, note, partner);
    this.#syncLocalJson();
    return updated;
  }

  /**
   * إضافة ملاحظة للعميل (عامة أو خاصة)
   */
  static addNote(id, noteText, partner, isPrivate = false) {
    const updated = FirestoreCrmRepository.addNote(id, noteText, partner, isPrivate);
    this.#syncLocalJson();
    return updated;
  }

  /**
   * حساب إحصائيات لوحة متابعة المبيعات ومؤشرات الأداء
   */
  static getAnalytics(partner = null) {
    return FirestoreCrmRepository.getAnalytics(partner);
  }

  /**
   * استرجاع مسودات عروض الأسعار المرتبطة بعميل
   */
  static getSalesDrafts(leadId = null, partner = null) {
    return FirestoreCrmRepository.getSalesDrafts(leadId, partner);
  }

  /**
   * حفظ مسودة عرض سعر جديدة من الذكاء الاصطناعي
   */
  static saveSalesDraft(draftData, partner = null) {
    const draft = FirestoreCrmRepository.saveSalesDraft(draftData, partner);
    this.#syncDraftsJson();
    return draft;
  }

  /**
   * تعديل أو اعتماد مسودة عرض سعر
   */
  static updateSalesDraft(draftId, updates = {}, partner = null) {
    const updated = FirestoreCrmRepository.updateSalesDraft(draftId, updates, partner);
    this.#syncDraftsJson();
    return updated;
  }
}
