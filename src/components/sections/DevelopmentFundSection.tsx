import React, { useState } from 'react';
import { 
  Wrench, 
  Cpu, 
  Server, 
  Globe, 
  Sparkles, 
  Plus, 
  Coins, 
  History, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { CompanyDevUsage, ProfitDistributionCycle } from '../../types/finance';
import { PartnerId } from '../../types/company';
import { calculateCompanyDevFundStatus } from '../../services/financeEngine';

interface DevelopmentFundSectionProps {
  currentPartner: PartnerId;
  profitCycles: ProfitDistributionCycle[];
  devUsages: CompanyDevUsage[];
  onAddDevUsage: (usage: Omit<CompanyDevUsage, 'id'>) => void;
}

export const DevelopmentFundSection: React.FC<DevelopmentFundSectionProps> = ({
  currentPartner,
  profitCycles,
  devUsages,
  onAddDevUsage
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [toolName, setToolName] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fundStatus = calculateCompanyDevFundStatus(profitCycles, devUsages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName || amount <= 0) return;

    onAddDevUsage({
      toolName,
      amount,
      purpose,
      date,
      loggedBy: currentPartner
    });

    setShowModal(false);
    setToolName('');
    setAmount(0);
    setPurpose('');
  };

  const sampleTools = [
    { name: 'Claude Code', icon: Sparkles, desc: 'تسريع البرمجة ومراجعة الأكواد المعقدة' },
    { name: 'Google Gemini Pro / Flash API', icon: Cpu, desc: 'محرك الذكاء الاصطناعي للمنصة والمشاريع' },
    { name: 'سيرفرات واستضافة سحابية (Firebase / Hostinger)', icon: Server, desc: 'تشغيل المنتجات وDemos العملاء' },
    { name: 'دومينات وتراخيص أمان SSL', icon: Globe, desc: 'حجز أسماء النطاقات وهوية الشركة' }
  ];

  return (
    <div className="space-y-6">
      
      {/* رأس الصندوق */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                صندوق تطوير أدوات الشركة (الربع الثالث - 25%)
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                مخصص لتطوير أدوات البرمجة، اشتراكات الذكاء الاصطناعي، السيرفرات، وكل ما يدعم نمو منتجاتنا.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل استخدام من الصندوق</span>
        </button>
      </div>

      {/* بطاقات المؤشرات الثلاثة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">إجمالي المخصص التراكمي (25%)</span>
          <span className="text-2xl font-black text-indigo-400 mt-2 block">
            {fundStatus.totalAllocated.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">من دورات الأرباح المعتمدة</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">المصروف الفعلي على الأدوات</span>
          <span className="text-2xl font-black text-rose-400 mt-2 block">
            -{fundStatus.totalSpent.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">اشتراكات، سيرفرات، وتراخيص</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 to-indigo-950/40">
          <span className="text-xs font-bold text-slate-400 block">الرصيد المتبقي المتاح للتطوير</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 block">
            {fundStatus.balanceRemaining.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">جاهز للاستثمار في أدوات جديدة</span>
        </div>
      </div>

      {/* الأدوات المستهدفة للاستثمار */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>الأدوات المعتمدة للاستخدام من هذا المخصص</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleTools.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <div className="p-2 w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-white">{t.name}</h3>
                <p className="text-[11px] text-slate-400">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* سجل الاستخدامات السابقة */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">سجل استخدامات مخصص التطوير</h2>
          </div>
          <span className="text-xs text-slate-400">{devUsages.length} عمليات مسجلة</span>
        </div>

        <div className="space-y-2.5">
          {devUsages.map((usage) => (
            <div key={usage.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white text-sm block">{usage.toolName}</span>
                <p className="text-slate-400 text-xs">{usage.purpose}</p>
                <span className="text-[10px] text-slate-400">
                  التاريخ: {usage.date} | المسجل: {usage.loggedBy === 'mohamed' ? 'م. محمد البحر' : 'م. طارق حافظ'}
                </span>
              </div>
              <div className="text-right sm:self-center">
                <span className="font-black text-rose-400 text-base">-{usage.amount.toLocaleString()} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نافذة تسجيل مصروف من الصندوق */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              <span>تسجيل استخدام من صندوق تطوير الشركة</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الأداة أو الخدمة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اشتراك Cursor Pro أو تجديد سيرفر..."
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ (ج.م):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الغرض من الاستخدام:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="كيف ستفيد هذه الأداة مشاريع الشركة..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ وتسجيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
