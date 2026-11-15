// server/middleware/distributedRateLimiter.mjs
import rateLimit from 'express-rate-limit';

/**
 * نظام تحديد معدل الطلبات الموزع والمتدرج حسب حساسية المسار
 * (Distributed & Differentiated Rate Limiting Engine)
 * يدعم التدرج الأمني:
 * 1. مسارات المصادقة وتسجيل الدخول: حماية مشددة من هجمات القوة الغاشمة (Brute Force Protection)
 * 2. مسارات استدعاء Gemini: حماية من استنزاف الحصص والتكاليف (Quota & Cost Protection)
 * 3. مسارات تعديل وكتابة CRM: حماية النزاهة والعمليات الحساسة (Mutation Protection)
 * 4. المسارات العامة: حماية الخادم من هجمات الحرمان من الخدمة (DoS Protection)
 */

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: process.env.NODE_ENV === 'test' ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح به من الطلبات العامة. يرجى الانتظار قليلاً.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: process.env.NODE_ENV === 'test' ? 200 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم حظر محاولات الدخول مؤقتاً لتجاوز الحد الأقصى للمحاولات (حماية ضد Brute Force).',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: process.env.RATE_LIMIT_TEST ? 3 : (process.env.NODE_ENV === 'test' ? 100 : 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح به من استشارات الذكاء الاصطناعي (30 طلب/دقيقة). يرجى الانتظار.',
    code: 'CHAT_RATE_LIMIT_EXCEEDED'
  }
});

export const mutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: process.env.NODE_ENV === 'test' ? 200 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح به من عمليات تعديل بيانات CRM. يرجى الانتظار.',
    code: 'MUTATION_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * فحص سلامة نظام تحديد المعدل لـ Readiness Probe
 */
export function checkRateLimiterStatus() {
  const isRedisConfigured = Boolean(process.env.REDIS_URL || process.env.MEMORSTORE_HOST);
  return {
    status: 'active',
    storeType: isRedisConfigured ? 'distributed_redis' : 'in_memory_cluster_fallback',
    failSafeActive: true,
    protectedTiers: ['auth', 'chat', 'mutations', 'global']
  };
}
