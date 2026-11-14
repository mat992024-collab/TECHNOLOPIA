import React, { useState } from 'react';
import { 
  Wallet, 
  Coins, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  Calendar, 
  Filter, 
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';
import { FinancialTransaction, ProfitDistributionCycle, ExpenseCategory } from '../../types/finance';
import { PartnerId } from '../../types/company';
import { ProjectItem } from '../../types/projects';
import { summarizeTransactions, calculateFourWayProfitSplit } from '../../services/financeEngine';

interface FinancialManagementSectionProps {
  currentPartner: PartnerId;
  transactions: FinancialTransaction[];
  profitCycles: ProfitDistributionCycle[];
  projects: ProjectItem[];
  onAddTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void;
  onApproveCycle: (cycleId: string, partner: PartnerId) => void;
  onCreateNewCycle: (cycle: Omit<ProfitDistributionCycle, 'id' | 'createdAt'>) => void;
}

export const FinancialManagementSection: React.FC<FinancialManagementSectionProps> = ({
  currentPartner,
  transactions,
  profitCycles,
  projects,
  onAddTransaction,
  onApproveCycle,
  onCreateNewCycle
}) => {
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense' | 'uncollected'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showNewCycleModal, setShowNewCycleModal] = useState<boolean>(false);

  // حالة إضافة معاملة
  const [txTitle, setTxTitle] = useState<string>('');
  const [txType, setTxType] = useState<'revenue' | 'expense'>('revenue');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txIsCollected, setTxIsCollected] = useState<boolean>(true);
  const [txCategory, setTxCategory] = useState<ExpenseCategory>('project_cost');
  const [txProjectId, setTxProjectId] = useState<string>('');
  const [txNotes, setTxNotes] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // حالة دورة أرباح جديدة
  const [cyclePeriodName, setCyclePeriodName] = useState<string>(`أرباح شهر ${new Date().toLocaleString('ar-EG', { month: 'long' })} 2026`);
  const [cycleStartDate, setCycleStartDate] = useState<string>(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [cycleEndDate, setCycleEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const summary = summarizeTransactions(transactions);

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'revenue') return t.type === 'revenue' && t.isCashCollected;
    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'uncollected') return t.type === 'revenue' && !t.isCashCollected;
    return true;
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || txAmount <= 0) return;

    const selectedProj = projects.find(p => p.id === txProjectId);

    onAddTransaction({
      title: txTitle,
      type: txType,
      amount: txAmount,
      isCashCollected: txType === 'revenue' ? txIsCollected : true,
      category: txCategory,
      projectId: txProjectId || undefined,
      projectTitle: selectedProj ? selectedProj.name : undefined,
      date: txDate,
      loggedBy: currentPartner,
      notes: txNotes
    });

    setShowAddModal(false);
    // تصفير النموذج
    setTxTitle('');
    setTxAmount(0);
    setTxNotes('');
  };

  const handleCreateCycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const split = calculateFourWayProfitSplit(summary.collectedRevenue, summary.uncollectedReceivables, summary.totalExpenses);

    onCreateNewCycle({
      periodName: cyclePeriodName,
      startDate: cycleStartDate,
      endDate: cycleEndDate,
      collectedRevenue: split.collectedRevenue,
      totalExpenses: split.totalExpenses,
      netDistributableProfit: split.netDistributableProfit,
      tarekShare: split.tarekShare,
      mohamedShare: split.mohamedShare,
      companyDevShare: split.companyDevShare,
      sadaqahShare: split.sadaqahShare,
      status: 'pending_approval',
      mohamedApproved: currentPartner === 'mohamed',
      mohamedApprovedAt: currentPartner === 'mohamed' ? new Date().toISOString() : undefined,
      tarekApproved: currentPartner === 'tarek',
      tarekApprovedAt: currentPartner === 'tarek' ? new Date().toISOString() : undefined
    });

    setShowNewCycleModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* بطاقة الرأس والتحكم المالي */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                الإدارة المالية ودورات توزيع الأرباح
              </h1>
              <span className="text-xs text-slate-300">
                تسجيل دقيق للإيرادات والمصروفات مع اعتماد الشريكين المزدوج (Dual Approval)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل معاملة مالية</span>
          </button>
          <button
            onClick={() => setShowNewCycleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>إغلاق دورة أرباح جديدة</span>
          </button>
        </div>
      </div>

      {/* شريط الإحصائيات المالية المباشرة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">الإيرادات المحصلة نقدياً فعلياً</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">
            {summary.collectedRevenue.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">في الحساب أو اليد نقداً</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">مستحقات آجلة لم تُحصل</span>
          <span className="text-xl font-black text-amber-400 mt-1 block">
            {summary.uncollectedReceivables.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">لا تدخل في التوزيع حتى تُحصّل</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">إجمالي المصروفات المسددة</span>
          <span className="text-xl font-black text-rose-400 mt-1 block">
            -{summary.totalExpenses.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">تكاليف، استضافة، أدوات، وتسويق</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">صافي الربح القابل للتوزيع (الأرباع الـ 4)</span>
          <span className="text-xl font-black text-white mt-1 block">
            {summary.split.netDistributableProfit.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-emerald-400">كل ربع: {summary.split.tarekShare.toLocaleString()} ج.م</span>
        </div>
      </div>

      {/* قسم دورات توزيع الأرباح (نظام الاعتماد المزدوج) */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              سجل دورات توزيع الأرباح الرسمية (Dual Approval)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            يشترط موافقة محمد وطارق معاً قبل اعتماد أي دورة
          </span>
        </div>

        <div className="space-y-3">
          {profitCycles.map((cycle) => {
            const isFullyApproved = cycle.status === 'approved' || (cycle.mohamedApproved && cycle.tarekApproved);
            const needsMohamed = !cycle.mohamedApproved;
            const needsTarek = !cycle.tarekApproved;

            return (
              <div 
                key={cycle.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{cycle.periodName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                        isFullyApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isFullyApproved ? 'معتمد رسمياً من الشريكين' : 'في انتظار اكتمال الاعتماد'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      الفترة: من {cycle.startDate} إلى {cycle.endDate}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">صافي الربح الموزع:</span>
                    <span className="text-lg font-black text-emerald-400 block">
                      {cycle.netDistributableProfit.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                {/* تفصيل الأرباع الأربعة لدورة الأرباح */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">م. طارق حافظ (25%)</span>
                    <span className="font-bold text-white text-sm">{cycle.tarekShare.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">م. محمد البحر (25%)</span>
                    <span className="font-bold text-white text-sm">{cycle.mohamedShare.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">صندوق تطوير الشركة (25%)</span>
                    <span className="font-bold text-indigo-400 text-sm">{cycle.companyDevShare.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">صدقة لوجه الله (25%)</span>
                    <span className="font-bold text-amber-400 text-sm">{cycle.sadaqahShare.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {/* أزرار وموقف الاعتماد المزدوج */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    {/* حالة محمد */}
                    <div className="flex items-center gap-1.5">
                      <UserCheck className={`w-3.5 h-3.5 ${cycle.mohamedApproved ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className={cycle.mohamedApproved ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                        م. محمد البحر: {cycle.mohamedApproved ? 'معتمد ✓' : 'لم يعتمد بعد'}
                      </span>
                    </div>

                    {/* حالة طارق */}
                    <div className="flex items-center gap-1.5">
                      <UserCheck className={`w-3.5 h-3.5 ${cycle.tarekApproved ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className={cycle.tarekApproved ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                        م. طارق حافظ: {cycle.tarekApproved ? 'معتمد ✓' : 'لم يعتمد بعد'}
                      </span>
                    </div>
                  </div>

                  {/* زر الاعتماد للشريك الحالي إذا لم يكن قد اعتمد */}
                  {!isFullyApproved && (
                    <div>
                      {currentPartner === 'mohamed' && needsMohamed && (
                        <button
                          onClick={() => onApproveCycle(cycle.id, 'mohamed')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow transition-all"
                        >
                          اعتماد بصفتي المهندس محمد البحر
                        </button>
                      )}
                      {currentPartner === 'tarek' && needsTarek && (
                        <button
                          onClick={() => onApproveCycle(cycle.id, 'tarek')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition-all"
                        >
                          اعتماد بصفتي المهندس طارق حافظ
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* جدول المعاملات المالية اليومية */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">سجل المعاملات المالية</h2>
          </div>

          {/* فلاتر */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterType('revenue')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${filterType === 'revenue' ? 'bg-emerald-600/30 text-emerald-400' : 'text-slate-400'}`}
            >
              إيرادات محصلة
            </button>
            <button
              onClick={() => setFilterType('uncollected')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${filterType === 'uncollected' ? 'bg-amber-600/30 text-amber-400' : 'text-slate-400'}`}
            >
              مستحقات آجلة
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${filterType === 'expense' ? 'bg-rose-600/30 text-rose-400' : 'text-slate-400'}`}
            >
              مصروفات
            </button>
          </div>
        </div>

        {/* قائمة المعاملات */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">المعاملة</th>
                <th className="p-3">النوع</th>
                <th className="p-3">القيمة</th>
                <th className="p-3">حالة التحصيل</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-200">
                    <div>{tx.title}</div>
                    {tx.projectTitle && (
                      <span className="text-[10px] text-slate-400 font-normal">مشروع: {tx.projectTitle}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'revenue' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {tx.type === 'revenue' ? 'إيراد' : 'مصروف'}
                    </span>
                  </td>
                  <td className="p-3 font-black text-sm">
                    <span className={tx.type === 'revenue' ? 'text-emerald-400' : 'text-rose-400'}>
                      {tx.type === 'revenue' ? '+' : '-'}{tx.amount.toLocaleString()} ج.م
                    </span>
                  </td>
                  <td className="p-3">
                    {tx.type === 'revenue' ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.isCashCollected ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {tx.isCashCollected ? 'نقدية محصلة ✓' : 'مستحق آجل'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">مسدد</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{tx.date}</td>
                  <td className="p-3 text-slate-400">
                    {tx.loggedBy === 'mohamed' ? 'م. محمد' : 'م. طارق'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة تسجيل معاملة مالية جديدة */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>تسجيل معاملة مالية جديدة</span>
            </h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع المعاملة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('revenue')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      txType === 'revenue' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    إيراد تعاقد أو دفعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      txType === 'expense' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    مصروف أو تكلفة تشغيل
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">بيان المعاملة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دفعة استلام نظام كاشير مطعم..."
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ (ج.م):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txAmount || ''}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* التحصيل الفعلي - حاسم جداً */}
              {txType === 'revenue' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">هل تم التحصيل النقدي فعلياً؟</span>
                    <span className="text-[10px] text-slate-400">
                      إذا لم يُحصل بعد، لن يدخل في صافي الربح القابل للتوزيع حتى تسجل تحصيله.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={txIsCollected}
                    onChange={(e) => setTxIsCollected(e.target.checked)}
                    className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">المشروع المرتبط (اختياري):</label>
                <select
                  value={txProjectId}
                  onChange={(e) => setTxProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">بدون مشروع (معاملة عامة للشركة)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ المعاملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إغلاق دورة أرباح جديدة */}
      {showNewCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>إغلاق دورة أرباح دورية جديدة</span>
            </h3>

            <p className="text-xs text-slate-300">
              سيتم حساب صافي الربح من النقدية المحصلة فعلياً وتقسيمها إلى 4 أرباع بنسبة 25% لكل بند، وستظهر كمسودة تنتظر اعتماد الشريكين.
            </p>

            <form onSubmit={handleCreateCycleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الفترة:</label>
                <input
                  type="text"
                  required
                  value={cyclePeriodName}
                  onChange={(e) => setCyclePeriodName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">من تاريخ:</label>
                  <input
                    type="date"
                    required
                    value={cycleStartDate}
                    onChange={(e) => setCycleStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">إلى تاريخ:</label>
                  <input
                    type="date"
                    required
                    value={cycleEndDate}
                    onChange={(e) => setCycleEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>صافي الربح المتوقع توزيعه:</span>
                  <span className="font-bold text-emerald-400">{summary.split.netDistributableProfit.toLocaleString()} ج.م</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  حصة كل طرف (25%): {summary.split.tarekShare.toLocaleString()} ج.م
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewCycleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  إنشاء الدورة وطلب الاعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
