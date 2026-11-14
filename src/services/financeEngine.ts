import { 
  FinancialTransaction, 
  FourWayProfitSplit, 
  ProfitDistributionCycle,
  CompanyDevUsage,
  SadaqahDonationRecord
} from '../types/finance';

/**
 * المحرك المالي الصارم (Deterministic Financial Engine)
 * يتم الحساب بالكامل بكود خالص 100% بدون أي تقديرات أو تدخل من الذكاء الاصطناعي
 */

/**
 * دالة حساب وتقسيم صافي الربح إلى 4 أرباع متساوية (25% لكل جهة)
 * مع المعالجة الدقيقة لأي فروق قروش لضمان تطابق المجموع مع صافي الربح تماماً
 */
export function calculateFourWayProfitSplit(
  collectedRevenue: number,
  uncollectedReceivables: number,
  totalExpenses: number
): FourWayProfitSplit {
  // التحويل إلى قروش صحيحة (Cents/Piastres) لتفادي أخطاء الفواصل العشرية في JavaScript
  const revCents = Math.round((Math.max(0, collectedRevenue) || 0) * 100);
  const uncollectedCents = Math.round((Math.max(0, uncollectedReceivables) || 0) * 100);
  const expCents = Math.round((Math.max(0, totalExpenses) || 0) * 100);

  // قاعدة حاسمة: صافي الربح القابل للتوزيع يعتمد فقط على ما تم تحصيله نقدياً فعلياً
  const netProfitCents = Math.max(0, revCents - expCents);

  // قسمة صافي الربح على 4
  const baseQuarterCents = Math.floor(netProfitCents / 4);
  const remainderCents = netProfitCents % 4;

  // الحصص الأساسية: 25% لكل جهة
  const tarekCents = baseQuarterCents;
  const mohamedCents = baseQuarterCents;
  const companyDevCents = baseQuarterCents;
  
  // معالجة كسر القرش لصالح الصدقة لوجه الله لضمان تطابق المجموع الكلي 100%
  const sadaqahCents = baseQuarterCents + remainderCents;

  const tarekShare = tarekCents / 100;
  const mohamedShare = mohamedCents / 100;
  const companyDevShare = companyDevCents / 100;
  const sadaqahShare = sadaqahCents / 100;
  const netDistributableProfit = netProfitCents / 100;

  const totalCalculated = tarekShare + mohamedShare + companyDevShare + sadaqahShare;
  const checksumMatches = Math.abs(totalCalculated - netDistributableProfit) < 0.00001;

  return {
    collectedRevenue: revCents / 100,
    uncollectedReceivables: uncollectedCents / 100,
    totalExpenses: expCents / 100,
    netDistributableProfit,
    tarekShare,
    mohamedShare,
    companyDevShare,
    sadaqahShare,
    remainderCents,
    checksumMatches
  };
}

/**
 * حساب إجماليات المعاملات المالية المجمعة
 */
export function summarizeTransactions(transactions: FinancialTransaction[]): {
  collectedRevenue: number;
  uncollectedReceivables: number;
  totalExpenses: number;
  split: FourWayProfitSplit;
} {
  let collectedRev = 0;
  let uncollectedRev = 0;
  let expenses = 0;

  for (const t of transactions) {
    if (t.type === 'revenue') {
      if (t.isCashCollected) {
        collectedRev += t.amount;
      } else {
        uncollectedRev += t.amount;
      }
    } else if (t.type === 'expense') {
      expenses += t.amount;
    }
  }

  const split = calculateFourWayProfitSplit(collectedRev, uncollectedRev, expenses);

  return {
    collectedRevenue: split.collectedRevenue,
    uncollectedReceivables: split.uncollectedReceivables,
    totalExpenses: split.totalExpenses,
    split
  };
}

/**
 * حساب رصيد صندوق تطوير الشركة (المخصص التراكمي - المصروف الفعلي)
 */
export function calculateCompanyDevFundStatus(
  approvedCycles: ProfitDistributionCycle[],
  usages: CompanyDevUsage[]
): {
  totalAllocated: number;
  totalSpent: number;
  balanceRemaining: number;
} {
  const totalAllocated = approvedCycles
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + c.companyDevShare, 0);

  const totalSpent = usages.reduce((sum, u) => sum + u.amount, 0);
  const balanceRemaining = Math.max(0, totalAllocated - totalSpent);

  return {
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    balanceRemaining: Math.round(balanceRemaining * 100) / 100
  };
}

/**
 * حساب رصيد صندوق الصدقة (المخصص التراكمي - المبالغ المسجلة كمتبرع بها)
 */
export function calculateSadaqahFundStatus(
  approvedCycles: ProfitDistributionCycle[],
  donations: SadaqahDonationRecord[]
): {
  totalAllocated: number;
  totalDonated: number;
  balanceRemaining: number;
} {
  const totalAllocated = approvedCycles
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + c.sadaqahShare, 0);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const balanceRemaining = Math.max(0, totalAllocated - totalDonated);

  return {
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalDonated: Math.round(totalDonated * 100) / 100,
    balanceRemaining: Math.round(balanceRemaining * 100) / 100
  };
}
