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
  
  // حالة مفتاح Gemini
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');

  useEffect(() => {
    const saved = getSavedGeminiKey();
    setGeminiKey(saved);
    setKeyInput(saved);
  }, []);

  const handleSaveKey = () => {
    saveGeminiKey(keyInput);
    setGeminiKey(keyInput);
    setShowKeyModal(false);
  };

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

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const reply = await AiCeoService.consultCeo(textToSend, currentPartner, mode);
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
    'مراجعة مشروعاتنا السابقة وتطويرها كـ SaaS عالمي',
    'خطة لاصطياد 10 مطاعم في سموحة وميامي هذا الأسبوع',
    'استراتيجية المنافسة العالمية والتوسع في السوق الخليجي',
    'رسالة بيع قوية لنظام إدارة المطابع ووكالات الدعاية',
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

        {/* محول وضعي المستشار والتنفيذ ومفتاح API */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono border border-slate-800 transition-all"
            title="إعدادات مفتاح Google Gemini API"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{geminiKey ? 'Gemini Key ✓' : 'إضافة Gemini Key'}</span>
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

      {/* نافذة ضبط مفتاح Gemini API */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl">
                  <Key className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">إعداد مفتاح Google Gemini</h3>
                  <p className="text-xs text-slate-400">الاتصال المباشر بنموذج Gemini 2.0 Flash</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-300 font-bold">أدخل مفتاح Google Gemini API Key الخاص بك:</label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إذا تركته فارغاً، ستستخدم المنصة تلقائياً المحرك التنفيذي الذكي المحلي المبرمج بأفضل ممارسات إدارة الأعمال المصرية دون انقطاع. للحصول على مفتاح مجاني يمكن الدخول على <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google AI Studio</a>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                حفظ المفتاح
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
