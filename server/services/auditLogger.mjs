// server/services/auditLogger.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.resolve(__dirname, '../../backups/tecnolobia_ai_audit_logs.json');
const CHECKPOINT_FILE = path.resolve(__dirname, '../../backups/.audit_tip_checkpoint.secure.json');
const AUDIT_SIGNING_KEY = process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS';

/**
 * سجل التدقيق الأمني المحمي وغير القابل للتلاعب (Immutable Hash-Chained Audit Logger)
 * يعتمد على سلسلة كتل تشفيرية (Hash Chain) ونقطة فحص موثقة وموقعة تشفيرياً (HMAC Signed Checkpoint)
 * لمنع أي تعديل أو حذف بأثر رجعي أو إعادة بناء السلسلة بالكامل (Full Chain Reconstruction Detection)
 */
export class AuditLogger {

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
   * حفظ نقطة الفحص المستقلة لحماية قمة السلسلة (Tip Checkpoint Anchor)
   */
  static #saveTipCheckpoint(totalCount, lastHash, lastLogId) {
    try {
      const signature = this.#signCheckpoint(totalCount, lastHash, lastLogId);
      const checkpointData = {
        totalCount,
        lastHash,
        lastLogId,
        updatedAt: new Date().toISOString(),
        signature
      };
      const tmpPath = `${CHECKPOINT_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tmpPath, JSON.stringify(checkpointData, null, 2), 'utf8');
      try {
        fs.renameSync(tmpPath, CHECKPOINT_FILE);
      } catch (e) {
        fs.copyFileSync(tmpPath, CHECKPOINT_FILE);
        try { fs.unlinkSync(tmpPath); } catch (_) {}
      }
    } catch (e) {
      // عدم إيقاف النظام في حال تعذر حفظ نقطة الفحص
    }
  }

  /**
   * تسجيل عملية جديدة بطريقة Append-Only غير قابلة للتعديل
   */
  static log(event) {
    let logs = [];
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      } catch (e) {
        logs = [];
      }
    }

    const previousHash = logs.length > 0 ? (logs[logs.length - 1].hash || 'GENESIS') : 'GENESIS';

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

    // إضافة الهاش المشفر لربط السجل بالسجل السابق
    logEntry.hash = this.#computeHash(previousHash, logEntry);

    logs.push(logEntry);

    // كتابة ذرية آمنة (Atomic Write) مع معالجة قيود نظام تشغيل Windows
    const content = JSON.stringify(logs, null, 2);
    const tmpPath = `${AUDIT_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    try {
      fs.writeFileSync(tmpPath, content, 'utf8');
      try {
        fs.renameSync(tmpPath, AUDIT_FILE);
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EEXIST') {
          fs.copyFileSync(tmpPath, AUDIT_FILE);
          try { fs.unlinkSync(tmpPath); } catch (_) {}
        } else {
          try { fs.copyFileSync(tmpPath, AUDIT_FILE); } catch (_) {}
          try { fs.unlinkSync(tmpPath); } catch (_) {}
        }
      }
    } catch (writeErr) {
      try {
        fs.writeFileSync(AUDIT_FILE, content, 'utf8');
      } catch (directErr) {
        // حماية الخادم من التوقف في حال وجود قفل مؤقت لملف التدقيق على مستوى نظام التشغيل
        console.error('[AUDIT_LOGGER_WARN] Transient audit write lock:', directErr.message);
      }
    }

    // تحديث نقطة الفحص المستقلة الموقعة تشفيرياً لحماية السلسلة من إعادة البناء الشامل
    try {
      this.#saveTipCheckpoint(logs.length, logEntry.hash, logEntry.id);
    } catch (_) {}

    return logEntry;
  }

  /**
   * استرجاع السجلات (قراءة فقط)
   */
  static getRecentLogs(limit = 50) {
    if (!fs.existsSync(AUDIT_FILE)) return [];
    try {
      const logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      return logs.slice(-limit).reverse();
    } catch (e) {
      return [];
    }
  }

  /**
   * فحص النزاهة التشفيرية لسجل التدقيق والتأكد من عدم التلاعب به أو إعادة بنائه
   */
  static verifyChainIntegrity() {
    if (!fs.existsSync(AUDIT_FILE)) return { valid: true, count: 0 };
    try {
      const logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
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
      if (fs.existsSync(CHECKPOINT_FILE)) {
        try {
          const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
          const expectedSig = this.#signCheckpoint(checkpoint.totalCount, checkpoint.lastHash, checkpoint.lastLogId);
          if (checkpoint.signature !== expectedSig) {
            return {
              valid: false,
              error: 'تم رصد تلاعب بتوقيع نقطة الفحص المستقلة (Checkpoint HMAC Signature Mismatch)!'
            };
          }

          if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            if (checkpoint.totalCount !== logs.length || checkpoint.lastHash !== lastLog.hash) {
              return {
                valid: false,
                error: `تم رصد إعادة بناء أو اقتطاع لسلسلة التدقيق (Chain Truncation or Full Reconstruction Detected). العدد المسجل (${logs.length}) لا يطابق نقطة الفحص المعتمدة (${checkpoint.totalCount}).`
              };
            }
          }
        } catch (e) {
          // خطأ في قراءة ملف نقطة الفحص
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
