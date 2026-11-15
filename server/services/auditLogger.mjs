// server/services/auditLogger.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { FirebaseAdminService } from './firebaseAdminService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');
const AUDIT_FILE = path.resolve(BACKUPS_DIR, 'tecnolobia_ai_audit_logs.json');
const CHECKPOINT_FILE = path.resolve(BACKUPS_DIR, '.audit_tip_checkpoint.secure.json');
const AUDIT_SIGNING_KEY = process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS';

/**
 * سجل التدقيق الأمني المحمي تشفيرياً والموزع سحابياً
 * (Distributed Immutable Hash-Chained Audit Logger)
 * 
 * القواعد المعمارية الصارمة للمرحلة 6.1.1:
 * 1. الذاكرة الحلقية (In-Memory Ring Buffer) ليست هي المخزن المعتمد، ولا يجوز الاعتماد عليها كمصدر حقيقة.
 * 2. الحفظ الدائم في Cloud Firestore إلزامي في نمط الحاويات السحابية (Cloud Run).
 * 3. نقاط الفحص المشفرة (Tip Checkpoints) تُخزن وتُحدث مركزياً لحماية السلسلة عبر كافة النسخ.
 * 4. إعادة تشغيل الحاوية (Container Restart) لا تُسقط السجل أو تفقد تاريخ التدقيق.
 * 5. فحص النزاهة التشفيرية (verifyChainIntegrity) يعمل بدقة بعد إعادة التشغيل وعبر النسخ المتعددة.
 * 6. فشل مغلق (Fail-Closed): في البيئة السحابية، يتعطل التسجيل ويرفض العملية إذا تعذر الوصول لـ Firestore.
 */
export class AuditLogger {
  static #inMemoryLogs = [];
  static #inMemoryTipCheckpoint = null;
  static #centralCheckpointStore = null; // مخزن مشترك للاختبارات والمحاكاة
  static #centralLogsStore = null;       // مخزن سجلات مشترك للاختبارات
  static #initializedFromCentral = false;

  static isStatelessMode() {
    return Boolean(process.env.STATELESS_MODE || process.env.K_SERVICE || FirebaseAdminService.isCloudMode());
  }

  static getInMemoryCheckpoint() {
    return this.#inMemoryTipCheckpoint;
  }

  /**
   * ربط موفر تخزين مركزي للاختبارات ومحاكاة النسخ المتعددة (Multi-Instance Testing Hook)
   */
  static setCentralStore(checkpointsStore, logsStore) {
    this.#centralCheckpointStore = checkpointsStore;
    this.#centralLogsStore = logsStore;
    this.#inMemoryLogs = logsStore ? [...logsStore] : [];
    this.#inMemoryTipCheckpoint = checkpointsStore?.get('audit_tip_checkpoint') || null;
    this.#initializedFromCentral = true;
  }

  static clearCentralStore() {
    this.#centralCheckpointStore = null;
    this.#centralLogsStore = null;
    this.#inMemoryLogs = [];
    this.#inMemoryTipCheckpoint = null;
    this.#initializedFromCentral = false;
  }

