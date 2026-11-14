import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDocs, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { FinancialTransaction, ProfitDistributionCycle, CompanyDevUsage, SadaqahDonationRecord } from '../types/finance';
import { ProjectItem, TaskItem } from '../types/projects';
import { ClientItem } from '../types/crm';
import { CompanyMeta } from '../types/company';
import { StrategicDecision, CompanyMemoryItem } from '../types/decisions';
import { 
  INITIAL_COMPANY_META, 
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

const COLLECTIONS = {
  TRANSACTIONS: 'tecnolobia_transactions',
  PROFIT_CYCLES: 'tecnolobia_profit_cycles',
  PROJECTS: 'tecnolobia_projects',
  TASKS: 'tecnolobia_tasks',
  CLIENTS: 'tecnolobia_clients',
  DEV_USAGES: 'tecnolobia_dev_usages',
  SADAQAH: 'tecnolobia_sadaqah',
  DECISIONS: 'tecnolobia_decisions',
  MEMORIES: 'tecnolobia_memories',
  META: 'tecnolobia_meta'
};

export class FirestoreSyncService {
  /**
   * تهيئة وزرع البيانات الأولية في السحابة إذا كانت فارغة
   */
  static async initializeAndSeedIfEmpty(): Promise<void> {
    if (!db) return;

    try {
      const projSnap = await getDocs(collection(db, COLLECTIONS.PROJECTS));
      if (projSnap.empty) {
        console.log('Seeding initial data into Cloud Firestore...');
        
        // مشروعات
        for (const p of INITIAL_PROJECTS) {
          await setDoc(doc(db, COLLECTIONS.PROJECTS, p.id), p);
        }
        // مهام
        for (const t of INITIAL_TASKS) {
          await setDoc(doc(db, COLLECTIONS.TASKS, t.id), t);
        }
        // عملاء
        for (const c of INITIAL_CLIENTS) {
          await setDoc(doc(db, COLLECTIONS.CLIENTS, c.id), c);
        }
        // معاملات مالية
        for (const tr of INITIAL_TRANSACTIONS) {
          await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, tr.id), tr);
        }
        // دورات أرباح
        for (const cy of INITIAL_PROFIT_CYCLES) {
          await setDoc(doc(db, COLLECTIONS.PROFIT_CYCLES, cy.id), cy);
        }
        // صندوق التطوير
        for (const d of INITIAL_COMPANY_DEV_USAGES) {
          await setDoc(doc(db, COLLECTIONS.DEV_USAGES, d.id), d);
        }
        // الصدقة
        for (const s of INITIAL_SADAQAH_RECORDS) {
          await setDoc(doc(db, COLLECTIONS.SADAQAH, s.id), s);
        }
        // قرارات استراتيجية أولية
        for (const dec of INITIAL_STRATEGIC_DECISIONS) {
          await setDoc(doc(db, COLLECTIONS.DECISIONS, dec.id), dec);
        }
        // ذاكرة الشركة المؤسسية
        for (const mem of INITIAL_COMPANY_MEMORIES) {
          await setDoc(doc(db, COLLECTIONS.MEMORIES, mem.id), mem);
        }
        // بيانات الشركة
        await setDoc(doc(db, COLLECTIONS.META, 'current'), INITIAL_COMPANY_META);

        console.log('Initial data seeded successfully in Cloud Firestore!');
      }
    } catch (err) {
      console.warn('Firestore seeding notice:', err);
    }
  }

  // مزامنة لحظية للمعاملات المالية
  static subscribeTransactions(callback: (items: FinancialTransaction[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.TRANSACTIONS), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as FinancialTransaction);
      items.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      callback(items);
    }, (err) => console.warn('Sync transactions error:', err));
  }

  static async saveTransaction(tx: FinancialTransaction): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, tx.id), tx);
  }

  // مزامنة دورات الأرباح
  static subscribeProfitCycles(callback: (items: ProfitDistributionCycle[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.PROFIT_CYCLES), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as ProfitDistributionCycle);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (err) => console.warn('Sync profit cycles error:', err));
  }

  static async saveProfitCycle(cycle: ProfitDistributionCycle): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.PROFIT_CYCLES, cycle.id), cycle);
  }

  // مزامنة المشاريع
  static subscribeProjects(callback: (items: ProjectItem[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.PROJECTS), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as ProjectItem);
      callback(items);
    }, (err) => console.warn('Sync projects error:', err));
  }

  static async saveProject(proj: ProjectItem): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.PROJECTS, proj.id), proj);
  }

  // مزامنة المهام
  static subscribeTasks(callback: (items: TaskItem[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.TASKS), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as TaskItem);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (err) => console.warn('Sync tasks error:', err));
  }

  static async saveTask(task: TaskItem): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.TASKS, task.id), task);
  }

  // مزامنة العملاء
  static subscribeClients(callback: (items: ClientItem[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.CLIENTS), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as ClientItem);
      callback(items);
    }, (err) => console.warn('Sync clients error:', err));
  }

  static async saveClient(client: ClientItem): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.CLIENTS, client.id), client);
  }

  // مزامنة صندوق التطوير
  static subscribeDevUsages(callback: (items: CompanyDevUsage[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.DEV_USAGES), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as CompanyDevUsage);
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(items);
    }, (err) => console.warn('Sync dev usages error:', err));
  }

  static async saveDevUsage(usage: CompanyDevUsage): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.DEV_USAGES, usage.id), usage);
  }

  // مزامنة الصدقة
  static subscribeSadaqah(callback: (items: SadaqahDonationRecord[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.SADAQAH), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as SadaqahDonationRecord);
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(items);
    }, (err) => console.warn('Sync sadaqah error:', err));
  }

  static async saveSadaqah(record: SadaqahDonationRecord): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.SADAQAH, record.id), record);
  }

  // مزامنة بيانات الشركة
  static subscribeMeta(callback: (meta: CompanyMeta) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(doc(db, COLLECTIONS.META, 'current'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as CompanyMeta);
      }
    }, (err) => console.warn('Sync meta error:', err));
  }

  static async saveMeta(meta: CompanyMeta): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.META, 'current'), meta);
  }

  // مزامنة القرارات الاستراتيجية المشتركة
  static subscribeDecisions(callback: (items: StrategicDecision[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.DECISIONS), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as StrategicDecision);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (err) => console.warn('Sync decisions error:', err));
  }

  static async saveDecision(decision: StrategicDecision): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.DECISIONS, decision.id), decision);
  }

  // مزامنة ذاكرة الشركة المؤسسية وقاعدة المعرفة
  static subscribeMemories(callback: (items: CompanyMemoryItem[]) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(collection(db, COLLECTIONS.MEMORIES), (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as CompanyMemoryItem);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (err) => console.warn('Sync memories error:', err));
  }

  static async saveMemory(memory: CompanyMemoryItem): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, COLLECTIONS.MEMORIES, memory.id), memory);
  }
}
