// server/services/aiSalesAgent.mjs
import { GeminiAgent } from '../geminiAgent.mjs';
import { CrmLeadStore } from '../data/crmLeadStore.mjs';
import { AuditLogger } from './auditLogger.mjs';

/**
 * وكيل المبيعات الذكي لشركة TECHNOLOPIA (AI Sales & Pitch Agent)
 * يعتمد على محفظة منتجات وسوابق أعمال الشركة الحقيقية ويولد عروضاً استرشادية منضبطة
 */
export class AiSalesAgent {

  /**
   * توليد استراتيجية المبيعات والرسالة التسويقية وعرض السعر الاسترشادي
   */
  static async generateLeadStrategy(lead, partner) {
    const { id, businessName, industry, softwareNeed, dealValueEstimate, contactInfo, notes } = lead;

    const activeModel = GeminiAgent.getActiveModel();
    const prompt = `أنت رئيس قطاع تطوير الأعمال ومستشار المبيعات الذكي (VP of Sales & Growth) لشركة البرمجيات المصرية TECHNOLOPIA.
الشركاء المؤسسون: م. محمد البحر (المدير التقني) وم. طارق حافظ (مدير الأعمال والمبيعات).

سوابق أعمال TECHNOLOPIA البرمجية الحقيقية المتاحة للبيع والاشتراك:
1. نظام "كاشير فريش المدمج" لمطاعم البرجر والكافيهات (تقفيل شيفتات، طباعة بون المطبخ في ثانيتين، ومنيو باركود QR تفاعلي).
2. نظام "مطبعة واجدي" لوكالات الدعاية والمطابع (حساب مقاسات الورق والفرخ، تتبع مديونيات العملاء، وإدارة ماكينات الطباعة).
3. نظام "تكامل الفوترة الإلكترونية ZATCA Phase 2" للشركات والمنشآت بالسوق الخليجي.
4. نظام "مكتبة مدرسية" الذكي للمدارس والأكاديميات لإدارة إعارة الكتب والطلاب بالباركود.
5. منصات الويب والمتاجر وتطبيقات الهاتف المخصصة (Custom Micro-SaaS & Full-Stack Apps).

بيانات العميل المحتمل:
- اسم المنشأة / العميل: ${businessName}
- مجال النشاط: ${industry}
- الاحتياج البرمجي المطلوب: ${softwareNeed}
- الميزانية أو القيمة التقديرية: ${dealValueEstimate ? `${dealValueEstimate} ج.م` : 'غير محددة'}
- الشخص المسؤول: ${contactInfo?.contactPerson || 'المدير المسؤول'}
- المدينة: ${contactInfo?.city || 'الإسكندرية'}
- ملاحظات الشركاء السابقة: ${(notes || []).join(' | ') || 'لا توجد ملاحظات سابقة'}

التعليمات الصارمة:
1. لا تخترع أسعاراً وهمية أو تخفيضات غير معتمدة أو ضمانات غير حقيقية على الإطلاق.
2. اكتب رسالة تسويقية محترمة باللهجة المصرية الراقية والعملية (Business Casual) تناسب إرسالها على واتساب من الشريك (${partner.name}).
3. قدم نصيحة تفاوض ذكية للشريك لسرعة إغلاق الصفقة (Closing Deal).
4. حدد نطاق سعر استرشادي يتناسب مع متوسط أسعار السوق المصري مع التوضيح التام بأنه غير ملزم ويتطلب اعتماد الشريكين.

المطلوب إخراج النتيجة بتنسيق JSON حصرياً بالشكل التالي:
{
  "needsAnalysis": "تحليل دقيق لاحتياج العميل ونقاط الألم التشغيلية لديه",
  "recommendedService": "اسم النظام المناسب من أنظمة تكنولوبيا",
  "indicativePriceMin": 6000,
  "indicativePriceMax": 10000,
  "pricingNote": "تقدير استرشادي غير ملزم يتطلب موافقة الشريكين قبل تقديمه للعميل",
  "marketingPitchMessage": "نص الرسالة التسويقية بالعامية المصرية الراقية الموجهة للعميل",
  "negotiationTactics": "نصائح تفاوض محددة لمهندس المبيعات لإتمام التعاقد",
  "closeProbabilityEstimate": 75,
  "probabilityReasoning": "أسباب تقدير هذه النسبة"
}`;

    let strategyResult;

    if (GeminiAgent.getApiKey()) {
      try {
        const generation = await GeminiAgent.generateContent(prompt, {
          model: activeModel,
          partnerId: partner.id,
          temperature: 0.2
        });

        // محاولة استخراج JSON من رد النموذج
        const cleanedText = generation.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        strategyResult = {
          needsAnalysis: parsed.needsAnalysis || `يحتاج العميل (${businessName}) إلى أتمتة عملياته عبر ${softwareNeed}.`,
          recommendedService: parsed.recommendedService || this.#inferServiceFromNeed(softwareNeed, industry),
          indicativePriceMin: Number(parsed.indicativePriceMin) || (dealValueEstimate ? Math.round(dealValueEstimate * 0.8) : 5000),
          indicativePriceMax: Number(parsed.indicativePriceMax) || (dealValueEstimate ? Math.round(dealValueEstimate * 1.2) : 10000),
          pricingNote: 'تقدير استرشادي غير ملزم يتطلب موافقة الشريكين قبل تقديمه للعميل.',
          marketingPitchMessage: parsed.marketingPitchMessage || this.#generateFallbackPitch(lead, partner),
          negotiationTactics: parsed.negotiationTactics || 'التركيز على سرعة التشغيل وعرض ديمو عملي مباشر بدون التزام.',
          closeProbabilityEstimate: Number(parsed.closeProbabilityEstimate) || 70,
          probabilityReasoning: parsed.probabilityReasoning || 'مبني على وضوح الاحتياج وتوافق خدمات تكنولوبيا القائمة.',
          generatedByModel: generation.model || activeModel,
          isLiveAiGenerated: true
        };
      } catch (err) {
        const sanitizedErr = GeminiAgent.sanitizeError(err);
        console.warn(`Gemini live sales pitch failed (${sanitizedErr}), using deterministic sales engine.`);
        strategyResult = this.#generateDeterministicSalesStrategy(lead, partner);
      }
    } else {
      strategyResult = this.#generateDeterministicSalesStrategy(lead, partner);
    }

    // حفظ الاستراتيجية في سجل المسودات المركزي (Audit Drafts)
    const savedDraft = CrmLeadStore.saveSalesDraft({
      leadId: id,
      businessName,
      partnerId: partner.id,
      ...strategyResult
    });

    AuditLogger.log({
      partnerId: partner.id,
      eventType: 'AI_SALES_STRATEGY_GENERATED',
      inputPayload: {
        leadId: id,
        businessName,
        recommendedService: strategyResult.recommendedService,
        indicativePriceRange: `${strategyResult.indicativePriceMin} - ${strategyResult.indicativePriceMax} EGP`
      },
      outputSummary: `تم إنشاء مسودة استراتيجية مبيعات للعميل (${businessName}) وتوثيقها بانتظار مراجعة الشريك.`,
      status: 'SUCCESS'
    });

    return savedDraft;
  }

