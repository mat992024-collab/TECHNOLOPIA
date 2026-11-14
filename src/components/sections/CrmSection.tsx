import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Phone, 
  Calendar, 
  Coins, 
  UserCheck, 
  ArrowRight,
  Filter,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Search
} from 'lucide-react';
import { ClientItem, PipelineStage } from '../../types/crm';
import { PartnerId } from '../../types/company';

interface CrmSectionProps {
  clients: ClientItem[];
  currentPartner: PartnerId;
  onAddClient: (client: Omit<ClientItem, 'id' | 'createdAt'>) => void;
  onUpdateStage: (clientId: string, stage: PipelineStage) => void;
}

export const CrmSection: React.FC<CrmSectionProps> = ({
  clients,
  currentPartner,
  onAddClient,
  onUpdateStage
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('');
  const [source, setSource] = useState<ClientItem['source']>('referral');
  const [requestedService, setRequestedService] = useState<string>('');
  const [expectedBudget, setExpectedBudget] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const STAGES: { id: PipelineStage; label: string; color: string }[] = [
    { id: 'lead', label: '1. عميل محتمل', color: 'border-slate-700 bg-slate-900' },
    { id: 'contacted', label: '2. تم التواصل', color: 'border-blue-900 bg-blue-950/20' },
    { id: 'interested', label: '3. مهتم بالخدمة', color: 'border-cyan-900 bg-cyan-950/20' },
    { id: 'needs_defined', label: '4. تم تحديد احتياجه', color: 'border-indigo-900 bg-indigo-950/20' },
    { id: 'quote_sent', label: '5. تم إرسال عرض سعر', color: 'border-purple-900 bg-purple-950/20' },
    { id: 'negotiation', label: '6. مرحلة التفاوض', color: 'border-amber-900 bg-amber-950/20' },
    { id: 'agreed', label: '7. تم الاتفاق المبدئي', color: 'border-emerald-800 bg-emerald-950/20' },
    { id: 'in_progress', label: '8. قيد التنفيذ', color: 'border-teal-800 bg-teal-950/20' },
    { id: 'delivered', label: '9. تم التسليم والتحصيل', color: 'border-emerald-500 bg-emerald-950/40' },
    { id: 'retained', label: '10. عميل مستمر / صيانة', color: 'border-green-600 bg-green-950/40' },
    { id: 'lost', label: '11. صفقة مفقودة', color: 'border-rose-900 bg-rose-950/20' }
  ];

  const filteredClients = clients.filter(c => {
    const matchesFilter = filterStage === 'all' || c.stage === filterStage;
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.businessType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPipelineValue = clients
    .filter(c => c.stage !== 'lost')
    .reduce((sum, c) => sum + (c.dealValue || c.expectedBudget || 0), 0);

  const closedWonValue = clients
    .filter(c => c.stage === 'delivered' || c.stage === 'retained')
    .reduce((sum, c) => sum + (c.dealValue || c.expectedBudget || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    onAddClient({
      name,
      phone,
      businessType,
      source,
      stage: 'lead',
      requestedService,
      expectedBudget,
      dealValue: expectedBudget,
      assignedTo: currentPartner,
      lastContactDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate,
      notes
    });

    setShowAddModal(false);
    setName('');
    setPhone('');
    setBusinessType('');
    setRequestedService('');
    setExpectedBudget(0);
  };

  return (
    <div className="space-y-6">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">إدارة علاقات العملاء (CRM Pipeline)</h1>
              <p className="text-xs text-slate-300 mt-1">
                تتبع مسار الصفقات عبر مراحل البيع الـ 11 مع إمكانية المراسلة الفورية عبر واتساب.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل محتمل</span>
        </button>
      </div>

      {/* شريط مؤشرات خط الأنابيب السريع */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي العملاء المسجلين</span>
            <span className="text-lg font-black text-white">{clients.length} عميل</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">قيمة الصفقات النشطة المتوقعة</span>
            <span className="text-lg font-black text-amber-400">{totalPipelineValue.toLocaleString()} ج.م</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">قيمة الصفقات المحصلة والمنفذة</span>
            <span className="text-lg font-black text-emerald-400">{closedWonValue.toLocaleString()} ج.م</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* شريط البحث وتصفية المراحل */}
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهاتف، أو النشاط التجاري..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setFilterStage('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterStage === 'all' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({clients.length})
          </button>
          <button
            onClick={() => setFilterStage('lead')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterStage === 'lead' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            عملاء محتملون
          </button>
          <button
            onClick={() => setFilterStage('in_progress')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterStage === 'in_progress' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            قيد التنفيذ
          </button>
          <button
            onClick={() => setFilterStage('delivered')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterStage === 'delivered' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            تم التحصيل
          </button>
        </div>
      </div>

      {/* خط الأنابيب بالمراحل الـ 11 - عرض منظم */}
      {filteredClients.length === 0 ? (
        <div className="bg-slate-900/60 p-8 sm:p-12 rounded-3xl border border-dashed border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">لا توجد صفقات أو عملاء مسجلين حالياً في هذا القسم</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ابدأ الآن بإضافة أول عميل محتمل من محيطك (كافيه، مطعم، مطبعة، مكتب محاماة) للتواصل الفوري معه وإغلاق أول صفقة كاش.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول عميل محتمل الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const currentStageObj = STAGES.find(s => s.id === client.stage) || STAGES[0];

            return (
              <div 
                key={client.id}
                className={`p-5 rounded-2xl border ${currentStageObj.color} space-y-3.5 shadow-md flex flex-col justify-between`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{client.name}</h3>
                      <span className="text-xs text-slate-300 font-medium">{client.businessType}</span>
                    </div>
                    <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {client.expectedBudget.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">الخدمة المطلوبة:</span>
                      <span className="font-bold text-white">{client.requestedService}</span>
                    </div>
                    
                    {/* زر محادثة واتساب وزر الاتصال */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/2${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `السلام عليكم يا فندم، معاك شركة Tecnolobia للحلول البرمجية بالإسكندرية بخصوص ${client.requestedService || 'الحلول الرقمية'}. حابين نتابع مع حضرتك العرض وتفاصيل التنفيذ.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>محادثة واتساب</span>
                      </a>
                      <a
                        href={`tel:${client.phone}`}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-colors"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                      <span className="text-slate-400">المتابعة القادمة:</span>
                      <span className="text-amber-300 font-semibold">{client.nextFollowUpDate}</span>
                    </div>
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-slate-400 italic">"{client.notes}"</p>
                  )}
                </div>

                {/* محول مرحلة البيع السريع */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">مرحلة البيع الحالية:</label>
                  <select
                    value={client.stage}
                    onChange={(e) => onUpdateStage(client.id, e.target.value as PipelineStage)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة إضافة عميل جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>تسجيل عميل محتمل جديد</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم العميل / المسؤول:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أستاذ أحمد..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف / واتساب:</label>
                  <input
                    type="tel"
                    required
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">النشاط التجاري:</label>
                  <input
                    type="text"
                    required
                    placeholder="مطعم، مطبعة، عيادة..."
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الخدمة المطلوبة:</label>
                  <input
                    type="text"
                    required
                    placeholder="كاشير، موقع، منيو QR..."
                    value={requestedService}
                    onChange={(e) => setRequestedService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الميزانية المتوقعة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={expectedBudget || ''}
                    onChange={(e) => setExpectedBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تاريخ المتابعة القادمة:</label>
                <input
                  type="date"
                  required
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات أولية:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
