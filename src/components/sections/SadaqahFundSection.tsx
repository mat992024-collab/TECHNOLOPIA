import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Coins, 
  Plus, 
  History, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { SadaqahDonationRecord, ProfitDistributionCycle } from '../../types/finance';
import { PartnerId } from '../../types/company';
import { calculateSadaqahFundStatus } from '../../services/financeEngine';

interface SadaqahFundSectionProps {
  currentPartner: PartnerId;
  profitCycles: ProfitDistributionCycle[];
  sadaqahRecords: SadaqahDonationRecord[];
  onAddDonation: (record: Omit<SadaqahDonationRecord, 'id'>) => void;
}

export const SadaqahFundSection: React.FC<SadaqahFundSectionProps> = ({
  currentPartner,
  profitCycles,
  sadaqahRecords,
  onAddDonation
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fundStatus = calculateSadaqahFundStatus(profitCycles, sadaqahRecords);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    onAddDonation({
      amount,
      notes,
      date,
      loggedBy: currentPartner
    });

    setShowModal(false);
    setAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* رأس القسم والتنبيه الشرعي والحوكمي */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-900 p-6 rounded-2xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                صندوق الصدقة لوجه الله تعالى (الربع الرابع - 25%)
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                بركة أرباح الشركة وتخصيص 25% ثابتة من صافي الربح الحقيقي لوجه الله تعالى.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-amber-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل تبرع تم إخراجه فعلياً</span>
        </button>
      </div>

      {/* تنبيه ميثاق إخراج الصدقة */}
      <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">ميثاق إدارة الصدقات في المنصة:</span>
          <p className="text-slate-400 leading-relaxed">
            المهندس محمد البحر والمهندس طارق حافظ هما من يختاران جهات التبرع والمستحقين ويتوليان إخراج الصدقة بأنفسهما يداً بيد خارج البرنامج. دور هذا القسم هو توثيق المخصص المتراكم، والمبالغ التي تم التبرع بها، لضمان عدم نسيان أي حق لله تعالى في الأرباح.
          </p>
        </div>
      </div>

      {/* بطاقات المؤشرات المالية للصدقة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">إجمالي مخصص الصدقة التراكمي (25%)</span>
          <span className="text-2xl font-black text-amber-400 mt-2 block">
            {fundStatus.totalAllocated.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">من كافة دورات الأرباح المعتمدة</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">المبالغ المسجلة كمتبرع بها</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 block">
            {fundStatus.totalDonated.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">خرجت بالفعل لوجه الله</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 to-amber-950/40">
          <span className="text-xs font-bold text-slate-400 block">الرصيد المتبقي للإخراج</span>
          <span className="text-2xl font-black text-white mt-2 block">
            {fundStatus.balanceRemaining.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-amber-400 font-bold">في ذمة الشركة للتبرع به</span>
        </div>
      </div>

      {/* سجل التبرعات والمخرجات السابقة */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">سجل التبرعات المخرجة يدوياً</h2>
          </div>
          <span className="text-xs text-slate-400">{sadaqahRecords.length} عمليات مسجلة</span>
        </div>

        <div className="space-y-2.5">
          {sadaqahRecords.map((record) => (
            <div key={record.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white text-sm block">{record.notes || 'صدقة لوجه الله تعالى'}</span>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>التاريخ: {record.date}</span>
                  <span>المسجل: {record.loggedBy === 'mohamed' ? 'م. محمد البحر' : 'م. طارق حافظ'}</span>
                </div>
              </div>
              <div className="text-right sm:self-center">
                <span className="font-black text-emerald-400 text-lg">
                  {record.amount.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نافذة تسجيل تبرع جديد */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-400" />
              <span>تسجيل صدقة تم إخراجها بالفعل</span>
            </h3>

            <p className="text-xs text-slate-300">
              أدخل المبلغ الذي قمتم بإخراجه يدوياً خارج البرنامج لتحديث سجل الرصيد المتبقي.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ (ج.م):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الإخراج:</label>
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
                <label className="block text-slate-300 font-bold mb-1">ملاحظات / الوجه الذي تم التبرع له:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="مثال: إطعام أسر متعففة، علاج مريض، كفالة طالب علم..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black shadow-md"
                >
                  تأكيد وحفظ في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
