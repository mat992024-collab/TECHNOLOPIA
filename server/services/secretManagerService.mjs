// server/services/secretManagerService.mjs
import crypto from 'crypto';

/**
 * خدمة إدارة الأسرار وحوكمة الهوية المشفرة (Secret Manager & Credential Security Service)
 * تدعم القراءة الآمنة للأسرار المحقونة من Google Secret Manager،
 * والتحقق من الإنتروبيا التشفيرية (256-bit entropy)،
 * والتجزئة المملحة لكلمات المرور ورموز PIN عبر PBKDF2
 */
export class SecretManagerService {
  static #cachedSecrets = null;
  static #partnerSalts = {
    mohamed: 'tecnolobia_mohamed_salt_992024_cloud_staging',
    tarek: 'tecnolobia_tarek_salt_1995_cloud_staging'
  };

  /**
   * اشتقاق تجزئة مشفرة ومملحة لرمز الأمان (Salted PIN Hashing via PBKDF2)
   */
  static hashPin(pin, partnerId = 'mohamed') {
    if (!pin || typeof pin !== 'string') return '';
    const salt = this.#partnerSalts[partnerId] || 'tecnolobia_default_secure_salt_2026';
    return crypto.pbkdf2Sync(pin.trim(), salt, 100000, 32, 'sha256').toString('hex');
  }

  /**
   * التحقق من تطابق رمز PIN باستخدام المقارنة الثابتة زمنياً (Timing-Safe Equality)
   * لمنع هجمات التوقيت (Timing Attacks)
   */
  static verifyPin(providedPin, expectedPinOrHash, partnerId = 'mohamed') {
    if (!providedPin || !expectedPinOrHash) return false;
    const providedClean = String(providedPin).trim();
    const expectedClean = String(expectedPinOrHash).trim();

    // 1. إذا كانت القيمة المخزنة هي تجزئة PBKDF2 مشفرة (64 hex characters)
    if (expectedClean.length === 64 && /^[0-9a-f]+$/i.test(expectedClean)) {
      const computedHash = this.hashPin(providedClean, partnerId);
      try {
        return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(expectedClean, 'hex'));
      } catch {
        return false;
      }
    }

    // 2. إذا كانت القيمة سرية مباشرة (حماية المقارنة الثابتة زمنياً)
    const bufProvided = Buffer.from(providedClean);
    const bufExpected = Buffer.from(expectedClean);
    if (bufProvided.length !== bufExpected.length) return false;
    return crypto.timingSafeEqual(bufProvided, bufExpected);
  }

  /**
   * التحقق من قوة المفتاح التشفيري JWT_SECRET (256-bit entropy check)
   */
  static validateJwtSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      throw new Error('JWT_SECRET is missing or invalid');
    }
    // في بيئة Staging / Production، يجب أن يحتوي المفتاح على 32 حرفاً على الأقل لتأمين 256 بت
    if (secret.length < 32 && process.env.NODE_ENV === 'production') {
      throw new Error('INSUFFICIENT_ENTROPY: JWT_SECRET must be at least 32 characters (256 bits) in production/staging environments');
    }
    return true;
  }

  /**
   * قراءة وتدقيق أسرار النظام الآمنة
   */
  static getSecrets() {
    if (this.#cachedSecrets) return this.#cachedSecrets;

    const defaultTestSecret = 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
    const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? defaultTestSecret : null);
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
    const mohamedPin = process.env.MOHAMED_PIN || (process.env.NODE_ENV === 'test' ? '1995' : null);
    const tarekPin = process.env.TAREK_PIN || (process.env.NODE_ENV === 'test' ? '2024' : null);

    this.#cachedSecrets = {
      jwtSecret,
      geminiApiKey,
      mohamedPin,
      tarekPin,
      isCloudRunEnvironment: Boolean(process.env.K_SERVICE || process.env.K_REVISION)
    };

    return this.#cachedSecrets;
  }

  /**
   * فحص جاهزية الأسرار لفحص الجاهزية (Readiness Probe)
   */
  static checkSecretsReadiness() {
    const secrets = this.getSecrets();
    const missing = [];
    if (!secrets.jwtSecret) missing.push('JWT_SECRET');
    if (!secrets.mohamedPin) missing.push('MOHAMED_PIN');
    if (!secrets.tarekPin) missing.push('TAREK_PIN');

    return {
      ready: missing.length === 0,
      missing,
      hasGeminiKey: Boolean(secrets.geminiApiKey),
      isCloudRun: secrets.isCloudRunEnvironment
    };
  }
}
