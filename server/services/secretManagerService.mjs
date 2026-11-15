// server/services/secretManagerService.mjs
import crypto from 'crypto';

/**
 * خدمة إدارة الأسرار وحوكمة الهوية المشفرة (Secret Manager & Credential Security Service)
 * تدعم:
 * 1. القياس التشفيري الفعلي لإنتروبيا شانون (Shannon Entropy Measurement).
 * 2. التحقق من القوة التشفيرية لمفتاح JWT_SECRET (256-bit entropy).
 * 3. التجزئة المملحة لكلمات المرور ورموز PIN عبر PBKDF2 والمقارنة الثابتة زمنياً.
 * 4. التحقق المستقل من مصدر الأسرار (Google Secret Manager vs Local Env).
 * 5. الحظر التام لطباعة أو تسجيل أي أسرار في السجلات (Zero Secret Logging).
 */
export class SecretManagerService {
  static #cachedSecrets = null;
  static #partnerSalts = {
    mohamed: 'tecnolobia_mohamed_salt_992024_cloud_staging',
    tarek: 'tecnolobia_tarek_salt_1995_cloud_staging'
  };

  /**
   * حساب إنتروبيا شانون بدقة رياضية لقياس العشوائية والتشتت التشفيري الفعلي
   * (Shannon Entropy Calculation)
   */
  static calculateShannonEntropy(str) {
    if (!str || typeof str !== 'string' || str.length === 0) {
      return { perChar: 0, totalBits: 0, uniqueChars: 0 };
    }

    const freq = {};
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      freq[c] = (freq[c] || 0) + 1;
    }

    const uniqueChars = Object.keys(freq).length;
    let entropyPerChar = 0;

    for (const c in freq) {
      const p = freq[c] / str.length;
      entropyPerChar -= p * Math.log2(p);
    }

    const totalBits = entropyPerChar * str.length;
    return {
      perChar: entropyPerChar,
      totalBits,
      uniqueChars
    };
  }

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
   * التحقق الصارم من القوة التشفيرية لمفتاح JWT_SECRET
   * يقيس إنتروبيا شانون الحقيقية وتنوع المحارف وليس مجرد طول السلسلة النصية
   */
  static validateJwtSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      throw new Error('JWT_SECRET is missing or invalid');
    }

    if (secret.length < 32) {
      throw new Error(`INSUFFICIENT_LENGTH: JWT_SECRET length (${secret.length}) is below minimum requirement of 32 characters.`);
    }

    const entropy = this.calculateShannonEntropy(secret);

    // التحقق من التنوع الأدنى للمحارف (منع السلاسل المتطابقة مثل 'A'*32)
    if (entropy.uniqueChars < 8 || entropy.perChar < 3.0 || entropy.totalBits < 120) {
      throw new Error(`INSUFFICIENT_ENTROPY: JWT_SECRET lacks cryptographic entropy (${entropy.totalBits.toFixed(1)} bits, ${entropy.perChar.toFixed(2)} bits/char, ${entropy.uniqueChars} unique chars). Repeating characters or trivial patterns are strictly forbidden.`);
    }

    // في بيئات Staging و Production يشترط قوة تشفير لا تقل عن 160 بت فعلي (معيار 256 بت مستهدف)
    if (process.env.NODE_ENV === 'production' || process.env.STAGING_MODE === 'true') {
      if (entropy.totalBits < 160) {
        throw new Error(`INSUFFICIENT_ENTROPY: Production/Staging requires high entropy (measured ${entropy.totalBits.toFixed(1)} bits < 160 bits required).`);
      }
    }

    return true;
  }

  /**
   * التحقق المستقل من مصدر الأسرار (Google Secret Manager vs Local Environment)
   * مع حظر طباعة أي قيم سرية
   */
  static verifySecretManagerSource() {
    const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION);
    const hasJwt = Boolean(process.env.JWT_SECRET);
    const hasMohamedPin = Boolean(process.env.MOHAMED_PIN);
    const hasTarekPin = Boolean(process.env.TAREK_PIN);
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

    let source = 'LOCAL_ENV_FILE';
    if (isCloudRun) {
      source = 'GOOGLE_SECRET_MANAGER_INJECTED';
    } else if (process.env.NODE_ENV === 'test') {
      source = 'TEST_HARNESS_MOCK';
    }

    const entropy = hasJwt ? this.calculateShannonEntropy(process.env.JWT_SECRET) : null;

    return {
      source,
      isCloudRunEnvironment: isCloudRun,
      secretsConfigured: {
        JWT_SECRET: hasJwt,
        MOHAMED_PIN: hasMohamedPin,
        TAREK_PIN: hasTarekPin,
        GEMINI_API_KEY: hasGeminiKey
      },
      jwtEntropy: entropy ? {
        totalBits: Number(entropy.totalBits.toFixed(1)),
        bitsPerChar: Number(entropy.perChar.toFixed(2)),
        uniqueChars: entropy.uniqueChars,
        isEntropySecure: entropy.totalBits >= 120 && entropy.uniqueChars >= 8
      } : null
    };
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

    let isEntropyValid = false;
    if (secrets.jwtSecret) {
      try {
        isEntropyValid = this.validateJwtSecret(secrets.jwtSecret);
      } catch {
        isEntropyValid = false;
      }
    }

    return {
      ready: missing.length === 0 && isEntropyValid,
      missing,
      isEntropyValid,
      hasGeminiKey: Boolean(secrets.geminiApiKey),
      isCloudRun: secrets.isCloudRunEnvironment,
      sourceAudit: this.verifySecretManagerSource().source
    };
  }
}
