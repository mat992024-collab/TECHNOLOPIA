import React from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Code2, 
  Briefcase,
  UserCheck
} from 'lucide-react';
import { PartnerProfile } from '../../types/company';

interface SkillsDevelopmentSectionProps {
  partners: PartnerProfile[];
}

export const SkillsDevelopmentSection: React.FC<SkillsDevelopmentSectionProps> = ({
  partners
}) => {
  const learningTracks = [
    {
      partner: 'المهندس محمد البحر',
      role: 'القيادة التقنية وFull-Stack Architecture',
      color: 'border-blue-500/30 bg-blue-950/10',
      badgeColor: 'bg-blue-500/20 text-blue-400',
      skills: [
        {
          title: 'هندسة الـ AI Agents وربط LLMs بالمشاريع',
          status: 'قيد التطوير',
          priority: 'أولوية قصوى',
          desc: 'تعلم بناء عملاء ذكاء اصطناعي يقومون بمهام ذاتية لخدمة منتجات الشركة ودمج Gemini API بكفاءة عالية وتكلفة منعدمة.'
        },
        {
          title: 'Next.js 15 PWA Offline-First',
          status: 'مخطط له',
          priority: 'عالي',
          desc: 'تطوير كاشير مطعم فريش ليعمل PWA على أي تابلت أو شاشة لمس بدون الحاجة للاتصال بالإنترنت مع مزامنة خلفية.'
        },
        {
          title: 'تقنيات مبيعات الحلول التقنية (Technical Sales)',
          status: 'مستمر',
          priority: 'متوسط',
          desc: 'شرح المزايا التقنية بأسلوب مبسط لأصحاب الأعمال لإغلاق الصفقات دون إرباكهم بالمصطلحات المعقدة.'
        }
      ]
    },
    {
      partner: 'المهندس طارق حافظ',
      role: 'قيادة الأعمال والعمليات وSoftware Engineering',
      color: 'border-emerald-500/30 bg-emerald-950/10',
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
      skills: [
        {
          title: 'تحويل نظام مطبعة واجدي إلى Cloud SaaS متكرر الاشتراكات',
          status: 'قيد التطوير',
          priority: 'أولوية قصوى',
          desc: 'إعادة هيكلة كود المطبعة ليدعم Multi-Tenancy حتى نتمكن من بيع اشتراكات شهرية متكررة للمطابع بدلاً من البيع لمرة واحدة.'
        },
        {
          title: 'أتمتة خط أنابيب المبيعات B2B عبر WhatsApp Business API',
          status: 'مخطط له',
          priority: 'عالي',
          desc: 'بناء بوت ردود تلقائي يرسل عروض الأسعار والـ Demos للعملاء المهتمين فور تسجيل بياناتهم.'
        },
        {
          title: 'إدارة وتوسيع البنية التحتية السحابية (DevOps & CI/CD)',
          status: 'مستمر',
          priority: 'متوسط',
          desc: 'تأمين ونشر النسخ والتحديثات للمشاريع بشكل أوتوماتيكي لتقليل تكلفة الصيانة وسرعة الاستجابة للأعطال.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">مركز تطوير مهارات الشريكين</h1>
              <p className="text-xs text-slate-300 mt-1">
                خطة تعلم عملية وموجهة مباشرة لما تحتاجه الشركة في السوق المصري لتحقيق أرباح أعلى وبناء منتجات مستدامة.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* مسارات التعلم للشريكين */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {learningTracks.map((track, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border ${track.color} space-y-4 shadow-lg bg-slate-900`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-xl text-white">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{track.partner}</h2>
                  <span className="text-xs text-slate-400">{track.role}</span>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${track.badgeColor}`}>
                مسار النمو
              </span>
            </div>

            <div className="space-y-3">
              {track.skills.map((skill, sIdx) => (
                <div key={sIdx} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{skill.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-500/10 text-amber-400">
                      {skill.priority}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{skill.desc}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-900">
                    <span>الحالة: <strong className="text-emerald-400">{skill.status}</strong></span>
                    <span>التطبيق العملي في مشاريع الشركة</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
