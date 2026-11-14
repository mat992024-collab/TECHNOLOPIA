import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  UserCheck, 
  Sparkles, 
  Layers, 
  Building2,
  FileCheck,
  Scale
} from 'lucide-react';
import { StrategicDecision, CompanyMemoryItem, DecisionCategory, MemoryCategory } from '../../types/decisions';
import { PartnerId } from '../../types/company';

interface GovernanceDecisionsSectionProps {
  currentPartner: PartnerId;
  decisions: StrategicDecision[];
  memories: CompanyMemoryItem[];
  onAddDecision: (decision: Omit<StrategicDecision, 'id' | 'createdAt'>) => void;
  onApproveDecision: (decisionId: string, partner: PartnerId) => void;
  onAddMemory: (memory: Omit<CompanyMemoryItem, 'id' | 'createdAt'>) => void;
}

export const GovernanceDecisionsSection: React.FC<GovernanceDecisionsSectionProps> = ({
  currentPartner,
  decisions,
  memories,
  onAddDecision,
  onApproveDecision,
  onAddMemory
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'decisions' | 'memories'>('decisions');
  const [showAddDecisionModal, setShowAddDecisionModal] = useState<boolean>(false);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState<boolean>(false);

  // حقول إضافة قرار جديد
  const [decisionTitle, setDecisionTitle] = useState<string>('');
  const [decisionDescription, setDecisionDescription] = useState<string>('');
  const [decisionCategory, setDecisionCategory] = useState<DecisionCategory>('policy');
  const [impactSummary, setImpactSummary] = useState<string>('');

  // حقول إضافة ذاكرة / قاعدة معرفة
  const [memoryTopic, setMemoryTopic] = useState<string>('');
  const [memoryCategory, setMemoryCategory] = useState<MemoryCategory>('lesson_learned');
  const [memoryContent, setMemoryContent] = useState<string>('');
  const [memorySource, setMemorySource] = useState<string>('');

  const CATEGORY_LABELS: Record<DecisionCategory, { label: string; color: string }> = {
    pricing: { label: 'تسعير وباقات', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    investment: { label: 'استثمار وتمويل', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    partnership: { label: 'شراكات وعقود', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    hiring: { label: 'توظيف وفريق العمل', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    policy: { label: 'سياسات وحوكمة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    dev_fund: { label: 'صندوق التطوير', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
  };

  const MEMORY_LABELS: Record<MemoryCategory, { label: string; color: string }> = {
    strategy: { label: 'استراتيجية وتوسع', color: 'bg-blue-500/10 text-blue-400' },
    technical: { label: 'معايير تقنية', color: 'bg-emerald-500/10 text-emerald-400' },
    client: { label: 'تفضيلات العملاء', color: 'bg-amber-500/10 text-amber-400' },
    pricing: { label: 'قواعد التسعير', color: 'bg-purple-500/10 text-purple-400' },
    lesson_learned: { label: 'درس مستفاد', color: 'bg-rose-500/10 text-rose-400' }
  };

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTitle || !decisionDescription) return;

    onAddDecision({
      title: decisionTitle,
      description: decisionDescription,
      category: decisionCategory,
      proposedBy: currentPartner,
      impactSummary: impactSummary || 'قرار تنظيمي وإداري',
      status: 'pending',
      mohamedApproved: currentPartner === 'mohamed',
      mohamedApprovedAt: currentPartner === 'mohamed' ? new Date().toISOString() : undefined,
      tarekApproved: currentPartner === 'tarek',
      tarekApprovedAt: currentPartner === 'tarek' ? new Date().toISOString() : undefined
    });

    setShowAddDecisionModal(false);
    setDecisionTitle('');
    setDecisionDescription('');
    setImpactSummary('');
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryTopic || !memoryContent) return;

    onAddMemory({
      topic: memoryTopic,
      category: memoryCategory,
      content: memoryContent,
      source: memorySource || 'خبرة تشغيلية مباشرة',
      addedBy: currentPartner
    });

    setShowAddMemoryModal(false);
    setMemoryTopic('');
    setMemoryContent('');
    setMemorySource('');
  };

  const approvedDecisionsCount = decisions.filter(d => d.status === 'approved').length;
  const pendingDecisionsCount = decisions.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Scale className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">مجلس الإدارة والذاكرة المؤسسية</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>اعتماد ثنائي إلزامي</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                حوكمة القرارات المصيرية المشتركة (موافقة صريحة من الشريكين) وحفظ المعارف والدروس المستفادة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {activeSubTab === 'decisions' ? (
            <button
              onClick={() => setShowAddDecisionModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>طرح قرار استراتيجي</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddMemoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة درس مستفاد / سياسة</span>
            </button>
          )}
        </div>
      </div>

      {/* مؤشرات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">قرارات نافذة ومعتمدة</span>
            <span className="text-lg font-black text-emerald-400">{approvedDecisionsCount} قرار</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">بانتظار تصويت الشريكين</span>
            <span className="text-lg font-black text-amber-400">{pendingDecisionsCount} قرار</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">مذكرات الذاكرة المؤسسية</span>
            <span className="text-lg font-black text-indigo-400">{memories.length} مدخلة</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* تبديل العرض بين القرارات والذاكرة */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('decisions')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeSubTab === 'decisions'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>القرارات الاستراتيجية والتصويت الثنائي ({decisions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('memories')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeSubTab === 'memories'
              ? 'text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>الذاكرة المؤسسية وقاعدة المعرفة ({memories.length})</span>
        </button>
      </div>

      {/* محتوى القرارات الاستراتيجية */}
      {activeSubTab === 'decisions' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-950/30 rounded-2xl border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>مبدأ الحوكمة المتساوية:</strong> لا يصبح أي قرار جوهري سارياً إلا بعد اعتماد الشريكين م. محمد البحر وم. طارق حافظ معاً. الشريكان متساويان في الصلاحيات والحقوق الإدارية 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {decisions.map((decision) => {
              const catObj = CATEGORY_LABELS[decision.category] || CATEGORY_LABELS.policy;
              const isApproved = decision.status === 'approved';
              const canMohamedSign = currentPartner === 'mohamed' && !decision.mohamedApproved;
              const canTarekSign = currentPartner === 'tarek' && !decision.tarekApproved;

              return (
                <div 
                  key={decision.id}
                  className={`p-6 rounded-3xl border transition-all shadow-lg space-y-4 ${
                    isApproved 
                      ? 'bg-slate-900 border-emerald-500/30 shadow-emerald-950/20' 
                      : 'bg-slate-900/90 border-amber-500/40 shadow-amber-950/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catObj.color}`}>
                          {catObj.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          مقترح بواسطة: <strong className="text-white">{decision.proposedBy === 'mohamed' ? 'م. محمد البحر' : 'م. طارق حافظ'}</strong>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(decision.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white">{decision.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{decision.description}</p>
                    </div>

                    <div className="self-start sm:self-auto">
                      {isApproved ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>معتمد ونافذ رسمياً</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                          <Clock className="w-4 h-4" />
                          <span>بانتظار اكتمال الموافقة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ملخص الأثر */}
                  {decision.impactSummary && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-slate-400">الأثر المتوقع:</span>
                      <span className="text-slate-200 font-semibold">{decision.impactSummary}</span>
                    </div>
                  )}

                  {/* بطاقتا توقيع الشريكين */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    
                    {/* اعتماد م. محمد البحر */}
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      decision.mohamedApproved 
                        ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${decision.mohamedApproved ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">م. محمد البحر</span>
                          <span className="text-[10px]">
                            {decision.mohamedApproved ? 'تم الاعتماد والتوقيع ✅' : 'بانتظار الاعتماد ⏳'}
                          </span>
                        </div>
                      </div>

                      {canMohamedSign && (
                        <button
                          onClick={() => onApproveDecision(decision.id, 'mohamed')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          اعتماد القرار الآن
                        </button>
                      )}
                    </div>

                    {/* اعتماد م. طارق حافظ */}
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      decision.tarekApproved 
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${decision.tarekApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">م. طارق حافظ</span>
                          <span className="text-[10px]">
                            {decision.tarekApproved ? 'تم الاعتماد والتوقيع ✅' : 'بانتظار الاعتماد ⏳'}
                          </span>
                        </div>
                      </div>

                      {canTarekSign && (
                        <button
                          onClick={() => onApproveDecision(decision.id, 'tarek')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          اعتماد القرار الآن
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* محتوى الذاكرة المؤسسية */}
      {activeSubTab === 'memories' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>قاعدة المعرفة التراكمية:</strong> هذه المذكرات تسجل خبرات ودروس سابقة أعمالكم وتفضيلات السوق، ويستخدمها المدير الذكي كمرجع استراتيجي دائم لا يُنسى.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map((mem) => {
              const memCat = MEMORY_LABELS[mem.category] || MEMORY_LABELS.lesson_learned;

              return (
                <div key={mem.id} className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-md space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${memCat.color}`}>
                        {memCat.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(mem.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm">{mem.topic}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{mem.content}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>المصدر: <strong className="text-slate-300">{mem.source}</strong></span>
                    <span>سُجل بواسطة: <strong className="text-slate-300">{mem.addedBy === 'mohamed' ? 'م. محمد' : mem.addedBy === 'tarek' ? 'م. طارق' : 'المدير الذكي'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* نافذة طرح قرار استراتيجي جديد */}
      {showAddDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <span>طرح قرار استراتيجي جديد للمجلس</span>
            </h3>

            <form onSubmit={handleCreateDecision} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان القرار:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اعتماد شراء اشتراك سيرفرات سحابية سنوي..."
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تصنيف القرار:</label>
                  <select
                    value={decisionCategory}
                    onChange={(e) => setDecisionCategory(e.target.value as DecisionCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="policy">سياسات وحوكمة</option>
                    <option value="pricing">تسعير وباقات</option>
                    <option value="investment">استثمار وتمويل</option>
                    <option value="dev_fund">صندوق التطوير</option>
                    <option value="partnership">شراكات وعقود</option>
                    <option value="hiring">فريق العمل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الأثر المالي / التشغيلي:</label>
                  <input
                    type="text"
                    placeholder="مثال: تكلفة 1,500 ج.م من صندوق التطوير"
                    value={impactSummary}
                    onChange={(e) => setImpactSummary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تفاصيل ومبررات القرار:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="اشرح مبررات القرار وأثره على الشركة والشريكين..."
                  value={decisionDescription}
                  onChange={(e) => setDecisionDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  طرح القرار وتوقيعه أولياً
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDecisionModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة درس مستفاد أو سياسة للذاكرة */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>تسجيل معلومة في الذاكرة المؤسسية</span>
            </h3>

            <form onSubmit={handleCreateMemory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">موضوع المذكرة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شروط التعاقد مع أصحاب الكافيهات..."
                  value={memoryTopic}
                  onChange={(e) => setMemoryTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تصنيف المعرفة:</label>
                  <select
                    value={memoryCategory}
                    onChange={(e) => setMemoryCategory(e.target.value as MemoryCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="lesson_learned">درس مستفاد</option>
                    <option value="strategy">استراتيجية وتوسع</option>
                    <option value="pricing">قواعد التسعير</option>
                    <option value="technical">معايير تقنية</option>
                    <option value="client">تفضيلات العملاء</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">مصدر المعلومة:</label>
                  <input
                    type="text"
                    placeholder="مثال: تجربة مطعم فريش..."
                    value={memorySource}
                    onChange={(e) => setMemorySource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نص المذكرة والقاعدة المستفادة:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب المعرفة بالتفصيل ليتذكرها النظام دائماً..."
                  value={memoryContent}
                  onChange={(e) => setMemoryContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  حفظ في الذاكرة المؤسسية
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMemoryModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
