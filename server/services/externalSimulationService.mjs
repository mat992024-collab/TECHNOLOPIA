// server/services/externalSimulationService.mjs
import { CrmLeadStore } from '../data/crmLeadStore.mjs';
import { AuditLogger } from './auditLogger.mjs';

/**
 * خدمة محاكاة التكاملات الخارجية (Simulation-First Safety Engine)
 * تفرض حظراً كاملاً على أي إرسال خارجي فعلي أو حملات مدفوعة أو اتصالات آلية
 */
export class ExternalSimulationService {
  static SIMULATION_MODE = true;

  /**
   * إعداد وتجهيز مسودة رسالة واتساب في نمط المحاكاة الآمن (بدون إرسال حقيقي)
   */
  static simulateWhatsApp(leadId, messageText, partner) {
    if (!leadId) {
      throw new Error('معرف العميل (leadId) مطلوب لإعداد المحاكاة');
    }

    const lead = CrmLeadStore.getLeadById(leadId);
    if (!lead) {
      throw new Error(`العميل بالمعرف (${leadId}) غير موجود.`);
    }

    const phone = lead.contactInfo?.phone;
    if (!phone) {
      throw new Error('لا يوجد رقم هاتف مسجل لهذا العميل');
    }

    const body = messageText || `السلام عليكم، معاك ${partner.name} من شركة تكنولوبيا بخصوص ${lead.softwareNeed}.`;

    // تنظيف رقم الهاتف لرابط واتساب الاسترشادي
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(body);
    const previewUrl = `https://wa.me/20${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}?text=${encodedText}`;

    AuditLogger.log({
      partnerId: partner?.partnerId || partner?.id || 'anonymous',
      eventType: 'SIMULATION_WHATSAPP_PREPARED',
      inputPayload: {
        leadId,
        businessName: lead.businessName,
        recipientPhone: phone,
        simulationMode: true
      },
      outputSummary: `تم تجهيز مسودة واتساب للعميل (${lead.businessName}) في نمط المحاكاة الآمن مع حظر الإرسال التلقائي.`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      mode: 'SIMULATION_ONLY',
      isLiveDispatched: false,
      leadId,
      businessName: lead.businessName,
      recipientPhone: phone,
      messageText: body,
      previewUrl,
      readyToCopy: true,
      disclaimer: 'وضع المحاكاة الآمن (Phase 5.0): لم يتم إرسال أي رسالة عبر الإنترنت. متاح نسخ الرسالة أو فتحها للمراجعة اليدوية فقط.'
    };
  }

  /**
   * إعداد منشور تسويقي لفيسبوك في نمط المحاكاة الآمن (بدون نشر حقيقي أو إعلانات)
   */
  static simulateFacebookPost(campaignData, partner) {
    const { title, targetNiche, postBody, budgetEstimate } = campaignData;

    const postContent = postBody || `فرصة لأصحاب ${targetNiche || 'الأنشطة التجارية'}: وفّر وقتك وأدر عملياتك بضغطة زر مع أنظمة تكنولوبيا الذكية.`;

    AuditLogger.log({
      partnerId: partner?.partnerId || partner?.id || 'anonymous',
      eventType: 'SIMULATION_FACEBOOK_PREVIEW',
      inputPayload: {
        title: title || 'حملة تسويقية تجريبية',
        targetNiche,
        budgetEstimate: budgetEstimate || 0,
        simulationMode: true
      },
      outputSummary: `تم إنشاء معاينة منشور فيسبوك في نمط المحاكاة دون نشر خارجي أو تفعيل أي إعلانات مدفوعة.`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      mode: 'SIMULATION_ONLY',
      isLivePublished: false,
      campaignTitle: title || 'منشور استقطاب محلي',
      targetNiche: targetNiche || 'المطاعم والمحلات',
      postContent,
      suggestedHashtags: ['#تكنولوبيا', '#حلول_برمجية', '#إدارة_مطاعم', '#كاشير_مصر', '#الإسكندرية'],
      budgetPlanNote: 'ميزانية استرشادية صفرية - لا يوجد أي إنفاق مالي أو ربط بطاقات بنكية.',
      disclaimer: 'وضع المحاكاة الآمن: لم يتم الاتصال بـ Facebook Graph API ولم يُنشر أي منشور علني.'
    };
  }

  /**
   * صمام الأمان لمنع أي إرسال خارجي حقيقي
   */
  static sendLiveOutreach() {
    const err = new Error('EXTERNAL_INTEGRATION_BLOCKED: الإرسال الخارجي المباشر معطل في مرحلة المحاكاة (Phase 5.0 Simulation-First) لحماية المنظومة والتكلفة.');
    err.code = 'EXTERNAL_INTEGRATION_BLOCKED';
    err.status = 403;
    throw err;
  }

  static publishLiveFacebook() {
    const err = new Error('EXTERNAL_INTEGRATION_BLOCKED: النشر الخارجي على فيسبوك معطل في مرحلة المحاكاة (Phase 5.0 Simulation-First) لحماية المنظومة والتكلفة.');
    err.code = 'EXTERNAL_INTEGRATION_BLOCKED';
    err.status = 403;
    throw err;
  }
}
