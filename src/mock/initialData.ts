import { FinancialTransaction, ProfitDistributionCycle, CompanyDevUsage, SadaqahDonationRecord } from '../types/finance';
import { ProjectItem, TaskItem } from '../types/projects';
import { ClientItem } from '../types/crm';
import { PartnerProfile, CompanyMeta } from '../types/company';
import { MarketOpportunity } from '../types/ai';
import { StrategicDecision, CompanyMemoryItem } from '../types/decisions';

export const INITIAL_COMPANY_META: CompanyMeta = {
  name: 'Tecnolobia',
  tagline: 'حلول برمجية ذكية متقدمة لنمو الأعمال',
  foundedDate: '2026-01-01',
  activeGoal: 'تحقيق أول إيراد كاش فعلي من السوق المصري وتأسيس أنظمة الشركة',
  quickCashTarget: 50000,
  currentMonthTarget: 30000
};

export const INITIAL_PARTNERS: PartnerProfile[] = [
  {
    id: 'mohamed',
    name: 'المهندس محمد البحر',
    roleTitle: 'شريك مؤسس ومدير تنفيذي تقني',
    avatarColor: 'from-blue-600 to-indigo-700',
    skills: ['Full-Stack Development', 'React / Next.js', 'Mobile Apps (Android)', 'System Architecture'],
    strengths: ['حل المشكلات البرمجية المعقدة', 'السرعة في بناء النماذج الأولية', 'هندسة قواعد البيانات'],
    learningGoals: ['AI Agents Orchestration', 'البيع المباشر وإغلاق الصفقات'],
    availableHoursPerWeek: 35,
    totalReceivedProfit: 0 // صفر مليم حتى يتم تسجيل استلام فعلي
  },
  {
    id: 'tarek',
    name: 'المهندس طارق حافظ',
    roleTitle: 'شريك مؤسس ومدير تنفيذي للأعمال',
    avatarColor: 'from-emerald-600 to-teal-700',
    skills: ['Software Engineering', 'Business Management', 'Operations & Printing ERP', 'Product Design'],
    strengths: ['إدارة متطلبات العملاء بدقة', 'التخطيط المالي والتشغيلي', 'تصميم واجهات المستخدم العصرية'],
    learningGoals: ['Cloud Infrastructure DevOps', 'حملات التسويق الرقمي B2B'],
    availableHoursPerWeek: 35,
    totalReceivedProfit: 0 // صفر مليم حتى يتم تسجيل استلام فعلي
  }
];

