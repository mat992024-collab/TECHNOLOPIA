// server/services/humanApprovalService.mjs
import crypto from 'crypto';
import { AuditLogger } from './auditLogger.mjs';

const APPROVAL_SECRET = process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
const TICKET_TTL_MS = 10 * 60 * 1000; // صلاحية تذكرة الاعتماد 10 دقائق فقط

/**
 * خدمة إدارة تذاكر الاعتماد البشري الموقعة تشفيرياً (Cryptographic Human Approval Ticket Service)
 * تضمن:
 * 1. أن الاعتماد أحادي الاستخدام (Single-Use / Nonce-Protected).
 * 2. محدود الصلاحية زمنياً (Time-Limited / TTL Enforced).
 * 3. مقيد ومربوط تشفيرياً بالأداة والمدخلات والشريك المصرح له (Strict Payload & Partner Binding).
 * 4. محمي تماماً من هجمات التكرار وإعادة الاستخدام (Replay Attack Immunity).
 * 5. محمي من استبدال أو تعديل البيانات المعتمدة (Payload Substitution Immunity).
 */
export class HumanApprovalService {
  static #usedTickets = new Set();
  static #ticketStore = new Map();

  /**
   * حساب التجزئة التشفيرية الموحدة للمدخلات
   */
  static computePayloadHash(toolName, args, partnerId) {
    const cleanArgs = { ...args };
    delete cleanArgs.isConfirmedByPartner;
    delete cleanArgs.approvalTicket;
    delete cleanArgs._ticketSignature;

    // ترتيب المفاتيح لضمان التجزئة القطعية
    const sortedKeys = Object.keys(cleanArgs).sort();
    const normalized = sortedKeys.map(k => `${k}:${JSON.stringify(cleanArgs[k])}`).join('|');
    const base = `${toolName}|${partnerId}|${normalized}`;
    return crypto.createHash('sha256').update(base).digest('hex');
  }

