// server/geminiAgent.mjs
import { GoogleGenAI } from '@google/genai';
import { GEMINI_TOOL_DECLARATIONS } from './tools/toolDefinitions.mjs';
import { ToolExecutors } from './tools/toolExecutors.mjs';
import { AuditLogger } from './services/auditLogger.mjs';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-pro';

const SYSTEM_INSTRUCTION = `أنت المساعد التنفيذي والشريك الاستشاري الذكي (AI Executive Co-Founder & Business Manager) لشركة البرمجيات المصرية TECHNOLOPIA.
الشركاء المؤسسون: م. محمد البحر (تقني & Full-Stack) وم. طارق حافظ (أعمال & مبيعات)، متساويان في الشراكة.

قواعد العمل الصارمة والمقدسة:
1. أنت متصل بالنظام الحقيقي لشركة TECHNOLOPIA عبر أدوات (Function Calling) رسمية.
2. لا تخترع مشروعات، ولا عملاء، ولا أرقام أرباح، ولا مصروفات، ولا إحصائيات غير حقيقية على الإطلاق.
3. إذا طلب منك الشريك أي معلومات عن المشروعات، أو المهام، أو العملاء، أو المالية، استدعِ الأداة المناسبة فوراً (مثل get_company_overview أو get_projects أو get_tasks أو get_financial_summary).
4. تذكر دائماً قاعدة توزيع الأرباح الصارمة (25% محمد البحر، 25% طارق حافظ، 25% صندوق تطوير الشركة، 25% صدقة جارية).
5. عند اقتراح تحسينات للمشروعات (propose_project_improvement) أو صياغة مهام جديدة (draft_new_task)، يتم حفظها كمسودات تتطلب موافقة الشريكين أولاً قبل اعتمادها.
6. الأسلوب: مصري ذكي ومحترف، بدون تنظير أو حشو، تنفيذي سريع يبحث عن الفرص الحقيقية وسرعة تحقيق الإيرادات للشركة.`;

export class GeminiAgent {
  static getActiveModel() {
    return process.env.GEMINI_MODEL || PRIMARY_MODEL;
  }

  static getFallbackModel() {
    return process.env.GEMINI_FALLBACK_MODEL || FALLBACK_MODEL;
  }

  static getApiKey() {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }

  static getClient() {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  /**
   * إرسال رسالة إلى المساعد التنفيذي ومعالجة استدعاء الأدوات تلقائياً (Function Calling Loop)
   */
  static async chat(userMessage, partner, conversationHistory = []) {
    const apiKey = this.getApiKey();

    // 1. تسجيل رسالة المستخدم في سجل التدقيق
    AuditLogger.log({
      partnerId: partner.id,
      eventType: 'USER_MESSAGE',
      inputPayload: { message: userMessage },
      status: 'SUCCESS'
    });

    // 2. إذا لم يكن المفتاح متوفراً في ملف البيئة، تشغيل المحرك الذكي الاحتياطي (Local Intent Engine)
    if (!apiKey) {
      return this.handleLocalIntentFallback(userMessage, partner);
    }

    const ai = this.getClient();
    let currentModel = PRIMARY_MODEL;

    try {
      // بناء سجل المحادثة المتسلسل
      const contents = [];
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      // استدعاء Gemini مع تفعيل Function Calling
      let response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
          temperature: 0.2
        }
      });

      const toolsUsed = [];
      let iterations = 0;
      const MAX_ITERATIONS = 5;

      // حلقة استدعاء الأدوات (Tool Calling Loop)
      while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        const functionCall = response.functionCalls[0];
        const toolName = functionCall.name;
        const toolArgs = functionCall.args || {};

        // تنفيذ الأداة مع تدقيق الصلاحيات
        const executionResult = await ToolExecutors.execute(toolName, toolArgs, partner);
        toolsUsed.push({
          tool: toolName,
          args: toolArgs,
          result: executionResult.data
        });