// سابقة أعمال وخبرات الشريكين (بدون اختراع أي مبالغ أو أرباح مالية)
export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'نظام كاشير وإدارة مطعم فريش',
    clientName: 'مطعم فريش (سابقة أعمال)',
    category: 'restaurant_pos',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'نظام كاشير وإدارة لمطعم: طباعة فواتير، تتبع المخزون، وحساب المبيعات.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    liveDemoUrl: 'https://tecnolobia-ceo.web.app',
    techStack: ['React', 'Node.js / Express', 'SQLite / Local Storage', 'Thermal ESC/POS'],
    aiReview: 'نظام عملي جداً ونقطة قوته الأساسية هي سرعة خروج الشيك وسهولة تدريب الكاشير. للتحول لـ Micro-SaaS عالمي، نوصي بإضافة Multi-tenancy سحابي لربط عدة فروع بـ Dashboard مركزية ودعم الفاتورة الإلكترونية المصرية والتكامل مع طابعات البلوتوث اللاسلكية.',
    isQuickCash: true
  },
  {
    id: 'proj-2',
    name: 'نظام إدارة مطبعة واجدي',
    clientName: 'مطبعة واجدي (سابقة أعمال)',
    category: 'print_erp',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'نظام إدارة مطبعة: أوامر الشغل، حساب استهلاك الورق والأحبار، وتكلفة التشغيل.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    liveDemoUrl: 'https://tecnolobia-ceo.web.app',
    techStack: ['TypeScript', 'Cloud Database', 'Tailwind CSS', 'PDF Invoicing'],
    aiReview: 'ميزة حساب هالك الورق هي القيمة التنافسية الأقوى التي لا توفرها البرامج العامة؛ التوصية التقنية القادمة هي إضافة خوارزمية ذكية لاقتراح أفضل طريقة لتقطيع الفرخ لتقليل الهالك تلقائياً (Paper Nesting Optimizer) لرفع جاذبية النظام لمطابع الخليج ومصر.',
    isQuickCash: false
  },
  {
    id: 'proj-3',
    name: 'نظام إدارة مكتبة مدرسية',
    clientName: 'مكتبة مدرسية (سابقة أعمال)',
    category: 'school_pos',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'نظام إدارة مكتبة مدرسية لبيع الكتب والكراسات والأدوات المكتبية.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    liveDemoUrl: 'https://tecnolobia-ceo.web.app',
    techStack: ['React PWA', 'Barcode Scanner API', 'Offline Dexie DB'],
    aiReview: 'أهم ميزة هي السرعة الخارقة في مواسم الامتحانات؛ نوصي بإضافة خاصية إرسال إشعار WhatsApp تلقائي لأولياء الأمور فور توفر الكتب المدرسية الناقصة لزيادة ولاء العملاء وتحويله لمنتج اشتراك سنوي للمكتبات.',
    isQuickCash: true
  },
  {
    id: 'proj-4',
    name: 'تطبيق منطقتنا الخدمي (سكينة بالرمل)',
    clientName: 'سكان سكينة بالرمل (سابقة أعمال)',
    category: 'mobile_app',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'تطبيق أندرويد اجتماعي وخدمي لخدمة سكان سكينة بالرمل.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    techStack: ['Android App', 'Firebase Realtime DB', 'FCM Push Notifications'],
    aiReview: 'مشروع ذو أثر مجتمعي قوي جداً؛ يمكن تحويله لنموذج ربحي دائم (Hyper-local Monetization) عبر إتاحة إعلانات ممولة شهرية للمحلات والعيادات وسائقي التوصيل في المنطقة.',
    isQuickCash: false
  },
  {
    id: 'proj-5',
    name: 'موقع Portfolio لمكتب محاماة',
    clientName: 'مكتب محاماة (سابقة أعمال)',
    category: 'portfolio',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'موقع تعريفي واستشارات قانونية وحجز مواعيد.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    liveDemoUrl: 'https://tecnolobia-ceo.web.app',
    techStack: ['Next.js', 'Tailwind CSS', 'WhatsApp Business Booking'],
    aiReview: 'واجهة رصينة تعزز الهيبة والمصداقية؛ التوصية القادمة لرفع سعر الباقة إلى 15,000+ ج.م هي إضافة بوابة موكلين آمنة (Client Portal) للاطلاع على مواعيد الجلسات ومستندات القضايا أونلاين.',
    isQuickCash: true
  },
  {
    id: 'proj-6',
    name: 'موقع Portfolio لأعمال الجبس والديكورات',
    clientName: 'أعمال ديكور (سابقة أعمال)',
    category: 'portfolio',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'موقع Portfolio لشخص يعمل في مجال الجبس والديكورات.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    techStack: ['React', 'Image CDN', 'Interactive Before/After Slider'],
    aiReview: 'عنصر الإبهار البصري هو مفتاح بيع هذا المشروع لعملاء الفيلات؛ نوصي بإضافة حاسبة تفاعلية لتكلفة تشطيب المتر لجمع بيانات العملاء الجادين (Lead Magnet).',
    isQuickCash: true
  },
  {
    id: 'proj-7',
    name: 'منيو إلكتروني (QR Menu)',
    clientName: 'مطاعم وكافيهات (سابقة أعمال)',
    category: 'qr_menu',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'قوائم طعام إلكترونية تفاعلية للمطاعم والكافيهات.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    liveDemoUrl: 'https://tecnolobia-ceo.web.app',
    techStack: ['React PWA', 'Cloud Firestore', 'Instant QR Engine'],
    aiReview: 'أسرع كاش فوري للشركة بهامش ربح يتجاوز 90%؛ التطوير القادم هو إتاحة زر إرسال الطلب مباشرة لطاولة الكاشير أو مطبخ المطعم عبر WhatsApp أو WebSockets.',
    isQuickCash: true
  },
  {
    id: 'proj-8',
    name: 'نظام متكامل لإدارة المطابع والدعاية والإعلان',
    clientName: 'وكالات إعلان ومطابع (سابقة أعمال)',
    category: 'print_erp',
    status: 'delivered',
    budget: 0,
    directCost: 0,
    expectedProfit: 0,
    collectedAmount: 0,
    leadPartner: 'both',
    startDate: '2026-01-01',
    deliveryDate: '2026-01-01',
    progressPercent: 100,
    scopeSummary: 'نظام متكامل لإدارة المطابع والطباعة والدعاية والإعلان.',
    githubUrl: 'https://github.com/mat992024-collab/TECHNOLOPIA',
    techStack: ['Full-Stack SaaS', 'Multi-user Roles', 'Accounting & Invoicing'],
    aiReview: 'المنتج الأكبر قيمة وقدرة على جلب صفقات ضخمة (High-Ticket)؛ مهيأ للتصدير للسوق السعودي والإماراتي بعد إضافة دعم الفوترة الإلكترونية وضريبة القيمة المضافة.',
    isQuickCash: false
  }
];

