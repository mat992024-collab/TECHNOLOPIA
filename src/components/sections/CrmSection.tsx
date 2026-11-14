import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  MessageCircle, 
  Sparkles, 
  TrendingUp, 
  Coins,
  Search, 
  ShieldAlert, 
  Share2, 
  Copy, 
  Check, 
  Bot, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';
import { PartnerId } from '../../types/company';
import { ClientItem } from '../../types/crm';
import { 
  CrmService, 
  CrmLead, 
  CrmStage, 
  CrmAnalytics, 
  AiStrategyResponse,
  WhatsAppSimulationResult,
  FacebookSimulationResult 
} from '../../services/crmService';

interface CrmSectionProps {
  clients: ClientItem[];
  currentPartner: PartnerId;
  onAddClient: (client: Omit<ClientItem, 'id' | 'createdAt'>) => void;
  onUpdateStage: (clientId: string, stage: any) => void;
}

export const CRM_7_STAGES: { id: CrmStage; label: string; color: string; border: string; bg: string }[] = [
  { id: 'NEW_LEAD', label: '1. عميل محتمل جديد', color: 'text-slate-300', border: 'border-slate-700', bg: 'bg-slate-900/80' },
  { id: 'CONTACTED', label: '2. تم التواصل المبدئي', color: 'text-blue-400', border: 'border-blue-800/60', bg: 'bg-blue-950/30' },
  { id: 'INTERESTED', label: '3. أبدى اهتماماً بالخدمة', color: 'text-cyan-400', border: 'border-cyan-800/60', bg: 'bg-cyan-950/30' },
  { id: 'PROPOSAL_SENT', label: '4. تم إرسال عرض السعر', color: 'text-purple-400', border: 'border-purple-800/60', bg: 'bg-purple-950/30' },
  { id: 'NEGOTIATION', label: '5. مرحلة التفاوض', color: 'text-amber-400', border: 'border-amber-800/60', bg: 'bg-amber-950/30' },
  { id: 'WON', label: '6. تم التعاقد (صفقة رابحة)', color: 'text-emerald-400', border: 'border-emerald-600', bg: 'bg-emerald-950/40' },
  { id: 'LOST', label: '7. صفقة غير مكتملة', color: 'text-rose-400', border: 'border-rose-900/60', bg: 'bg-rose-950/30' }
];

