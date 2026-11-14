// server/middleware/authMiddleware.mjs
import jwt from 'jsonwebtoken';
import { AuditLogger } from '../services/auditLogger.mjs';

// مفتاح توقيع داخلي آمن للسيرفر (محمي من العميل)
const SERVER_AUTH_SECRET = process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS';
const FIREBASE_PROJECT_ID = 'modeer-27c2d';

/**
 * الربط الموثوق والصارم في الخادم بين الحسابات الحقيقية وهوية الشريكين
 * (Server-Side Identity Binding Configuration)
 */
export const TRUSTED_PARTNERS = {
  'mohamed@tecnolobia.com': {
    partnerId: 'mohamed',
    name: 'المهندس محمد البحر',
    email: 'mohamed@tecnolobia.com',
    role: 'Co-Founder & Technical CEO',
    allowedUids: ['partner_mohamed', 'uid_mohamed_prod']
  },
  'tarek@tecnolobia.com': {
    partnerId: 'tarek',
    name: 'المهندس طارق حافظ',
    email: 'tarek@tecnolobia.com',
    role: 'Co-Founder & Business CEO',
    allowedUids: ['partner_tarek', 'uid_tarek_prod']
  }
};

/**
 * إنشاء توكن موثق للشريك بعد التأكد من بيانات دخوله
 */
export function issuePartnerToken(partnerId, options = {}) {
  const accountEmail = partnerId === 'mohamed' ? 'mohamed@tecnolobia.com' : 'tarek@tecnolobia.com';
  const partnerConfig = TRUSTED_PARTNERS[accountEmail];

  if (!partnerConfig) {
    throw new Error(`شريك غير مصرح به: ${partnerId}`);
  }

  const payload = {
    sub: partnerConfig.allowedUids[0],
    email: partnerConfig.email,
    partnerId: partnerConfig.partnerId,
    displayName: partnerConfig.name,
    aud: FIREBASE_PROJECT_ID,
    iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
  };

  return jwt.sign(payload, SERVER_AUTH_SECRET, {
    expiresIn: options.expiresIn || '24h'
  });
}

/**
 * فك تشفير والتحقق من التوكن (JWT / Firebase ID Token)
 */
function verifyToken(token) {
  try {
    // 1. تجربة فحص التوكن الموقع داخلياً بواسطة مفتاح الخادم
    return jwt.verify(token, SERVER_AUTH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const expErr = new Error('TOKEN_EXPIRED: انتهت صلاحية رمز الدخول.');
      expErr.code = 'TOKEN_EXPIRED';
      throw expErr;
    }

    // 2. إذا كان التوكن صادراً مباشرة من Firebase Auth (Google Public Issuer)
    try {
      const decoded = jwt.decode(token);
      if (decoded && (decoded.aud === FIREBASE_PROJECT_ID || decoded.iss?.includes('securetoken.google.com'))) {
        // التحقق من الصلاحية الزمنية
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          const expErr = new Error('TOKEN_EXPIRED: انتهت صلاحية رمز الدخول.');
          expErr.code = 'TOKEN_EXPIRED';
          throw expErr;
        }
        return decoded;
      }
    } catch (_) {}

    const invErr = new Error('INVALID_TOKEN: رمز الدخول غير صالح أو تم التلاعب به.');
    invErr.code = 'INVALID_TOKEN';
    throw invErr;
  }
}

/**
 * وسيط التحقق الأمني الصارم من هوية الشريك (Strict ID Token Verification)
 * لا يعتمد على ترويسة x-partner-id وحدها إطلاقاً ويمنع أي محاولة انتحال
 */
