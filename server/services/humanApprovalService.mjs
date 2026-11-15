// server/services/humanApprovalService.mjs
import crypto from 'crypto';
import { AuditLogger } from './auditLogger.mjs';
import { FirebaseAdminService } from './firebaseAdminService.mjs';

const APPROVAL_SECRET = process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
const TICKET_TTL_MS = 10 * 60 * 1000; // صلاحية تذكرة الاعتماد 10 دقائق فقط

/**
 * خدمة إدارة تذاكر الاعتماد البشري الموقعة تشفيرياً والمحمية عبر الحاويات الموزعة
 * (Distributed Cryptographic Human Approval Ticket Service)
 * تضمن:
 * 1. أن الاعتماد أحادي الاستخدام ومحمي من التكرار عبر كافة الحاويات السحابية (Cross-Instance Replay Protection).
 * 2. التخزين المركزي الذري لاستهلاك التذاكر لمنع التضارب (Atomic Centralized Consumption).
 * 3. التقييد الزمني الصارم (10-Minute TTL Enforcement).
 * 4. الربط التشفيري القطعي بين الأداة والمدخلات وهوية الشريك (Strict HMAC-SHA256 Payload Binding).
 * 5. الحماية المطلقة من استبدال أو تعديل البيانات المعتمدة (Payload Substitution Immunity).
 */
export class HumanApprovalService {
  // مخزن استهلاك التذاكر المركزي (يدعم التشارك بين النسخ)
  static #centralUsedTicketsStore = new Map();
  static #ticketStore = new Map();

  /**
   * ربط مخزن تذاكر مركزي مخصص (للاختبارات ومحاكاة النسخ المتعددة)
   */
  static setCentralUsedTicketsStore(store) {
    this.#centralUsedTicketsStore = store;
  }

  static getCentralUsedTicketsStore() {
    return this.#centralUsedTicketsStore;
  }

  static clearStores() {
    this.#centralUsedTicketsStore.clear();
    this.#ticketStore.clear();
  }

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
   * تسجيل استهلاك التذكرة ذرياً في المخزن المركزي المشترك
   */
  static async #atomicConsumeTicket(ticketId, ticketData, partnerId, toolName) {
    // 1. في البيئة السحابية: نستخدم Cloud Firestore للمعاملات الذرية المركزية
    if (FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: تعذر التحقق من استهلاك التذكرة مركزياً في البيئة السحابية.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }

      const collName = FirebaseAdminService.getCollectionName('system_used_tickets');
      const docRef = db.collection(collName).doc(ticketId);

      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (doc.exists) {
          const replayErr = new Error('REPLAY_DETECTED: تذكرة الاعتماد هذه تم استخدامها مسبقاً في نسخة سحابية أخرى.');
          replayErr.code = 'REPLAYED_APPROVAL_TICKET';
          replayErr.status = 403;
          throw replayErr;
        }

        transaction.set(docRef, {
          ticketId,
          toolName,
          partnerId,
          consumedAt: new Date().toISOString(),
          consumedByInstance: process.env.K_REVISION || `proc-${process.pid}`
        });
      });

      return;
    }

    // 2. في بيئة الاختبارات أو التطوير المحلي: نستخدم المخزن المشترك
    if (this.#centralUsedTicketsStore.has(ticketId)) {
      const replayErr = new Error('REPLAY_DETECTED: تذكرة الاعتماد هذه تم استخدامها بالفعل ولا يمكن إعادة استخدامها.');
      replayErr.code = 'REPLAYED_APPROVAL_TICKET';
      replayErr.status = 403;
      throw replayErr;
    }

    this.#centralUsedTicketsStore.set(ticketId, {
      ticketId,
      toolName,
      partnerId,
      consumedAt: new Date().toISOString()
    });
  }

  /**
   * تدقيق والتحقق التشفيري الصارم من تذكرة الاعتماد قبل تنفيذ العملية
   */
  static async verifyAndConsumeTicket(toolName, args, partner, providedTicket) {
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

    // 3. التحقق من التوقيع الرقمي لمنع التزوير
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

    // 4. التحقق من عدم انتهاء الصلاحية الزمنية
    if (Date.now() > Number(expiresAt)) {
      const err = new Error('EXPIRED_TICKET: انتهت صلاحية تذكرة الاعتماد (المهلة القصوى 10 دقائق). يرجى طلب الاقتراح مجدداً.');
      err.code = 'EXPIRED_APPROVAL_TICKET';
      err.status = 400;
      throw err;
    }

    // 5. التحقق من تطابق الشريك المصرح له (Cross-Partner Execution Prevention)
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

    // 6. التحقق من عدم التلاعب في البيانات (Payload Tampering Prevention)
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

    // 7. الاستهلاك المركزي الذري (مقاوم لإعادة الاستخدام عبر كافة النسخ السحابية)
    await this.#atomicConsumeTicket(ticketId, providedTicket, partnerId, toolName);
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