export const CrmSection: React.FC<CrmSectionProps> = ({
  clients: propClients,
  currentPartner,
  onAddClient,
  onUpdateStage: _onUpdateStage
}) => {
  // الحالات المركزية لقسم إدارة العملاء المطور
  const [serverLeads, setServerLeads] = useState<CrmLead[]>([]);
  const [analytics, setAnalytics] = useState<CrmAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analytics' | 'simulation'>('pipeline');
  
  // حالات الفلترة والبحث
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterPartner, setFilterPartner] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // نافذة تسجيل عميل جديد (Lead Discovery)
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [softwareNeed, setSoftwareNeed] = useState<string>('');
  const [source, setSource] = useState<string>('direct_visit');
  const [dealValueEstimate, setDealValueEstimate] = useState<number>(10000);
  const [assignedPartner, setAssignedPartner] = useState<PartnerId | 'both'>(currentPartner);
  const [city, setCity] = useState<string>('الإسكندرية');
  const [notes, setNotes] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );

  // حالات وكيل الذكاء الاصطناعي (AI Sales Agent)
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [activeAiStrategy, setActiveAiStrategy] = useState<AiStrategyResponse | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // حالات المحاكاة الآمنة (Simulation Mode)
  const [simWhatsAppResult, setSimWhatsAppResult] = useState<WhatsAppSimulationResult | null>(null);
  const [showWhatsAppSimModal, setShowWhatsAppSimModal] = useState<boolean>(false);
  const [simFbResult, setSimFbResult] = useState<FacebookSimulationResult | null>(null);
  const [showFbSimModal, setShowFbSimModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // تحميل البيانات من الخادم
  const loadCrmData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leads, metrics] = await Promise.all([
        CrmService.getLeads(currentPartner),
        CrmService.getAnalytics(currentPartner)
      ]);
      setServerLeads(leads);
      setAnalytics(metrics);
    } catch {
      // fallback handling
    } finally {
      setIsLoading(false);
    }
  }, [currentPartner]);

  useEffect(() => {
    loadCrmData();
  }, [loadCrmData]);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // تسجيل عميل محتمل جديد
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !phone) return;

    const payload = {
      businessName,
      industry,
      softwareNeed,
      source,
      dealValueEstimate,
      dealProbability: 25,
      assignedPartner,
      contactInfo: {
        contactPerson,
        phone,
        city,
        address: ''
      },
      nextFollowUpDate,
      initialNote: notes || 'تسجيل عميل محتمل جديد عبر Lead Discovery'
    };

    const res = await CrmService.createLead(currentPartner, payload);
    if (res.success && res.lead) {
      setServerLeads(prev => [res.lead!, ...prev]);
      // مزامنة مع الحالة المحلية العامة
      onAddClient({
        name: businessName,
        phone,
        businessType: industry,
        source: 'referral',
        stage: 'lead',
        requestedService: softwareNeed,
        expectedBudget: dealValueEstimate,
        dealValue: dealValueEstimate,
        assignedTo: assignedPartner,
        lastContactDate: new Date().toISOString().split('T')[0],
        nextFollowUpDate,
        notes
      });
      setShowAddModal(false);
      resetAddForm();
      loadCrmData();
    } else {
      alert(res.error || 'فشل تسجيل العميل المحتمل');
    }
  };

  const resetAddForm = () => {
    setBusinessName('');
    setContactPerson('');
    setPhone('');
    setIndustry('');
    setSoftwareNeed('');
    setDealValueEstimate(10000);
    setNotes('');
  };

  // ترقية مرحلة العميل
  const handleStageTransition = async (leadId: string, newStage: CrmStage) => {
    const note = prompt(`ملاحظة الانتقال إلى مرحلة (${newStage}):`) || 'تحديث مرحلة العميل';
    const res = await CrmService.updateStage(currentPartner, leadId, newStage, note);
    if (res.success && res.lead) {
      setServerLeads(prev => prev.map(l => l.id === leadId ? res.lead! : l));
      loadCrmData();
    } else {
      alert(res.error || 'الانتقال غير مصرح به وفق قواعد الحوكمة');
    }
  };

  // استدعاء وكيل الذكاء الاصطناعي للمبيعات
  const handleGenerateAiStrategy = async (leadId: string) => {
    setIsGeneratingAi(true);
    setShowAiModal(true);
    setActiveAiStrategy(null);
    try {
      const res = await CrmService.generateAiStrategy(currentPartner, leadId);
      if (res.success && res.strategy) {
        setActiveAiStrategy(res.strategy);
      } else {
        alert(res.error || 'تعذر استدعاء وكيل المبيعات الذكي');
        setShowAiModal(false);
      }
    } catch {
      setShowAiModal(false);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // محاكاة واتساب
  const handleSimulateWhatsApp = async (leadId: string, customMessage?: string) => {
    const res = await CrmService.simulateWhatsApp(currentPartner, leadId, customMessage);
    if (res) {
      setSimWhatsAppResult(res);
      setShowWhatsAppSimModal(true);
    }
  };

  // محاكاة فيسبوك
  const handleSimulateFacebook = async (niche: string) => {
    const res = await CrmService.simulateFacebook(currentPartner, {
      title: `حملة استقطاب محلي - قطاع ${niche}`,
      targetNiche: niche,
      budgetEstimate: 0
    });
    if (res) {
      setSimFbResult(res);
      setShowFbSimModal(true);
    }
  };

  // تصفية العملاء
  const displayLeads = serverLeads.length > 0 ? serverLeads : propClients.map(c => ({
    id: c.id,
    businessName: c.name,
    industry: c.businessType,
    softwareNeed: c.requestedService,
    source: c.source,
    stage: 'NEW_LEAD' as CrmStage,
    priority: 'medium' as const,
    dealValueEstimate: c.dealValue || c.expectedBudget || 0,
    dealProbability: 30,
    assignedPartner: c.assignedTo || currentPartner,
    contactInfo: {
      contactPerson: c.name,
      phone: c.phone,
      city: 'الإسكندرية'
    },
    notes: c.notes ? [c.notes] : [],
    nextFollowUpDate: c.nextFollowUpDate || '',
    history: [],
    isRealProspect: true,
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const filteredLeads = displayLeads.filter(l => {
    const matchesStage = filterStage === 'all' || l.stage === filterStage;
    const matchesPartner = filterPartner === 'all' || l.assignedPartner === filterPartner || l.assignedPartner === 'both';
    const matchesSearch = !searchQuery ||
      l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactInfo?.phone?.includes(searchQuery) ||
      l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.softwareNeed.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesPartner && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* الرأس الرئيسي ومؤشر Phase 5.0 */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-600/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">إدارة علاقات العملاء وفرص النمو (CRM Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Phase 5.0 Simulation-First
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                دورة حياة العميل بالمراحل السبع المعتمدة، وكيل المبيعات الذكي بـ Gemini، ومحرك المحاكاة الآمن مع حظر الإنفاق المالي.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={loadCrmData}
            title="تحديث البيانات"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل عميل محتمل (Lead Discovery)</span>
          </button>
        </div>
      </div>

      {/* شريط الأمان والحظر الإلزامي للمرحلة الخامسة */}
      <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-amber-300 block">ضوابط السلامة الصارمة (Simulation-First Safety Guardrails)</span>
          <p className="text-slate-300 leading-relaxed">
            جميع أدوات المراسلة والنشر تعمل في وضع <strong className="text-white">المحاكاة الآمنة فقط</strong>: لا يوجد أي اتصال مباشر بـ WhatsApp API أو Facebook Graph API، ولا يوجد أي سحب مالي أو بطاقات بنكية مفعلة (<span className="font-mono text-amber-300">Zero Billing & Zero Ad-Spend Policy</span>).
          </p>
        </div>
      </div>

      {/* شريط الإحصائيات الحية لخط الأنابيب والمؤشرات الرئيسية */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">قيمة الفرص النشطة</span>
              <span className="text-lg font-black text-amber-400">{analytics.totalPipelineValue.toLocaleString()} ج.م</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{analytics.activePipelineCount} صفقة قيد التفاوض</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي الصفقات الرابحة</span>
              <span className="text-lg font-black text-emerald-400">{analytics.totalWonValue.toLocaleString()} ج.م</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{analytics.wonCount} صفقة مكتملة</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">معدل التحويل (Conversion)</span>
              <span className="text-lg font-black text-indigo-400">{analytics.conversionRate}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">من إجمالي الصفقات المغلقة</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">المتابعات العاجلة المتأخرة</span>
              <span className={`text-lg font-black ${analytics.overdueFollowUpsCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {analytics.overdueFollowUpsCount} عميل
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">تتطلب التواصل السريع اليوم</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* تبويبات التنقل العلوية */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pipeline' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>خط الأنابيب بالمراحل السبع ({filteredLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'simulation' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>محرك محاكاة الانتشار الآمن (WhatsApp & Facebook)</span>
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* شريط الفلترة والبحث */}
          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم المنشأة، الهاتف، أو الاحتياج البرمجي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none"
              >
                <option value="all">كل المراحل</option>
                {CRM_7_STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              <select
                value={filterPartner}
                onChange={(e) => setFilterPartner(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none"
              >
                <option value="all">كل الشركاء</option>
                <option value="mohamed">م. محمد البحر (التقني)</option>
                <option value="tarek">م. طارق حافظ (الأعمال)</option>
              </select>
            </div>
          </div>

          {/* شبكة بطاقات العملاء */}
          {filteredLeads.length === 0 ? (
            <div className="bg-slate-900/60 p-12 rounded-3xl border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">لا توجد فرص مطابقة للبحث حالياً</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  سجل الآن أول فرصة عميل محتمل في منطقتك لبدء التفاوض وتوليد العروض الذكية.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل عميل محتمل الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map((lead) => {
                const stageObj = CRM_7_STAGES.find(s => s.id === lead.stage) || CRM_7_STAGES[0];
                const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < new Date().toISOString().split('T')[0] && lead.stage !== 'WON' && lead.stage !== 'LOST';

                return (
                  <div
                    key={lead.id}
                    className={`p-5 rounded-2xl border ${stageObj.border} ${stageObj.bg} space-y-3.5 shadow-md flex flex-col justify-between transition-all hover:border-slate-600`}
                  >
                    <div className="space-y-2.5">
                      {/* رأس البطاقة */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{lead.businessName}</h3>
                            {isOverdue && (
                              <span className="p-1 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold" title="متابعة متأخرة">
                                عاجل
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium block mt-0.5">{lead.industry}</span>
                        </div>
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {Number(lead.dealValueEstimate).toLocaleString()} ج.م
                        </span>
                      </div>

                      {/* تفاصيل الاحتياج وجهة الاتصال */}
                      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">الاحتياج البرمجي:</span>
                          <span className="font-bold text-white text-right max-w-[65%] truncate" title={lead.softwareNeed}>
                            {lead.softwareNeed}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">الشريك المسؤول:</span>
                          <span className="font-bold text-indigo-300">
                            {lead.assignedPartner === 'mohamed' ? 'م. محمد البحر' : lead.assignedPartner === 'tarek' ? 'م. طارق حافظ' : 'كلا الشريكين'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/60">
                          <span className="text-slate-400">المتابعة القادمة:</span>
                          <span className={`font-semibold ${isOverdue ? 'text-rose-400 font-bold' : 'text-amber-300'}`}>
                            {lead.nextFollowUpDate || 'غير محدد'}
                          </span>
                        </div>
                      </div>

                      {/* أدوات الذكاء الاصطناعي والمحاكاة */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleGenerateAiStrategy(lead.id)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>عرض الذكاء الاصطناعي</span>
                        </button>

                        <button
                          onClick={() => handleSimulateWhatsApp(lead.id)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>محاكاة واتساب</span>
                        </button>
                      </div>
                    </div>

                    {/* محول المراحل السبع المعتمدة */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold">المرحلة الحالية:</span>
                        <span className={`font-black ${stageObj.color}`}>{stageObj.label}</span>
                      </div>
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageTransition(lead.id, e.target.value as CrmStage)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                      >
                        {CRM_7_STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تبويب محرك المحاكاة الآمن للنمو والتسويق */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">محاكاة حملات النمو واكتساب العملاء (Zero-Spend Growth Simulation)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              اختر القطاع المستهدف لاختبار توليد منشورات تسويقية وصيغ رسائل تواصل احترافية تلائم السوق المصري، مع الحفاظ على ميزانية صفرية وحظر أي نشر آلي خارجي.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleSimulateFacebook('المطاعم والكافيهات')}
                className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-right transition-all group"
              >
                <span className="text-xs font-black text-white group-hover:text-indigo-400 block mb-1">
                  1. قطاع المطاعم والكافيهات
                </span>
                <span className="text-[11px] text-slate-400 block">
                  نظام كاشير فريش المدمج وبون المطبخ السريع ومنيو الباركود التفاعلي.
                </span>
              </button>

              <button
                onClick={() => handleSimulateFacebook('المطابع ووكالات الدعاية')}
                className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-right transition-all group"
              >
                <span className="text-xs font-black text-white group-hover:text-indigo-400 block mb-1">
                  2. قطاع المطابع ووكالات الإعلان
                </span>
                <span className="text-[11px] text-slate-400 block">
                  نظام مطبعة واجدي لحساب هالك الفرخ والزنكات وأوامر الشغل الدقيقة.
                </span>
              </button>

              <button
                onClick={() => handleSimulateFacebook('الشركات والمؤسسات التجارية')}
                className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-right transition-all group"
              >
                <span className="text-xs font-black text-white group-hover:text-indigo-400 block mb-1">
                  3. الفاتورة الإلكترونية والمخازن
                </span>
                <span className="text-[11px] text-slate-400 block">
                  حل الفاتورة الإلكترونية المعتمد من الضرائب ZATCA وإدارة المخازن السحابية.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة استراتيجية وعرض الذكاء الاصطناعي (AI Strategy Modal) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">استراتيجية وكيل المبيعات الذكي (Gemini AI Sales Agent)</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>

            {isGeneratingAi || !activeAiStrategy ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-300 font-bold">جاري تحليل احتياجات العميل وصياغة العرض الاسترشادي عبر Gemini API...</p>
                <span className="text-[10px] text-slate-500 block">مطابقة محفظة مشروعات TECHNOLOPIA واحتساب التسعير الاسترشادي التقديري</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* اسم المنشأة والخدمة المقترحة */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">المنشأة المستهدفة:</span>
                    <span className="font-bold text-white text-sm">{activeAiStrategy.businessName} ({activeAiStrategy.industry})</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">الحل البرمجي المرشح:</span>
                    <span className="font-bold text-indigo-400">{activeAiStrategy.recommendedService}</span>
                  </div>
                </div>

                {/* تحليل الاحتياج */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-300 block">1. تشخيص احتياجات العميل الفنية:</span>
                  <p className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-300 leading-relaxed">
                    {activeAiStrategy.needsAnalysis}
                  </p>
                </div>

                {/* التسعير الاسترشادي وإخلاء المسؤولية */}
                <div className="p-3.5 bg-amber-950/20 border border-amber-800/50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300">2. التسعير الاسترشادي المقترح (Non-Binding Estimate):</span>
                    <span className="font-black text-amber-400 text-sm">
                      {activeAiStrategy.suggestedPricingRange?.minimumEgp?.toLocaleString()} - {activeAiStrategy.suggestedPricingRange?.maximumEgp?.toLocaleString()} ج.م
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed italic">
                    {activeAiStrategy.pricingDisclaimer}
                  </p>
                </div>

                {/* رسالة التواصل الأولية المقترحة */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300">3. رسالة التواصل الأولية المقترحة (باللهجة المصرية المهنية):</span>
                    <button
                      onClick={() => copyToClipboard('pitch', activeAiStrategy.outreachPitchMessage)}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      {copiedKey === 'pitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'pitch' ? 'تم النسخ' : 'نسخ الرسالة'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {activeAiStrategy.outreachPitchMessage}
                  </div>
                </div>

                {/* نصيحة التفاوض */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-300 block">4. تكتيك التفاوض الموصى به:</span>
                  <p className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-300 leading-relaxed">
                    {activeAiStrategy.negotiationStrategy}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">حالة المسودة: محفوظة تلقائياً وتتطلب موافقة الشريكين قبل التنفيذ.</span>
                  <button
                    onClick={() => handleSimulateWhatsApp(activeAiStrategy.leadId, activeAiStrategy.outreachPitchMessage)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تجهيز محاكاة واتساب</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة محاكاة واتساب الآمنة */}
      {showWhatsAppSimModal && simWhatsAppResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">محاكاة واتساب الآمنة (Simulation Mode)</h3>
              </div>
              <button
                onClick={() => setShowWhatsAppSimModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-200">
              {simWhatsAppResult.disclaimer}
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-400 block font-bold">المستلم:</span>
              <span className="text-white font-bold">{simWhatsAppResult.businessName} ({simWhatsAppResult.recipientPhone})</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 block font-bold">نص الرسالة الجاهزة:</span>
                <button
                  onClick={() => copyToClipboard('simWa', simWhatsAppResult.messageText)}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  {copiedKey === 'simWa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'simWa' ? 'تم النسخ بنجاح' : 'نسخ الرسالة'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {simWhatsAppResult.messageText}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <a
                href={simWhatsAppResult.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح الرابط للمراجعة اليدوية</span>
              </a>

              <button
                onClick={() => setShowWhatsAppSimModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs"
              >
                تمت المراجعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة محاكاة فيسبوك الآمنة */}
      {showFbSimModal && simFbResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">معاينة منشور فيسبوك في نمط المحاكاة</h3>
              </div>
              <button
                onClick={() => setShowFbSimModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>

            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200">
              {simFbResult.disclaimer}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 block font-bold">محتوى المنشور المقترح:</span>
                <button
                  onClick={() => copyToClipboard('simFb', simFbResult.postContent)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  {copiedKey === 'simFb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'simFb' ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed">
                {simFbResult.postContent}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 text-[11px]">
              {simFbResult.suggestedHashtags?.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold">
                  {tag}
                </span>
              ))}
            </div>

            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400">
              {simFbResult.budgetPlanNote}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل عميل محتمل جديد (Lead Discovery Modal) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>تسجيل فرصة عميل محتمل جديدة (Lead Discovery)</span>
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المنشأة / النشاط التجاري:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم أو كافيه أو مطبعة أو شركة..."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المسؤول / العميل:</label>
                  <input
                    type="text"
                    placeholder="مثال: أستاذ حسام أو الحاج ناصر..."
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف / واتساب:</label>
                  <input
                    type="tel"
                    required
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">مجال النشاط:</label>
                  <input
                    type="text"
                    required
                    placeholder="مطاعم، مطابع، تجزئة، استشارات..."
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المدينة / المنطقة:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الاحتياج أو المشكلة البرمجية:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تأخير بون المطبخ، هالك الورق، فواتير إلكترونية، كاشير..."
                  value={softwareNeed}
                  onChange={(e) => setSoftwareNeed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المصدر:</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="direct_visit">زيارة مباشرة</option>
                    <option value="referral">ترشيح / إحالة</option>
                    <option value="social_media">شبكات اجتماعية</option>
                    <option value="phone_call">مكالمة واردة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الشريك المسؤول:</label>
                  <select
                    value={assignedPartner}
                    onChange={(e) => setAssignedPartner(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="mohamed">م. محمد (تقني)</option>
                    <option value="tarek">م. طارق (أعمال)</option>
                    <option value="both">كلاهما</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">القيمة التقديرية (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={dealValueEstimate}
                    onChange={(e) => setDealValueEstimate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold focus:outline-none"
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
                  placeholder="أي تفاصيل إضافية عن الاجتماع أو العميل..."
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  تسجيل الفرصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
