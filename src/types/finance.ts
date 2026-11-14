// أنواع البيانات المالية وتقسيم الأرباح

export type TransactionType = 'revenue' | 'expense';

export type ExpenseCategory = 
  | 'project_cost'      // تكاليف تنفيذ المشاريع
  | 'tools_ai'          // أدوات واشتراكات الذكاء الاصطناعي والبرمجة
  | 'hosting_servers'   // استضافة وسيرفرات ودومينات
  | 'marketing'         // مصروفات تسويق وإعلانات
  | 'operational'       // مصروفات تشغيلية
  | 'other';            // أخرى

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;             // القيمة بالجنيه المصري
  isCashCollected: boolean;   // هل تم التحصيل النقدي فعلياً في اليد/الحساب؟ (حاسم في الإيرادات)
  category: ExpenseCategory;
  date: string;               // YYYY-MM-DD
  loggedBy: 'mohamed' | 'tarek';
  projectId?: string;
  projectTitle?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

// هيكل نتيجة تقسيم الأرباح للأرباع الأربعة
export interface FourWayProfitSplit {
  collectedRevenue: number;         // إجمالي الإيرادات المحصلة فعلياً
  uncollectedReceivables: number;   // مستحقات مؤجلة لم تُحصل بعد
  totalExpenses: number;            // إجمالي المصروفات المسددة
  netDistributableProfit: number;   // صافي الربح القابل للتوزيع (المحصل - المصروفات)
  
  // الأرباع الأربعة المتساوية (25% لكل طرف)
  tarekShare: number;               // 25% نصيب م. طارق حافظ
  mohamedShare: number;             // 25% نصيب م. محمد البحر
  companyDevShare: number;          // 25% صندوق تطوير الشركة والأدوات
  sadaqahShare: number;             // 25% صندوق الصدقة لوجه الله
  
  remainderCents: number;           // بواقي القروش المحاسبية
  checksumMatches: boolean;         // تطابق المجموع 100% بدون أي هلوسة
}

// دورة إغلاق وتوزيع أرباح رسمية
export interface ProfitDistributionCycle {
  id: string;
  periodName: string;               // مثلاً: "أرباح شهر نوفمبر 2026"
  startDate: string;
  endDate: string;
  collectedRevenue: number;
  totalExpenses: number;
  netDistributableProfit: number;
  
  tarekShare: number;
  mohamedShare: number;
  companyDevShare: number;
  sadaqahShare: number;
  
  // نظام الاعتماد المزدوج الصارم (Dual Approval)
  status: 'draft' | 'pending_approval' | 'approved';
  mohamedApproved: boolean;
  mohamedApprovedAt?: string;
  tarekApproved: boolean;
  tarekApprovedAt?: string;
  
  createdAt: string;
  notes?: string;
}

// سجل استخدامات صندوق تطوير الشركة
export interface CompanyDevUsage {
  id: string;
  toolName: string;                 // مثل Claude Code, Cursor, Gemini API, Hostinger
  amount: number;
  date: string;
  loggedBy: 'mohamed' | 'tarek';
  purpose: string;
}

// سجل الصدقات والتبرعات
export interface SadaqahDonationRecord {
  id: string;
  amount: number;
  date: string;
  loggedBy: 'mohamed' | 'tarek';
  notes: string;                    // ملحوظة أو جهة التبرع التي اختارها الشريكان يدوياً
}