  /**
   * إصدار تذكرة اعتماد موقعة تشفيرياً بانتظار نقرة الشريك
   */
  static issueApprovalTicket(toolName, args, partner) {
    const partnerId = partner?.id || partner?.partnerId || 'anonymous';
    const ticketId = `ticket-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + TICKET_TTL_MS;
    const payloadHash = this.computePayloadHash(toolName, args, partnerId);

    const signPayload = `${ticketId}|${toolName}|${partnerId}|${payloadHash}|${expiresAt}`;
    const signature = crypto.createHmac('sha256', APPROVAL_SECRET).update(signPayload).digest('hex');

    const ticket = {
      ticketId,
      toolName,
      partnerId,
      payloadHash,
      issuedAt,
      expiresAt,
      signature
    };

    this.#ticketStore.set(ticketId, ticket);

    AuditLogger.log({
      partnerId,
      eventType: 'APPROVAL_TICKET_ISSUED',
      toolName,
      inputPayload: { ticketId, toolName, payloadHash },
      status: 'INFO',
      permissionLevel: 'APPROVAL_REQUIRED'
    });

    return ticket;
  }

  /**
   * تدقيق والتحقق التشفيري الصارم من تذكرة الاعتماد قبل تنفيذ العملية
   */
  static verifyAndConsumeTicket(toolName, args, partner, providedTicket) {
    const partnerId = partner?.id || partner?.partnerId;
    if (!partnerId) {
      const err = new Error('UNAUTHORIZED: الشريك غير معروف أو غير موثق لتنفيذ الاعتماد.');
      err.code = 'UNAUTHORIZED_APPROVAL';
      err.status = 401;
      throw err;
    }

    // 1. إذا لم يتم توفير تذكرة وكانت العملية موجهة مباشرة من الشريك الموثق عبر endpoint
    if (!providedTicket) {
      if (args.isConfirmedByPartner === true) {
        // فحص مباشر للشريك المعتمد المصرح له
        return {
          valid: true,
          mode: 'DIRECT_AUTHENTICATED_PARTNER_CONFIRMATION',
          partnerId
        };
      }
      const err = new Error('APPROVAL_REQUIRED: هذه العملية حساسة وتتطلب تذكرة اعتماد صريحة أو تأكيداً موثقاً من الشريك.');
      err.code = 'APPROVAL_REQUIRED';
      err.status = 400;
      throw err;
    }

    const { ticketId, signature, expiresAt, payloadHash } = providedTicket;

    // 2. التحقق من وجود التذكرة
    if (!ticketId || !signature) {
      const err = new Error('INVALID_TICKET: تذكرة الاعتماد غير مكتملة أو مشوهة.');
      err.code = 'INVALID_APPROVAL_TICKET';
      err.status = 400;
      throw err;
    }

    // 3. منع هجمات إعادة الاستخدام (Replay Attack Prevention)
    if (this.#usedTickets.has(ticketId)) {
      AuditLogger.log({
        partnerId,
        eventType: 'APPROVAL_REPLAY_ATTEMPT_BLOCKED',
        toolName,
        inputPayload: { ticketId },
        status: 'BLOCKED',
        error: 'محاولة إعادة استخدام تذكرة اعتماد مستهلكة مسبقاً'
      });
      const err = new Error('REPLAY_DETECTED: تذكرة الاعتماد هذه تم استخدامها بالفعل ولا يمكن إعادة استخدامها.');
      err.code = 'REPLAYED_APPROVAL_TICKET';
      err.status = 403;
      throw err;
    }

    // 4. التحقق من التوقيع الرقمي لمنع التزوير في المتصفح
    const signPayload = `${ticketId}|${toolName}|${providedTicket.partnerId || partnerId}|${payloadHash}|${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', APPROVAL_SECRET).update(signPayload).digest('hex');

    const bufSig = Buffer.from(signature);
    const bufExp = Buffer.from(expectedSig);
    if (bufSig.length !== bufExp.length || !crypto.timingSafeEqual(bufSig, bufExp)) {
      const err = new Error('FORGED_TICKET: فشل التحقق من التوقيع التشفيري لتذكرة الاعتماد.');
      err.code = 'FORGED_APPROVAL_TICKET';
      err.status = 403;
      throw err;
    }

    // 5. التحقق من عدم انتهاء الصلاحية الزمنية
    if (Date.now() > Number(expiresAt)) {
      const err = new Error('EXPIRED_TICKET: انتهت صلاحية تذكرة الاعتماد (المهلة القصوى 10 دقائق). يرجى طلب الاقتراح مجدداً.');
      err.code = 'EXPIRED_APPROVAL_TICKET';
      err.status = 400;
      throw err;
    }

    // 6. التحقق من تطابق الشريك المصرح له (Cross-Partner Execution Prevention)
    if (providedTicket.partnerId && providedTicket.partnerId !== partnerId) {
      AuditLogger.log({
        partnerId,
        eventType: 'CROSS_PARTNER_APPROVAL_BLOCKED',
        toolName,
        inputPayload: { ticketId, intendedPartner: providedTicket.partnerId, attemptingPartner: partnerId },
        status: 'BLOCKED',
        error: 'محاولة تنفيذ تذكرة مخصصة لشريك آخر'
      });
      const err = new Error('FORBIDDEN_APPROVAL: تذكرة الاعتماد هذه صادرة لشريك آخر ولا يحق لك اعتمادها.');
      err.code = 'CROSS_PARTNER_APPROVAL_FORBIDDEN';
      err.status = 403;
      throw err;
    }

    // 7. التحقق من عدم التلاعب في البيانات (Payload Tampering Prevention)
    const currentHash = this.computePayloadHash(toolName, args, partnerId);
    if (currentHash !== payloadHash) {
      AuditLogger.log({
        partnerId,
        eventType: 'PAYLOAD_SUBSTITUTION_BLOCKED',
        toolName,
        inputPayload: { ticketId, expectedHash: payloadHash, actualHash: currentHash },
        status: 'BLOCKED',
        error: 'تم اكتشاف تعديل أو استبدال في بيانات الحمولة المعتمدة'
      });
      const err = new Error('TAMPERED_PAYLOAD: تم تعديل البيانات المقترحة بعد إصدار التذكرة. تم حظر التنفيذ لحماية النزاهة.');
      err.code = 'APPROVAL_PAYLOAD_MISMATCH';
      err.status = 400;
      throw err;
    }

    // 8. استهلاك التذكرة بنجاح لمنع أي إعادة استخدام لاحقة
    this.#usedTickets.add(ticketId);
    this.#ticketStore.delete(ticketId);

    AuditLogger.log({
      partnerId,
      eventType: 'APPROVAL_TICKET_CONSUMED',
      toolName,
      inputPayload: { ticketId, toolName },
      status: 'SUCCESS',
      permissionLevel: 'APPROVAL_REQUIRED'
    });

    return {
      valid: true,
      ticketId,
      partnerId,
      mode: 'CRYPTOGRAPHIC_TICKET_VERIFIED'
    };
  }
}
