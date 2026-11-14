import React, { useState } from 'react';
import { 
  Megaphone, 
  MessageSquare, 
  Copy, 
  Check, 
  Share2, 
  TrendingUp, 
  Zap, 
  HelpCircle,
  Sparkles,
  FileText,
  Send,
  MessageCircle,
  Coins,
  Lightbulb,
  ExternalLink,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { EGYPTIAN_MARKET_OPPORTUNITIES } from '../../mock/initialData';

export const MarketingSalesSection: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // حالات مولد عروض الأسعار السريعة
  const [proposalClient, setProposalClient] = useState<string>('');
  const [proposalBusiness, setProposalBusiness] = useState<string>('');
  const [proposalPhone, setProposalPhone] = useState<string>('');
  const [proposalService, setProposalService] = useState<string>('restaurant_pos');
  const [proposalPrice, setProposalPrice] = useState<number>(6500);
  const [proposalTimeline, setProposalTimeline] = useState<string>('3 أيام عمل');
  const [generatedProposalText, setGeneratedProposalText] = useState<string>('');

  const handleGenerateProposal = () => {
    const serviceTitles: Record<string, string> = {
      restaurant_pos: 'نظام إدارة ونقاط بيع المطاعم والكافيهات (POS)',
      qr_menu: 'منيو إلكتروني تفاعلي بالباركود (QR Code Menu)',
      print_erp: 'نظام إدارة المطابع وشركات الدعاية والإعلان (Print ERP)',
      portfolio: 'موقع تعريفي احترافي (Portfolio & Landing Page)',
      mobile_app: 'تطبيق موبايل خدمي وتجاري متكامل (Android App)'
    };

    const sTitle = serviceTitles[proposalService] || 'حل برمجي مخصص';
    const upfront = Math.round(proposalPrice * 0.5);
    const balance = proposalPrice - upfront;

    const text = `*شركة Tecnolobia للحلول البرمجية الذكية*
----------------------------------------
*عرض سعر رسمي وخطة تنفيذ مشروع*
*إلى السيد/ة:* ${proposalClient || 'العميل الكريم'}
*النشاط:* ${proposalBusiness || 'المؤسسة'}
*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}

تحية طيبة وبعد،،
يسر شركة Tecnolobia أن تقدم لحضرتكم عرض السعر الفني والمالي لتنفيذ وتشغيل:
⭐ *[ ${sTitle} ]*

*أولاً: مخرجات المشروع:*
1. تسليم النظام مبرمج ومختبر بالكامل وفق أعلى معايير الجودة والأمان.
2. واجهة مستخدم عربية سريعة جداً وسهلة الاستخدام للموظفين والإدارة.
3. تدريب مجاني مباشر لفريق العمل على تشغيل واستخدام النظام.
4. نسخة احتياطية سحابية منتظمة لحماية البيانات من التلف أو الفقدان.

*ثانياً: التكلفة المالية والدفع:*
- القيمة الإجمالية للمشروع: *${proposalPrice.toLocaleString()} جنيه مصري*.
- الدفعة المقدمة عند بدء التعاقد (50%): *${upfront.toLocaleString()} ج.م*.
- الدفعة الختامية عند الاستلام النهائي والتدريب (50%): *${balance.toLocaleString()} ج.م*.

*ثالثاً: الجدول الزمني والضمان:*
- مدة التنفيذ والتسليم: *${proposalTimeline}*.
- فترة الضمان والدعم الفني: *30 يوماً مجاناً* تشمل الصيانة ومتابعة التشغيل.

شاكرين لثقتكم ومستعدون للبدء الفوري.
_فريق عمل شركة Tecnolobia - الإسكندرية_
_م. محمد البحر & م. طارق حافظ_`;

    setGeneratedProposalText(text);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // حالات التخصيص اللحظي لرسائل الواتساب
  const [targetOwnerName, setTargetOwnerName] = useState<string>('أحمد');
  const [targetBusinessName, setTargetBusinessName] = useState<string>('المكان');
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [activeSender, setActiveSender] = useState<'م. محمد البحر' | 'م. طارق حافظ'>('م. محمد البحر');
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<string>('all');

  const salesTemplates = [
    {
      id: 'tmpl-restaurant-pain',
      category: 'restaurants',
      target: 'أصحاب المطاعم والكافيهات ومحلات البرجر والبيتزا',
      stageBadge: 'مدخل التركيز على وجع الشيفتات والفلوس',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      subject: 'حل مشكلة تسريب فلوس الكاشير وجرد المطبخ اليومي',
      whyItWorks: 'تخاطب الهاجس الأكبر لصاحب المطعم (سرقة الدرج وتأخير التقفيل) وتقدم حلاً عملياً شغال بالفعل في مطعم فريش، مع طلب موافقة على فيديو 60 ثانية بدون أي إلحاح.',
      generateMessage: (owner: string, business: string, sender: string) => 
`مساء الخير يا أستاذ ${owner || 'فندم'}، ألف مبروك السمعة الممتازة لـ ${business || 'المكان'}، المكان ماشاء الله عامل صدى محترم في منطقتكم.
معاك ${sender} شريك مؤسس في شركة Tecnolobia للحلول البرمجية بالإسكندرية.

بكلم حضرتك بخصوص أكبر مشكلة بنشوفها يومياً مع أصحاب المطاعم والكافيهات:
- وجع دماغ تقفيل الشيفتات وضياع وقت الجرد اليومي.
- تسريب الفلوس اللي بيحصل من الدرج بدون قصد أو مع ضغط الزحمة.
- إنك مش بتعرف صافي أرباحك الحقيقي لكل صنف إلا بعد مجهود وحسابات معقدة.

إحنا طورنا نظام كاشير وإدارة سريع جداً (شغال بالفعل في مطاعم زي "مطعم فريش"):
1. تقرير خزينة وأرباح بيوصل على موبايلك أوتوماتيك أول ما الشيفت يقفل في ثواني.
2. متابعة فورية لاستهلاك الخامات في المطبخ وتنبيهك قبل ما أي صنف يخلص.
3. منيو باركود تفاعلي بالـ QR سريع جداً يفتح على موبايل الزبون بدون أي تحميل.

مش طالب من حضرتك أي تعاقد ولا مليم مقدماً؛ حابب أبعتلك فيديو 60 ثانية تشوف السيستم شغال لايف على الطبيعة، أو نمر نركبلك نسخة تجريبية 48 ساعة تجربها في المحل بنفسك.
تحب أبعتلك الفيديو التوضيحي هنا على الواتساب؟`
    },
    {
      id: 'tmpl-printing-waste',
      category: 'printing',
      target: 'أصحاب المطابع ومكاتب الدعاية والإعلان',
      stageBadge: 'مدخل أزمة هالك الورق والعملاء الآجل',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      subject: 'حل حسابات أوامر الشغل وخسائر هالك تقطيع الورق',
      whyItWorks: 'تتحدث لغة أصحاب المطابع المتخصصة بدقة (الفرخ، الزنكات، الأحبار، المقاسات) المستفادة من سابقة أعمال مطبعة واجدي، فتبني مصداقية فورية.',
      generateMessage: (owner: string, business: string, sender: string) => 
`السلام عليكم أستاذ ${owner || 'فندم'}، يا رب تكون بخير وبأحسن حال.
معاك ${sender} شريك مؤسس في شركة Tecnolobia للأنظمة الرقمية بالإسكندرية.

شغالين حالياً مع مطابع كبرى (زي مطبعة واجدي)، وعارفين كويس إن أكبر 3 مشاكل بتاكل أرباح المطبعة هي:
1. هالك تقطيع الورق والفرخ اللي بيضيع ومحدش بيحسبه بدقة في سعر الشغلة.
2. أوامر الشغل اللي بتتسلم متأخرة أو الفنيين بيتلخبطوا في مواصفاتها ومقاساتها.
3. حسابات العملاء والمناديب الآجلة اللي بتوه بين الدفاتر والأوراق.

بنينا نظام إدارة مطابع متخصص (Print ERP) معمول مخصوص لحسابات السوق المصري:
- يحسبلك تكلفة الفرخ، الزنكات، الأحبار، والسولفان لكل أمر شغل بالمليم، فتعرف مكسبك الصافي قبل ما تبدأ طباعة.
- كشف حساب فوري ومفصل لكل عميل بضغطة زر يوضح المتبقي والمحصل.
- باركود لكل أمر شغل لمتابعة مراحل الطباعة والتشطيب والتسليم بدون لخبطة.

متاح نمر على حضرتك ربع ساعة في ${business || 'المطبعة'} نعرض لحضرتك السيستم شغال لايف على اللاب توب وتشوفه بنفسك بدون أي التزام مالي.
يناسب حضرتك نحدد معاد سريع بكره أو بعده؟`
    },
    {
      id: 'tmpl-lawyers-prestige',
      category: 'lawyers',
      target: 'المحامين والمستشارين القانونيين',
      stageBadge: 'مخاطبة بروتوكولية راقية والهيبة الرقمية',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      subject: 'إبراز مكانة وهيبة المكتب وجذب الموكلين الكبار',
      whyItWorks: 'تحترم تقاليد مهنة المحاماة وتخاطب رغبة المستشار في الظهور الرقمي الرصين الذي يجذب الشركات والموكلين القادرين على دفع أتعاب مرتفعة.',
      generateMessage: (owner: string, business: string, sender: string) => 
`مساء الخير يا سيادة المستشار ${owner || 'المحترم'}، تحياتي لشخصكم الكريم ولمكانتكم القانونية المرموقة.
معاك ${sender} من شركة Tecnolobia للحلول البرمجية بالإسكندرية.

حالياً الموكلين ورجال الأعمال لما بيحتاجوا استشارة قانونية أو رفع دعوى تجارية أو مدنية، أول تصرف بيعملوه هو البحث لمعرفة سابقة أعمال المحامي ومجالات تخصصه.
ووجود واجهة رقمية رسمية باسم مكتب حضرتك بيصنع فارق ضخم في:
1. إعطاء انطباع قوي بالثقة والفخامة للموكلين الجدد والشركات الكبرى.
2. استعراض سابقة الترافع والاستشارات القانونية بأسلوب راقٍ يليق بتقاليد مهنة المحاماة.
3. زر حجز موعد واستشارة مباشر على واتساب يسهل على الموكلين التواصل المنظم مع السكرتارية.

صممنا نموذج موقع تعريفي احترافي فخم جداً (Portfolio) مخصص لمكاتب المحاماة، والتسليم بالكامل خلال 48 ساعة فقط.
لو وقت سيادتكم يسمح، يشرفني أرسل لحضرتك رابط نموذج حي لمكتب محاماة نفذناه لمعاينته على الهاتف؟`
    },
    {
      id: 'tmpl-interior-portfolio',
      category: 'interior',
      target: 'مهندسو الديكور والتشطيبات والمقاولات',
      stageBadge: 'إغلاق صفقات الفيلات عبر معرض قبل/بعد',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subject: 'إقناع عملاء الفيلات بدفع باقات أعلى عبر بورتفوليو فخم',
      whyItWorks: 'تركز على نقطة ضعف المنشورات العادية على فيسبوك وتوضح للمهندس كيف يحول أعمال الجبس والتشطيب إلى معرض رقمي يبرر أسعاره العالية.',
      generateMessage: (owner: string, business: string, sender: string) => 
`مساء الخير يا باشمهندس ${owner || 'المحترم'}، شفت بعض أعمالكم في التشطيبات والديكور وما شاء الله ذوق راقي وشغل فندقي محترم.
معاك ${sender} من شركة Tecnolobia للحلول الرقمية.

أكيد حضرتك عارف إن عميل الفيلات والوحدات الراقية مش بيقتنع بمجرد بوستات عادية؛ العميل ده محتاج يشوف معرض أعمال رقمي فخم وسريع على الموبايل يعرض شغلك بتقنية (قبل وبعد) وتفاصيل الإضاءة والخامات عشان يثق ويدفع في الباقة العالية.

إحنا بننفذ موقع بورتفوليو رقمي سريع جداً مخصص لمهندسي الديكور والمقاولات (مبني على سابقة أعمالنا في مشاريع الجبس والديكور):
- معرض صور احترافي ومصنف (مودرن، كلاسيك، جبسيوم بورد، حمامات ومطابخ).
- استعراض مراحل الشغل والشهادات لرفع ثقة المالك قبل المعاينة.
- زر واتساب واتصال فوري لطلب المعاينة وحجز الاستشارة بدون وسيط.

التسليم خلال 3 أيام فقط وبسعر خاص جداً لمرحلة التأسيس.
تحب أبعت لحضرتك رابط نموذج لموقع ديكور شغال تشوف سرعته وأناقته على موبايلك؟`
    },
    {
      id: 'tmpl-bookstores-retail',
      category: 'bookstores',
      target: 'المكتبات المدرسية ومحلات التجزئة والتجارة',
      stageBadge: 'حل أزمة الزحمة ونواقص المخزن السريعة',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      subject: 'القضاء على طوابير الكاشير وجرد آلاف الأصناف المدرسية',
      whyItWorks: 'تستند إلى تجربة واقعية لنظام مكتبة مدرسية، وتخاطب الرعب من ضياع المبيعات في مواسم الزحمة بسبب بطء الحساب اليدوي.',
      generateMessage: (owner: string, business: string, sender: string) => 
`مساء الخير أستاذ ${owner || 'فندم'}، يا رب تكون بخير وبأحسن حال.
معاك ${sender} من شركة Tecnolobia للحلول البرمجية.

أكيد حضرتك في مواسم المدارس والامتحانات بتعاني من:
- الزحمة الشديدة وتكدس أولياء الأمور والطلبة أمام الكاشير.
- نسيان أسعار آلاف الأصناف (كشاكيل، أدوات، كتب، هدايا).
- صعوبة جرد المخزن ومعرفة النواقص قبل ما تخلص في عز الموسم.

صممنا نظام إدارة وكاشير للمكتبات المدرسية ومحلات التجزئة (مبني على تجربة فعلية لمكتبة مدرسية متكاملة):
- قارئ باركود فوري يخرج الإيصال في 3 ثواني فقط، فتقضي على الطوابير تماماً.
- تنبيه فوري بالأصناف اللي قربت تخلص عشان تلحق تطلبها من تاجر الجملة.
- تقرير مبيعات يومي وأرباح كل قسم بضغطة زر على شاشة جهازك.

متاح نمر على حضرتك في ${business || 'المكتبة'} نشغل لحضرتك ديمو لايف مجاني 15 دقيقة على جهازك.
تحب نحدد معاد مناسب هذا الأسبوع؟`
    },
    {
      id: 'tmpl-soft-followup',
      category: 'followup',
      target: 'جميع الأنشطة (متابعة ذكية بعد 48 ساعة)',
      stageBadge: 'متابعة ناعمة غير محرجة (Soft Follow-up)',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      subject: 'إعادة فتح الكلام بذكاء لو العميل قرأ وماردش',
      whyItWorks: 'لا تلوم العميل على التجاهل، بل تعترف بضغط وقته وتقدم له عرضاً أسهل بمشاهدة فيديو 60 ثانية متى ناسبه الوقت.',
      generateMessage: (owner: string, business: string, sender: string) => 
`مساء الخير أستاذ ${owner || 'فندم'}، أتمنى يومك يكون موفق وسعيد.
عارف إن وقت حضرتك ضيق مع ضغط إدارة العمل في ${business || 'المكان'}.
حبيت بس أأكد لحضرتك إن التجربة المجانية والمعاينة السريعة متاحة في أي وقت على جهازك وبدون أي التزام مالي من طرفكم.
لو حابب أبعتلك فيديو دقيقة واحدة تشوف فيه السيستم عملي، عرفني وتحت أمرك في أي وقت تشرفنا.`
    },
    {
      id: 'tmpl-guarantee-offer',
      category: 'followup',
      target: 'العملاء المترددين في اتخاذ القرار النهائي',
      stageBadge: 'عرض الضمان الخالي من المخاطرة (Zero Risk)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      subject: 'إزالة أي مخاوف بتدريب مجاني وضمان استرجاع 30 يوماً',
      whyItWorks: 'تقضي تماماً على تردد العميل عبر ضمان كامل: تجربة وتدريب للفريق بدون مقابل ولو لم يناسبه لا يدفع مليماً.',
      generateMessage: (owner: string, business: string, sender: string) => 
`أهلاً بحضرتك أستاذ ${owner || 'فندم'}، يا رب تكون بخير.
تقديراً لجهدكم وشغلكم المحترم في ${business || 'المكان'}، حابب أقدم لحضرتك عرض استثنائي هذا الأسبوع:
إحنا هننزل بنفسنا نثبت السيستم وندرب الفريق عندك عملياً، وهيكون معاك 30 يوم دعم فني وصيانة مجانية ومتابعة للتشغيل خطوة بخطوة.
لو حسيت خلال التجربة إن السيستم ما وفرش وقتك وفلوسك، مش هتدفع أي شيء.
تحب نبدأ التجربة سوا بكره أو بعده؟`
    }
  ];

  const filteredTemplates = selectedTemplateTab === 'all' 
    ? salesTemplates 
    : salesTemplates.filter(t => t.category === selectedTemplateTab);

  const objectionHandling = [
    {
      objection: '"السعر غالي علينا حالياً"',
      answer: 'يا فندم السيستم مش مصروف، ده استثمار بيوفرلك مرتب موظف أو فلوس هالك بتضيع في جرد المخزن. ده غير إننا بنوفرلك إمكانية اشتراك شهري بسيط (600 - 800 ج) عشان متدفعش مبلغ كبير في الأول.'
    },
    {
      objection: '"إحنا متعودين على الورقة والقلم والدفاتر"',
      answer: 'الدفاتر ممتازة في البداية، لكن بتصعب عليك تعرف صافي ربحك الحقيقي آخر الشهر، ولما الدفتر يضيع أو يحصل خلاف مع كاشير بتخسر عملاء وفلوس. البرنامج مش هيغير طريقة شغلك، إحنا مدربين النظام يشتغل بنفس سلاسة الدفتر لكن بحماية كاملة.'
    },
    {
      objection: '"مش هعرف أدرب الكاشير والفنيين عندي عليه"',
      answer: 'الواجهة معمولة بالعربي وبسيطة جداً بحيث أي حد بيعرف يستخدم فيسبوك وواتساب هيتعلم يشتغل عليها في 15 دقيقة فقط، وده جزء من خدمتنا إننا بننزل ندربهم بنفسنا.'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Megaphone className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">مركز التسويق والمبيعات المباشرة (B2B Playbook)</h1>
              <p className="text-xs text-slate-300 mt-1">
                رسائل بيع واتساب فائقة الإقناع والواقعية، مولد عروض الأسعار الرسمية، ودليل إغلاق الصفقات بالسوق المصري.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
          <Zap className="w-4 h-4" />
          <span>استهداف كاش فوري عالي الإقناع</span>
        </div>
      </div>

      {/* 1. شريط التخصيص التلقائي لرسائل الواتساب */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 rounded-3xl border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">شريط التخصيص السريع لرسائل الواتساب</h2>
              <span className="text-[11px] text-slate-400">اكتب اسم العميل والنشاط لتتحدث كل الرسائل أدناه تلقائياً ببياناته الحقيقية!</span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold self-start sm:self-auto flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-indigo-400" />
            <span>تحديث لحظي لجميع النماذج</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">اسم صاحب النشاط / العميل:</label>
            <input
              type="text"
              value={targetOwnerName}
              onChange={(e) => setTargetOwnerName(e.target.value)}
              placeholder="مثال: أستاذ أحمد..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">اسم المكان / الشركة:</label>
            <input
              type="text"
              value={targetBusinessName}
              onChange={(e) => setTargetBusinessName(e.target.value)}
              placeholder="مثال: كافيه الباشا..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">رقم واتساب العميل (لإرسال فوري):</label>
            <input
              type="tel"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">المرسل من الشريكين:</label>
            <select
              value={activeSender}
              onChange={(e) => setActiveSender(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="م. محمد البحر">م. محمد البحر (تقني & Full-Stack)</option>
              <option value="م. طارق حافظ">م. طارق حافظ (أعمال & مبيعات)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. تبويبات تصنيف رسائل الواتساب */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>رسائل البيع المباشر على واتساب (واقعية ومجهزة للإرسال)</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">اختر تصنيف النشاط لعرض الرسائل المخصصة</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedTemplateTab('all')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            جميع القوالب ({salesTemplates.length})
          </button>
          <button
            onClick={() => setSelectedTemplateTab('restaurants')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'restaurants'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🍔 المطاعم والكافيهات
          </button>
          <button
            onClick={() => setSelectedTemplateTab('printing')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'printing'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🖨️ المطابع والدعاية
          </button>
          <button
            onClick={() => setSelectedTemplateTab('lawyers')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'lawyers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            ⚖️ مكاتب المحاماة
          </button>
          <button
            onClick={() => setSelectedTemplateTab('interior')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'interior'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🎨 الديكور والمقاولات
          </button>
          <button
            onClick={() => setSelectedTemplateTab('bookstores')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'bookstores'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            📚 المكتبات والتجزئة
          </button>
          <button
            onClick={() => setSelectedTemplateTab('followup')}
            className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedTemplateTab === 'followup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            🔄 المتابعة وإحياء الصفقات
          </button>
        </div>

        {/* شبكة بطاقات رسائل الواتساب */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTemplates.map((t) => {
            const finalMessage = t.generateMessage(targetOwnerName, targetBusinessName, activeSender);

            return (
              <div key={t.id} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${t.badgeColor}`}>
                      {t.stageBadge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      النشاط: <strong className="text-white">{t.target}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{t.subject}</h3>

                  {/* نصيحة سر الإقناع النفسي */}
                  <div className="p-3 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>سر الإقناع:</strong> {t.whyItWorks}
                    </p>
                  </div>

                  {/* صندوق نص الرسالة */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                    {finalMessage}
                  </div>
                </div>

                {/* أزرار الإجراء السريع */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => copyToClipboard(t.id, finalMessage)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-700 shadow"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>تم نسخ النص بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ نص الرسالة</span>
                      </>
                    )}
                  </button>

                  <a
                    href={targetPhone ? `https://wa.me/2${targetPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(finalMessage)}` : `https://wa.me/?text=${encodeURIComponent(finalMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-600/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{targetPhone ? 'إرسال للعميل عبر واتساب' : 'مشاركة عبر واتساب'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* مولد عروض الأسعار والبروبوزال الفوري للعملاء (Proposal Generator) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 rounded-3xl border border-indigo-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">مولد عروض الأسعار الرسمية السريعة (Proposal Generator)</h2>
              <span className="text-xs text-slate-400">توليد بروبوزال رسمي فوري باسم Tecnolobia للإرسال المباشر للعميل عبر واتساب</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            جاهز للإرسال في 30 ثانية ⚡
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* مدخلات العرض */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>بيانات العرض والعميل:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">اسم العميل / المسؤول:</label>
                <input
                  type="text"
                  placeholder="مثال: أستاذ محمود..."
                  value={proposalClient}
                  onChange={(e) => setProposalClient(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">اسم المحل / الشركة:</label>
                <input
                  type="text"
                  placeholder="مثال: كافيه الباشا..."
                  value={proposalBusiness}
                  onChange={(e) => setProposalBusiness(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">رقم واتساب العميل:</label>
                <input
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  value={proposalPhone}
                  onChange={(e) => setProposalPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">الخدمة المستهدفة:</label>
                <select
                  value={proposalService}
                  onChange={(e) => setProposalService(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="restaurant_pos">نظام كاشير مطعم/كافيه (POS)</option>
                  <option value="qr_menu">منيو إلكتروني تفاعلي (QR Menu)</option>
                  <option value="print_erp">نظام إدارة مطبعة (Print ERP)</option>
                  <option value="portfolio">موقع بورتفوليو تعريفي (Portfolio)</option>
                  <option value="mobile_app">تطبيق موبايل (Mobile App)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">القيمة الإجمالية (ج.م):</label>
                <input
                  type="number"
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">مدة التنفيذ والتسليم:</label>
                <input
                  type="text"
                  value={proposalTimeline}
                  onChange={(e) => setProposalTimeline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateProposal}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>توليد وتحديث نص العرض الرسمي</span>
            </button>
          </div>

          {/* معاينة العرض وأزرار الإرسال والنسخ */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>معاينة نص العرض (واتساب / بريد):</span>
                </span>
                <span className="text-[10px] text-slate-400">تنسيق متوافق مع WhatsApp Markdown</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto">
                {generatedProposalText || 'اضغط على زر "توليد نص العرض الرسمي" لتظهر لك المعاينة الفورية هنا.'}
              </div>
            </div>

            {generatedProposalText && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => copyToClipboard('proposal-text', generatedProposalText)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all"
                >
                  {copiedId === 'proposal-text' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ العرض</span>
                    </>
                  )}
                </button>

                {proposalPhone && (
                  <a
                    href={`https://wa.me/2${proposalPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generatedProposalText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال عبر واتساب</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* دليل الرد على أشهر اعتراضات العملاء في مصر */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>كيف ترد على أشهر اعتراضات العملاء في السوق المصري؟</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {objectionHandling.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <span className="font-bold text-amber-400 text-sm block">{item.objection}</span>
              <p className="text-slate-300 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
