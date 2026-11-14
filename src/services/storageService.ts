import { 
  FinancialTransaction, 
  ProfitDistributionCycle, 
  CompanyDevUsage, 
  SadaqahDonationRecord 
} from '../types/finance';
import { ProjectItem, TaskItem } from '../types/projects';
import { ClientItem } from '../types/crm';
import { PartnerProfile, CompanyMeta, AuditLogItem, PrivateNote, PartnerId } from '../types/company';
import { AiChatMessage, TokenUsageStats } from '../types/ai';
import { StrategicDecision, CompanyMemoryItem } from '../types/decisions';
import { FirestoreSyncService } from './firestoreSyncService';
import { 
  INITIAL_COMPANY_META, 
  INITIAL_PARTNERS, 
  INITIAL_PROJECTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_PROFIT_CYCLES, 
  INITIAL_COMPANY_DEV_USAGES, 
  INITIAL_SADAQAH_RECORDS, 
  INITIAL_TASKS, 
  INITIAL_CLIENTS,
  INITIAL_STRATEGIC_DECISIONS,
  INITIAL_COMPANY_MEMORIES
} from '../mock/initialData';

const STORAGE_KEYS = {
  COMPANY_META: 'tecnolobia_meta',
  PARTNERS: 'tecnolobia_partners',
  PROJECTS: 'tecnolobia_projects',
  TASKS: 'tecnolobia_tasks',
  CLIENTS: 'tecnolobia_clients',
  TRANSACTIONS: 'tecnolobia_transactions',
  PROFIT_CYCLES: 'tecnolobia_profit_cycles',
  DEV_USAGES: 'tecnolobia_dev_usages',
  SADAQAH_RECORDS: 'tecnolobia_sadaqah',
  DECISIONS: 'tecnolobia_decisions',
  MEMORIES: 'tecnolobia_memories',
  PRIVATE_NOTES: 'tecnolobia_private_notes',
  AUDIT_LOGS: 'tecnolobia_audit_logs',
  AI_CHATS: 'tecnolobia_ai_chats',
  TOKEN_STATS: 'tecnolobia_token_stats',
  FIREBASE_CONFIG: 'tecnolobia_firebase_config',
  GEMINI_KEY: 'tecnolobia_gemini_key'
};

// تنظيف إجباري لأي بيانات تجريبية سابقة لضمان بدء النظام على بيانات حقيقية 100%
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('tecnolobia_v2_clean_zero_base') !== 'true') {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.PROFIT_CYCLES);
      localStorage.removeItem(STORAGE_KEYS.DEV_USAGES);
      localStorage.removeItem(STORAGE_KEYS.SADAQAH_RECORDS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.setItem('tecnolobia_v2_clean_zero_base', 'true');
    }
  } catch (e) {
    // ignore
  }
}