  /**
   * محرك المبيعات المنضبط محلياً (Deterministic Sales Engine)
   */
  static #generateDeterministicSalesStrategy(lead, partner) {
    const { businessName, industry, softwareNeed, dealValueEstimate } = lead;
    const recommendedService = this.#inferServiceFromNeed(softwareNeed, industry);

    let minPrice = 5000;
    let maxPrice = 10000;

    if (dealValueEstimate && dealValueEstimate > 0) {
      minPrice = Math.round(dealValueEstimate * 0.85);
      maxPrice = Math.round(dealValueEstimate * 1.15);
    } else if (industry.includes('مطعم') || softwareNeed.includes('كاشير')) {
      minPrice = 6000;
      maxPrice = 9000;
    } else if (industry.includes('مطبع') || softwareNeed.includes('مطبع')) {
      minPrice = 12000;
      maxPrice = 18000;
    } else if (softwareNeed.includes('zatca') || softwareNeed.includes('فوترة')) {
      minPrice = 15000;
      maxPrice = 25000;
    }

    return {
      needsAnalysis: `يحتاج ${businessName} في قطاع (${industry}) إلى معالجة هدر الوقت والتحكم في الإيرادات من خلال حل برمجي سحابي (${softwareNeed}) يضمن دقة العمليات.`,
      recommendedService,
      indicativePriceMin: minPrice,
      indicativePriceMax: maxPrice,
      pricingNote: 'تقدير استرشادي غير ملزم يتطلب موافقة الشريكين قبل تقديمه للعميل.',
      marketingPitchMessage: this.#generateFallbackPitch(lead, partner),
      negotiationTactics: `1. التركيز على ميزة تجربة النظام (Demo) عملياً لمدة 24 ساعة.\n2. إبراز سابقة الأعمال الحقيقية المشابهة بشركة TECHNOLOPIA.\n3. اقتراح دفعة مقدمة 50% والباقي عند التسليم والتشغيل النهائي.`,
      closeProbabilityEstimate: 75,
      probabilityReasoning: 'وجود سابقة أعمال مطابقة في الشركة يقلل مدة التنفيذ ويرفع ثقة العميل.',
      generatedByModel: 'TECHNOLOPIA Deterministic Sales Engine',
      isLiveAiGenerated: false
    };
  }

  static #inferServiceFromNeed(need = '', industry = '') {
    const text = (need + ' ' + industry).toLowerCase();
    if (text.includes('مطعم') || text.includes('كاشير') || text.includes('منيو') || text.includes('food') || text.includes('pos')) {
      return 'نظام كاشير فريش المدمج + منيو باركود QR التفاعلي';
    }
    if (text.includes('مطبع') || text.includes('دعاية') || text.includes('ورق') || text.includes('print')) {
      return 'نظام إدارة مطابع واجدي الشامل وحساب الهالك والتكاليف';
    }
    if (text.includes('zatca') || text.includes('فوترة') || text.includes('سعودي') || text.includes('ضرائب')) {
      return 'نظام تكامل الفوترة الإلكترونية السحابية ZATCA Phase 2';
    }
    if (text.includes('مكتب') || text.includes('مدرس') || text.includes('كتب') || text.includes('library')) {
      return 'نظام إدارة المكتبات المدرسية والأكاديمية واستعارة الكتب الذكي';
    }
    return 'منصة سحابية مخصصة Micro-SaaS وحلول الويب وتطبيقات الهاتف';
  }

  static #generateFallbackPitch(lead, partner) {
    const { businessName, contactInfo, softwareNeed } = lead;
    const contactPerson = contactInfo?.contactPerson || 'يا فندم';
    const partnerTitle = partner.id === 'mohamed' ? 'م. محمد البحر (شريك مؤسس ومدير تنفيذي تقني)' : 'م. طارق حافظ (شريك مؤسس ومدير تنفيذي للأعمال)';

    return `السلام عليكم ورحمة الله، مساء الخير ${contactPerson}،
معاك ${partnerTitle} بشركة TECHNOLOPIA للحلول البرمجية الذكية بالإسكندرية.

تواصلنا مع حضرتك بخصوص تطوير وتسهيل إدارة العمل في (${businessName}).
لدينا بالفعل أنظمة برمجية جاهزة ومثبتة في السوق لحل (${softwareNeed}) بشكل جذري:
1. ضبط الحسابات وتصفية الإيرادات اليومية بضغطة زر.
2. واجهة عربية سريعة وسهلة جداً للموظفين بدون أي تعقيد.
3. إمكانية متابعة الشغل والأرقام لحظة بلحظة من تليفون حضرتك في أي وقت.

متاح نمر على حضرتك ربع ساعة نعرض لحضرتك ديمو لايف تجريبي على اللاب توب تشوفه بنفسك بدون أي التزام مالي.
هل يناسب حضرتك معاد سريع خلال يومين لمراجعة النظام معاً؟`;
  }
}
