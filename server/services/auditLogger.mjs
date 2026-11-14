// server/services/auditLogger.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.resolve(__dirname, '../../backups/tecnolobia_ai_audit_logs.json');

export class AuditLogger {
  /**
   * تسجيل عملية جديدة في سجل التدقيق غير القابل للتلاعب
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

    const logEntry = {
      id: `ai-audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      partnerId: event.partnerId || 'unknown',
      eventType: event.eventType || 'TOOL_CALL',
      toolName: event.toolName || null,
      inputPayload: event.inputPayload || null,
      outputSummary: event.outputSummary || null,
      permissionLevel: event.permissionLevel || 'READ_ONLY',
      status: event.status || 'SUCCESS',
      error: event.error || null
    };

    logs.push(logEntry);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return logEntry;
  }

  /**
   * استرجاع أحدث السجلات
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
}
