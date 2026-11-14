import { AiChatMessage, AiMode, MarketOpportunity } from '../types/ai';
import { PartnerId } from '../types/company';
import { AppStorageService } from './storageService';
import { EGYPTIAN_MARKET_OPPORTUNITIES } from '../mock/initialData';

const GEMINI_KEY_STORAGE = 'tecnolobia_gemini_key';

export function getSavedGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

export function saveGeminiKey(key: string): void {
  localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
}

/**
 * خدمة المدير التنفيذي الذكي لشركة Tecnolobia
 */
export class AiCeoService {
  /**
   * توليد رد المدير الذكي مع تطبيق Token Saver Mode الصارم
   */
  static async consultCeo(
    userMessage: string,
    currentPartner: PartnerId,
    mode: AiMode
  ): Promise<AiChatMessage> {
    const partnerName = currentPartner === 'mohamed' ? 'بشمهندس محمد البحر' : 'بشمهندس طارق حافظ';
    const otherPartnerName = currentPartner === 'mohamed' ? 'بشمهندس طارق' : 'بشمهندس محمد';
    const apiKey = getSavedGeminiKey();

    // فحص العمليات التي يمكن أن ينفذها كود محلي لتوفير الـ Tokens تماماً
    const lowerQuery = userMessage.toLowerCase();

    // تحديث إحصائيات التوفير
    AppStorageService.updateTokenStats(180);

    // إذا كان هناك مفتاح Gemini مسجل، يمكن الاتصال المباشر بنموذج gemini-2.0-flash أو gemini-1.5-flash
    if (apiKey) {
      try {
        const responseText = await this.callGeminiApi(apiKey, userMessage, partnerName, otherPartnerName, mode);
        return {
          id: `ai-msg-${Date.now()}`,
          sender: 'ai_ceo',
          text: responseText,
          timestamp: new Date().toISOString(),
          mode
        };
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local executive brain:', err);
      }
    }

    // المخ الإداري المحلي الفوري (Zero Tokens / Instant Response)
    const simulatedReply = this.generateExecutiveResponse(userMessage, partnerName, otherPartnerName, mode, currentPartner);
    return simulatedReply;
  }

  /**
   * الاتصال الآمن بـ Gemini API مع تفعيل سياسة التوفير
   */
  private static async callGeminiApi(
    apiKey: string,
    prompt: string,
    partnerName: string,
    otherPartnerName: string,
    mode: AiMode
  ): Promise<string> {
    const systemInstruction = `
أنت الآن المدير التنفيذي الذكي (AI CEO & Business Manager) لشركة البرمجيات المصرية Tecnolobia.
الشركاء المؤسسون هم: المهندس محمد البحر والمهندس طارق حافظ، بصلاحيات متساوية تماماً.
تتحدث الآن مع: ${partnerName}. والشريك الآخر هو: ${otherPartnerName}.
الوضع الحالي: وضع ${mode === 'advisor' ? 'المستشار (Advisor Mode): تحليل وتخطيط واقتراحات دون تنفيذ مباشر' : 'التنفيذ (Execution Mode): تقديم اقتراح تنفيذي محدد ينتظر تأكيد الشريكين'}.
طريقة التحدث:
- تحدث باللهجة المصرية البسيطة المهنية، دون تعقيد أو حشو نظري.
- كن مبادراً، وركز على تحقيق دخل سريع للشركة عبر استغلال سابقة أعمالنا (كاشير مطعم فريش، مطبعة واجدي، مكتبة مدرسية، منيو QR، تطبيق منطقتنا، مواقع بورتفوليو للمحامين والديكور).
- احترم دائماً قاعدة تقسيم الأرباح للأرباع الأربعة (25% طارق، 25% محمد، 25% تطوير أدوات الشركة، 25% صدقة جارية لوجه الله).
- لا تقترح إطلاقاً أي تحويل أموال أو دفع ذاتي؛ الشريكان هما من ينفذان الصرف والتحصيل خارج النظام.
- اجعل إجابتك مركزة ومباشرة وعملية.
    `.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nالسؤال/الطلب من ${partnerName}:\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، حدث خطأ في استلام الرد من النموذج.';
  }

