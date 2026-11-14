import { AiChatMessage, AiMode, MarketOpportunity } from '../types/ai';
import { PartnerId } from '../types/company';
import { ProjectItem } from '../types/projects';
import { AppStorageService } from './storageService';
import { EGYPTIAN_MARKET_OPPORTUNITIES } from '../mock/initialData';

const GEMINI_KEY_STORAGE = 'tecnolobia_gemini_key';

export function getSavedGeminiKey(): string {
  return typeof window !== 'undefined' ? (localStorage.getItem(GEMINI_KEY_STORAGE) || '') : '';
}

export function saveGeminiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  }
}

export interface ProjectAiReviewResult {
  architectureCritique: string;
  microSaasPlan: string;
  regionalExpansion: string;
  immediateActionSteps: string[];
}

export interface HuntedClientLead {
  id: string;
  businessName: string;
  ownerName: string;
  category: string;
  location: string;
  painPoint: string;
  pitchAngle: string;
  suggestedPrice: number;
  whatsAppMessage: string;
}

export interface FacebookPostResult {
  title: string;
  hook: string;
  body: string;
  cta: string;
  imageOrVideoIdea: string;
  hashtags: string[];
}

/**
 * خدمة المدير التنفيذي الذكي لشركة Tecnolobia المدعومة بنماذج Google Gemini
 */
export class AiCeoService {
  
  /**
   * استشارة المدير الذكي في المحادثة المباشرة
   */
  static async consultCeo(
    userMessage: string,
    currentPartner: PartnerId,
    mode: AiMode
  ): Promise<AiChatMessage> {
    const partnerName = currentPartner === 'mohamed' ? 'بشمهندس محمد البحر' : 'بشمهندس طارق حافظ';
    const otherPartnerName = currentPartner === 'mohamed' ? 'بشمهندس طارق' : 'بشمهندس محمد';
    const apiKey = getSavedGeminiKey();

    // تحديث إحصائيات الـ Tokens
    AppStorageService.updateTokenStats(210);

    // إذا وُجد مفتاح Gemini، نتصل مباشرة بنموذج Gemini 2.0 Flash
    if (apiKey) {
      try {
        const responseText = await this.callGeminiRaw(
          apiKey,
          userMessage,
          `أنت الآن المدير التنفيذي الذكي (AI CEO & Business Manager) لشركة البرمجيات المصرية Tecnolobia.
الشركاء المؤسسون: م. محمد البحر (تقني & Full-Stack) وم. طارق حافظ (أعمال & مبيعات)، متساويان تماماً.
تتحدث الآن مع: ${partnerName}. والشريك الآخر هو: ${otherPartnerName}.
الوضع الحالي: وضع ${mode === 'advisor' ? 'المستشار (Advisor Mode)' : 'التنفيذ (Execution Mode)'}.
الأسلوب: مصري ذكي ومحترف، بدون تنظير، مباشر، يبحث عن الكاش السريع وتحويل الأنظمة السابقة (كاشير فريش، مطبعة واجدي، مكتبة مدرسية، منيو QR، بورتفوليو محاماة وديكور) لشركات ومنتجات قوية.
تذكر قاعدة الأرباح الصارمة (25% محمد، 25% طارق، 25% تطوير أدوات، 25% صدقة جارية).`
        );

        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'ai_ceo',
          text: responseText,
          timestamp: new Date().toISOString(),
          mode
        };
      } catch (err: any) {
        console.warn('Gemini 2.0 Flash call failed, falling back to local executive brain:', err);
      }
    }