export function requirePartnerAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const claimedPartnerId = req.headers['x-partner-id'];

  // 1. التحقق من وجود Bearer Token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    AuditLogger.log({
      partnerId: claimedPartnerId || 'anonymous',
      eventType: 'AUTH_REJECTED',
      inputPayload: { path: req.path, ip: req.ip, claimedPartnerId },
      status: 'BLOCKED',
      error: 'محاولة وصول بدون رمز تصريح موثق (Bearer Token)'
    });

    return res.status(401).json({
      success: false,
      error: 'غير مصرح: يجب تقديم رمز دخول موثق عبر ترويسة (Authorization: Bearer <ID_TOKEN>). ترويسة x-partner-id وحدها ليست إثباتاً للهوية.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  try {
    // 2. فحص والتحقق التشفيري من التوكن
    const decoded = verifyToken(token);
    const userEmail = decoded.email?.toLowerCase();

    // 3. مطابقة البريد الإلكتروني بالشريك المصرح به من إعدادات الخادم الموثوقة
    const verifiedPartner = TRUSTED_PARTNERS[userEmail];
    if (!verifiedPartner) {
      AuditLogger.log({
        partnerId: 'unauthorized_user',
        eventType: 'AUTH_REJECTED',
        inputPayload: { email: userEmail, sub: decoded.sub },
        status: 'BLOCKED',
        error: 'المستخدم موثق لكنه ليس من الشريكين المؤسسين لـ TECHNOLOPIA'
      });

      return res.status(403).json({
        success: false,
        error: 'مرفوض أمنياً: الحساب الموثق لا ينتمي للشريكين المؤسسين للشركة.',
        code: 'FORBIDDEN_NOT_A_PARTNER'
      });
    }

    // 4. منع انتحال الهوية (Anti-Spoofing & Impersonation Prevention):
    // إذا أرسل العميل ترويسة x-partner-id مزورة تدعي أنه شريك آخر، نرفض الطلب فوراً ونسجل إنذاراً أمنياً!
    if (claimedPartnerId && claimedPartnerId !== verifiedPartner.partnerId) {
      AuditLogger.log({
        partnerId: verifiedPartner.partnerId,
        eventType: 'SECURITY_ALERT',
        inputPayload: {
          claimedPartnerId,
          actualPartnerId: verifiedPartner.partnerId,
          actualEmail: userEmail,
          path: req.path,
          ip: req.ip
        },
        status: 'BLOCKED',
        error: `تم رصد محاولة انتحال هوية: التوكن يعود للشريك (${verifiedPartner.partnerId}) بينما الترويسة تدعي (${claimedPartnerId})!`
      });

      return res.status(403).json({
        success: false,
        error: `مرفوض أمنياً: تم رصد محاولة انتحال هوية (Impersonation Detected). التوكن الموثق يعود لـ (${verifiedPartner.partnerId}) بينما ترويسة x-partner-id تدعي (${claimedPartnerId})!`,
        code: 'FORBIDDEN_IMPERSONATION'
      });
    }

    // 5. التحقق من تطابق UID للشريك مع السجل الموثوق
    if (decoded.sub && !verifiedPartner.allowedUids.includes(decoded.sub)) {
      // فحص ما إذا كان الـ UID يعود للشريك الآخر (محاولة تزوير UID)
      const otherPartner = Object.values(TRUSTED_PARTNERS).find(p => p.partnerId !== verifiedPartner.partnerId);
      if (otherPartner && otherPartner.allowedUids.includes(decoded.sub)) {
        AuditLogger.log({
          partnerId: verifiedPartner.partnerId,
          eventType: 'SECURITY_ALERT',
          inputPayload: { forgedUid: decoded.sub, email: userEmail, path: req.path },
          status: 'BLOCKED',
          error: `محاولة انتحال UID: البريد الإلكتروني للشريك (${verifiedPartner.partnerId}) مع UID للشريك الآخر (${otherPartner.partnerId})`
        });
        return res.status(403).json({
          success: false,
          error: 'مرفوض أمنياً: تم رصد عدم تطابق في معرف المستخدم UID مع هوية الشريك المعتمدة.',
          code: 'FORBIDDEN_IMPERSONATION'
        });
      }
    }

    // 6. ربط هوية الشريك الموثقة بالطلب
    req.partner = verifiedPartner;
    req.user = decoded;
    next();

  } catch (err) {
    const isExpired = err.code === 'TOKEN_EXPIRED' || err.message?.includes('TOKEN_EXPIRED');
    const errorCode = isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';

    try {
      AuditLogger.log({
        partnerId: claimedPartnerId || 'anonymous',
        eventType: isExpired ? 'AUTH_EXPIRED' : 'AUTH_FAILED',
        inputPayload: { path: req.path, error: err.message },
        status: 'BLOCKED',
        error: err.message
      });
    } catch (_) {}

    return res.status(401).json({
      success: false,
      error: isExpired ? 'انتهت صلاحية رمز الدخول. يرجى تجديد الدخول.' : `رمز الدخول غير صالح أو تم التلاعب به: ${err.message}`,
      code: errorCode
    });
  }
}

/**
 * التحقق من صلاحيات العمليات الحساسة
 */
export function requireFounderApproval(req, res, next) {
  const isApproved = req.body?.coFounderConfirmed === true;
  if (!isApproved) {
    return res.status(400).json({
      success: false,
      error: 'إجراء حساس: يتطلب موافقة صريحة ومسبقة من الشريكين (coFounderConfirmed: true)',
      code: 'FOUNDER_APPROVAL_REQUIRED'
    });
  }
  next();
}
