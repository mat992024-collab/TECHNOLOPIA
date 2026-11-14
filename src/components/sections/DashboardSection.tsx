import React from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  Plus, 
  Clock, 
  ArrowRight, 
  Briefcase, 
  GraduationCap, 
  Coins, 
  UserCheck, 
  Compass, 
  Lightbulb, 
  Trophy, 
  Flame, 
  Award,
  TrendingUp,
  Percent
} from 'lucide-react';
import { PartnerProfile, PartnerId, CompanyMeta } from '../../types/company';
import { ProjectItem, TaskItem } from '../../types/projects';
import { FinancialTransaction, ProfitDistributionCycle } from '../../types/finance';
import { summarizeTransactions } from '../../services/financeEngine';

interface DashboardSectionProps {
  currentPartner: PartnerId;
  partners: PartnerProfile[];
  companyMeta: CompanyMeta;
  projects: ProjectItem[];
  tasks: TaskItem[];
  transactions: FinancialTransaction[];
  profitCycles: ProfitDistributionCycle[];
  onNavigate: (tab: any) => void;
  onOpenNewTransaction: () => void;
  onOpenNewProject: () => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  currentPartner,
  partners,
  companyMeta,
  projects,
  tasks,
  transactions,
  profitCycles,
  onNavigate,
  onOpenNewTransaction,
  onOpenNewProject
}) => {
  const currentPartnerObj = partners.find(p => p.id === currentPartner) || partners[0];
  const otherPartner = partners.find(p => p.id !== currentPartner) || partners[1];
  const summary = summarizeTransactions(transactions);

  // حساب مؤشرات الأداء والتنافس الإيجابي بين الشريكين
  const mohamedTasks = tasks.filter(t => t.assignedTo === 'mohamed' || t.assignedTo === 'both');
  const mohamedCompleted = mohamedTasks.filter(t => t.status === 'completed').length;
  const mohamedTotal = mohamedTasks.length;
  const mohamedRate = mohamedTotal > 0 ? Math.round((mohamedCompleted / mohamedTotal) * 100) : 0;
  const mohamedUrgentDone = mohamedTasks.filter(t => t.status === 'completed' && t.priority === 'urgent').length;
  const mohamedPoints = mohamedCompleted * 10 + mohamedUrgentDone * 15;

  const tarekTasks = tasks.filter(t => t.assignedTo === 'tarek' || t.assignedTo === 'both');
  const tarekCompleted = tarekTasks.filter(t => t.status === 'completed').length;
  const tarekTotal = tarekTasks.length;
  const tarekRate = tarekTotal > 0 ? Math.round((tarekCompleted / tarekTotal) * 100) : 0;
  const tarekUrgentDone = tarekTasks.filter(t => t.status === 'completed' && t.priority === 'urgent').length;
  const tarekPoints = tarekCompleted * 10 + tarekUrgentDone * 15;

  // تحديد المتصدر
  let competitionLeaderText = 'شراكة ذهبية وتكافؤ تام في الأداء بين الشريكين 🤝';
  let leaderPartner: 'mohamed' | 'tarek' | 'tie' = 'tie';

  if (mohamedPoints > tarekPoints) {
    competitionLeaderText = 'م. محمد البحر يتصدر سباق الإنجاز هذا الأسبوع 🔥';
    leaderPartner = 'mohamed';
  } else if (tarekPoints > mohamedPoints) {
    competitionLeaderText = 'م. طارق حافظ يتصدر سباق الإنجاز هذا الأسبوع 🔥';
    leaderPartner = 'tarek';
  }

  // المهام المعينة للشريك الحالي وللشريك الآخر
  const myTasks = tasks.filter(t => (t.assignedTo === currentPartner || t.assignedTo === 'both') && t.status !== 'completed');
  const otherPartnerTasks = tasks.filter(t => t.assignedTo === otherPartner.id && t.status !== 'completed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. بانر القيادة والتوجيه التنفيذي */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-5 sm:p-7 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                <span>غرفة التوجيه والتطوير التنفيذي</span>
              </span>
              <span className="text-slate-400 text-xs">| {companyMeta.name}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white">
              أهلاً بك يا {currentPartnerObj.name} 👋
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تركيزنا الآن منصبّ على <strong className="text-emerald-400">التنفيذ الميداني وإنجاز المهام بمواعيدها المحددة</strong> واستغلال خبراتنا السابقة لجلب أول عملاء وتحقيق دخل سريع.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => onNavigate('ai_ceo')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>استشارة المدير الذكي</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إسناد مهمة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ميدان التنافس الإيجابي بين الشريكين (Co-Founders Performance & Excellence Arena) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">ميدان التنافس والتميز بين الشريكين</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>سباق الإنجاز</span>
                </span>
              </div>
              <span className="text-xs text-slate-400">مؤشر أداء ونسبة إنجاز المهام لكل مهندس لخلق روح تنافسية تدفع الشركة للقمة</span>
            </div>
          </div>

          <div className="bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-amber-300 self-start sm:self-auto">
            {competitionLeaderText}
          </div>
        </div>

        {/* بطاقتا المقارنة والرسم البياني للشريكين */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* بطاقة المهندس محمد البحر */}
          <div className={`p-5 rounded-2xl border transition-all ${
            leaderPartner === 'mohamed' 
              ? 'bg-gradient-to-br from-blue-950/60 via-slate-950 to-slate-900 border-blue-500/50 shadow-lg shadow-blue-900/20' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md">
                  م
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">المهندس محمد البحر</h3>
                    {leaderPartner === 'mohamed' && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded">متصدر 🏆</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">القيادة التقنية وFull-Stack</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-blue-400">{mohamedRate}%</span>
                <span className="text-[10px] text-slate-400 block font-semibold">نسبة الإنجاز</span>
              </div>
            </div>

            {/* شريط الرسم البياني لنسبة الإنجاز */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${mohamedRate}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2">
                <span>المهام المنجزة: <strong className="text-white">{mohamedCompleted} من {mohamedTotal}</strong></span>
                <span>نقاط التميز: <strong className="text-amber-400">{mohamedPoints} نقطة</strong></span>
              </div>
            </div>
          </div>

          {/* بطاقة المهندس طارق حافظ */}
          <div className={`p-5 rounded-2xl border transition-all ${
            leaderPartner === 'tarek' 
              ? 'bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md">
                  ط
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">المهندس طارق حافظ</h3>
                    {leaderPartner === 'tarek' && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded">متصدر 🏆</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">قيادة الأعمال والعمليات</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">{tarekRate}%</span>
                <span className="text-[10px] text-slate-400 block font-semibold">نسبة الإنجاز</span>
              </div>
            </div>

            {/* شريط الرسم البياني لنسبة الإنجاز */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${tarekRate}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2">
                <span>المهام المنجزة: <strong className="text-white">{tarekCompleted} من {tarekTotal}</strong></span>
                <span>نقاط التميز: <strong className="text-amber-400">{tarekPoints} نقطة</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. المهام التنفيذية الحالية وتوزيع العمل بين محمد وطارق */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">المهام التنفيذية وأولويات العمل اليوم</h2>
              <span className="text-xs text-slate-400">توزيع العمل المشترك بين المهندس محمد والمهندس طارق</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>لوحة المهام الكاملة ({tasks.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* عرض المهام المباشرة للشريك الحالي */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* مهامك المباشرة */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>مهامك المباشرة ({currentPartnerObj.name})</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                {myTasks.length} معلقة
              </span>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 space-y-2">
                <p>لا توجد مهام معلقة لك حالياً. ممتاز!</p>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="px-3 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 rounded-lg text-xs font-bold transition-colors"
                >
                  + إضافة مهمة جديدة
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {myTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-white">{t.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                        t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.priority === 'urgent' ? 'عاجل' : 'أولوية'}
                      </span>
                    </div>
                    {t.description && <p className="text-slate-400 text-[11px]">{t.description}</p>}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>التسليم: {t.dueDate} {t.dueTime ? `الساعة ${t.dueTime}` : ''}</span>
                      </div>
                      <span className="text-indigo-400 font-semibold">{t.status === 'in_progress' ? 'قيد العمل' : 'انتظار'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* مهام الشريك الآخر */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>مهام الشريك ({otherPartner.name})</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                {otherPartnerTasks.length} معلقة
              </span>
            </div>

            {otherPartnerTasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                <p>لا توجد مهام معلقة مسندة لـ {otherPartner.name} حالياً.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {otherPartnerTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-white">{t.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                        t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {t.priority === 'urgent' ? 'عاجل' : 'قيد العمل'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>التسليم: {t.dueDate} {t.dueTime ? `الساعة ${t.dueTime}` : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4. توجيهات المدير الذكي لاقتناص أول دخل سريع وتطوير الشركة */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">إرشادات وتوجيهات المدير الذكي لتطوير الشركة</h2>
              <span className="text-xs text-slate-400">كيف نستغل إمكانياتنا وخبراتنا لتحقيق نتائج فورية على الأرض</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('marketing')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>خطة المبيعات والتسويق</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  كاش سريع فوري
                </span>
                <span className="text-xs font-bold text-slate-400">تسليم 3 أيام</span>
              </div>
              <h3 className="font-bold text-sm text-white">إعادة تقديم كاشير مطعم فريش للمطاعم والكافيهات</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                الكود مبرمج ومختبر لديكم بالفعل. نبيعه كنسخة مخصصة للمطاعم بسعر 8,000 إلى 15,000 ج.م كاش، أو باشتراك شهري 800 ج.م، ونحصل مقدم تعاقد 50% فوري.
              </p>
            </div>
            <button
              onClick={() => onNavigate('marketing')}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold transition-colors text-center"
            >
              نسخ رسالة الواتساب لعرض الكاشير
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                  ربحية 90%
                </span>
                <span className="text-xs font-bold text-slate-400">تسليم يومين</span>
              </div>
              <h3 className="font-bold text-sm text-white">منيو إلكتروني تفاعلي QR كود</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                أسرع خدمة يمكن تسليمها بجهد برمجي بسيط جداً. أصحاب الكافيهات ومحلات البرجر والبيتزا يدفعون فوراً (3,500 - 5,000 ج.م) للحصول على منيو سريع للموبايل.
              </p>
            </div>
            <button
              onClick={() => onNavigate('ai_ceo')}
              className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-bold transition-colors text-center"
            >
              مناقشة خطة العرض مع المدير الذكي
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  عقود كبرى B2B
                </span>
                <span className="text-xs font-bold text-slate-400">تسليم 7 أيام</span>
              </div>
              <h3 className="font-bold text-sm text-white">نظام إدارة المطابع وشركات الدعاية والإعلان</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                خبرتكم في "مطبعة واجدي" تمنحكم مصداقية فورية لأنكم تفهمون حساب هالك الورق ومراحل التشغيل. يمكن بيعه بـ 20,000+ ج.م لكل مطبعة.
              </p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-xl text-xs font-bold transition-colors text-center"
            >
              معاينة كود سابقة أعمال واجدي
            </button>
          </div>

        </div>
      </div>

      {/* 5. سابقة الأعمال والخبرات المنفذة (8 أنظمة مطورة) */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">سابقة أعمال وخبرات الفريق (8 أنظمة مطورة)</h2>
              <span className="text-xs text-slate-400">الرصيد التقني الذي نعتمد عليه لإثبات جدارتنا أمام العملاء</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>عرض المشروعات</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {projects.map((proj) => (
            <div key={proj.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  سابقة أعمال
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h3 className="font-bold text-xs text-white leading-snug">{proj.name}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">{proj.scopeSummary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. مسار تطوير مهارات الشريكين */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">تطوير مهارات الشريكين وفق متطلبات السوق</h2>
              <span className="text-xs text-slate-400">خطط تعلم مركزة تخدم منتجات الشركة ومبيعاتها</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('skills')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>المسارات التعليمية</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white">المهندس محمد البحر (المسار التقني وAI)</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              التركيز الحالي: ربط وتطوير AI Agents ذكية للأنظمة، وتطوير كود الكاشير ليعمل Offline PWA بدون إنترنت على تابلت المطاعم.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white">المهندس طارق حافظ (مسار الأعمال وSaaS)</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              التركيز الحالي: إعادة هيكلة نظام المطابع ليدعم Multi-Tenant Cloud SaaS متكرر الاشتراكات، وأتمتة مبيعات B2B عبر رسائل واتساب.
            </p>
          </div>
        </div>
      </div>

      {/* 7. الملخص المالي المحاسبي المقتضب في نهاية الصفحة */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>السجل المالي الصارم (الأرباع الأربعة - 25% لكل بند)</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            النظام جاهز ومصفر تماماً: المحصل الفعلي: <span className="text-white font-bold">{summary.collectedRevenue} ج.م</span> | المصروفات: <span className="text-white font-bold">{summary.totalExpenses} ج.م</span> | صافي الربح: <span className="text-white font-bold">{summary.split.netDistributableProfit} ج.م</span>
          </p>
        </div>

        <button
          onClick={() => onNavigate('profit_calculator')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto shrink-0"
        >
          فتح حاسبة الأرباح
        </button>
      </div>

    </div>
  );
};
