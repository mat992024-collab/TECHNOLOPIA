import React, { useState } from 'react';
import { 
  Calculator, 
  Coins, 
  UserCheck, 
  Wrench, 
  HeartHandshake, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  Info,
  Save,
  HelpCircle
} from 'lucide-react';
import { calculateFourWayProfitSplit } from '../../services/financeEngine';
import { FourWayProfitSplit } from '../../types/finance';

interface ProfitCalculatorSectionProps {
  onCreateCycleFromCalculation?: (split: FourWayProfitSplit, note: string) => void;
}

export const ProfitCalculatorSection: React.FC<ProfitCalculatorSectionProps> = ({
  onCreateCycleFromCalculation
}) => {
  const [collectedRevenue, setCollectedRevenue] = useState<number>(20000);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [uncollected, setUncollected] = useState<number>(5000);
  const [cycleTitle, setCycleTitle] = useState<string>('دورة أرباح تجريبية');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // حساب دقيق فوري
  const split = calculateFourWayProfitSplit(collectedRevenue, uncollected, totalExpenses);

  const presets = [10000, 20000, 35000, 50000, 100000];

  const handleSaveCycle = () => {
    if (onCreateCycleFromCalculation) {
      onCreateCycleFromCalculation(split, cycleTitle);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* رأس القسم والتنبيه الشرعي والمحاسبي */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/60 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Calculator className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                حاسبة الأرباح التفاعلية ومحرك الأرباع الأربعة
              </h1>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              تقسيم صافي الربح الحقيقي المحصل إلى <span className="text-emerald-400 font-bold">أربعة أجزاء متساوية (25% لكل بند)</span> بدقة متناهية بكود رياضي برمجي حتمي، مع معالجة كسور القروش لصالح الصدقة لوجه الله تعالى.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 self-start md:self-auto">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-right">
              <span className="block text-[11px] text-slate-400">التطابق المحاسبي:</span>
              <span className="text-xs font-bold text-emerald-400">
                {split.checksumMatches ? '100% متطابق بدون أدنى عجز' : 'يوجد تباين'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* مدخلات الحساب */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* عمود المدخلات */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-lg">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>بيانات الإيرادات والمصروفات</span>
          </h2>

          {/* الإيرادات المحصلة فعلياً */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>المبالغ المحصلة نقدياً فعلياً (ج.م):</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">كاش باليد / الحساب</span>
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={collectedRevenue}
              onChange={(e) => setCollectedRevenue(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              * الأساس في التوزيع هو ما دخل الحساب أو استلمتوه نقدياً فقط.
            </p>
          </div>

          {/* مبالغ مستحقة لم تحصل */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>مستحقات آجلة لم تُحصل بعد (ج.م):</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">مؤجلة لحين السداد</span>
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={uncollected}
              onChange={(e) => setUncollected(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-400">
              * لا تدخل هذه المبالغ إطلاقاً في صافي الربح القابل للتوزيع لحين تحصيلها الفعلي.
            </p>
          </div>

          {/* التكاليف والمصروفات */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>إجمالي المصروفات والتكاليف المسددة (ج.م):</span>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">تُخصم أولاً</span>
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={totalExpenses}
              onChange={(e) => setTotalExpenses(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-black text-rose-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* أزرار سريعة للأرقام الشائعة */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">مبالغ تجريبية سريعة للإيراد:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((val) => (
                <button
                  key={val}
                  onClick={() => setCollectedRevenue(val)}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  {val.toLocaleString()} ج.م
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* عرض النتيجة والتقسيم الرباعي */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* شريط ملخص صافي الربح القابل للتوزيع */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">صافي الربح القابل للتوزيع الفوري:</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  {split.netDistributableProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400">جنيه مصري</span>
                </span>
              </div>
              <div className="text-xs text-slate-400 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <div>الإيراد الفعلي: <span className="text-white font-bold">{split.collectedRevenue.toLocaleString()} ج.م</span></div>
                <div>المصروفات: <span className="text-rose-400 font-bold">-{split.totalExpenses.toLocaleString()} ج.م</span></div>
              </div>
            </div>

            {/* الأرباع الأربعة بنسبة 25% لكل طرف */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              
              {/* 1. نصيب المهندس طارق حافظ */}
              <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 p-4 rounded-xl border border-emerald-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300">المهندس طارق حافظ</h3>
                      <span className="text-[10px] text-emerald-400 font-bold">الربع الأول (25%)</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    نصيب شريك
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white">
                    {split.tarekShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">حصة الأرباح الشخصية المستحقة</p>
              </div>

              {/* 2. نصيب المهندس محمد البحر */}
              <div className="bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-900 p-4 rounded-xl border border-blue-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300">المهندس محمد البحر</h3>
                      <span className="text-[10px] text-blue-400 font-bold">الربع الثاني (25%)</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    نصيب شريك
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white">
                    {split.mohamedShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">حصة الأرباح الشخصية المستحقة</p>
              </div>

              {/* 3. صندوق تطوير أدوات الشركة */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 p-4 rounded-xl border border-indigo-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300">تطوير أدوات الشركة</h3>
                      <span className="text-[10px] text-indigo-400 font-bold">الربع الثالث (25%)</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    أدوات وسيرفرات
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white">
                    {split.companyDevShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Claude Code، اشتراكات AI، استضافة ودومينات</p>
              </div>

              {/* 4. الصدقة لوجه الله تعالى */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 p-4 rounded-xl border border-amber-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300">الصدقة لوجه الله تعالى</h3>
                      <span className="text-[10px] text-amber-400 font-bold">الربع الرابع (25%)</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    بركة وتبرع
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white">
                    {split.sadaqahShare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  يتولى الشريكان إخراجها بأنفسهما خارج التطبيق {split.remainderCents > 0 ? `(يشمل ${split.remainderCents} قرش لمعالجة الكسر)` : ''}
                </p>
              </div>

            </div>

            {/* التحقق من تطابق المجموع بدقة 100% */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  مجموع الأرباع: {(split.tarekShare + split.mohamedShare + split.companyDevShare + split.sadaqahShare).toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م 
                  (مطابق تماماً لصافي الربح)
                </span>
              </div>

              {/* زر الحفظ كدورة رسمية */}
              {onCreateCycleFromCalculation && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCycle}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ كدورة أرباح معتمدة</span>
                  </button>
                  {saveSuccess && (
                    <span className="text-emerald-400 font-bold animate-fade-in">تم الحفظ!</span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* تنبيه حدود مسؤولية البرنامج المالية */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>ميثاق الحوكمة والأمان المالي:</span>
            </div>
            <p>
              المنصة مسؤولة عن الحسابات الدقيقة والأرشفة والتقارير الرقابية فقط. لا تنفذ المنصة أي تحويلات بنكية أو إلكترونية أو تبرعات مباشرة. كل العمليات المالية النقدية يقوم بها المهندس محمد والمهندس طارق على أرض الواقع خارج البرنامج.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
