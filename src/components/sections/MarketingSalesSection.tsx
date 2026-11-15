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
  Smartphone,
  Target,
  Share,
  Video,
  Award,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { EGYPTIAN_MARKET_OPPORTUNITIES } from '../../mock/initialData';
import { AiCeoService, HuntedClientLead, FacebookPostResult } from '../../services/aiCeoService';

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const MarketingSalesSection: React.FC = () => {
  // التبويب الرئيسي للقسم
  const [activeTab, setActiveTab] = useState<'direct_sales' | 'client_hunter' | 'facebook_engine'>('client_hunter');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ==========================================
  // حالات صياد العملاء الذكي (AI Client Hunter)
  // ==========================================
  const [hunterNiche, setHunterNiche] = useState<string>('restaurant');
  const [hunterArea, setHunterArea] = useState<string>('سموحة');
  const [isHunting, setIsHunting] = useState<boolean>(false);
  const [huntedLeads, setHuntedLeads] = useState<HuntedClientLead[]>([
    {
      id: 'lead-fresh-scale',
      businessName: 'كافيه وبرجر كينجستون',
      ownerName: 'أ. سامح علام',
      category: 'مطاعم وبرجر سريع',
      location: 'سموحة - الإسكندرية',
      painPoint: 'عجز الدرج في نهاية كل شيفت وتأخير خروج بون المطبخ وقت الزحمة',
      pitchAngle: 'عرض نظام كاشير فريش المدمج مع تقفيل الخزينة في 30 ثانية وبون فوري للمطبخ',
      suggestedPrice: 7500,
      whatsAppMessage: `مساء الخير يا أستاذ سامح، ألف مبروك السمعة الممتازة لـ برجر كينجستون، المحل ماشاء الله عامل صدى محترم في سموحة.
معاك م. محمد البحر شريك مؤسس بشركة Tecnolobia للأنظمة الرقمية بالإسكندرية.

طورنا نظام كاشير مطاعم مخصص (شغال بالفعل في مطاعم زي "مطعم فريش"):
1. تقفيل الخزينة وتصفية أرباح الشيفت بضغطة زر وتوصل على تليفونك لحظياً.
2. بون المطبخ بيطبع في ثانيتين فقط عشان تمنع أي طابور أو تأخير للزبائن.
3. منيو باركود تفاعلي بالـ QR سريع جداً يفتح على موبايل الزبون بدون تحميل.

جاهز أبعت لحضرتك فيديو 60 ثانية تشوف السيستم عملي على اللاب توب، أو نمر نركبلك تجربة مجانية 48 ساعة في المحل بنفسك.
تحب أبعتلك الفيديو التوضيحي هنا على الواتساب؟`
    },
    {
      id: 'lead-print-scale',
      businessName: 'مطبعة الأندلس للدعاية والطباعة',
      ownerName: 'أ. وائل المهدي',
      category: 'مطابع ووكالات إعلان',
      location: 'محطة الرمل - الإسكندرية',
      painPoint: 'هالك الورق غير المحسوب وضياع مديونيات العملاء الآجلة بين الدفاتر',
      pitchAngle: 'نظام إدارة المطابع المأخوذ من مطبعة واجدي لحساب هالك الفرخ والزنكات بالمليم',
      suggestedPrice: 15000,
      whatsAppMessage: `السلام عليكم أستاذ وائل، يا رب تكون بخير وبأحسن حال.
معاك م. طارق حافظ شريك مؤسس في شركة Tecnolobia لأنظمة الإدارة السحابية.

شغالين حالياً مع مطابع كبرى بالإسكندرية (زي مطبعة واجدي)، وبنحل أكبر 3 مشاكل بتاكل أرباح المطبعة:
1. هالك تقطيع الورق والفرخ اللي بيضيع ومحدش بيحسبه بدقة في سعر أمر الشغل.
2. حسابات العملاء والمناديب الآجلة اللي بتضيع بين الدفاتر.
3. تتبع أوامر الشغل ومراحل الطباعة والتشطيب بالباركود لمنع أي تأخير.

متاح نمر على حضرتك ربع ساعة في المطبعة بمحطة الرمل نعرض لحضرتك السيستم لايف على اللاب توب وتشوفه بنفسك بدون أي التزام مالي.
يناسب حضرتك نحدد معاد سريع بكره أو بعده؟`
    },
    {
      id: 'lead-law-scale',
      businessName: 'مكتب الدكتور فاروق للاستشارات القانونية',
      ownerName: 'المستشار فاروق الديب',
      category: 'مكاتب محاماة واستشارات',
      location: 'ميامي - الإسكندرية',
      painPoint: 'غياب واجهة رقمية راقية تليق بهيبة المكتب وصعوبة أرشفة قضايا الموكلين',
      pitchAngle: 'بورتفوليو رقمي قانوني فاخر مع نظام حجز استشارات إلكتروني مدفوع',
      suggestedPrice: 9000,
      whatsAppMessage: `سيادة المستشار فاروق الديب، تحية تقدير واحترام لشخصكم الكريم ومكانتكم الموقرة بمحافظة الإسكندرية.
معكم م. محمد البحر، الشريك المؤسس لشركة Tecnolobia للحلول البرمجية الفاخرة.

يشرفنا عرض تصميم منصة وموقع تعريفي خاص بمكتب سيادتكم:
- يعكس الهيبة والوقار القانوني ويستعرض مجالات الترافع وسوابق الأحكام القضائية بصورة احترافية.
- يتضمن نظاماً مؤمناً لحجز مواعيد الاستشارات القانونية واستلام مستندات الموكلين بسرية تامة.
- متوافق ومصمم للعرض السلس على كافة شاشات الهواتف الذكية مع دومين وهوية رسمية مخصصة.

يسعدنا إرسال نموذج حي لمعاينة التصميم في دقيقة واحدة، آملين أن يكون بداية لتعاون مثمر.
وتفضلوا بقبول فائق الاحترام والتقدير.`
    }
  ]);

  const handleHuntClients = async () => {
    setIsHunting(true);
    try {
      const results = await AiCeoService.huntClients(hunterNiche, hunterArea);
      setHuntedLeads(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHunting(false);
    }
  };

  // ==========================================
  // حالات مطور صفحة الفيسبوك الذاتي
  // ==========================================
  const [fbPostType, setFbPostType] = useState<'case_study' | 'pain_point' | 'reels_script' | 'sponsored_ad'>('case_study');
  const [currentFbPost, setCurrentFbPost] = useState<FacebookPostResult>(AiCeoService.generateFacebookPost('case_study'));

  const handleSelectFbPostType = (type: 'case_study' | 'pain_point' | 'reels_script' | 'sponsored_ad') => {
    setFbPostType(type);
    setCurrentFbPost(AiCeoService.generateFacebookPost(type));
  };

  // ==========================================
  // حالات مولد عروض الأسعار السريعة (المبيعات)
  // ==========================================
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
      
      {/* رأس القسم مع تبويبات الأدوات الثلاث */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Megaphone className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">مركز التسويق والمبيعات وصيد العملاء</h1>
              <p className="text-xs text-slate-300 mt-1">
                محرك ذكي شامل لصيد العملاء في مصر، إدارة وتطوير صفحة الفيسبوك، ورسائل البيع المباشر على واتساب.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold self-start md:self-auto">
            <Zap className="w-4 h-4" />
            <span>محرك جلب كاش فوري للشركة</span>
          </div>
        </div>

        {/* تنبيه التمييز المؤسسي بين نماذج المحاكاة والعملاء الحقيقيين */}
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>نماذج تدريبية ومحاكاة استرشادية:</strong> النماذج المعروضة في هذا القسم مخصصة لتجهيز الحملات وصياغة الرسائل. لإدارة ومتابعة العملاء الفعليين المعتمدين، يرجى الانتقال إلى <strong>قسم إدارة علاقات العملاء (CRM Engine)</strong>.
            </span>
          </div>
        </div>

        {/* التبويبات التفاعلية الثلاثة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('client_hunter')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'client_hunter'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>صياد العملاء الذكي (AI Hunter)</span>
          </button>

          <button
            onClick={() => setActiveTab('facebook_engine')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'facebook_engine'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FacebookIcon className="w-4 h-4" />
            <span>مطور صفحة الفيسبوك الذاتي</span>
          </button>

          <button
            onClick={() => setActiveTab('direct_sales')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'direct_sales'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>رسائل الواتساب وعروض الأسعار</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* التبويب 1: صياد العملاء الذكي (AI Client Hunter) */}
      {/* ========================================================= */}
      {activeTab === 'client_hunter' && (
        <div className="space-y-6">
          {/* لوحة تحكم الاستهداف والتوليد */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Target className="w-5 h-5" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    صياد العملاء والمطاعم والمطابع (AI B2B Lead Generator)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  اختر قطاع النشاط والمنطقة وسيقوم الذكاء الاصطناعي بتحديد المشاكل التشغيلية الدقيقة وتجهيز رسالة واتساب مفصلة لكل عميل!
                </p>
              </div>

              <button
                onClick={handleHuntClients}
                disabled={isHunting}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isHunting ? 'جاري اصطياد العملاء...' : 'اصطياد فرص جديدة بالذكاء الاصطناعي'}</span>
              </button>
            </div>

            {/* محددات القطاع والمنطقة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1.5">القطاع المستهدف (Niche):</label>
                <select
                  value={hunterNiche}
                  onChange={(e) => setHunterNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="restaurant">مطاعم وكافيهات وبرجر (نظام كاشير فريش)</option>
                  <option value="print">مطابع ووكالات دعاية (نظام مطبعة واجدي)</option>
                  <option value="lawyer">مكاتب محاماة ومستشارين (بورتفوليو محاماة وحجز)</option>
                  <option value="decor">شركات ديكور وتشطيب وجبس (معارض أعمال تفاعلية)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1.5">المنطقة الجغرافية المستهدفة:</label>
                <select
                  value={hunterArea}
                  onChange={(e) => setHunterArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="سموحة">سموحة - الإسكندرية</option>
                  <option value="ميامي وسيدي بشر">ميامي وسيدي بشر - الإسكندرية</option>
                  <option value="محطة الرمل والمنشية">محطة الرمل والمنشية - الإسكندرية</option>
                  <option value="لوران وجليم ورشدي">لوران وجليم ورشدي - الإسكندرية</option>
                  <option value="المعادي">المعادي - القاهرة</option>
                  <option value="التجمع الخامس">التجمع الخامس - القاهرة الجديدة</option>
                  <option value="الشيخ زايد">الشيخ زايد وأكتوبر</option>
                </select>
              </div>
            </div>
          </div>

          {/* قائمة الفرص المصطادة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>العملاء المستهدفون المكتشفون:</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold">
                  {huntedLeads.length} عملاء
                </span>
              </span>
              <span className="text-slate-400 text-[11px]">رسائل مجهزة بمداخل إقناع واقعية مبنية على مشاريعنا السابقة</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {huntedLeads.map((lead) => (
                <div key={lead.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{lead.businessName}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          المسؤول: <span className="text-slate-200 font-semibold">{lead.ownerName}</span> • {lead.location}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold font-mono shrink-0">
                        {lead.suggestedPrice.toLocaleString()} ج.م
                      </span>
                    </div>

                    {/* نقطة الألم ومدخل الإقناع */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div>
                        <span className="text-rose-400 font-bold block mb-0.5">⚠️ الوجع التشغيلي الحاد:</span>
                        <p className="text-slate-300 leading-relaxed">{lead.painPoint}</p>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/80">
                        <span className="text-indigo-400 font-bold block mb-0.5">💡 زاوية الإقناع التكنولوبية:</span>
                        <p className="text-slate-300 leading-relaxed">{lead.pitchAngle}</p>
                      </div>
                    </div>

                    {/* نص رسالة الواتساب المجهزة */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 block">نص رسالة الواتساب المخصصة (جاهزة للإرسال):</span>
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {lead.whatsAppMessage}
                      </div>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => copyToClipboard(lead.id, lead.whatsAppMessage)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      {copiedId === lead.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرسالة</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(lead.whatsAppMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>فتح واتساب والإرسال</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* التبويب 2: مطور صفحة الفيسبوك الذاتي (Facebook Growth Engine) */}
      {/* ========================================================= */}
      {activeTab === 'facebook_engine' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <FacebookIcon className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    مطور ومغذي صفحة فيسبوك Tecnolobia الذاتي
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    توليد محتوى احترافي يبرز مشروعاتنا الواقعية (فريش، واجدي) ويجلب عملاء جاهزين للشراء بدون الحاجة لإنفاق مبالغ ضخمة.
                  </p>
                </div>
              </div>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start md:self-auto"
              >
                <span>الانتقال لصفحة الفيسبوك</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* محدد نوع المحتوى */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button
                onClick={() => handleSelectFbPostType('case_study')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  fbPostType === 'case_study'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⭐ قصة نجاح فريش
              </button>

              <button
                onClick={() => handleSelectFbPostType('pain_point')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  fbPostType === 'pain_point'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⚠️ لمس ألم المطابع
              </button>

              <button
                onClick={() => handleSelectFbPostType('reels_script')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  fbPostType === 'reels_script'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🎬 سكريبت ريلز 45 ثانية
              </button>

              <button
                onClick={() => handleSelectFbPostType('sponsored_ad')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  fbPostType === 'sponsored_ad'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🎯 إعلان ممول عالي التحويل
              </button>
            </div>
          </div>

          {/* بطاقة المنشور المولد ومعاينته الفورية */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 block mb-1">
                  {fbPostType === 'case_study' && 'منشور بناء الثقة والمصداقية (Social Proof)'}
                  {fbPostType === 'pain_point' && 'منشور استهداف الوجع والاعتراضات (Pain Solver)'}
                  {fbPostType === 'reels_script' && 'سكريبت فيديو رأسي قصير سريع الانتشار (Viral Reels)'}
                  {fbPostType === 'sponsored_ad' && 'نص حملة إعلانية ممولة لجلب رسائل واتساب (Direct Sales Ad)'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{currentFbPost.title}</h3>
              </div>

              <button
                onClick={() => copyToClipboard('fb-post', `${currentFbPost.hook}\n\n${currentFbPost.body}\n\n${currentFbPost.cta}\n\n${currentFbPost.hashtags.join(' ')}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
              >
                {copiedId === 'fb-post' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>تم نسخ المنشور بالكامل!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ المنشور للنشر</span>
                  </>
                )}
              </button>
            </div>

            {/* خطاف المنشور (Hook) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 block">الخطاف الأول (Hook - أول ما تقع عليه عين القارئ لمنع التخطي):</span>
              <p className="text-white text-xs sm:text-sm font-bold leading-relaxed">{currentFbPost.hook}</p>
            </div>

            {/* متن المنشور (Post Body) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">نص المنشور الكامل (Post Copy):</span>
              <p className="text-slate-200 text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                {currentFbPost.body}
              </p>
            </div>

            {/* الدعوة لاتخاذ إجراء (Call to Action) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 block">الدعوة للتواصل وحجز الديمو (CTA):</span>
              <p className="text-slate-200 text-xs sm:text-sm font-bold leading-relaxed">{currentFbPost.cta}</p>
            </div>

            {/* فكرة الصورة أو الفيديو المقترحة */}
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950/30 p-4 rounded-2xl border border-indigo-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>فكرة التصميم أو الفيديو المقترح إرفاقه بالمنشور:</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{currentFbPost.imageOrVideoIdea}</p>
            </div>

            {/* الهاشتاجات */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-400 font-bold">الهاشتاجات المقترحة:</span>
              {currentFbPost.hashtags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-950 text-indigo-400 rounded-lg text-xs font-mono border border-slate-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* التبويب 3: رسائل البيع المباشر وعروض الأسعار (الوضع الحالي) */}
      {/* ========================================================= */}
      {activeTab === 'direct_sales' && (
        <div className="space-y-6">
          {/* شريط التخصيص التلقائي لرسائل الواتساب */}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم صاحب النشاط (مثال: أ. أحمد):</label>
                <input
                  type="text"
                  value={targetOwnerName}
                  onChange={(e) => setTargetOwnerName(e.target.value)}
                  placeholder="أحمد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المحل / الشركة (مثال: برجر هاوس):</label>
                <input
                  type="text"
                  value={targetBusinessName}
                  onChange={(e) => setTargetBusinessName(e.target.value)}
                  placeholder="المحل"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم واتساب العميل (اختياري للإرسال المباشر):</label>
                <input
                  type="tel"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-left"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">مرسل الرسالة (التوقيع):</label>
                <select
                  value={activeSender}
                  onChange={(e) => setActiveSender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="م. محمد البحر">م. محمد البحر (شريك تقني)</option>
                  <option value="م. طارق حافظ">م. طارق حافظ (شريك تنفيذي)</option>
                </select>
              </div>
            </div>
          </div>

          {/* تصنيفات رسائل الواتساب */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <button
              onClick={() => setSelectedTemplateTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${selectedTemplateTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              جميع الصيغ ({salesTemplates.length})
            </button>
            <button
              onClick={() => setSelectedTemplateTab('restaurants')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${selectedTemplateTab === 'restaurants' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              المطاعم والكافيهات 🍔
            </button>
            <button
              onClick={() => setSelectedTemplateTab('printing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${selectedTemplateTab === 'printing' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              المطابع والدعاية 🖨️
            </button>
            <button
              onClick={() => setSelectedTemplateTab('followup')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${selectedTemplateTab === 'followup' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              متابعات وإغلاق صفقات 🤝
            </button>
          </div>

          {/* شبكة رسائل الواتساب الجاهزة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTemplates.map((tmpl) => {
              const fullMsg = tmpl.generateMessage(targetOwnerName, targetBusinessName, activeSender);
              return (
                <div key={tmpl.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tmpl.badgeColor}`}>
                        {tmpl.stageBadge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">WhatsApp Script</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm leading-snug">{tmpl.subject}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">الهدف: {tmpl.target}</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {fullMsg}
                    </div>

                    <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      💡 <strong>سر القوة:</strong> {tmpl.whyItWorks}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => copyToClipboard(tmpl.id, fullMsg)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      {copiedId === tmpl.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم النسخ بنجاح!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرسالة</span>
                        </>
                      )}
                    </button>

                    {targetPhone ? (
                      <a
                        href={`https://wa.me/2${targetPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(fullMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>إرسال واتساب مباشر</span>
                      </a>
                    ) : (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(fullMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                        title="مشاركة الرسالة عبر واتساب"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مشاركة بواتساب</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* مولد عروض الأسعار السريعة */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">مولد عروض الأسعار الرسمية السريعة (Instant Proposal)</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  تجهيز بروبوزال رسمي ومنسق بخطة دفع 50% مقدم و 50% استلام لإرساله للعميل على واتساب في أقل من دقيقة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">اسم العميل:</label>
                    <input
                      type="text"
                      placeholder="أ. هاني شكري"
                      value={proposalClient}
                      onChange={(e) => setProposalClient(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">اسم المحل / الشركة:</label>
                    <input
                      type="text"
                      placeholder="كافيه ومطعم رويال"
                      value={proposalBusiness}
                      onChange={(e) => setProposalBusiness(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">الخدمة المطلوبة:</label>
                    <select
                      value={proposalService}
                      onChange={(e) => setProposalService(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="restaurant_pos">نظام كاشير مطاعم وكافيهات (POS)</option>
                      <option value="qr_menu">منيو إلكتروني بالباركود (QR Menu)</option>
                      <option value="print_erp">نظام إدارة مطابع ودعاية (Print ERP)</option>
                      <option value="portfolio">موقع تعريفي وبورتفوليو احترافي</option>
                      <option value="mobile_app">تطبيق أندرويد تجاري مخصص</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">القيمة الإجمالية (ج.م):</label>
                    <input
                      type="number"
                      value={proposalPrice || ''}
                      onChange={(e) => setProposalPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">مدة التسليم والتشغيل:</label>
                    <input
                      type="text"
                      value={proposalTimeline}
                      onChange={(e) => setProposalTimeline(e.target.value)}
                      placeholder="3 أيام عمل"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رقم هاتف العميل (اختياري):</label>
                    <input
                      type="tel"
                      value={proposalPhone}
                      onChange={(e) => setProposalPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-left focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateProposal}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>توليد نص العرض الرسمي الآن</span>
                </button>
              </div>

              {/* معاينة العرض */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>معاينة العرض الرسمي</span>
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
      )}

    </div>
  );
};
