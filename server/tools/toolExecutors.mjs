// server/tools/toolExecutors.mjs
import { RealDataProvider } from '../data/realDataProvider.mjs';
import { AuditLogger } from '../services/auditLogger.mjs';
import { TOOL_PERMISSIONS } from './toolDefinitions.mjs';

/**
 * منفذ أدوات المساعد الذكي
 * يربط كل أداة ببيانات TECHNOLOPIA الحقيقية ويسجل كل حركة أمنياً
 */
export class ToolExecutors {
  /**
   * تنفيذ أداة معينة بناءً على اسمها ومدخلاتها مع التحقق من الصلاحيات
   */
  static async execute(toolName, args = {}, partner = { id: 'system', name: 'System' }) {
    const permission = TOOL_PERMISSIONS[toolName];
    if (!permission) {
      AuditLogger.log({
        partnerId: partner.id,
        eventType: 'TOOL_REJECTED',
        toolName,
        inputPayload: args,
        status: 'BLOCKED',
        error: `أداة غير معروفة: ${toolName}`
      });
      throw new Error(`الأداة المطلوبة غير مسجلة في النظام: ${toolName}`);
    }

    try {
      let result;

      switch (toolName) {
        case 'get_company_overview':
          result = RealDataProvider.getCompanyOverview();
          break;

        case 'get_projects':
          result = RealDataProvider.getProjects(args);
          break;

        case 'get_project_details':
          result = RealDataProvider.getProjectById(args.projectId);
          if (!result) {
            result = { error: `المشروع رقم (${args.projectId}) غير موجود في قاعدة بيانات الشركة` };
          }
          break;

        case 'get_tasks':
          result = RealDataProvider.getTasks(args);
          break;

        case 'get_financial_summary':
          result = RealDataProvider.getFinancialSummary();
          break;

        case 'get_crm_leads':
          result = RealDataProvider.getClients(args);
          break;

        case 'get_audit_logs':
          result = AuditLogger.getRecentLogs(args.limit || 20);
          break;

        case 'propose_project_improvement': {
          const proposal = RealDataProvider.saveAiProposal({
            ...args,
            proposedByPartner: partner.id,
            partnerName: partner.name
          });
          result = {
            success: true,
            message: 'تم تسجيل مقترح التحسين كمسودة بنجاح بانتظار مراجعة واعتماد الشريكين.',
            proposal
          };
          break;
        }

        case 'draft_new_task': {
          const draftTask = RealDataProvider.saveDraftTask({
            ...args,
            draftedByPartner: partner.id,
            partnerName: partner.name
          });
          result = {
            success: true,
            message: 'تم إنشاء مسودة المهمة بنجاح مع خطواتها التفصيلية بانتظار اعتماد الشريك.',
            draftTask
          };
          break;
        }

        default:
          throw new Error(`لم يتم برمجة منفذ للأداة: ${toolName}`);
      }

      // تسجيل العملية بنجاح في سجل التدقيق
      AuditLogger.log({
        partnerId: partner.id,
        eventType: 'TOOL_CALL',
        toolName,
        inputPayload: args,
        outputSummary: typeof result === 'object' ? JSON.stringify(result).substring(0, 300) : String(result),
        permissionLevel: permission.level,
        status: 'SUCCESS'
      });

      return {
        tool: toolName,
        success: true,
        permissionLevel: permission.level,
        data: result
      };

    } catch (err) {
      AuditLogger.log({
        partnerId: partner.id,
        eventType: 'TOOL_CALL',
        toolName,
        inputPayload: args,
        status: 'ERROR',
        error: err.message,
        permissionLevel: permission.level
      });
      throw err;
    }
  }
}
