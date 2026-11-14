// server/data/realDataProvider.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_PATH = path.resolve(__dirname, '../../backups/firestore_backup_latest.json');

/**
 * مزود بيانات TECHNOLOPIA الحقيقية
 * يقرأ مباشرة من البيانات الموثقة دون أي بيانات وهمية أو أرقام مختلقة
 */
export class RealDataProvider {
  static #loadStore() {
    if (!fs.existsSync(BACKUP_PATH)) {
      throw new Error(`ملف البيانات الأساسي غير موجود في المسار: ${BACKUP_PATH}`);
    }
    const raw = fs.readFileSync(BACKUP_PATH, 'utf8');
    return JSON.parse(raw);
  }

  /**
   * قراءة جميع المشروعات الحقيقية
   */
  static getProjects(filters = {}) {
    const store = this.#loadStore();
    let projects = store.collections?.tecnolobia_projects || [];
    
    // توحيد الحقول (title و name) لضمان التوافق التام
    projects = projects.map(p => ({
      ...p,
      title: p.title || p.name,
      name: p.name || p.title
    }));

    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    if (filters.assignedTo) {
      projects = projects.filter(p => p.assignedTo === filters.assignedTo || p.assignedTo === 'both');
    }
    return projects;
  }

  /**
   * قراءة تفاصيل مشروع محدد
   */
  static getProjectById(projectId) {
    const projects = this.getProjects();
    const found = projects.find(p => p.id === projectId || p._id === projectId);
    if (!found) return null;

    // إرفاق المهام المرتبطة بهذا المشروع إن وجدت
    const tasks = this.getTasks().filter(t => t.projectId === projectId || (t.title && t.title.includes(found.title)));
    return {
      ...found,
      title: found.title || found.name,
      name: found.name || found.title,
      relatedTasks: tasks
    };
  }

  /**
   * قراءة جميع المهام الحقيقية
   */
  static getTasks(filters = {}) {
    const store = this.#loadStore();
    let tasks = store.collections?.tecnolobia_tasks || [];

    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filters.assignedTo || t.assignedTo === 'both');
    }
    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    return tasks;
  }

  /**
   * قراءة جميع العملاء وفرص المبيعات الحقيقية
   */
  static getClients(filters = {}) {
    const store = this.#loadStore();
    let clients = store.collections?.tecnolobia_clients || [];

    if (filters.status) {
      clients = clients.filter(c => c.status === filters.status);
    }
    return clients;
  }

  /**
   * قراءة الملخص المالي الحقيقي بنسبة 100%
   * يطبق بدقة معادلة الأرباح الأربعة (25% لكل جهة)
   */
  static getFinancialSummary() {
    const store = this.#loadStore();
    const transactions = store.collections?.tecnolobia_transactions || [];
    const profitCycles = store.collections?.tecnolobia_profit_cycles || [];

    let totalRevenue = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === 'income') totalRevenue += Number(t.amount || 0);
      if (t.type === 'expense') totalExpenses += Number(t.amount || 0);
    });

    const netProfit = Math.max(0, totalRevenue - totalExpenses);

    // تطبيق قاعدة الـ 25% الصارمة
    const partnerMohamedShare = Math.floor(netProfit * 0.25 * 100) / 100;
    const partnerTarekShare = Math.floor(netProfit * 0.25 * 100) / 100;
    const devFundShare = Math.floor(netProfit * 0.25 * 100) / 100;
    // الباقي مع القروش يذهب تلقائياً للصدقة الجارية
    const sadaqahShare = Math.round((netProfit - (partnerMohamedShare + partnerTarekShare + devFundShare)) * 100) / 100;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      distributions: {
        partnerMohamedShare,
        partnerTarekShare,
        devFundShare,
        sadaqahShare
      },
      transactionsCount: transactions.length,
      profitCyclesCount: profitCycles.length,
      isRealData: true
    };
  }

  /**
   * النظرة العامة للشركة
   */
  static getCompanyOverview() {
    const projects = this.getProjects();
    const tasks = this.getTasks();
    const clients = this.getClients();
    const finances = this.getFinancialSummary();

    return {
      companyName: 'TECHNOLOPIA',
      coFounders: [
        { name: 'المهندس محمد البحر', role: 'شريك مؤسس ومدير تنفيذي تقني', id: 'mohamed' },
        { name: 'المهندس طارق حافظ', role: 'شريك مؤسس ومدير تنفيذي للأعمال', id: 'tarek' }
      ],
      metrics: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status !== 'completed').length,
        urgentTasks: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
        totalClients: clients.length,
        netProfit: finances.netProfit
      }
    };
  }

  /**
   * كتابة ذرية آمنة لحماية ملفات JSON من التلف أثناء الحفظ مع دعم التوافق مع Windows
   */
  static #writeJsonAtomic(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    try {
      fs.writeFileSync(tmpPath, content, 'utf8');
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EEXIST') {
          fs.copyFileSync(tmpPath, filePath);
          try { fs.unlinkSync(tmpPath); } catch (_) {}
        } else {
          throw err;
        }
      }
    } catch (e) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  /**
   * حفظ اقتراح تحسين استباقي من المساعد الذكي كمسودة للمراجعة
   */
  static saveAiProposal(proposal) {
    const proposalsFile = path.resolve(__dirname, '../../backups/tecnolobia_ai_proposals.json');
    let proposals = [];
    if (fs.existsSync(proposalsFile)) {
      try {
        proposals = JSON.parse(fs.readFileSync(proposalsFile, 'utf8'));
      } catch (e) {
        proposals = [];
      }
    }
    const record = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'pending_partner_review',
      requiresPartnerApproval: true,
      ownerPartnerId: proposal.ownerPartnerId || proposal.proposedByPartner || 'system',
      ...proposal
    };
    proposals.push(record);
    this.#writeJsonAtomic(proposalsFile, proposals);
    return record;
  }

  /**
   * قراءة جميع اقتراحات الذكاء الاصطناعي المسجلة
   */
  static getAiProposals() {
    const proposalsFile = path.resolve(__dirname, '../../backups/tecnolobia_ai_proposals.json');
    if (!fs.existsSync(proposalsFile)) return [];
    try {
      return JSON.parse(fs.readFileSync(proposalsFile, 'utf8'));
    } catch (e) {
      return [];
    }
  }

  /**
   * اعتماد مقترح تحسين من قبل أحد الشريكين
   */
  static approveProposal(proposalId, partner) {
    const proposalsFile = path.resolve(__dirname, '../../backups/tecnolobia_ai_proposals.json');
    const proposals = this.getAiProposals();
    const index = proposals.findIndex(p => p.id === proposalId);
    if (index === -1) {
      throw new Error(`المقترح المطلوب (${proposalId}) غير موجود.`);
    }

    const proposal = proposals[index];
    if (proposal.status === 'approved') {
      return proposal; // معتمد مسبقاً
    }

    proposal.status = 'approved';
    proposal.approvedBy = partner.id;
    proposal.approvedAt = new Date().toISOString();
    proposals[index] = proposal;

    this.#writeJsonAtomic(proposalsFile, proposals);
    return proposal;
  }

  /**
   * صياغة مهمة جديدة كمسودة تنتظر اعتماد الشريك
   */
  static saveDraftTask(task) {
    const draftsFile = path.resolve(__dirname, '../../backups/tecnolobia_draft_tasks.json');
    let drafts = [];
    if (fs.existsSync(draftsFile)) {
      try {
        drafts = JSON.parse(fs.readFileSync(draftsFile, 'utf8'));
      } catch (e) {
        drafts = [];
      }
    }
    const draftRecord = {
      id: `draft-task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'draft_pending_partner_approval',
      requiresPartnerApproval: true,
      ownerPartnerId: task.ownerPartnerId || task.draftedByPartner || 'system',
      isPrivate: task.isPrivate === true,
      ...task
    };
    drafts.push(draftRecord);
    this.#writeJsonAtomic(draftsFile, drafts);
    return draftRecord;
  }

  /**
   * قراءة مسودات المهام
   */
  static getDraftTasks(partnerId = null) {
    const draftsFile = path.resolve(__dirname, '../../backups/tecnolobia_draft_tasks.json');
    if (!fs.existsSync(draftsFile)) return [];
    try {
      let drafts = JSON.parse(fs.readFileSync(draftsFile, 'utf8'));
      if (partnerId) {
        // حجب المسودات الخاصة بالشريك الآخر
        drafts = drafts.filter(d => !d.isPrivate || d.ownerPartnerId === partnerId || d.assignedTo === partnerId);
      }
      return drafts;
    } catch (e) {
      return [];
    }
  }

  /**
   * تعديل مسودة مهمة مع التحقق الصارم من ملكية الشريك وصلاحياته
   */
  static updateDraftTask(taskId, updates, partner) {
    const draftsFile = path.resolve(__dirname, '../../backups/tecnolobia_draft_tasks.json');
    const drafts = this.getDraftTasks();
    const index = drafts.findIndex(t => t.id === taskId);
    if (index === -1) {
      throw new Error(`مسودة المهمة (${taskId}) غير موجودة.`);
    }

    const draft = drafts[index];

    // حماية الخصوصية ومنع التعديل غير المصرح به: إذا كانت المسودة خاصة ومملوكة لشريك آخر
    if (draft.isPrivate && draft.ownerPartnerId && draft.ownerPartnerId !== partner.id) {
      const err = new Error(`مرفوض أمنياً: لا يمكنك تعديل مسودة خاصة بالشريك الآخر (${draft.ownerPartnerId})`);
      err.code = 'FORBIDDEN_PRIVATE_DRAFT';
      throw err;
    }

    const updated = {
      ...draft,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: partner.id
    };

    drafts[index] = updated;
    this.#writeJsonAtomic(draftsFile, drafts);
    return updated;
  }
}