// صفر معاملات وهمية - السجل المالي يبدأ نظيفاً 100% لحين إدخال المعاملات الحقيقية
export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];

// صفر دورات أرباح وهمية
export const INITIAL_PROFIT_CYCLES: ProfitDistributionCycle[] = [];

// صفر استخدامات وهمية لصندوق التطوير
export const INITIAL_COMPANY_DEV_USAGES: CompanyDevUsage[] = [];

// صفر تبرعات وهمية
export const INITIAL_SADAQAH_RECORDS: SadaqahDonationRecord[] = [];

// مهام أولية تشغيلية متتابعة ومفصلة بخطوات واضحة للشريكين
export const INITIAL_TASKS: TaskItem[] = [
  // مسار المهام التنفيذي للمهندس محمد البحر (تقني & برمجي)
  {
    id: 'task-m-1',
    order: 1,
    title: 'تجهيز نسخة الديمو التفاعلية لنظام كاشير فريش والمنيو الإلكتروني',
    description: 'تجهيز سورس كود كاشير مطعم فريش السابق ليكون جاهزاً للمعاينة الحية الفورية أمام أصحاب المطاعم على الموبايل واللابتوب.',
    assignedTo: 'mohamed',
    priority: 'urgent',
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '16:00',
    isPrivate: false,
    createdBy: 'mohamed',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'استخراج سورس كود نظام كاشير مطعم فريش وتنظيف أي بيانات تجريبية سابقة', completed: false },
      { id: 's2', text: 'تجهيز قاعدة بيانات تجريبية واقعية تحتوي على أصناف (بيتزا، برجر، مشروبات، إضافات)', completed: false },
      { id: 's3', text: 'التأكد من سلاسة سرعة واجهة الكاشير وطباعة الإيصال التجريبي بصيغة PDF سريعة', completed: false },
      { id: 's4', text: 'توليد رابط معاينة ديمو حي ومشاركته مع م. طارق لتجربته على الموبايل في المقابلات', completed: false }
    ]
  },
  {
    id: 'task-m-2',
    order: 2,
    title: 'توحيد قالب مواقع الهوية الاحترافية (Portfolio) للتسليم في 48 ساعة',
    description: 'إعداد قالب موحد فائق السرعة لمواقع المحامين والأطباء ومهندسي الديكور لتسليم أي تعاقد في يومين فقط.',
    assignedTo: 'mohamed',
    priority: 'high',
    status: 'todo',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    dueTime: '18:00',
    isPrivate: false,
    createdBy: 'mohamed',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'بناء قالب سريع ومتوافق مع الموبايل بالكامل مع معايير SEO عالية', completed: false },
      { id: 's2', text: 'ربط زر واتساب مباشر ونموذج حجز استشارات قانونية أو معاينات ديكور', completed: false },
      { id: 's3', text: 'تجهيز معرض سابقة أعمال مرئي عالي الجودة لعرض المشاريع السابقة', completed: false }
    ]
  },
  {
    id: 'task-m-3',
    order: 3,
    title: 'ربط وتوثيق مستودعات المشروعات السابقة على GitHub وفحص الجودة',
    description: 'رفع ومراجعة كود الأنظمة السابقة وتوثيق الـ Architecture لتمكين Gemini وشات جي بي تي من مراجعتها.',
    assignedTo: 'mohamed',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    dueTime: '15:00',
    isPrivate: false,
    createdBy: 'mohamed',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'ربط مستودعات GitHub الخاصة بالأنظمة السابقة بحساب المنصة', completed: false },
      { id: 's2', text: 'إعداد ملف توثيق تقني يوضح الـ Tech Stack وإمكانيات التحويل إلى SaaS', completed: false },
      { id: 's3', text: 'تأمين مفاتيح الـ API وقواعد البيانات لضمان أعلى معايير الحماية', completed: false }
    ]
  },

  // مسار المهام التنفيذي للمهندس طارق حافظ (أعمال & مبيعات & تشغيل)
  {
    id: 'task-t-1',
    order: 1,
    title: 'حصر قائمة أول 20 عميل محتمل بالإسكندرية والتواصل المباشر',
    description: 'حصر أصحاب الكافيهات والمطاعم والمطابع في محيط سموحة وميامي والرمل ومراسلتهم بمحرك الواتساب الجديد.',
    assignedTo: 'tarek',
    priority: 'urgent',
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '17:00',
    isPrivate: false,
    createdBy: 'tarek',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'حصر 10 كافيهات ومطاعم و5 مطابع في الإسكندرية وتسجيل أرقام المسؤولين في الـ CRM', completed: false },
      { id: 's2', text: 'تخصيص رسائل الواتساب الذكية باسم كل صاحب نشاط وإرسال المدخل الأول المباشر', completed: false },
      { id: 's3', text: 'متابعة الردود وحجز موعدين لمعاينة الديمو لايف مع أصحاب الأماكن', completed: false },
      { id: 's4', text: 'تحديث مراحل العملاء في خط الأنابيب بالـ CRM (تم التواصل / مهتم / موعد معاينة)', completed: false }
    ]
  },
  {
    id: 'task-t-2',
    order: 2,
    title: 'تجهيز اتفاقيات عروض الأسعار والبروبوزال الرسمي (عربون 50%)',
    description: 'استخدام مولد عروض الأسعار لتجهيز بروبوزال رسمي لكل عميل أبدى اهتماماً مع بنود الدفع والضمان.',
    assignedTo: 'tarek',
    priority: 'high',
    status: 'todo',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    dueTime: '19:00',
    isPrivate: false,
    createdBy: 'tarek',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'توليد عرض سعر رسمي مخصص باسم كل عميل يطلب تفاصيل الخدمة والتكلفة', completed: false },
      { id: 's2', text: 'التأكيد على شرط التعاقد: تحصيل 50% مقدماً قبل البدء في التخصيص', completed: false },
      { id: 's3', text: 'شرح ميزة الضمان المجاني والدعم الفني 30 يوماً لإزالة أي تردد لدى العميل', completed: false }
    ]
  },
  {
    id: 'task-t-3',
    order: 3,
    title: 'إطلاق خطة محتوى صفحة الفيسبوك لشركة Tecnolobia وإدارتها آلياً',
    description: 'نشر منشورات قصص النجاح ودراسات الحالة (كاشير فريش وهالك مطبعة واجدي) لجذب عملاء B2B تلقائياً.',
    assignedTo: 'tarek',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    dueTime: '14:00',
    isPrivate: false,
    createdBy: 'tarek',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'نشر دراسة حالة نظام مطعم فريش (كيف وفر 4 ساعات جرد يومياً ومنع تسريب الفلوس)', completed: false },
      { id: 's2', text: 'نشر منشور موجه لأصحاب المطابع عن حل مشكلة هالك تقطيع الورق وحساب تكلفة الزنكات', completed: false },
      { id: 's3', text: 'متابعة رسائل الصفحة وتحويل المهتمين فوراً إلى محادثات واتساب مخصصة', completed: false }
    ]
  }
];