  /**
   * محرك الذكاء التنفيذي المحلي المبرمج حسب شروط الشركة
   */
  private static generateExecutiveResponse(
    query: string,
    partnerName: string,
    otherPartnerName: string,
    mode: AiMode,
    partnerId: PartnerId
  ): AiChatMessage {
    const q = query.toLowerCase();

    // 1. استفسار عن الكاش السريع أو دراسة السوق
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

    // 2. استفسار عن الأرباح أو التقسيم المالي
    if (q.includes('ربح') || q.includes('أرباح') || q.includes('فلوس') || q.includes('مالية') || q.includes('صدقة') || q.includes('تطوير')) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'ai_ceo',
        text: `يا ${partnerName}، سياستنا المالية واضحة وصارمة جداً ومفيهاش أي مجال للاجتهاد:

1. **صافي الربح القابل للتوزيع** بيتحسب فقط من **الفلوس اللي دخلت الحساب أو اتسلمت كاش فعلياً** ناقص كافة المصروفات المسددة. أي متبقي عند العملاء مش محسوب ربح نقدي قابل للتوزيع لحد ما يتحصل.
2. المعادلة الرياضية بتتقسم بدقة متناهية بكود برمجي (مش تخمين ذكاء اصطناعي) إلى **أربعة أرباع متساوية (25% لكل طرف)**:
   - 25% نصيب م. طارق حافظ.
   - 25% نصيب م. محمد البحر.
   - 25% صندوق تطوير أدوات الشركة (اشتراكات برمجية زي كود وGemini، سيرفرات، دومينات).
   - 25% صدقة جارية لوجه الله تعالى (بواقي القروش المحاسبية بتنزل هنا لضمان تطابق المجموع 100%).
3. **تنبيه حاسم:** البرنامج بيحسب ويسجل ويوثق بس، ومبيعملش أي تحويلات بنكية أو دفع إلكتروني. أنتم اللي بتستلموا وتصرفوا وتتصدقوا بره التطبيق، والتطبيق حافظ لسجلاتكم بحيادية تامة.`,
        timestamp: new Date().toISOString(),
        mode
      };
    }

    // 3. وضع التنفيذ - اقتراح مهمة أو إجراء
    if (mode === 'execution') {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: 'ai_ceo',
        text: `تمام يا ${partnerName}. بصفتي في **وضع التنفيذ (Execution Mode)**، قمت بصياغة الإجراء التنفيذي المطلوب بناءً على طلبك، ولكن تطبيقاً لبروتوكول الأمان والحوكمة: **لن يتم الحفظ الفعلي في قاعدة البيانات إلا بعد مراجعتك أنت و${otherPartnerName} والضغط على زر التأكيد أدناه.**`,
        timestamp: new Date().toISOString(),
        mode,
        suggestedAction: {
          type: 'create_task',
          payload: {
            title: `متابعة تنفيذية: ${query.slice(0, 40)}`,
            assignedTo: partnerId,
            priority: 'high',
            dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
          },
          confirmed: false
        }
      };
    }

    // 4. استشارة عامة وتطوير أعمال
    return {
      id: `ai-msg-${Date.now()}`,
      sender: 'ai_ceo',
      text: `أهلاً يا ${partnerName}! أنا معاك ومركز في كلامك. كمديركم التنفيذي وشريككم، هدفي دايماً إني أوجه طاقتنا أنت و${otherPartnerName} نحو الخطوات اللي بتجيب نتايج عملية سريعة على الأرض:

- لو محتاج نناقش تسعير عرض سعر لعميل جديد، ابعتلي التفاصيل وأحسبلك هامش الربح والتكلفة.
- لو عايز نوزع المهام على مشروع جديد حسب نقاط قوة كل واحد فيكم، أنا جاهز.
- لو حابب نفحص كود مشروع من الناحية التقنية والأمنية، ارفع الملفات أو اديني فكرة عن المعمارية وهعملك تقرير فني شامل.

قولي إيه الأولوية العاجلة اللي نركز عليها النهاردة؟`,
      timestamp: new Date().toISOString(),
      mode
    };
  }
}
