import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  Coins, 
  Briefcase, 
  Bot,
  Zap,
  ArrowRight,
  Key,
  Globe,
  Settings,
  Target
} from 'lucide-react';
import { AiChatMessage, AiMode, MarketOpportunity } from '../../types/ai';
import { PartnerId, PartnerProfile } from '../../types/company';
import { AiCeoService, getSavedGeminiKey, saveGeminiKey } from '../../services/aiCeoService';
import { AppStorageService } from '../../services/storageService';

interface AiCeoSectionProps {
  currentPartner: PartnerId;
  partners: PartnerProfile[];
  onExecuteAction?: (action: any) => void;
}

export const AiCeoSection: React.FC<AiCeoSectionProps> = ({
  currentPartner,
  partners,
  onExecuteAction
}) => {
  const currentPartnerObj = partners.find(p => p.id === currentPartner) || partners[0];
  const [mode, setMode] = useState<AiMode>('advisor');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // حالة معمارية الخادم الآمن
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean;
    hasKey: boolean;
    model: string;
    toolsCount: number;
  }>({
    online: false,
    hasKey: false,
    model: 'gemini-1.5-flash',
    toolsCount: 9
  });

  useEffect(() => {
    // التحقق من حالة الـ Backend
    fetch('/api/gemini/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBackendStatus({
            online: true,
            hasKey: data.hasApiKeyConfigured,
            model: data.primaryModel,
            toolsCount: data.registeredToolsCount
          });
        }
      })
      .catch(() => {
        setBackendStatus(prev => ({ ...prev, online: false }));
      });
  }, []);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai_ceo',
      text: `أهلاً بحضرتك يا ${currentPartnerObj.name}! أنا جاهز معاك كمدير تنفيذي ومستشار ذكي متصل بـ **Google Gemini 1.5 Flash** (النموذج الرسمي المستقر طويل المدى).
دلوقتي إحنا في **وضع ${mode === 'advisor' ? 'المستشار (Advisor Mode)' : 'التنفيذ (Execution Mode)'}**. 

أولوياتنا الحالية للنهوض بشركة Tecnolobia:
1. **مراجعة سابقة أعمالنا الـ 8 من GitHub** وتحويلها إلى Micro-SaaS باشتراك شهري.
2. **صيد عملاء جدد في الإسكندرية والقاهرة** وتجهيز رسائل المبيعات على WhatsApp.
3. **وضع استراتيجية التوسع والمنافسة العالمية** في السوق المصري والخليج.

جاهز أراجع معاك أي مشروع أو نجهز استهداف كاش سريع لمطاعم سموحة وميامي، تحب نبدأ بإيه؟`,
      timestamp: new Date().toISOString(),
      mode: 'advisor'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const [confirmingTool, setConfirmingTool] = useState<string | null>(null);

  const handleConfirmCrmTool = async (msgId: string, toolName: string, args: any) => {
    setConfirmingTool(`${msgId}-${toolName}`);
    try {
      const res = await AiCeoService.confirmAction(toolName, args, currentPartner);
      if (res.success || (res as any).action === 'EXECUTED_SUCCESSFULLY' || (res as any).status === 'created' || (res as any).status === 'updated') {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId && m.toolsUsed) {
            return {
              ...m,
              toolsUsed: m.toolsUsed.map(t => {
                if (t.tool === toolName) {
                  return {
                    ...t,
                    result: {
                      ...t.result,
                      action: 'EXECUTED_SUCCESSFULLY',
                      status: 'confirmed_and_executed',
                      message: (res as any).message || (res as any).data?.message || 'تم الاعتماد والتنفيذ بنجاح في قاعدة البيانات ✓'
                    }
                  };
                }
                return t;
              })
            };
          }
          return m;
        }));
      } else {
        alert(res.error || 'تعذر تأكيد العملية');
      }
    } catch (err: any) {
      alert(err.message || 'فشل تأكيد العملية');
    } finally {
      setConfirmingTool(null);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderPartner: currentPartner,
      text: textToSend,
      timestamp: new Date().toISOString(),
      mode
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputQuery('');
    setIsLoading(true);

    try {
      const reply = await AiCeoService.consultCeo(textToSend, currentPartner, mode, nextHistory);
      setMessages(prev => [...prev, reply]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = (msgId: string, action: any) => {
    if (onExecuteAction) {
      onExecuteAction(action);
    }
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.suggestedAction) {
        return {
          ...m,
          suggestedAction: { ...m.suggestedAction, confirmed: true }
        };
      }
      return m;
    }));
  };

  const quickPrompts = [
    'اعرضلي تقرير المبيعات الحالي.',
    'مين العملاء اللي محتاجين متابعة؟',
    'احكيلي تفاصيل مطعم البرنس.',
    'كام الفلوس اللي حصلناها فعلياً من المبيعات؟',
    'سجل عميل جديد اسمه كافتيريا الأندلس ورقم 01234567890 وقيمة 6000 جنيه',
    'احسبلي صافي ربح وتقسيم الأرباع لصفقة بقيمة 28,000 ج.م'
  ];

  return (
    <div className="space-y-3 sm:space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-190px)] md:h-[calc(100vh-140px)] pb-2">
      
      {/* شريط التحكم بالمدير التنفيذي والأوضاع ومفتاح Gemini */}
      <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Bot className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white">المدير التنفيذي الذكي (AI CEO)</h1>
              <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>Gemini 1.5 Flash</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              العقل الإداري والاستراتيجي للشركة • مستشار م. محمد وم. طارق
            </p>
          </div>
        </div>

        {/* مؤشر الخادم الخلفي الآمن ومحول الأوضاع */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowArchitectureModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-mono border border-indigo-500/30 transition-all shadow-sm"
            title="فحص معمارية الخادم الآمن وحالة الأدوات"
          >
            <span className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold">Backend Agent: {backendStatus.model}</span>
            <span className="text-[10px] text-indigo-400 font-sans">({backendStatus.toolsCount} أدوات)</span>
          </button>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
            <button
              onClick={() => setMode('advisor')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs transition-all ${
                mode === 'advisor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              وضع المستشار
            </button>
            <button
              onClick={() => setMode('execution')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs transition-all ${
                mode === 'execution'
                  ? 'bg-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              وضع التنفيذ
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Token Saver</span>
          </div>
        </div>
      </div>

      {/* منطقة الرسائل والمحادثة */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai_ceo';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isAi ? 'mr-0 ml-auto' : 'ml-0 mr-auto flex-row-reverse'}`}
            >
              {/* الصورة الرمزية */}
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                isAi 
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md'
                  : msg.senderPartner === 'mohamed' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isAi ? <Bot className="w-4 h-4" /> : msg.senderPartner === 'mohamed' ? 'م' : 'ط'}
              </div>

              {/* محتوى الرسالة */}
              <div className={`space-y-2.5 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                isAi 
                  ? 'bg-slate-900 border border-slate-700/80 text-slate-200 shadow-md'
                  : 'bg-indigo-600 text-white font-medium shadow-md'
              }`}>
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 mb-1 border-b border-slate-700/40 pb-1">
                  <span className="font-bold text-slate-300">
                    {isAi ? 'المدير التنفيذي الذكي (Gemini)' : msg.senderPartner === 'mohamed' ? 'المهندس محمد البحر' : 'المهندس طارق حافظ'}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* استعراض الأدوات المستدعاة حقيقياً وبطاقات التأكيد التنفيذية */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <div className="p-2.5 bg-slate-950/90 rounded-xl border border-indigo-500/30 text-[11px] text-slate-300 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>الأدوات التنفيذية المستدعاة (Live Function Calling):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.toolsUsed.map((t, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-950/80 text-indigo-300 rounded font-mono text-[10px] border border-indigo-800/40">
                            ⚙️ {t.tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* بطاقات الاعتماد الصريح للعمليات المغيرة للبيانات (Human-in-the-Loop) */}
                    {msg.toolsUsed.map((t, idx) => {
                      const isPending = t.result?.action === 'SUGGESTION_ONLY' || t.result?.status === 'pending_partner_confirmation';
                      const isExecuted = t.result?.action === 'EXECUTED_SUCCESSFULLY' || t.result?.status === 'confirmed_and_executed';

                      if (!isPending && !isExecuted) return null;

                      return (
                        <div key={`tool-card-${idx}`} className={`p-3.5 bg-slate-950 rounded-xl border ${isExecuted ? 'border-emerald-500/40' : 'border-amber-500/50'} space-y-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className={`w-4 h-4 ${isExecuted ? 'text-emerald-400' : 'text-amber-400'}`} />
                              <span className="font-bold text-xs text-white">
                                {isExecuted ? 'تم اعتماد وتنفيذ العملية بنجاح' : 'صمام أمان بشري (Human-in-the-Loop Approval)'}
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isExecuted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {t.tool}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {t.result?.message}
                          </p>

                          {/* تفاصيل البيانات المقترحة */}
                          {t.result?.proposedData && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900/80 rounded-lg text-[11px] text-slate-300 border border-slate-800">
                              <div><span className="text-slate-400">المنشأة:</span> <strong className="text-white">{t.result.proposedData.businessName}</strong></div>
                              <div><span className="text-slate-400">الهاتف:</span> <strong className="text-white">{t.result.proposedData.phone}</strong></div>
                              <div><span className="text-slate-400">الاحتياج:</span> <strong className="text-white">{t.result.proposedData.softwareNeed || 'برمجيات'}</strong></div>
                              <div><span className="text-slate-400">القيمة التقديرية:</span> <strong className="text-amber-400">{t.result.proposedData.dealValueEstimate ? `${t.result.proposedData.dealValueEstimate} ج.م` : 'غير محدد'}</strong></div>
                            </div>
                          )}

                          {t.result?.proposedStage && (
                            <div className="p-2 bg-slate-900/80 rounded-lg text-[11px] text-slate-300 border border-slate-800">
                              <span>ترقية العميل إلى مرحلة: </span>
                              <strong className="text-indigo-400 font-mono text-xs">{t.result.proposedStage}</strong>
                            </div>
                          )}

                          {isExecuted ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold pt-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تم توثيق العملية وحفظها في مستودع Firestore الموحد ✓</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-2">
                              <button
                                disabled={confirmingTool === `${msg.id}-${t.tool}`}
                                onClick={() => handleConfirmCrmTool(msg.id, t.tool, t.args)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{confirmingTool === `${msg.id}-${t.tool}` ? 'جاري الاعتماد...' : 'اعتماد وتنفيذ العملية كشريك رسمي'}</span>
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">
                                يتطلب توثيق الشريك (isConfirmedByPartner)
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* بطاقة الفرصة التجارية إن وجدت في الرد */}
                {msg.isOpportunityCard && msg.opportunityData && (
                  <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{msg.opportunityData.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        طلب مرتفع جداً
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      <div>السعر المقترح: <span className="text-amber-400 font-bold">{msg.opportunityData.priceRange}</span></div>
                      <div>الجمهور المستهدف: <span className="text-slate-400">{msg.opportunityData.targetAudience}</span></div>
                    </div>
                  </div>
                )}

                {/* بطاقة تأكيد الإجراء في وضع التنفيذ */}
                {msg.suggestedAction && (
                  <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>تأكيد الإجراء التنفيذي المطلوب:</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      سيتم إنشاء مهمة تنفيذية بعنوان: <span className="text-white font-bold">{msg.suggestedAction.payload.title}</span>
                    </p>
                    
                    {msg.suggestedAction.confirmed ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold pt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم تأكيد وتنفيذ هذا الإجراء في النظام ✓</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.suggestedAction)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                        >
                          موافقة واعتماد الإجراء
                        </button>
                        <span className="text-[10px] text-slate-400">
                          (لا ينفذ أي شيء دون نقرة صريحة)
                        </span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-900 rounded-xl border border-slate-800 w-fit">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>المدير التنفيذي يحلل البيانات عبر Gemini ويجهز أفضل قرار...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* الأسئلة والمقترحات السريعة */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
        <span className="text-[11px] text-slate-400 font-bold shrink-0">مقترحات استراتيجية:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-full text-xs font-semibold shrink-0 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* حقل الإدخال وزر الإرسال */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`اكتب استشارتك للمدير الذكي يا ${currentPartner === 'mohamed' ? 'بشمهندس محمد' : 'بشمهندس طارق'}...`}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all active:scale-95"
          title="إرسال"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* نافذة استعراض معمارية الخادم الآمن وحالة الأدوات */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">معمارية Gemini Backend Agent</h3>
                  <p className="text-xs text-slate-400">بنية سحابية آمنة ومفصولة تماماً عن المتصفح</p>
                </div>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">حالة الخادم:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${backendStatus.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {backendStatus.online ? 'متصل وجاهز (Active)' : 'وضع المعاينة المحلية (Local Intent)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">النموذج الرسمي:</span>
                  <span className="font-mono text-indigo-400 font-bold">{backendStatus.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">أدوات النظام الحقيقية:</span>
                  <span className="text-emerald-400 font-bold">{backendStatus.toolsCount} أدوات (Function Calling)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">تأمين المفتاح:</span>
                  <span className="text-slate-200 font-mono">Server Environment (.env) • صفر مفاتيح في المتصفح</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 text-[11px] space-y-1">
                <p className="font-bold text-indigo-300">🛡️ حوكمة الصلاحيات (Strict ACL):</p>
                <p className="text-slate-300">
                  - جميع استدعاءات البيانات الحقيقية محمية بوسيط التحقق الأمني <code className="text-indigo-300">x-partner-id</code>.
                </p>
                <p className="text-slate-300">
                  - أي مقترح تحسين أو صياغة مهمة يُحفظ كمسودة تتطلب موافقة صريحة من الشريكين قبل الاعتماد.
                </p>
                <p className="text-slate-300">
                  - كل حركة واستدعاء يتم تدوينها في سجل تدقيق غير قابل للتلاعب (Audit Logs).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