// سجل عملاء حقيقي يبدأ نظيفاً
export const INITIAL_CLIENTS: ClientItem[] = [];

export const EGYPTIAN_MARKET_OPPORTUNITIES: MarketOpportunity[] = [
  {
    id: 'opp-1',
    title: 'نظام كاشير وإدارة الكافيهات والمطاعم الشعبية والسريعة',
    targetAudience: 'المطاعم، الكافيهات، محلات العصير والوجبات السريعة في الإسكندرية والقاهرة',
    demandLevel: 'very_high',
    expectedDeliveryDays: 3,
    priceRange: '8,000 - 18,000 جنيه كاش (أو 600 - 1,200 شهرياً)',
    profitMarginPercent: 85,
    whyFastCash: 'لأنكم بالفعل بنيتم نظام مطعم فريش ولديه كود جاهز ومختبر، ويمكن تخصيصه وتسليمه في أيام قليلة مع تحصيل كاش فوري.',
    requiredSkills: ['تخصيص الواجهة وتوصيل طابعات الإيصالات والبلوتوث', 'تدريب الكاشير']
  },
  {
    id: 'opp-2',
    title: 'قوائم طعام رقمية تفاعلية (QR Code Menu) مع لوحة تحكم فورية',
    targetAudience: 'الكافيهات الحديثة، مطاعم البرجر والبيتزا، صالات البلياردو والـ PlayStation',
    demandLevel: 'very_high',
    expectedDeliveryDays: 2,
    priceRange: '3,500 - 6,000 جنيه (أو اشتراك 300 جنيه شهرياً)',
    profitMarginPercent: 92,
    whyFastCash: 'أسرع كاش تدفق ممكن: وقت التطوير منعدم تقريباً عند تجهيز قالب ديناميكي، والعميل يدفع مقدماً 50% فورا.',
    requiredSkills: ['تصميم جذاب للموبايل', 'سرعة التحميل']
  },
  {
    id: 'opp-3',
    title: 'نظام إدارة المطابع وشركات الدعاية والإعلان (Mini ERP)',
    targetAudience: 'مطابع الديجيتال، مكاتب الدعاية، ورش تصنيع البنرات والاستيكر',
    demandLevel: 'high',
    expectedDeliveryDays: 7,
    priceRange: '15,000 - 28,000 جنيه',
    profitMarginPercent: 80,
    whyFastCash: 'الخبرة الاستثنائية التي اكتسبتموها في مطبعة واجدي تعطيكم مصداقية فورية لدى أصحاب المطابع لأنكم تتحدثون لغتهم ومشاكلهم.',
    requiredSkills: ['إدارة حسابات الورق والخامات', 'تقارير أرباح أوامر الشغل']
  },
  {
    id: 'opp-4',
    title: 'مواقع الهوية التعريفية (Portfolio) للمحامين والأطباء ومهندسي الديكور',
    targetAudience: 'مكاتب المحاماة، مهندسي الديكور والمقاولات (مثل مشروع الجبس السابق)، العيادات',
    demandLevel: 'high',
    expectedDeliveryDays: 4,
    priceRange: '5,000 - 9,000 جنيه',
    profitMarginPercent: 88,
    whyFastCash: 'العميل المهني يحتاج واجهة سريعة لمشاركة سابقة أعماله عبر واتساب ولينكد إن مع العملاء لزيادة الثقة.',
    requiredSkills: ['UI/UX راقي وسرعة SEO', 'ربط نموذج واتساب مباشر']
  }
];

