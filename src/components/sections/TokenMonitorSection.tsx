import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  Coins, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { TokenUsageStats } from '../../types/ai';
import { AppStorageService } from '../../services/storageService';

export const TokenMonitorSection: React.FC = () => {
  const [stats, setStats] = useState<TokenUsageStats>(() => AppStorageService.getTokenStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(AppStorageService.getTokenStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const egpExchangeRate = 50.5; // سعر الصرف التقديري
  const estimatedCostEgp = stats.estimatedCostUsd * egpExchangeRate;

  const rules = [
    { title: 'العمليات الحسابية بكود عادي (0 Tokens)', desc: 'حساب الأرباح والنسب وتقسيم الأرباع يتم برمجياً 100% بدون إهدار أي رمز على الـ AI.' },
    { title: 'تقليص نافذة السياق (Context Pruning)', desc: 'إرسال آخر 3 رسائل فقط مع ملخص تنفيذي بدلاً من كامل المحادثات القديمة.' },
    { title: 'استرجاع عند الطلب فقط (Selective RAG)', desc: 'جلب بيانات العميل أو المشروع المطلوب فقط وتجنب إرسال كل ملفات الشركة.' },
    { title: 'الاعتماد على النماذج الخفيفة الفائقة (Flash Models)', desc: 'استخدام Gemini 2.0 Flash السريع والاقتصادي، وحجز النماذج الأكبر للحالات القصوى.' },
    { title: 'التخزين المؤقت (Caching Layer)', desc: 'تخزين نتائج التحليلات السوقية والاستشارات المتكررة لتفادي تكرار الطلبات.' }
  ];

  return (
    <div className="space-y-6">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">لوحة مراقبة الـ Tokens وحصص الذكاء الاصطناعي</h1>
              <p className="text-xs text-slate-300 mt-1">
                تطبيق سياسة التوفير الصارم لتقليل التكلفة والحفاظ على حصة اشتراك Gemini Pro المشترك.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold self-start md:self-auto">
          <Zap className="w-4 h-4 animate-pulse" />
          <span>Token Saver Mode: مفعل افتراضياً</span>
        </div>
      </div>

      {/* المؤشرات الأربعة للاستهلاك والتكلفة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">إجمالي طلبات الذكاء الاصطناعي</span>
          <span className="text-2xl font-black text-white mt-2 block">
            {stats.totalCalls} طلب
          </span>
          <span className="text-[10px] text-slate-400">آخر استدعاء: منذ دقائق</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">الرموز المستهلكة التقديرية</span>
          <span className="text-2xl font-black text-indigo-400 mt-2 block">
            {stats.estimatedTokensUsed.toLocaleString()} Tokens
          </span>
          <span className="text-[10px] text-slate-400">سياق مقتضب ومضغوط</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 block">التكلفة الفعلية التقديرية</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 block">
            {stats.estimatedCostUsd.toFixed(4)} $
          </span>
          <span className="text-[10px] text-slate-400">يعادل حوالي {estimatedCostEgp.toFixed(2)} جنيه مصري</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/20">
          <span className="text-xs font-bold text-slate-400 block">نسبة التوفير المحققة</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 block">
            {stats.tokenSaverSavedPercent}% وفراً
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">بفضل الحسابات البرمجية الذاتية</span>
        </div>

      </div>

      {/* قواعد التوفير الإلزامية المطبقة برمجياً */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>القواعد الإلزامية لتوفير الـ Tokens المطبقة داخل المنصة</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{rule.title}</span>
              </div>
              <p className="text-slate-400 leading-relaxed pr-6">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