// تحميل أولي آمن
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export class AppStorageService {
  static getCompanyMeta(): CompanyMeta {
    return loadFromStorage(STORAGE_KEYS.COMPANY_META, INITIAL_COMPANY_META);
  }

  static saveCompanyMeta(meta: CompanyMeta): void {
    saveToStorage(STORAGE_KEYS.COMPANY_META, meta);
  }

  static getPartners(): PartnerProfile[] {
    return loadFromStorage(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);
  }

  static getProjects(): ProjectItem[] {
    return loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  static saveProjects(projects: ProjectItem[]): void {
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  }

  static getTasks(): TaskItem[] {
    return loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  }

  static saveTasks(tasks: TaskItem[]): void {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }

  static getClients(): ClientItem[] {
    return loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }

  static saveClients(clients: ClientItem[]): void {
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
  }

  static getTransactions(): FinancialTransaction[] {
    return loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  static saveTransactions(transactions: FinancialTransaction[]): void {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static getProfitCycles(): ProfitDistributionCycle[] {
    return loadFromStorage(STORAGE_KEYS.PROFIT_CYCLES, INITIAL_PROFIT_CYCLES);
  }

  static saveProfitCycles(cycles: ProfitDistributionCycle[]): void {
    saveToStorage(STORAGE_KEYS.PROFIT_CYCLES, cycles);
  }

  static getDevUsages(): CompanyDevUsage[] {
    return loadFromStorage(STORAGE_KEYS.DEV_USAGES, INITIAL_COMPANY_DEV_USAGES);
  }

  static saveDevUsages(usages: CompanyDevUsage[]): void {
    saveToStorage(STORAGE_KEYS.DEV_USAGES, usages);
  }

  static getSadaqahRecords(): SadaqahDonationRecord[] {
    return loadFromStorage(STORAGE_KEYS.SADAQAH_RECORDS, INITIAL_SADAQAH_RECORDS);
  }

  static saveSadaqahRecords(records: SadaqahDonationRecord[]): void {
    saveToStorage(STORAGE_KEYS.SADAQAH_RECORDS, records);
  }

  static getDecisions(): StrategicDecision[] {
    return loadFromStorage(STORAGE_KEYS.DECISIONS, INITIAL_STRATEGIC_DECISIONS);
  }

  static saveDecisions(decisions: StrategicDecision[]): void {
    saveToStorage(STORAGE_KEYS.DECISIONS, decisions);
  }

  static getMemories(): CompanyMemoryItem[] {
    return loadFromStorage(STORAGE_KEYS.MEMORIES, INITIAL_COMPANY_MEMORIES);
  }

  static saveMemories(memories: CompanyMemoryItem[]): void {
    saveToStorage(STORAGE_KEYS.MEMORIES, memories);
  }

  static getPrivateNotes(partnerId: PartnerId): PrivateNote[] {
    const allNotes: PrivateNote[] = loadFromStorage(STORAGE_KEYS.PRIVATE_NOTES, [
      {
        id: 'note-1',
        ownerId: 'mohamed',
        title: 'أفكار لتطوير كاشير المطاعم باستخدام Next.js Offline PWA',
        content: 'إمكانية تشغيل تطبيق الكاشير بالكامل بدون إنترنت مع مزامنة لحظية مع عودة الشبكة.',
        updatedAt: '2026-11-10T11:00:00Z'
      },
      {
        id: 'note-2',
        ownerId: 'tarek',
        title: 'استراتيجية تسعير أنظمة المطابع بالإسكندرية',
        content: 'التركيز على بند حساب هالك الورق كأقوى ميزة تسويقية تقنع أصحاب المطابع بالاشتراك.',
        updatedAt: '2026-11-12T14:30:00Z'
      }
    ]);
    return allNotes.filter(n => n.ownerId === partnerId);
  }

  static savePrivateNote(newNote: PrivateNote): void {
    const allNotes: PrivateNote[] = loadFromStorage(STORAGE_KEYS.PRIVATE_NOTES, []);
    const existingIndex = allNotes.findIndex(n => n.id === newNote.id);
    if (existingIndex >= 0) {
      allNotes[existingIndex] = newNote;
    } else {
      allNotes.push(newNote);
    }
    saveToStorage(STORAGE_KEYS.PRIVATE_NOTES, allNotes);
  }

  static getAuditLogs(): AuditLogItem[] {
    return loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  static logAction(actor: PartnerId | 'ai_ceo', action: string, details: string, category: AuditLogItem['category']): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor,
      action,
      details,
      timestamp: new Date().toISOString(),
      category
    };
    logs.unshift(newLog);
    // الاحتفاظ بآخر 200 سجل نشاط محلياً
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200));

    // رفع السجل سحابياً بشكل مؤمن في Firestore
    FirestoreSyncService.saveAuditLog(newLog).catch(() => {});
  }

  static getTokenStats(): TokenUsageStats {
    return loadFromStorage(STORAGE_KEYS.TOKEN_STATS, {
      totalCalls: 14,
      estimatedTokensUsed: 6200,
      estimatedCostUsd: 0.003,
      tokenSaverSavedPercent: 88,
      lastCallTimestamp: '2026-11-13T16:00:00Z',
      activeModel: 'Gemini 2.0 Flash (Token Saver)'
    });
  }

  static updateTokenStats(tokensUsed: number): void {
    const current = this.getTokenStats();
    current.totalCalls += 1;
    current.estimatedTokensUsed += tokensUsed;
    current.estimatedCostUsd += (tokensUsed / 1000000) * 0.10; // تقديري
    current.lastCallTimestamp = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.TOKEN_STATS, current);
  }
}
