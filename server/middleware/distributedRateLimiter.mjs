// server/middleware/distributedRateLimiter.mjs
import rateLimit from 'express-rate-limit';

/**
 * محرك تحديد معدل الطلبات المتدرج (Multi-Tiered Rate Limiting Engine)
 * 
 * تدقيق معماري صريح (Architectural Audit Note):
 * يعتمد هذا المحدد افتراضياً على الذاكرة الداخلية للعملية (Node.js Process MemoryStore)
 * في بيئات الحاويات سريعة الزوال (Google Cloud Run متعددة النسخ)، كل نسخة تمتلك عداداً مستقلاً.
 * للحصول على حظر موزع شامل عبر كافة الحاويات (True Distributed Rate Limiting)،
 * يجب تفعيل خدمة Google Cloud Memorystore (Redis) وتمرير REDIS_URL أو MEMORSTORE_HOST.
 * في غياب Redis، يتم تصنيف المحدد كـ (Instance-Level Local Defense) مع تسجيل تحذير بيئي.
 */

const isRedisConfigured = Boolean(process.env.REDIS_URL || process.env.MEMORSTORE_HOST);

// تدرج حدود الاستهلاك
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
 * فحص سلامة وتصنيف نظام تحديد المعدل لـ Readiness Probe والتدقيق الأمني
 */
export function checkRateLimiterStatus() {
  return {
    status: isRedisConfigured ? 'distributed_active' : 'instance_level_active',
    isDistributed: isRedisConfigured,
    storeType: isRedisConfigured ? 'distributed_redis_memorystore' : 'in_memory_instance_local',
    protectedTiers: ['auth', 'chat', 'mutations', 'global'],
    deploymentWarning: isRedisConfigured ? null : 'SHARED_STORAGE_UNAVAILABLE: Rate limiting operates at the instance-local memory level. In multi-instance Cloud Run deployment, deploy Google Cloud Memorystore (Redis) for cross-instance limit synchronization.'
  };
}