    // المخ التنفيذي المحلي الفوري كبديل سريع ومجاني
    return this.generateExecutiveResponse(userMessage, partnerName, otherPartnerName, mode, currentPartner);
  }

  /**
   * مراجعة ونقد مشروع برمجي عبر Gemini لتقديم نصائح تقنية وتجارية دقيقة
   */
  static async reviewProjectWithGemini(project: ProjectItem): Promise<ProjectAiReviewResult> {
    const apiKey = getSavedGeminiKey();

    if (apiKey) {
      try {
        const prompt = `قم بمراجعة هذا المشروع البرمجي لشركة Tecnolobia:
- اسم المشروع: ${project.name}
- تصنيف الخدمة: ${project.category}
- التقنيات: ${(project.techStack || []).join(', ') || 'React / Node.js'}
- نبذة العمل: ${project.scopeSummary}
- رابط GitHub: ${project.githubUrl || 'https://github.com/mat992024-collab/TECHNOLOPIA'}

قدم تحليلاً دقيقاً وموجزاً في 4 أجزاء رئيسية:
1. تقييم المعمارية البرمجية وجودة الكود.
2. خطة تحويله إلى Micro-SaaS سحابي باشتراك شهري ثابت (ARR).
3. فرص التوسع والمنافسة في السوق المصري والخليجي (السعودية والإمارات).
4. أهم 3 خطوات تطوير برمجية عاجلة.`;

        const rawText = await this.callGeminiRaw(apiKey, prompt, 'أنت رئيس القطاع التقني وكبير مهندسي البرمجيات في Google وشركات الـ SaaS العالمية.');
        
        return {
          architectureCritique: rawText.slice(0, 400) + '...',
          microSaasPlan: 'إتاحة اشتراك شهري سحابي 600 - 1,200 ج.م مع مزامنة فورية وربط طابعات البلوتوث والفاتورة الإلكترونية.',
          regionalExpansion: 'النظام مهيأ للمنافسة بقوة في مدن السعودية ومصر بعد إضافة دعم الفاتورة الضريبية ZATCA.',
          immediateActionSteps: [
            'عزل الـ Backend وتوفير REST / GraphQL APIs لدعم تطبيقات الموبايل والفروع المتعددة.',
            'إضافة لوحة تحكم مركزية للإدارة (Admin Multi-Tenant Dashboard).',
            'إعداد توثيق Swagger للـ API وتجهيز اختبارات آلية Unit & E2E Tests.'
          ]
        };
      } catch (e) {
        console.warn('Gemini project review failed, using expert fallback:', e);
      }
    }

    // تقرير ذكي محلي جاهز ومبني على أفضل ممارسات SaaS
    return {
      architectureCritique: project.aiReview || `مشروع ${project.name} يتميز بكود عملي وخفيف وسهل النشر الميداني؛ يحتاج فقط لتحويل قاعدة البيانات المحلية إلى بنية سحابية متزامنة (Offline-first PWA).`,
      microSaasPlan: `تحويل نظام ${project.name} إلى نموذج اشتراك شهري (Recurring SaaS) بدلاً من البيع لمرة واحدة، بتكلفة 600 - 900 ج.م شهرياً مع خدمة الصيانة والنسخ الاحتياطي السحابي اليومي.`,
      regionalExpansion: `المنتج يحل مشكلة تشغيلية واقعية في مصر؛ والخطوة القادمة للتوسع العالمي هي تقديم باقة بالدولار/الريال لأصحاب الأنشطة في السعودية والخليج عن بُعد.`,
      immediateActionSteps: [
        'توحيد الـ Tech Stack ودعم العمل دون إنترنت (Offline IndexedDB Sync).',
        'ربط مستودع المشروع برابط GitHub الرسمي لتشغيل المراجعات الآلية.',
        'إضافة داشبورد تقارير يومية لصاحب العمل ترسل ملخص المبيعات تلقائياً على WhatsApp.'
      ]
    };
  }

  /**
   * صياد العملاء الذكي (AI Client Hunter) لتوليد فرص بيع واستهداف محدد
   */
  static async huntClients(niche: string, area: string): Promise<HuntedClientLead[]> {
    const leads: Record<string, HuntedClientLead[]> = {
      restaurant: [
        {
          id: 'lead-1',
          businessName: 'كافيه وكريب الباشا',
          ownerName: 'أ. حسام',
          category: 'مطعم وكافيه سريع',
          location: `${area} - الإسكندرية`,
          painPoint: 'تسريب الكاش في الشيفت المسائي وضياع وقت الجرد اليومي',
          pitchAngle: 'عرض نظام كاشير فريش المدمج مع شاشة لمس سريعة وتقفيل الخزينة في 30 ثانية',
          suggestedPrice: 6500,
          whatsAppMessage: `مساء الخير يا أستاذ حسام، ألف مبروك السمعة الممتازة لـ كافيه وكريب الباشا.
معاك م. محمد البحر من شركة Tecnolobia بالإسكندرية.
طورنا سيستم كاشير مطاعم وفر على أماكن زي مطعم فريش أكتر من 4 ساعات جرد ومنع تسريب الفلوس في الشيفتات تماماً.
جاهز أبعت لحضرتك فيديو 60 ثانية تشوف السيستم عملي على الموبايل بدون أي التزام؟`
        },
        {
          id: 'lead-2',
          businessName: 'برجر فاكتوري',
          ownerName: 'أ. محمود',
          category: 'مطعم برجر وساندوتشات',
          location: `${area} - الإسكندرية`,
          painPoint: 'طوابير الكاشير وبطء طباعة بون المطبخ ومنيو ورقي مكلف يتلف باستمرار',
          pitchAngle: 'منيو باركود QR ذكي + نظام كاشير مطبخ فوري يسرع خروج الطلبات 3 أضعاف',
          suggestedPrice: 7500,
          whatsAppMessage: `أهلاً يا أستاذ محمود، منيو برجر فاكتوري ماشاء الله عليه إقبال ممتاز.
معاك م. طارق حافظ من شركة Tecnolobia.
عارفين إن زحمة أوردرات البرجر محتاجة بون يوصل المطبخ في ثانيتين عشان الزبون ميتأخرش.
سيستم الكاشير والمنيو الباركود بتاعنا شغال لايف وجاهزين نمر نركبلك تجربة مجانية 48 ساعة في المحل. يناسبك نمر بكره؟`
        }
      ],
      print: [
        {
          id: 'lead-3',
          businessName: 'مطبعة الأهرام ديجيتال',
          ownerName: 'أ. وائل',
          category: 'مطبعة ديجيتال ودعاية',
          location: `${area} - الإسكندرية`,
          painPoint: 'هالك تقطيع الورق وتضارب حسابات العملاء الآجل والزنكات',
          pitchAngle: 'نظام إدارة مطابع متخصص يحسب تكلفة الفرخ والزنكات وأوامر الشغل بالمليم',
          suggestedPrice: 14000,
          whatsAppMessage: `السلام عليكم أستاذ وائل، معاك م. طارق حافظ شريك مؤسس في Tecnolobia.
شغالين حالياً مع مطابع كبرى (زي مطبعة واجدي) ومطورين سيستم بيحسب هالك الورق والزنكات والأحبار لكل أمر شغل بالمليم، وكشف حساب فوري لكل عميل.
متاح نمر على حضرتك ربع ساعة في المطبعة نعرضلك السيستم لايف على اللاب توب؟`
        }
      ]
    };

    return leads[niche] || leads.restaurant;
  }

  /**
   * محرك توليد محتوى صفحة الفيسبوك الذاتي لشركة Tecnolobia
   */
  static generateFacebookPost(type: 'case_study' | 'pain_point' | 'reels_script' | 'sponsored_ad'): FacebookPostResult {
    const posts: Record<string, FacebookPostResult> = {
      case_study: {
        title: 'قصة نجاح واقعية: كيف وفر مطعم فريش 4 ساعات جرد يومياً؟',
        hook: '🔥 صاحب المطعم مش المفروض يقضي نص يومه يتخانق مع الكاشير على الدرج والجرد!',
        body: `في مطعم "فريش"، المشكلة ماكنتش في المبيعات، المكان شغال وزحمة.. 
بس آخر كل شيفت كان بيبدأ الصداع:
❌ عجز في الخزينة ومش معروف سببه.
❌ ساعات بتضيع في عد الفلوس وجرد الجبن واللحوم.
❌ صاحب المطعم مش عارف صافي ربحه الحقيقي إلا بعد مجهود شاق.

إحنا في شركة **Tecnolobia** نزلنا المحل وعملنا الآتي:
✅ ركبنا نظام كاشير عربي فائق السرعة، الشيك بيطلع في 3 ثواني.
✅ تقرير خزينة فوري وأرباح كل صنف بتتبعت أوتوماتيك على موبايل صاحب المطعم أول ما الشيفت يقفل.
✅ تنبيه ذكي قبل ما أي خامة في المطبخ تخلص.

النتيجة؟ توفير 4 ساعات جرد يومياً، ومنع تسريب الفلوس بنسبة 100%.`,
        cta: '📩 لو عندك مطعم أو كافيه وحابب تجرب السيستم مجاناً 48 ساعة على جهازك، ابعتلنا رسالة على الصفحة أو تواصل واتساب على رسائل الصفحة وهنرد عليك فوراً!',
        imageOrVideoIdea: 'صورة مقسمة نصين: النص الأول شاشة كاشير فخمة ومريحة، والنص الثاني إشعار على الموبايل بتقرير أرباح اليوم مع كابشن "أرباحك في جيبك لحظة بلحظة".',
        hashtags: ['#تكنولوبيا', '#كاشير_مطاعم', '#إدارة_المطاعم', '#سوفت_وير_مصري', '#Tecnolobia', '#كافيهات_الإسكندرية']
      },
      pain_point: {
        title: 'منشور تفاعلي لأصحاب المطابع ومكاتب الدعاية',
        hook: '⚠️ لو عندك مطبعة، الورق اللي بيترمي في الهالك ده مش زبالة.. دي أرباحك الصافية بتتسرب!',
        body: `معظم أصحاب المطابع في مصر بيسعّر أمر الشغل بالتقريب:
"الفرخ هيكفي كذا تقريباً، والزنكة تكلفتها كذا..."
وفي آخر الشهر يفاجأ إن الشغل كتير بس الفلوس في جيبه مش باينة!

السر؟ إن هالك تقطيع الورق وتقلبات أسعار الأحبار والزنكات بتاكل من 15% لـ 25% من هامش ربحك بدون ما تحس.

برنامج إدارة المطابع من **Tecnolobia** (المجرب في مطابع زي مطبعة واجدي):
1. يحسبلك تقطيع الفرخ وحساب الهالك بالمليم.
2. يحددلك تكلفة أمر الشغل الحقيقية قبل ما تقول للعميل سعرك.
3. يتابع أوامر الشغل المتأخرة وحسابات العملاء الآجل.`,
        cta: '💬 اطلب ديمو لايف مجاني في مطبعتك الآن؛ فريقنا هيمر عليك يعرضلك السيستم شغال على أرض الواقع!',
        imageOrVideoIdea: 'إنفوجرافيك بسيط يوضح: "طريقة الحساب اليدوي vs حساب نظام Tecnolobia الذكي لمكسب أمر الشغل".',
        hashtags: ['#مطابع_مصر', '#دعاية_وإعلان', '#إدارة_المطابع', '#تكنولوبيا_سوفت_وير', '#مطابع_الإسكندرية']
      },
      reels_script: {
        title: 'سكريبت ريلز / فيديو تيك توك وفيسبوك (45 ثانية)',
        hook: '🎬 [المشهد الأول: زوم على كاشير متلخبط وطابور زباين واقفين مخنوقين]',
        body: `🗣️ الفويس أوفر (بلهجة مصرية واثقة وسريعة):
"عارف إيه اللي بيخسّرك زباين المطعم في الويك إند؟ 
مش جودة الأكل.. إن الزبون يقف 10 دقايق مستني حسابه لأن السيستم بطيء أو الكاشير بيتلخبط في المنيو!

[المشهد الثاني: كليك على شاشة كاشير Tecnolobia السريعة، الأوردر بيتسجل في ثانية والبون بيطبع فورا]
بص الحركة دي.. شاشة لمس واضحة، كل الأصناف بضغطة واحدة، ومنيو باركود QR على كل ترابيزة الزبون يطلب منه براحته.
والأهم؟ تقرير مبيعاتك وأرباحك بتجيلك على موبايلك وأنت في بيتك أول ما اليوم يخلص."`,
        cta: '🚀 جرب السيستم 48 ساعة مجاناً في مكانك بدون أي التزام. الرابط في أول تعليق!',
        imageOrVideoIdea: 'تصوير فيديو رأسي بالموبايل يوضح سرعة كاشير Tecnolobia وطباعة البون مع كابشنات ملونة سريعة.',
        hashtags: ['#ريلز_بيزنس', '#مطاعم_مصر', '#سوفت_وير_كاشير', '#Tecnolobia']
      },
      sponsored_ad: {
        title: 'نص إعلان ممول عالي التحويل (Sponsored Ad Copy)',
        hook: '💼 لأصحاب المطاعم، الكافيهات، والمطابع بالإسكندرية والقاهرة: حان وقت التوقف عن الخسائر غير المرئية!',
        body: `مش محتاج تشتري برامج معقدة باشتراكات خيالية عشان تدير شغلك باحترافية.
شركة **Tecnolobia** بتقدملك أنظمة برمجية مبنية مخصوص لحل مشاكل السوق المصري:

⭐ نظام كاشير المطاعم والمنيو الإلكتروني:
- سرعة تسجيل الطلبات ومنع التلاعب بالدرج.
- جرد فوري للمخازن وتنبيه النواقص.
- تقارير أرباح يومية وشهرية على تليفونك.

⭐ نظام إدارة المطابع والدعاية:
- حساب تكلفة أمر الشغل وهالك الورق والزنكات بدقة.
- متابعة المديونيات وحسابات العملاء.

🎁 **عرض خاص للأسبوع الحالي:**
- تركيب وتدريب مجاني لفريق العمل داخل مكانك.
- 30 يوماً دعم فني وصيانة مجانية شاملة.
- إمكانية دفع 50% فقط عند بدء التعاقد و 50% بعد التشغيل والرضا التام.`,
        cta: '📲 اضغط على زر (إرسال رسالة واتساب) الآن لحجز موعد ديمو تجريبي مجاني في مكانك قبل اكتمال حجوزات الأسبوع!',
        imageOrVideoIdea: 'تصميم إعلاني فخم يحمل شعار Tecnolobia وشاشات الأنظمة على لابتوب وموبايل مع شارة "ديمو مجاني 48 ساعة".',
        hashtags: ['#إعلان_ممول', '#برامج_كاشير', '#Tecnolobia_ERP', '#حلول_برمجية']
      }
    };

    return posts[type] || posts.case_study;
  }

  /**
   * دالة الاتصال المباشر بنموذج Google Gemini 2.0 Flash
   */
  private static async callGeminiRaw(apiKey: string, prompt: string, systemInstruction?: string): Promise<string> {
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents: any[] = [];
    if (systemInstruction) {
      contents.push({
        role: 'user',
        parts: [{ text: `تعليمات النظام التوجيهية الأساسية:\n${systemInstruction}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'مفهوم تماماً، أنا جاهز للعمل كمدير تنفيذي ذكي ومستشار تقني لشركة Tecnolobia.' }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!res.ok) {
      // تجربة النموذج البديل gemini-1.5-flash
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
      if (!fallbackRes.ok) {
        throw new Error(`Gemini error: ${res.status}`);
      }
      const data = await fallbackRes.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * المحرك المحلي البديل الفوري
   */
  private static generateExecutiveResponse(
    query: string,
    partnerName: string,
    otherPartnerName: string,
    mode: AiMode,
    partnerId: PartnerId
  ): AiChatMessage {
    const q = query.toLowerCase();

    if (q.includes('دخل سريع') || q.includes('سوق') || q.includes('كاش') || q.includes('خدمات') || q.includes('فرص')) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'ai_ceo',
        text: `أهلاً يا ${partnerName}! بصفتي مديركم التنفيذي، درست سابقة أعمالنا واحتياج السوق المصري حالياً، وخليني أكون صريح ومباشر:
أسرع سكة تحقق لنا سيولة كاش فورية خلال الـ 10 أيام الجاية هي **إعادة تدوير الأنظمة اللي برمجناها بالفعل** وليس بناء شيء من الصفر:

1. **نظام كاشير وإدارة المطاعم الشعبية والكافيهات:** عندنا كود "مطعم فريش" جاهز ومجرب. محلات كتير في الإسكندرية والقاهرة محتاجة حل سريع وبسيط بدون تعقيدات البرامج الكبيرة. نبيعه بـ 10,000 إلى 15,000 جنيه كاش (أو اشتراك شهري 800 ج).
2. **منيو إلكتروني QR تفاعلي:** بياخد يومين شغل بس وربحيته تتجاوز 90%، وسعره مناسب جداً (3,000 - 5,000 ج).
3. **نظام إدارة المطابع ووكالات الدعاية:** قليل جداً اللي فاهم مشاكل هالك الورق ومراحل الطباعة زينا بفضل تجربة "مطبعة واجدي". العميل هنا مستعد يدفع 20,000+ جنيه لأنه بيوفر أضعافها.

**اقتراحي العملي:** إيه رأيك أنت و${otherPartnerName} نخصص يومين هذا الأسبوع لحملة تواصل مباشرة مع 20 مطعم وكافيه في محيطنا؟ أنا مجهز خطة الرسائل وعرض السعر ومستعد أعرضها عليكم.`,
        timestamp: new Date().toISOString(),
        mode,
        isOpportunityCard: true,
        opportunityData: EGYPTIAN_MARKET_OPPORTUNITIES[0]
      };
    }

    return {
      id: `ai-msg-${Date.now()}`,
      sender: 'ai_ceo',
      text: `أهلاً يا ${partnerName}! أنا معاك ومركز في كلامك. كمديركم التنفيذي ومستشاركم الذكي المتصل بـ Gemini، هدفي دايماً إني أوجه طاقتنا أنت و${otherPartnerName} نحو الخطوات العملية:

- مراجعة أي مشروع برمجي وتحويله لـ SaaS باشتراك شهري.
- صيد عملاء جدد في الإسكندرية والقاهرة وتجهيز رسائل الواتساب لهم فوراً.
- توليد منشورات وإعلانات فيسبوك احترافية لجذب العملاء لصفحة الشركة.

قولي إيه الأولوية العاجلة اللي نركز عليها النهاردة؟`,
      timestamp: new Date().toISOString(),
      mode
    };
  }
}
