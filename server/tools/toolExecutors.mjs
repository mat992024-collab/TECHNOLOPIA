// server/tools/toolExecutors.mjs
import { RealDataProvider } from '../data/realDataProvider.mjs';
import { AuditLogger } from '../services/auditLogger.mjs';
import { TOOL_PERMISSIONS } from './toolDefinitions.mjs';
import { GitHubService } from '../services/githubService.mjs';
import { GeminiCodeAdvisor } from '../services/geminiCodeAdvisor.mjs';

/**
 * القائمة البيضاء الصارمة للأدوات المصرح بها (Strict Tool Whitelist)
 * أي أداة غير مدرجة في هذه القائمة تُحظر فوراً مع تسجيل إنذار أمني
 */
export const AUTHORIZED_TOOL_WHITELIST = new Set([
  'get_company_overview',
  'get_projects',
  'get_project_details',
  'get_tasks',
  'get_financial_summary',
  'get_crm_leads',
  'get_audit_logs',
  'propose_project_improvement',
  'draft_new_task',
  'github_get_accounts',
  'github_list_repositories',
  'github_analyze_repository'
]);

/**
 * منفذ أدوات المساعد الذكي
 * يربط كل أداة ببيانات TECHNOLOPIA الحقيقية ويسجل كل حركة أمنياً
 */
export class ToolExecutors {
  /**
   * تنفيذ أداة معينة بناءً على اسمها ومدخلاتها مع التحقق الصارم من القائمة البيضاء والصلاحيات
   */
  static async execute(toolName, args = {}, partner = { id: 'system', name: 'System' }) {
    // 1. التحقق الصارم من القائمة البيضاء (Strict Whitelist Check)
    if (!AUTHORIZED_TOOL_WHITELIST.has(toolName)) {
      AuditLogger.log({
        partnerId: partner.id || 'anonymous',
        eventType: 'SECURITY_ALERT',
        toolName,
        inputPayload: args,
        status: 'BLOCKED',
        error: `محاولة استدعاء أداة غير مصرح بها خارج القائمة البيضاء المعتمدة: ${toolName}`
      });
      const secErr = new Error(`مرفوض أمنياً: الأداة المطلوبة (${toolName}) غير مصرح بها في القائمة البيضاء.`);
      secErr.code = 'UNAUTHORIZED_TOOL';
      throw secErr;
    }

    const permission = TOOL_PERMISSIONS[toolName];
    if (!permission) {
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

        case 'github_get_accounts': {
          result = await GitHubService.getAccountsStatus();
          break;
        }

        case 'github_list_repositories': {
          result = await GitHubService.listAllRepositories();
          break;
        }

        case 'github_analyze_repository': {
          const allRepos = await GitHubService.listAllRepositories();
          const target = allRepos.find(r => r.name.toLowerCase() === args.repoName?.toLowerCase() || r.fullName?.toLowerCase() === args.repoName?.toLowerCase());
          if (!target) {
            result = { error: `المستودع (${args.repoName}) غير موجود في الحسابات المتصلة.` };
          } else {
            const details = await GitHubService.getRepositoryDetails(target.owner, target.name);
            result = await GeminiCodeAdvisor.analyzeProject(details, partner);
          }
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
