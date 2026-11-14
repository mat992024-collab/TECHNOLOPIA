// server/geminiAgent.mjs
import { GoogleGenAI } from '@google/genai';
import { GEMINI_TOOL_DECLARATIONS } from './tools/toolDefinitions.mjs';
import { ToolExecutors } from './tools/toolExecutors.mjs';
import { AuditLogger } from './services/auditLogger.mjs';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = (process.env.GEMINI_FALLBACK_MODEL && process.env.GEMINI_FALLBACK_MODEL !== 'gemini-2.5-flash')
  ? process.env.GEMINI_FALLBACK_MODEL
  : 'gemini-3-flash-preview';

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
    const model = process.env.GEMINI_FALLBACK_MODEL;
    if (!model || model === 'gemini-2.5-flash') return 'gemini-3-flash-preview';
    return model;
  }

  static getApiKey() {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }

  /**
   * تنقية نصوص الأخطاء وسجلات التتبع لحظر تسريب أي مفاتيح سرية نهائياً
   */
  static sanitizeError(err) {
    if (!err) return '';
    const msg = typeof err === 'string' ? err : (err.message || String(err));
    return msg
      .replace(/AQ\.[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
  }

  /**
   * تحديد ما إذا كان الخطأ عابراً يستوجب إعادة المحاولة (503, 429, 500, 502, 504, Timeout)
   */
  static isTransientError(err) {
    if (!err) return false;
    const status = err.status || err.statusCode || (err.response && err.response.status);
    if ([503, 429, 500, 502, 504].includes(status)) return true;

    const msg = String(err.message || err || '').toLowerCase();
    const transientKeywords = [
      '503', 'unavailable', 'high demand', 'spikes in demand', 'overloaded',
      '429', 'resource_exhausted', 'rate limit', 'quota exceeded',
      '500', 'internal error', '502', 'bad gateway', '504', 'gateway timeout',
      'timeout', 'etimedout', 'econnreset', 'network error', 'fetch failed'
    ];
    return transientKeywords.some(keyword => msg.includes(keyword));
  }

  /**
   * فحص ما إذا كان الخطأ متعلقاً بصلاحية أو سحب المفتاح
   */
  static isAuthError(err) {
    if (!err) return false;
    const status = err.status || err.statusCode || (err.response && err.response.status);
    const msg = String(err.message || err || '').toLowerCase();
    if ([400, 401, 403].includes(status)) {
      return msg.includes('api_key_invalid') || msg.includes('api key') || msg.includes('invalid') || msg.includes('unauthenticated') || status === 401;
    }
    return msg.includes('api_key_invalid') || msg.includes('api key not valid');
  }

  /**
   * سياسة إعادة المحاولة باستخدام التراجع الأسي (Exponential Backoff with Jitter)
   */
  static async callWithRetry(fn, options = {}) {
    const maxRetries = options.maxRetries ?? 2;
    const baseDelay = options.baseDelay ?? 1000;
    const backoffFactor = options.backoffFactor ?? 2;
    const partnerId = options.partnerId || 'system';

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;
        const isTransient = this.isTransientError(err);
        const isAuth = this.isAuthError(err);

        // إذا كان خطأ مصادقة صريح، نوقف المحاولات فوراً
        if (isAuth) {
          AuditLogger.log({
            partnerId,
            eventType: 'AGENT_AUTH_ERROR',
            inputPayload: { error: this.sanitizeError(err) },
            status: 'ERROR'
          });
          throw err;
        }

        // إذا لم يكن خطأ عابراً أو استنفدنا عدد المحاولات الأقصى
        if (!isTransient || attempt >= maxRetries) {
          throw err;
        }

        const delay = (baseDelay * Math.pow(backoffFactor, attempt)) + Math.floor(Math.random() * 250);
        AuditLogger.log({
          partnerId,
          eventType: 'API_RETRY_ATTEMPT',
          inputPayload: {
            attempt: attempt + 1,
            maxRetries,
            delayMs: delay,
            error: this.sanitizeError(err)
          },
          status: 'INFO'
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static getClient(apiKeyOverride) {
    const apiKey = apiKeyOverride || this.getApiKey();
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1beta' }
    });
  }

  /**
   * توليد محتوى نصي مباشر مع دعم Retry و Fallback التلقائي متعدد المستويات
   */
  static async generateContent(prompt, options = {}) {
    const apiKey = options.apiKey !== undefined ? options.apiKey : this.getApiKey();
    if (!apiKey) {
      throw new Error('NO_API_KEY: Gemini API Key is not configured');
    }

    const ai = this.getClient(apiKey);
    const primaryModel = options.model || this.getActiveModel();
    const fallbackModel = options.fallbackModel || this.getFallbackModel();
    const partnerId = options.partnerId || 'system';

    const candidateModels = [primaryModel];
    if (fallbackModel && !candidateModels.includes(fallbackModel)) candidateModels.push(fallbackModel);
    if (!candidateModels.includes('gemini-flash-lite-latest')) candidateModels.push('gemini-flash-lite-latest');

    const executeCall = async (model) => {
      return await this.callWithRetry(async () => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: options.systemInstruction || SYSTEM_INSTRUCTION,
            temperature: options.temperature ?? 0.2
          }
        });
        return {
          text: response.text || '',
          model,
          rawResponse: response
        };
      }, {
        maxRetries: options.maxRetries ?? 2,
        baseDelay: options.baseDelay ?? 1000,
        partnerId
      });
    };

    let lastError = null;
    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
      try {
        if (i > 0) {
          AuditLogger.log({
            partnerId,
            eventType: 'MODEL_FALLBACK',
            inputPayload: {
              from: candidateModels[i - 1],
              to: currentModel,
              reason: this.sanitizeError(lastError)
            },
            status: 'SUCCESS'
          });
        }

        const result = await executeCall(currentModel);
        if (i > 0) {
          result.fallbackEngaged = true;
          result.primaryModelAttempted = primaryModel;
        }
        return result;
      } catch (err) {
        lastError = err;
        if (this.isAuthError(err)) {
          throw err;
        }
        if (!this.isTransientError(err) && i === candidateModels.length - 1) {
          throw err;
        }
      }
    }

    throw lastError;
  }

  /**
   * إرسال رسالة إلى المساعد التنفيذي ومعالجة استدعاء الأدوات تلقائياً (Function Calling Loop)
   * مع حماية كاملة من HTTP 503 والانتقال التلقائي للنموذج البديل والتعامل مع أخطاء المفتاح
   */
  static async chat(userMessage, partner, conversationHistory = [], options = {}) {
    const apiKey = options.apiKey !== undefined ? options.apiKey : this.getApiKey();

    // 1. تسجيل رسالة المستخدم في سجل التدقيق
    AuditLogger.log({
      partnerId: partner?.id || 'unknown',
      eventType: 'USER_MESSAGE',
      inputPayload: { message: userMessage },
      status: 'SUCCESS'
    });

    // 2. إذا لم يكن المفتاح متوفراً، تشغيل المحرك الذكي الاحتياطي (Local Intent Engine)
    if (!apiKey) {
      return this.handleLocalIntentFallback(userMessage, partner);
    }

    const ai = this.getClient(apiKey);
    const primaryModel = options.model || this.getActiveModel();
    const fallbackModel = options.fallbackModel || this.getFallbackModel();

    const candidateModels = [primaryModel];
    if (fallbackModel && !candidateModels.includes(fallbackModel)) candidateModels.push(fallbackModel);
    if (!candidateModels.includes('gemini-flash-lite-latest')) candidateModels.push('gemini-flash-lite-latest');

    // بناء سجل المحادثة المتسلسل
    const buildInitialContents = () => {
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
      return contents;
    };

    // تنفيذ حلقة استدعاء الأدوات لنموذج محدد
    const runChatWithModel = async (modelToUse) => {
      const contents = buildInitialContents();
      const toolsUsed = [];
      let iterations = 0;
      const MAX_ITERATIONS = 5;

      let response = await this.callWithRetry(async () => {
        return await ai.models.generateContent({
          model: modelToUse,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
            temperature: 0.2
          }
        });
      }, {
        maxRetries: options.maxRetries ?? 2,
        baseDelay: options.baseDelay ?? 1000,
        partnerId: partner?.id
      });

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

        // الحفاظ على أجزاء رد النموذج كاملة بما فيها thought_signature لتوافق Gemini 3
        const modelContent = response.candidates?.[0]?.content || {
          role: 'model',
          parts: [{ functionCall }]
        };
        contents.push(modelContent);

        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: toolName,
              response: { output: executionResult.data }
            }
          }]
        });

        response = await this.callWithRetry(async () => {
          return await ai.models.generateContent({
            model: modelToUse,
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
              temperature: 0.2
            }
          });
        }, {
          maxRetries: options.maxRetries ?? 2,
          baseDelay: options.baseDelay ?? 1000,
          partnerId: partner?.id
        });
      }

      const replyText = response.text || 'تم معالجة الطلب بنجاح عبر أدوات النظام.';
      return { replyText, toolsUsed };
    };

    let lastError = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];

      try {
        if (i > 0) {
          AuditLogger.log({
            partnerId: partner?.id || 'unknown',
            eventType: 'MODEL_FALLBACK',
            inputPayload: {
              from: candidateModels[i - 1],
              to: currentModel,
              reason: this.sanitizeError(lastError)
            },
            status: 'SUCCESS'
          });
        }

        const result = await runChatWithModel(currentModel);

        AuditLogger.log({
          partnerId: partner?.id || 'unknown',
          eventType: 'AGENT_RESPONSE',
          outputSummary: (i > 0 ? `[Fallback: ${currentModel}] ` : '') + result.replyText.substring(0, 300),
          status: 'SUCCESS'
        });

        return {
          success: true,
          model: currentModel,
          primaryModelAttempted: primaryModel,
          fallbackEngaged: currentModel !== primaryModel,
          reply: result.replyText,
          toolsUsed: result.toolsUsed,
          liveApiKeyUsed: true
        };

      } catch (err) {
        lastError = err;
        const sanitizedErr = this.sanitizeError(err);

        // فحص أخطاء المصادقة وسحب المفتاح
        if (this.isAuthError(err)) {
          AuditLogger.log({
            partnerId: partner?.id || 'unknown',
            eventType: 'AGENT_AUTH_ERROR',
            status: 'ERROR',
            error: sanitizedErr
          });
          return {
            success: false,
            error: 'فشل التحقق من مفتاح Gemini API (مفتاح غير صالح أو مسحوب). تم حماية النظام بأمان.',
            code: 'GEMINI_AUTH_FAILED',
            model: currentModel,
            liveApiKeyUsed: true
          };
        }

        // إذا كان خطأ عابراً وهناك نماذج بديلة أخرى، ننتقل للموديل التالي
        if (this.isTransientError(err) && i < candidateModels.length - 1) {
          continue;
        }

        break;
      }
    }

    // إذا فشلت جميع النماذج السحابية، تفعيل المحرك المحلي الآمن
    const sanitizedLastError = this.sanitizeError(lastError);
    AuditLogger.log({
      partnerId: partner?.id || 'unknown',
      eventType: 'AGENT_RESPONSE',
      status: 'ERROR',
      error: `All cloud models exhausted. Error: ${sanitizedLastError}`
    });

    const localFallback = await this.handleLocalIntentFallback(userMessage, partner);
    return {
      ...localFallback,
      note: 'تم تفعيل المحرك المحلي الآمن بعد تعذر الاتصال بسيرفرات الذكاء الاصطناعي السحابية.',
      cloudError: sanitizedLastError
    };
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
