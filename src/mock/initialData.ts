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

// مهام أولية لتأسيس العمل
export const INITIAL_TASKS: TaskItem[] = [];

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
