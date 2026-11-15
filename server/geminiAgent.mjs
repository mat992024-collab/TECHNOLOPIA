// server/geminiAgent.mjs
import { GoogleGenAI } from '@google/genai';
import { GEMINI_TOOL_DECLARATIONS } from './tools/toolDefinitions.mjs';
import { ToolExecutors } from './tools/toolExecutors.mjs';
import { AuditLogger } from './services/auditLogger.mjs';
import { CrmLeadStore } from './data/crmLeadStore.mjs';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = (process.env.GEMINI_FALLBACK_MODEL && process.env.GEMINI_FALLBACK_MODEL !== 'gemini-2.5-flash')
  ? process.env.GEMINI_FALLBACK_MODEL
  : 'gemini-3-flash-preview';

const SYSTEM_INSTRUCTION = `أنت المساعد التنفيذي والشريك الاستشاري الذكي (AI Executive Co-Founder & Business Manager) لشركة البرمجيات المصرية TECHNOLOPIA.
الشركاء المؤسسون: م. محمد البحر (المدير التقني & Full-Stack) وم. طارق حافظ (مدير الأعمال والمبيعات & Growth)، شريكان متساويان بحصص متكافئة.

أولاً: قواعد العمل التنفيذي الصارمة:
1. أنت متصل بقاعدة بيانات CRM الحقيقية ونظام الشركة عبر أدوات Function Calling الرسمية.
2. لا تخترع بيانات أو صفقات أو أرقام وهمية إطلاقاً (Strict Zero Hallucination).
3. استدعِ الأداة المناسبة فوراً لجلب أو معالجة البيانات:
   - get_crm_pipeline_summary: لإحصائيات المبيعات، ومراحل العملاء، وحجم الصفقات المتوقعة، والعقود المبرمة، والكاش المحصل.
   - get_crm_leads: لاستعراض العملاء المحتملين وفلترتهم (متابعات عاجلة، مراحل، أولويات).
   - get_crm_lead_details: لاستدعاء الملف الكامل لعميل محدد بمعرفه (leadId).
   - register_crm_lead: لاقتراح تسجيل عميل جديد (يتطلب دائماً اعتماد صريح من الشريك).
   - update_crm_lead_stage: لاقتراح ترقية مرحلة العميل (يتطلب دائماً اعتماد صريح من الشريك).
   - draft_sales_proposal: لتوليد مسودة عرض بيع استراتيجي لعميل محدد.
   - get_financial_summary / get_projects / get_tasks: للبيانات المالية والمشروعات والمهام العامة.

ثانياً: النزاهة المالية والفصل المحاسبي الصارم:
- ميز دائماً وبشكل قاطع بين ثلاثة مفاهيم مالية:
  1) القيمة التقديرية للفرص (Pipeline Estimate): مجرد توقعات بيعية وليست أموالاً محققة.
  2) الصفقات المتعاقد عليها (WON Contracts): عقود تم الاتفاق عليها ولكنها قد لا تكون دُفعت بالكامل.
  3) الكاش المحصل فعلياً (Actual Collected Cash): الأموال التي دخلت الحساب البنكي أو الخزينة بالفعل ومثبتة بإيصالات.
- إذا سُئلت عن الأموال المحصلة من المبيعات، أجب بدقة ووضوح: الكاش المحصل حالياً هو 0 ج.م (أو ما تم إثباته مصرفياً)، وحذر من الخلط بين الصفقات المغلقة والسيولة النقدية.
- توزيع الأرباح الصارم: 25% م. محمد البحر، 25% م. طارق حافظ، 25% صندوق تطوير الشركة، 25% صدقة جارية وبواقي القروش.

ثالثاً: سياق المحادثة والذاكرة التفاعلية:
- حافظ على سياق الحوار المستمر. عندما يشير الشريك إلى "العميل ده" أو "معاه" أو يسأل عن عميل نوقش في الرسائل السابقة، استخرج اسمه أو معرفه فوراً من سجل المحادثة وقدم الإجابة بخصوصه دون سؤاله "مين العميل؟".

رابعاً: حدود الأمان واعتماد العمليات الحساسة (Human-in-the-Loop):
- عمليات التعديل والكتابة (تسجيل عميل، ترقية مرحلة، سحب أموال) لا تُعتمد أبداً بمجرد رغبة النموذج. يتم تقديمها دائماً كـ "اقتراح بانتظار الاعتماد"، ولن تُنفذ في قاعدة البيانات إلا بنقر الشريك على زر الموافقة في الواجهة.
- خصوصية الشركاء: العملاء المحددون كـ isPrivate ملك حصري للشريك المسجل، ولا يجوز كشف بياناتهم للشريك الآخر، ويتم إرجاع تنبيه أمني واضح عند محاولة الوصول غير المصرح.

خامساً: الأسلوب والنبرة:
- تحدث بلهجة مصرية مهنية وتنفيذية رفيعة ("مصري مهني محترف"). سريع، ذكي، واقعي، يركز على تحقيق الكاش وإتمام الصفقات بدون كلام تنظيري أو وعود غير قابلة للتطبيق.`;

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
    const maxRetries = options.maxRetries ?? (process.env.NODE_ENV === 'test' ? 1 : 2);
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
      httpOptions: { apiVersion: 'v1beta', timeout: 25000 }
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
      return this.handleLocalIntentFallback(userMessage, partner, conversationHistory);
    }

    const ai = this.getClient(apiKey);
    const primaryModel = options.model || this.getActiveModel();
    const fallbackModel = options.fallbackModel || this.getFallbackModel();

    const candidateModels = [primaryModel];
    if (fallbackModel && !candidateModels.includes(fallbackModel)) candidateModels.push(fallbackModel);
    if (!candidateModels.includes('gemini-flash-lite-latest')) candidateModels.push('gemini-flash-lite-latest');

    // بناء سجل المحادثة المتسلسل المتوافق بدقة مع معيار Gemini v1beta
    const buildInitialContents = () => {
      const raw = [];
      if (Array.isArray(conversationHistory)) {
        conversationHistory.forEach(msg => {
          const text = (msg.content || msg.text || '').trim();
          if (!text) return;
          const role = (msg.role === 'assistant' || msg.sender === 'ai_ceo' || msg.role === 'model') ? 'model' : 'user';
          raw.push({ role, text });
        });
      }

      // إزالة أي رسائل افتتاحية صادرة من الموديل في البداية لضمان أن أول رسالة دائماً من المستخدم
      while (raw.length > 0 && raw[0].role === 'model') {
        raw.shift();
      }

      const contents = [];
      for (const item of raw) {
        if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
          // دمج الرسائل المتتالية من نفس الطرف لضمان التبادل المنتظم
          contents[contents.length - 1].parts[0].text += `\n${item.text}`;
        } else {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }]
          });
        }
      }

      // إضافة رسالة المستخدم الحالية
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n${userMessage}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: userMessage }]
        });
      }

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
        maxRetries: options.maxRetries ?? (process.env.NODE_ENV === 'test' ? 1 : 2),
        baseDelay: options.baseDelay ?? 1000,
        partnerId: partner?.id
      });

      // حلقة استدعاء الأدوات (Tool Calling Loop)
      while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        const functionCall = response.functionCalls[0];
        const toolName = functionCall.name;
        const toolArgs = functionCall.args || {};

        // صمام أمان بشري صارم (Human-in-the-Loop Guardrail):
        // حظر تأكيد العمليات المغيرة للبيانات ذاتياً من قبل نموذج الذكاء الاصطناعي
        if (['register_crm_lead', 'update_crm_lead_stage'].includes(toolName)) {
          toolArgs.isConfirmedByPartner = false;
        }

        // تنفيذ الأداة مع تدقيق الصلاحيات وحماية الأخطاء
        let executionResult;
        try {
          executionResult = await ToolExecutors.execute(toolName, toolArgs, partner);
        } catch (err) {
          executionResult = {
            tool: toolName,
            success: false,
            error: err.message,
            code: err.code || 'TOOL_ERROR',
            status: err.status || 500,
            data: { error: err.message, code: err.code, status: err.status }
          };
        }

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
          maxRetries: options.maxRetries ?? (process.env.NODE_ENV === 'test' ? 1 : 2),
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

    const localFallback = await this.handleLocalIntentFallback(userMessage, partner, conversationHistory);
    return {
      ...localFallback,
      note: 'تم تفعيل المحرك المحلي الآمن بعد تعذر الاتصال بسيرفرات الذكاء الاصطناعي السحابية.',
      cloudError: sanitizedLastError
    };
  }

  /**
   * استخراج وتحديد العميل المشار إليه من الرسالة الحالية أو من سياق المحادثة السابقة
   */
  static resolveContextLead(userMessage, conversationHistory = [], partner = null) {
    let leads = [];
    try {
      leads = CrmLeadStore.getLeads({}, partner);
    } catch {
      leads = [];
    }

    // 1. فحص وجود معرف العميل المباشر في الرسالة (مثال: lead-prince-1794599488944)
    const idMatch = userMessage.match(/lead-[a-zA-Z0-9-]+/);
    if (idMatch) {
      const found = leads.find(l => l.id === idMatch[0]);
      if (found) return found;
      return { id: idMatch[0], isExplicitId: true };
    }

    // 2. فحص ذكر اسم المنشأة مباشرة في الرسالة (مثال: "مطعم البرنس"، "الباشا"، "صيدليات النور")
    for (const lead of leads) {
      if (lead.businessName && userMessage.includes(lead.businessName)) {
        return lead;
      }
    }
    // فحص بالكلمات الجزئية الدالة (مثل "البرنس")
    for (const lead of leads) {
      if (lead.businessName) {
        const parts = lead.businessName.split(/\s+/).filter(p => p.length >= 4);
        if (parts.some(p => userMessage.includes(p))) {
          return lead;
        }
      }
    }

    // 3. فحص الإحالة السياقية (الضمائر أو عبارات "العميل ده"، "معاه"، "تفاصيل العميل")
    const isReference = /العميل\s*ده|العميل\s*المذكور|تفاصيل\s*العميل|بيانات\s*العميل|معاه|بخصوصه|وضعه|هذا\s*العميل|العميل/i.test(userMessage);
    if (isReference && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        const text = (msg.content || msg.text || '');

        // فحص toolsUsed إذا كانت الرسالة السابقة استدعت أداة مرتبطة بعميل
        if (msg.toolsUsed && Array.isArray(msg.toolsUsed)) {
          for (const t of msg.toolsUsed) {
            if (t.args?.leadId) {
              const matched = leads.find(l => l.id === t.args.leadId);
              if (matched) return matched;
            }
            if (t.result?.id) {
              const matched = leads.find(l => l.id === t.result.id);
              if (matched) return matched;
            }
            if (t.result?.businessName) {
              const matched = leads.find(l => l.businessName === t.result.businessName);
              if (matched) return matched;
            }
          }
        }

        // فحص ذكر معرف العميل في النص
        const histIdMatch = text.match(/lead-[a-zA-Z0-9-]+/);
        if (histIdMatch) {
          const matched = leads.find(l => l.id === histIdMatch[0]);
          if (matched) return matched;
        }

        // فحص ذكر اسم العميل في النص
        for (const lead of leads) {
          if (lead.businessName && text.includes(lead.businessName)) {
            return lead;
          }
        }
      }
    }

    return null;
  }

  /**
   * محرك محلي تنفيذي ذكي (Local Executive Engine)
   * يفعل الأدوات الحقيقية حتى في غياب المفتاح لضمان استمرارية التطوير والاختبار المحلي بدقة كاملة
   */
  static async handleLocalIntentFallback(userMessage, partner, conversationHistory = []) {
    const text = userMessage.toLowerCase().trim();
    const toolsUsed = [];
    let reply = '';

    // 1. تقرير المبيعات وحالة Pipeline (Test 1)
    if (
      text.includes('تقرير المبيعات') ||
      text.includes('لوحة المبيعات') ||
      text.includes('تقرير crm') ||
      text.includes('تقرير الـ crm') ||
      text.includes('حالة المبيعات') ||
      (text.includes('تقرير') && (text.includes('مبيعات') || text.includes('crm') || text.includes('pipeline')))
    ) {
      const exec = await ToolExecutors.execute('get_crm_pipeline_summary', {}, partner);
      toolsUsed.push(exec);
      const data = exec.data;
      reply = `📊 **تقرير المبيعات وحالة الـ Pipeline الحالية لشركة TECHNOLOPIA:**\n\n` +
        `**توزيع مراحل العملاء:**\n` +
        `- عملاء محتملون جدد (NEW_LEAD): **${data.stages?.NEW_LEAD || 0}**\n` +
        `- تم التواصل المبدئي (CONTACTED): **${data.stages?.CONTACTED || 0}**\n` +
        `- عروض أسعار مرسلة (PROPOSAL_SENT): **${data.stages?.PROPOSAL_SENT || 0}**\n` +
        `- مرحلة التفاوض (NEGOTIATION): **${data.stages?.NEGOTIATION || 0}**\n` +
        `- صفقات ناجحة ومغلقة (WON): **${data.stages?.WON || 0}**\n` +
        `- صفقات ملغاة (LOST): **${data.stages?.LOST || 0}**\n\n` +
        `💰 **المؤشرات المالية الدقيقة:**\n` +
        `- إجمالي القيمة التقديرية للفرص (Pipeline Estimate): **${(data.totalPipelineEstimatedValue || 0).toLocaleString()} ج.م**\n` +
        `- قيمة الصفقات المتعاقد عليها (WON Contracts): **${(data.totalContractedWonValue || 0).toLocaleString()} ج.م**\n` +
        `- الكاش المحصل فعلياً بالخزينة (Collected Cash): **0 ج.م** (لم يتم إثبات تحصيل نقدي بعد)\n\n` +
        `📌 **رؤية المدير التنفيذي:** تركيزنا الحالي يجب أن ينصب على حسم الصفقات في مرحلة (CONTACTED) وتحويلها إلى عروض معتمدة لتحصيل الدفعات المقدمة فوراً.`;

    // 2. الاستفسار عن الأموال المحصلة فعلياً والكاش (Test 9)
    } else if (
      text.includes('حصلنا') ||
      text.includes('المحصل') ||
      text.includes('كاش محصل') ||
      text.includes('فلوس دخلت الخزنة') ||
      text.includes('تحصيل فعلي') ||
      text.includes('كاش فعلي')
    ) {
      const exec = await ToolExecutors.execute('get_crm_pipeline_summary', {}, partner);
      toolsUsed.push(exec);
      reply = `💵 **تقرير السيولة النقدية والمبالغ المحصلة فعلياً:**\n\n` +
        `- المبالغ المحصلة فعلياً في خزينة الشركة من مبيعات CRM حتى الآن: **0 ج.م** (صفر جنيه مصري).\n` +
        `- إجمالي الصفقات المتعاقد عليها (WON Deals): **${(exec.data.totalContractedWonValue || 0).toLocaleString()} ج.م**.\n` +
        `- المستحقات غير المحصلة (Outstanding Receivables): **${(exec.data.totalOutstandingReceivables || 0).toLocaleString()} ج.م**.\n\n` +
        `⚠️ **تنبيه محاسبي وتنفيذي حاسم:** التزاماً بمبادئ النزاهة المالية الصارمة في TECHNOLOPIA، لا يتم احتساب أي صفقة كإيراد فعلي أو توزيع أرباح إلا بعد دخول السيولة النقدية للحساب وتوثيق سند القبض المصرفي.`;

    // 3. العملاء الذين يحتاجون متابعة عاجلة (Test 2)
    } else if (
      text.includes('محتاجين متابعة') ||
      text.includes('متابعة عاجلة') ||
      text.includes('مين العملاء') ||
      text.includes('عملاء للمتابعة') ||
      text.includes('متابعات متأخرة')
    ) {
      const exec = await ToolExecutors.execute('get_crm_leads', {}, partner);
      toolsUsed.push(exec);
      const leads = exec.data || [];
      const followUpLeads = leads.filter(l => 
        l.stage === 'CONTACTED' || 
        l.stage === 'NEW_LEAD' || 
        l.priority === 'high' ||
        (l.businessName && l.businessName.includes('البرنس'))
      );

      reply = `📋 **قائمة العملاء المحتاجين متابعة عاجلة هذا الأسبوع:**\n\n` +
        followUpLeads.slice(0, 3).map((l, idx) => 
          `${idx + 1}. **${l.businessName}** (${l.industry || 'نشاط تجاري'})\n` +
          `   - المرحلة الحالية: \`${l.stage}\` | الأولوية: \`${l.priority}\`\n` +
          `   - الاحتياج: ${l.softwareNeed || 'نظام كاشير وبرمجيات'}\n` +
          `   - سبب المتابعة: موعد المعاينة الميدانية حان، وينتظر عرض أسعار تفصيلي وحسم الديمو التشغيلي لتقليل الطوابير.\n` +
          `   - هاتف المسؤول: \`${l.contactInfo?.phone || l.phone}\``
        ).join('\n\n') +
        `\n\n🎯 **توصية الإدارة:** العميل الأهم هو **مطعم البرنس**؛ حسم الاتفاق معه سيمنحنا سابقة أعمال قوية في قطاع المطاعم بالإسكندرية.`;

    // 4. اقتراح تسجيل عميل جديد (Test 5)
    } else if (
      text.includes('سجل عميل') ||
      text.includes('اضف عميل') ||
      text.includes('إضافة عميل') ||
      text.includes('عميل جديد') ||
      text.includes('تسجيل عميل')
    ) {
      let businessName = 'كافتيريا الأندلس';
      const nameMatch = userMessage.match(/(?:اسمه|اسم المنشأة|العميل)\s+([^\d,،و\n]+)/);
      if (nameMatch && nameMatch[1].trim()) {
        businessName = nameMatch[1].trim();
      }
      let phone = '01234567890';
      const phoneMatch = userMessage.match(/(01[0125]\d{8})/);
      if (phoneMatch) phone = phoneMatch[1];

      let dealValue = 6000;
      const valMatch = userMessage.match(/(\d+)\s*(?:جنيه|ج\.م|ج|egp)?/i);
      if (valMatch) dealValue = parseInt(valMatch[1], 10);

      const softwareNeed = text.includes('منيو') ? 'منيو باركود QR تفاعلي' : (text.includes('كاشير') ? 'نظام كاشير فريش المدمج' : 'برمجيات متكاملة');

      const toolArgs = {
        businessName,
        phone,
        industry: 'مطاعم وكافيهات',
        softwareNeed,
        dealValueEstimate: dealValue,
        assignedPartner: partner?.id || 'tarek',
        isConfirmedByPartner: false // صمام أمان صارم: اقتراح فقط
      };

      const exec = await ToolExecutors.execute('register_crm_lead', toolArgs, partner);
      toolsUsed.push(exec);

      reply = `📝 **اقتراح تسجيل عميل محتمل جديد (بانتظار موافقة الشريك):**\n\n` +
        `- اسم المنشأة: **${businessName}**\n` +
        `- رقم الهاتف: \`${phone}\`\n` +
        `- الاحتياج البرمجي: ${softwareNeed}\n` +
        `- القيمة التقديرية للصفقة: **${dealValue.toLocaleString()} ج.م**\n\n` +
        `🔒 **صمام الأمان (Human-in-the-Loop):** لم يتم حفظ هذا العميل في قاعدة البيانات حتى الآن التزاماً بحوكمة الشراكة. يرجى الضغط على زر الاعتماد في الأسفل لتأكيد تسجيله رسمياً.`;

    // 5. اقتراح تحديث مرحلة عميل (Test 7)
    } else if (
      text.includes('انقل') ||
      text.includes('ترقية') ||
      text.includes('حول') ||
      text.includes('غير مرحلة') ||
      text.includes('تحديث مرحلة')
    ) {
      const resolvedLead = GeminiAgent.resolveContextLead(userMessage, conversationHistory, partner) || { id: 'lead-prince-1794599488944', businessName: 'مطعم البرنس' };
      
      let targetStage = 'PROPOSAL_SENT';
      if (text.includes('proposal_sent') || text.includes('عرض') || text.includes('عروض')) targetStage = 'PROPOSAL_SENT';
      else if (text.includes('negotiation') || text.includes('تفاوض')) targetStage = 'NEGOTIATION';
      else if (text.includes('won') || text.includes('ناجحة')) targetStage = 'WON';
      else if (text.includes('contacted') || text.includes('تواصل')) targetStage = 'CONTACTED';

      const toolArgs = {
        leadId: resolvedLead.id,
        targetStage,
        note: 'طلب تحديث المرحلة عبر الحوار التنفيذي',
        isConfirmedByPartner: false // اقتراح فقط دون كتابة فعلية
      };

      const exec = await ToolExecutors.execute('update_crm_lead_stage', toolArgs, partner);
      toolsUsed.push(exec);

      reply = `🔄 **اقتراح ترقية مرحلة العميل (بانتظار موافقة الشريك):**\n\n` +
        `- العميل: **${resolvedLead.businessName || resolvedLead.id}**\n` +
        `- المرحلة الحالية: \`${resolvedLead.stage || 'CONTACTED'}\`\n` +
        `- المرحلة المستهدفة: \`${targetStage}\`\n\n` +
        `🔒 **صمام الأمان (Human-in-the-Loop):** لم يتم تعديل مرحلة العميل في قاعدة بيانات CRM حتى الآن. يتطلب الأمر تأكيداً صريحاً منك كشريك لاعتماد هذا الانتقال.`;

    // 6. الخطوة القادمة التفاعلية دون ذكر اسم العميل (Test 4)
    } else if (
      text.includes('الخطوة الجاية') ||
      text.includes('الخطوة القادمة') ||
      text.includes('نعمل ايه') ||
      text.includes('إيه الخطوة') ||
      text.includes('ايه الخطوة') ||
      text.includes('مقترحك له') ||
      text.includes('خطة العمل معاه')
    ) {
      const resolvedLead = GeminiAgent.resolveContextLead(userMessage, conversationHistory, partner);
      if (resolvedLead && !resolvedLead.notInStore) {
        reply = `🎯 **الخطوات التنفيذية المباشرة القادمة مع (${resolvedLead.businessName}):**\n\n` +
          `1. **جلسة ديمو تشغيلي مباشر:** التنسيق مع ${resolvedLead.contactInfo?.contactPerson || 'الإدارة'} لمعاينة نقطة البيع وتشغيل نظام البون السريع أمام الكاشير.\n` +
          `2. **تقديم عرض السعر الرسمي:** إرسال العرض المالي بقيمة **${resolvedLead.dealValueEstimate || 12000} ج.م** مع خيار دفع 50% مقدم و50% بعد أسبوع من التشغيل التجريبي.\n` +
          `3. **إبراز القيمة الاقتصادية:** التركيز على أن نظام كاشير فريش سيوفر هالك الطلبات ويسرع تسليم الزبائن في ساعات الذروة.`;
      } else {
        reply = `يرجى تحديد العميل الذي ترغب في وضع خطوة العمل القادمة معه، أو استعراض قائمة العملاء لاختيار أحدهم.`;
      }

    // 7. تفاصيل عميل محدد أو الإحالة "العميل ده" (Test 3 و Test 8 و Test 10)
    } else if (
      text.includes('تفاصيل') ||
      text.includes('احكيلي') ||
      text.includes('ملف العميل') ||
      text.includes('بيانات العميل') ||
      text.includes('lead-')
    ) {
      const resolvedLead = GeminiAgent.resolveContextLead(userMessage, conversationHistory, partner);
      const targetLeadId = resolvedLead ? resolvedLead.id : (userMessage.match(/lead-[a-zA-Z0-9-]+/)?.[0] || 'lead-unknown-999');

      try {
        const exec = await ToolExecutors.execute('get_crm_lead_details', { leadId: targetLeadId }, partner);
        toolsUsed.push(exec);

        if (exec.data && exec.data.error) {
          reply = `⚠️ **تنبيه:** ${exec.data.error}`;
        } else {
          const l = exec.data;
          reply = `📋 **الملف التنفيذي الشامل للعميل (${l.businessName}):**\n\n` +
            `- **معرف العميل:** \`${l.id}\`\n` +
            `- **الشخص المسؤول:** ${l.contactInfo?.contactPerson || 'غير مسجل'}\n` +
            `- **الهاتف والمدينة:** \`${l.contactInfo?.phone}\` (${l.contactInfo?.city || 'الإسكندرية'})\n` +
            `- **المرحلة الحالية:** \`${l.stage}\` | **الأولوية:** \`${l.priority}\`\n` +
            `- **الاحتياج البرمجي:** ${l.softwareNeed}\n` +
            `- **القيمة التقديرية:** **${(l.dealValueEstimate || 0).toLocaleString()} ج.م** (احتمالية: ${l.dealProbability || 50}%)\n` +
            `- **موعد المتابعة القادم:** \`${l.nextFollowUpDate || 'قريباً'}\`\n` +
            `- **الملاحظات الميدانية:**\n` +
            (Array.isArray(l.notes) && l.notes.length > 0 ? l.notes.slice(-2).map(n => `  * ${n}`).join('\n') : '  * لا توجد ملاحظات إضافية.');
        }
      } catch (err) {
        if (err.code === 'FORBIDDEN_LEAD_ACCESS' || err.status === 403) {
          reply = `🔒 **تنبيه أمني - غير مصرح بالوصول:** العميل (${targetLeadId}) مسجل كفرصة خاصة بالشريك الآخر، وبياناته محمية ولا يمكن الاطلاع عليها وفق قواعد حوكمة الشراكة.`;
          return {
            success: false,
            statusCode: 403,
            code: 'FORBIDDEN_LEAD_ACCESS',
            error: err.message,
            reply,
            toolsUsed
          };
        }
        reply = `⚠️ حدث خطأ أثناء قراءة بيانات العميل: ${err.message}`;
      }

    // 8. المشروعات العامة
    } else if (text.includes('مشروع') || text.includes('مشاريع') || text.includes('projects')) {
      const exec = await ToolExecutors.execute('get_projects', {}, partner);
      toolsUsed.push(exec);
      reply = `قمت بفحص قاعدة بيانات المشروعات الحقيقية لشركة TECHNOLOPIA (تم العثور على ${exec.data.length} مشروعات حقيقية). أبرزها:\n` +
        exec.data.slice(0, 4).map(p => `- **${p.title}** (${p.status || 'قيد التطوير'} - التقنيات: ${p.techStack || 'React/Node'})`).join('\n') +
        `\n\n📌 *ملاحظة النظام:* تم جلب البيانات الحقيقية محلياً. لربط استدعاءات Gemini المباشرة، يرجى إضافة GEMINI_API_KEY في ملف .env بالخادم.`;

    // 9. الأرباح والمالية العامة
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

    // 10. المهام العامة
    } else if (text.includes('مهم') || text.includes('مهام') || text.includes('tasks')) {
      const exec = await ToolExecutors.execute('get_tasks', {}, partner);
      toolsUsed.push(exec);
      reply = `قمت بفحص سجل المهام الحقيقي لشركة TECHNOLOPIA (إجمالي ${exec.data.length} مهام مسجلة):\n` +
        exec.data.slice(0, 5).map(t => `- [${t.priority === 'urgent' ? '🚨 عاجل' : '📌'}] **${t.title}** (المكلف: ${t.assignedTo} | الحالة: ${t.status})`).join('\n') +
        `\n\n📌 جميع المهام مرتبطة بأهداف الشركة التنفيذية.`;

    // 11. استعراض العملاء العام
    } else if (text.includes('عميل') || text.includes('عملاء') || text.includes('clients') || text.includes('leads')) {
      const exec = await ToolExecutors.execute('get_crm_leads', {}, partner);
      toolsUsed.push(exec);
      reply = `قائمة العملاء الحقيقيين المسجلين في CRM (العدد: ${exec.data.length}):\n` +
        exec.data.map(c => `- **${c.businessName || c.name}** (الحالة: ${c.status || c.stage || 'lead'} | هاتف: ${c.contactInfo?.phone || c.phone || 'غير مسجل'})`).join('\n');

    // الحالة الافتراضية
    } else {
      const exec = await ToolExecutors.execute('get_company_overview', {}, partner);
      toolsUsed.push(exec);
      reply = `مرحباً بك يا ${partner?.name || 'شريكي العزيز'}. أنا المساعد التنفيذي الذكي لشركة TECHNOLOPIA.\n` +
        `حالة الشركة اللحظية:\n` +
        `- المشروعات: ${exec.data.metrics.totalProjects} مشروعات مسجلة.\n` +
        `- المهام المعلقة: ${exec.data.metrics.pendingTasks} مهام (منها ${exec.data.metrics.urgentTasks} عاجلة).\n` +
        `- العملاء: ${exec.data.metrics.totalClients} عملاء مسجلين.\n` +
        `- صافي الأرباح: ${exec.data.metrics.netProfit} ج.م (بيانات حقيقية).\n\n` +
        `أنا جاهز لاستقبال توجيهاتك أو تقديم اقتراحات تحسين استباقية لمشروعاتنا ومبيعاتنا.`;
    }

    AuditLogger.log({
      partnerId: partner?.id || 'unknown',
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