export const INITIAL_STRATEGIC_DECISIONS: StrategicDecision[] = [
  {
    id: 'dec-1',
    title: 'اعتماد ميثاق الشراكة المتساوية ونظام توزيع الأرباح الرباعي (25% × 4)',
    description: 'توزيع صافي الأرباح المحصلة بنسب متساوية 25% م. محمد البحر، 25% م. طارق حافظ، 25% صندوق تطوير الشركة، 25% صدقة جارية لوجه الله مع اشتراط الموافقة الصريحة المزدوجة.',
    category: 'policy',
    proposedBy: 'mohamed',
    impactSummary: 'حوكمة مالية عادلة ومستدامة وتكافؤ تام في الإدارة والأرباح',
    status: 'approved',
    mohamedApproved: true,
    mohamedApprovedAt: '2026-01-01T00:00:00Z',
    tarekApproved: true,
    tarekApprovedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'dec-2',
    title: 'اعتماد استراتيجية باقات الكاش السريع في السوق المصري',
    description: 'التركيز خلال أول 90 يوماً على بيع باقات الكاشير والمنيو الإلكتروني، نظام المطابع، ومواقع البورتفوليو لتحقيق سيولة سريعة دون انتظار عقود طويلة الأجل.',
    category: 'pricing',
    proposedBy: 'tarek',
    impactSummary: 'استهداف تحقيق أول 50,000 ج.م كاش وتدفق نقدي منتظم',
    status: 'approved',
    mohamedApproved: true,
    mohamedApprovedAt: '2026-01-02T00:00:00Z',
    tarekApproved: true,
    tarekApprovedAt: '2026-01-02T00:00:00Z',
    createdAt: '2026-01-02T00:00:00Z'
  },
  {
    id: 'dec-3',
    title: 'حوكمة الصرف من صندوق التطوير: موافقة مسبقة لأي مصروف فوق 1,000 ج.م',
    description: 'أي اشتراك في أدوات برمجية أو سيرفرات أو معدات تتجاوز تكلفتها 1,000 ج.م يجب أن تحظى بموافقة خطية صريحة من الشريكين قبل السحب من الصندوق.',
    category: 'dev_fund',
    proposedBy: 'mohamed',
    impactSummary: 'حماية أموال الشركة ومنع الهدر في أدوات غير ضرورية',
    status: 'approved',
    mohamedApproved: true,
    mohamedApprovedAt: '2026-01-03T00:00:00Z',
    tarekApproved: true,
    tarekApprovedAt: '2026-01-03T00:00:00Z',
    createdAt: '2026-01-03T00:00:00Z'
  }
];