        // إرسال نتيجة الأداة إلى Gemini ليكمل صياغة الرد
        contents.push({
          role: 'model',
          parts: [{ functionCall }]
        });

        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: toolName,
              response: { output: executionResult.data }
            }
          }]
        });

        response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
            temperature: 0.2
          }
        });
      }

      const replyText = response.text || 'تم معالجة الطلب بنجاح عبر أدوات النظام.';

      // تسجيل رد المساعد في سجل التدقيق
      AuditLogger.log({
        partnerId: partner.id,
        eventType: 'AGENT_RESPONSE',
        outputSummary: replyText.substring(0, 300),
        status: 'SUCCESS'
      });

      return {
        success: true,
        model: currentModel,
        reply: replyText,
        toolsUsed,
        liveApiKeyUsed: true
      };

    } catch (err) {
      // تجربة النموذج الاحتياطي FALLBACK_MODEL في حال واجه النموذج الأساسي ضغطاً
      if (currentModel === PRIMARY_MODEL && err.message?.includes('503') || err.message?.includes('overloaded')) {
        currentModel = FALLBACK_MODEL;
        // محاولة بديلة...
      }

      AuditLogger.log({
        partnerId: partner.id,
        eventType: 'AGENT_RESPONSE',
        status: 'ERROR',
        error: err.message
      });

      throw err;
    }
  }

  /**
   * محرك محلي احتياطي (Local Intent Engine)
   * يفعل الأدوات الحقيقية حتى في غياب المفتاح لضمان استمرارية التطوير والاختبار المحلي
   */
  static async handleLocalIntentFallback(userMessage, partner) {
    const text = userMessage.toLowerCase();
    const toolsUsed = [];
    let reply = '';

    if (text.includes('مشروع') || text.includes('مشاريع') || text.includes('projects')) {
      const exec = await ToolExecutors.execute('get_projects', {}, partner);
      toolsUsed.push(exec);
      reply = `قمت بفحص قاعدة بيانات المشروعات الحقيقية لشركة TECHNOLOPIA (تم العثور على ${exec.data.length} مشروعات حقيقية). أبرزها:\n` +
        exec.data.slice(0, 4).map(p => `- **${p.title}** (${p.status || 'قيد التطوير'} - التقنيات: ${p.techStack || 'React/Node'})`).join('\n') +
        `\n\n📌 *ملاحظة النظام:* تم جلب البيانات الحقيقية محلياً. لربط استدعاءات Gemini المباشرة، يرجى إضافة GEMINI_API_KEY في ملف .env بالخادم.`;

    } else if (text.includes('مالي') || text.includes('ارباح') || text.includes('أرباح') || text.includes('فلوس') || text.includes('finance')) {
      const exec = await ToolExecutors.execute('get_financial_summary', {}, partner);
      toolsUsed.push(exec);
      reply = `قمت بحساب الوضع المالي الحقيقي للشركة وفق معادلة الأرباح الأربعة الصارمة (25% لكل جهة):\n` +
        `- إجمالي الإيرادات الفعلية: **${exec.data.totalRevenue} ج.م**\n` +
        `- إجمالي المصروفات المعتمدة: **${exec.data.totalExpenses} ج.م**\n` +
        `- صافي الأرباح القابلة للتوزيع: **${exec.data.netProfit} ج.م**\n` +
        `*توزيع الأرباح العادل:*\n` +
        `  - حصة م. محمد البحر (25%): ${exec.data.distributions.partnerMohamedShare} ج.م\n` +
        `  - حصة م. طارق حافظ (25%): ${exec.data.distributions.partnerTarekShare} ج.م\n` +
        `  - صندوق تطوير الشركة (25%): ${exec.data.distributions.devFundShare} ج.م\n` +
        `  - الصدقة الجارية وبواقي القروش (25%): ${exec.data.distributions.sadaqahShare} ج.م\n\n` +
        `📌 *البيانات حقيقية 100% وبدون أي معاملات وهمية.*`;

    } else if (text.includes('مهم') || text.includes('مهام') || text.includes('tasks')) {
      const exec = await ToolExecutors.execute('get_tasks', {}, partner);
      toolsUsed.push(exec);
      reply = `قمت بفحص سجل المهام الحقيقي لشركة TECHNOLOPIA (إجمالي ${exec.data.length} مهام مسجلة):\n` +
        exec.data.slice(0, 5).map(t => `- [${t.priority === 'urgent' ? '🚨 عاجل' : '📌'}] **${t.title}** (المكلف: ${t.assignedTo} | الحالة: ${t.status})`).join('\n') +
        `\n\n📌 جميع المهام مرتبطة بأهداف الشركة التنفيذية.`;

    } else if (text.includes('عميل') || text.includes('عملاء') || text.includes('clients') || text.includes('leads')) {
      const exec = await ToolExecutors.execute('get_crm_leads', {}, partner);
      toolsUsed.push(exec);
      reply = `قائمة العملاء الحقيقيين المسجلين في CRM (العدد: ${exec.data.length}):\n` +
        exec.data.map(c => `- **${c.businessName || c.name}** (الحالة: ${c.status || 'lead'} | هاتف: ${c.phone || 'غير مسجل'})`).join('\n');

    } else {
      const exec = await ToolExecutors.execute('get_company_overview', {}, partner);
      toolsUsed.push(exec);
      reply = `مرحباً بك يا ${partner.name}. أنا المساعد التنفيذي الذكي لشركة TECHNOLOPIA.\n` +
        `حالة الشركة اللحظية:\n` +
        `- المشروعات: ${exec.data.metrics.totalProjects} مشروعات مسجلة.\n` +
        `- المهام المعلقة: ${exec.data.metrics.pendingTasks} مهام (منها ${exec.data.metrics.urgentTasks} عاجلة).\n` +
        `- العملاء: ${exec.data.metrics.totalClients} عملاء مسجلين.\n` +
        `- صافي الأرباح: ${exec.data.metrics.netProfit} ج.م (بيانات حقيقية).\n\n` +
        `أنا جاهز لاستقبال توجيهاتك أو تقديم اقتراحات تحسين استباقية لمشروعاتنا.`;
    }

    AuditLogger.log({
      partnerId: partner.id,
      eventType: 'AGENT_RESPONSE',
      outputSummary: reply.substring(0, 300),
      status: 'SUCCESS'
    });

    return {
      success: true,
      model: `${PRIMARY_MODEL} (Local Intent Emulator)`,
      reply,
      toolsUsed,
      liveApiKeyUsed: false
    };
  }
}