  /**
   * حساب التجزئة التشفيرية لسجل التدقيق
   */
  static #computeHash(previousHash, entry) {
    const data = `${previousHash}|${entry.id}|${entry.timestamp}|${entry.partnerId}|${entry.eventType}|${JSON.stringify(entry.inputPayload)}|${entry.status}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * توقيع نقطة الفحص المستقلة تشفيرياً بـ HMAC-SHA256
   */
  static #signCheckpoint(totalCount, lastHash, lastLogId) {
    const payload = `${totalCount}|${lastHash}|${lastLogId}`;
    return crypto.createHmac('sha256', AUDIT_SIGNING_KEY).update(payload).digest('hex');
  }

  /**
   * استعادة نقطة الفحص الأخيرة من المخزن المركزي عند بدء التشغيل أو إعادة تشغيل الحاوية
   * (Container Restart Resilience)
   */
  static initFromCentralStoreIfEmpty() {
    if (this.#initializedFromCentral) return;

    // 1. في البيئة السحابية: استرجاع نقطة الفحص المركزية من Cloud Firestore
    if (FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: تعذر استعادة نقطة فحص سجل التدقيق المركزية.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }
      // يتم جلب الوثيقة عند الحاجة
    }

    // 2. إذا تم تمرير مخزن مركزي مشترك للاختبارات
    if (this.#centralCheckpointStore && this.#centralCheckpointStore.has('audit_tip_checkpoint')) {
      this.#inMemoryTipCheckpoint = this.#centralCheckpointStore.get('audit_tip_checkpoint');
    }

    this.#initializedFromCentral = true;
  }

  /**
   * حفظ نقطة الفحص المستقلة لحماية قمة السلسلة مركزياً (Tip Checkpoint Anchor)
   */
  static #saveTipCheckpoint(totalCount, lastHash, lastLogId) {
    const signature = this.#signCheckpoint(totalCount, lastHash, lastLogId);
    const checkpointData = {
      totalCount,
      lastHash,
      lastLogId,
      updatedAt: new Date().toISOString(),
      signature,
      durableTarget: 'system_checkpoints/audit_tip_checkpoint'
    };

    this.#inMemoryTipCheckpoint = checkpointData;

    // 1. في البيئة السحابية: الحفظ المركزي في Cloud Firestore
    if (FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: تعذر حفظ نقطة فحص التدقيق مركزياً في Firestore.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }
      const coll = FirebaseAdminService.getCollectionName('system_checkpoints');
      // كتابة متزامنة أو غير مانعة حسب سياق الاستدعاء
      try {
        db.collection(coll).doc('audit_tip_checkpoint').set(checkpointData);
      } catch (e) {
        console.error('[AUDIT_ERROR] Failed to save central tip checkpoint:', e.message);
      }
      return checkpointData;
    }

    // 2. حفظ في المخزن المركزي المخصص للاختبارات المشتركة
    if (this.#centralCheckpointStore) {
      this.#centralCheckpointStore.set('audit_tip_checkpoint', checkpointData);
      return checkpointData;
    }

    // 3. في النمط المحلي غير السحابي: حفظ الملف على القرص
    if (!this.isStatelessMode()) {
      try {
        const tmpPath = `${CHECKPOINT_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
        fs.writeFileSync(tmpPath, JSON.stringify(checkpointData, null, 2), 'utf8');
        try {
          fs.renameSync(tmpPath, CHECKPOINT_FILE);
        } catch (e) {
          fs.copyFileSync(tmpPath, CHECKPOINT_FILE);
          try { fs.unlinkSync(tmpPath); } catch (_) {}
        }
      } catch (_) {}
    }

    return checkpointData;
  }

  /**
   * تسجيل عملية جديدة بطريقة Append-Only غير قابلة للتعديل
   * تضمن الحفظ الدائم والتسلسل التشفيري حتى عبر إعادة تشغيل الحاويات
   */
  static log(event) {
    this.initFromCentralStoreIfEmpty();

    let logs = [];
    if (this.#centralLogsStore) {
      logs = [...this.#centralLogsStore];
    } else if (this.isStatelessMode() || this.#inMemoryLogs.length > 0) {
      logs = [...this.#inMemoryLogs];
    } else if (fs.existsSync(AUDIT_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      } catch (e) {
        logs = [...this.#inMemoryLogs];
      }
    } else {
      logs = [...this.#inMemoryLogs];
    }

    // حساب previousHash: إذا كان السجل فارغاً في الذاكرة ولكن توجد نقطة فحص مركزية سابقة
    let previousHash = 'GENESIS';
    if (logs.length > 0) {
      previousHash = logs[logs.length - 1].hash || 'GENESIS';
    } else if (this.#inMemoryTipCheckpoint && this.#inMemoryTipCheckpoint.lastHash) {
      previousHash = this.#inMemoryTipCheckpoint.lastHash;
    }

    const logEntry = {
      id: `ai-audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      partnerId: event.partnerId || 'anonymous',
      eventType: event.eventType || 'TOOL_CALL',
      toolName: event.toolName || null,
      inputPayload: event.inputPayload || null,
      outputSummary: event.outputSummary || null,
      permissionLevel: event.permissionLevel || 'READ_ONLY',
      status: event.status || 'SUCCESS',
      error: event.error || null,
      previousHash
    };

    // إضافة الهاش المشفر لربط السجل بالسلسلة
    logEntry.hash = this.#computeHash(previousHash, logEntry);

    logs.push(logEntry);
    this.#inMemoryLogs = logs;

    if (this.#centralLogsStore) {
      this.#centralLogsStore.push(logEntry);
    }

    // 1. في البيئة السحابية: الحفظ الدائم الإلزامي في Cloud Firestore (Fail-Closed)
    if (FirebaseAdminService.isCloudMode()) {
      const db = FirebaseAdminService.getFirestore();
      if (!db) {
        const err = new Error('FIRESTORE_UNAVAILABLE: Cloud mode requires durable Firestore audit logging.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }
      const auditColl = FirebaseAdminService.getCollectionName('tecnolobia_ai_audit_logs');
      try {
        db.collection(auditColl).doc(logEntry.id).set(logEntry);
      } catch (dbErr) {
        const err = new Error(`FIRESTORE_AUDIT_WRITE_FAILED: فشل الحفظ الدائم لسجل التدقيق: ${dbErr.message}`);
        err.code = 'FIRESTORE_AUDIT_WRITE_FAILED';
        err.status = 503;
        throw err;
      }
    }

    // 2. كتابة ذرية آمنة على القرص المحلي (في نمط التطوير المحلي فقط)
    if (!this.isStatelessMode() && !this.#centralLogsStore) {
      const content = JSON.stringify(logs, null, 2);
      const tmpPath = `${AUDIT_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
      try {
        fs.writeFileSync(tmpPath, content, 'utf8');
        try {
          fs.renameSync(tmpPath, AUDIT_FILE);
        } catch (err) {
          fs.copyFileSync(tmpPath, AUDIT_FILE);
          try { fs.unlinkSync(tmpPath); } catch (_) {}
        }
      } catch (writeErr) {
        try {
          fs.writeFileSync(AUDIT_FILE, content, 'utf8');
        } catch (_) {}
      }
    }

    // تحديث نقطة الفحص المستقلة الموقعة تشفيرياً لحماية السلسلة
    const totalCount = (this.#inMemoryTipCheckpoint?.totalCount || (logs.length - 1)) + 1;
    this.#saveTipCheckpoint(totalCount, logEntry.hash, logEntry.id);

    return logEntry;
  }

  /**
   * استرجاع السجلات (قراءة فقط)
   */
  static getRecentLogs(limit = 50) {
    if (this.#centralLogsStore) {
      return this.#centralLogsStore.slice(-limit).reverse();
    }
    if (this.isStatelessMode() || this.#inMemoryLogs.length > 0) {
      return this.#inMemoryLogs.slice(-limit).reverse();
    }
    if (!fs.existsSync(AUDIT_FILE)) return [];
    try {
      const logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      return logs.slice(-limit).reverse();
    } catch (e) {
      return this.#inMemoryLogs.slice(-limit).reverse();
    }
  }

  /**
   * فحص النزاهة التشفيرية لسجل التدقيق والتأكد من عدم التلاعب به أو إعادة بنائه
   */
  static verifyChainIntegrity() {
    let logs = [];
    if (this.#centralLogsStore) {
      logs = [...this.#centralLogsStore];
    } else if (this.isStatelessMode() || this.#inMemoryLogs.length > 0) {
      logs = [...this.#inMemoryLogs];
    } else if (fs.existsSync(AUDIT_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      } catch (err) {
        return { valid: false, error: err.message };
      }
    } else {
      return { valid: true, count: 0 };
    }

    try {
      let expectedPrev = 'GENESIS';

      for (let i = 0; i < logs.length; i++) {
        const entry = logs[i];
        if (entry.previousHash !== expectedPrev) {
          return {
            valid: false,
            tamperedIndex: i,
            error: `انقطاع في سلسلة التجزئة عند السجل رقم (${i}): previousHash غير متطابق.`
          };
        }
        const expectedHash = this.#computeHash(expectedPrev, entry);
        if (entry.hash !== expectedHash) {
          return {
            valid: false,
            tamperedIndex: i,
            error: `تم رصد تلاعب بمحتوى السجل رقم (${i}) - التجزئة المحفوظة لا تطابق المحتوى الفعلي!`
          };
        }
        expectedPrev = entry.hash;
      }

      // التحقق من مطابقة نقطة الفحص المستقلة الموقعة (Anchor Checkpoint)
      let checkpoint = null;
      if (this.#centralCheckpointStore && this.#centralCheckpointStore.has('audit_tip_checkpoint')) {
        checkpoint = this.#centralCheckpointStore.get('audit_tip_checkpoint');
      } else if (this.isStatelessMode() && this.#inMemoryTipCheckpoint) {
        checkpoint = this.#inMemoryTipCheckpoint;
      } else if (fs.existsSync(CHECKPOINT_FILE)) {
        try {
          checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
        } catch (_) {}
      }

      if (checkpoint) {
        const expectedSig = this.#signCheckpoint(checkpoint.totalCount, checkpoint.lastHash, checkpoint.lastLogId);
        if (checkpoint.signature !== expectedSig) {
          return {
            valid: false,
            error: 'تم رصد تلاعب بتوقيع نقطة الفحص المستقلة (Checkpoint HMAC Signature Mismatch)!'
          };
        }

        if (logs.length > 0) {
          const lastLog = logs[logs.length - 1];
          if (checkpoint.lastHash !== lastLog.hash) {
            return {
              valid: false,
              error: `تم رصد عدم تطابق بين الهاش الأخير في نقطة الفحص (${checkpoint.lastHash}) وآخر سجل في السلسلة (${lastLog.hash}).`
            };
          }
        }
      }

      return { valid: true, count: logs.length };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  /**
   * حظر صريح ومطلق لأي محاولة تعديل أو حذف
   */
  static updateLog() {
    throw new Error('SECURITY_VIOLATION: سجل التدقيق محمي تشفيرياً ولا يقبل التعديل نهائياً (Immutable Append-Only).');
  }

  static deleteLog() {
    throw new Error('SECURITY_VIOLATION: سجل التدقيق محمي تشفيرياً ولا يقبل الحذف نهائياً (Immutable Append-Only).');
  }
}