export const INITIAL_COMPANY_MEMORIES: CompanyMemoryItem[] = [
  {
    id: 'mem-1',
    topic: 'سياسة التحصيل الإجباري في السوق المصري',
    category: 'pricing',
    content: 'لا يبدأ أي عمل برمجي أو تسليم كود إلا بعد تحصيل 50% دفعة مقدمة رسمية، والـ 50% المتبقية تسلم فور التشغيل والتدريب وقبل تسليم الصلاحيات الإدارية الكاملة.',
    source: 'اتفاق الشريكين المالي',
    addedBy: 'tarek',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'mem-2',
    topic: 'درس مستفاد من مشروع مطبعة واجدي',
    category: 'lesson_learned',
    content: 'أصحاب المطابع يعانون جداً من هالك الورق وتقلب أسعار الأحبار والزنكات؛ لذلك إبراز خاصية "حساب تكلفة أمر الشغل الصافي" هي العامل الأساسي لإغلاق الصفقة فوراً.',
    source: 'سابقة أعمال مطبعة واجدي',
    addedBy: 'mohamed',
    createdAt: '2026-01-02T00:00:00Z'
  },
  {
    id: 'mem-3',
    topic: 'معيار السرعة لمواقع البورتفوليو للمحامين والديكور',
    category: 'technical',
    content: 'العميل المهني (محامي أو مهندس) يهمه المظهر الفخم وسرعة التحميل وزر الواتساب السريع. يجب تسليم المسودة خلال 48 ساعة لكسب ثقته وجلب ترشيحات جديدة.',
    source: 'سابقة أعمال مكتب المحاماة ومقاولات الجبس',
    addedBy: 'mohamed',
    createdAt: '2026-01-03T00:00:00Z'
  }
];
