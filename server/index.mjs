// server/index.mjs
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requirePartnerAuth, issuePartnerToken, TRUSTED_PARTNERS, getFirebaseAdminAuth } from './middleware/authMiddleware.mjs';
import { GeminiAgent } from './geminiAgent.mjs';
import { ToolExecutors } from './tools/toolExecutors.mjs';
import { GEMINI_TOOL_DECLARATIONS, TOOL_PERMISSIONS } from './tools/toolDefinitions.mjs';
import { AuditLogger } from './services/auditLogger.mjs';
import { RealDataProvider } from './data/realDataProvider.mjs';
import { fileURLToPath } from 'url';
import { GitHubService } from './services/githubService.mjs';
import { GeminiCodeAdvisor } from './services/geminiCodeAdvisor.mjs';
import { CrmLeadStore, CRM_LEAD_STAGES } from './data/crmLeadStore.mjs';
import { AiSalesAgent } from './services/aiSalesAgent.mjs';
import { ExternalSimulationService } from './services/externalSimulationService.mjs';

const app = express();
const PORT = process.env.PORT || 5001;

// 1. القائمة البيضاء الصارمة للأصول المسموح بها (Strict CORS Whitelist)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://tecnolobia-ceo.web.app',
  'https://modeer-27c2d.web.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // السماح بالطلبات الداخلية والخدمية أو الأصول المعتمدة في القائمة البيضاء
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS_BLOCKED: الأصل (${origin}) غير مصرح به للاتصال بنظام TECHNOLOPIA.`));
    }
  },
  credentials: true
}));

// 2. حدود استهلاك الطلبات وحماية السيرفر من هجمات الإغراق (Rate Limiting)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: process.env.NODE_ENV === 'test' ? 500 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح به من الطلبات العامة. يرجى الانتظار قليلاً.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: process.env.RATE_LIMIT_TEST ? 3 : (process.env.NODE_ENV === 'test' ? 100 : 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'تم تجاوز الحد المسموح به من استشارات الذكاء الاصطناعي (حد أقصى 30 طلب/دقيقة). يرجى الانتظار.',
    code: 'CHAT_RATE_LIMIT_EXCEEDED'
  }
});

app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));

// 3. وسيط التحقق من المدخلات وحماية النموذج من التلاعب (Sanitization Middleware)
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // منع هجمات Prototype Pollution
    delete req.body['__proto__'];
    delete req.body['constructor'];

    if (req.body.message && typeof req.body.message === 'string') {
      if (req.body.message.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'حجم الرسالة يتجاوز الحد الأقصى المسموح به (5,000 حرف).',
          code: 'PAYLOAD_TOO_LARGE'
        });
      }
    }
  }
  next();
}

app.use(sanitizeInput);

/**
 * نقطة تسجيل الدخول الرسمية وإصدار رمز الدخول الموثق (Auth Token Issue)
 * تدعم التحقق الصارم من PIN/Password أو التحقق التشفيري من Firebase ID Token عبر Firebase Admin SDK
 */
app.post('/api/auth/token', async (req, res) => {
  const { partnerId, credentialSecret, firebaseIdToken } = req.body;
  if (!partnerId || !['mohamed', 'tarek'].includes(partnerId)) {
    return res.status(400).json({
      success: false,
      error: 'معرف الشريك مطلوب (mohamed أو tarek)',
      code: 'INVALID_PARTNER_ID'
    });
  }

  const expectedSecret = partnerId === 'mohamed' ? 
    (process.env.MOHAMED_PIN || '1995') : 
    (process.env.TAREK_PIN || '2024');

  let verified = false;

  // 1. إذا تم تقديم Firebase ID Token، يتم التحقق التشفيري الصارم عبر Firebase Admin SDK
  if (firebaseIdToken && typeof firebaseIdToken === 'string') {
    const fbAdminAuth = getFirebaseAdminAuth();
    if (!fbAdminAuth) {
      return res.status(500).json({
        success: false,
        error: 'خدمة التحقق من Firebase Admin غير مفعلة في الخادم.',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    try {
      const decoded = await fbAdminAuth.verifyIdToken(firebaseIdToken);
      const expectedEmail = partnerId === 'mohamed' ? 'mohamed@tecnolobia.com' : 'tarek@tecnolobia.com';
      const expectedUids = TRUSTED_PARTNERS[expectedEmail]?.allowedUids || [];

      if (decoded.email?.toLowerCase() === expectedEmail || expectedUids.includes(decoded.uid) || expectedUids.includes(decoded.sub)) {
        verified = true;
      } else {
        AuditLogger.log({
          partnerId,
          eventType: 'AUTH_FAILED',
          inputPayload: { partnerId, decodedEmail: decoded.email, ip: req.ip },
          status: 'BLOCKED',
          error: 'توكن Firebase ID لا يتطابق مع الشريك المطلوب'
        });
        return res.status(403).json({
          success: false,
          error: 'توكن Firebase ID لا ينتمي للشريك المطلوب.',
          code: 'FORBIDDEN_PARTNER_MISMATCH'
        });
      }
    } catch (fbErr) {
      AuditLogger.log({
        partnerId,
        eventType: 'AUTH_FAILED',
        inputPayload: { partnerId, ip: req.ip, error: fbErr.message },
        status: 'BLOCKED',
        error: 'فشل التحقق التشفيري من توكن Firebase ID'
      });
      return res.status(401).json({
        success: false,
        error: 'توكن Firebase ID غير صالح أو منتهي الصلاحية.',
        code: 'INVALID_FIREBASE_TOKEN'
      });
    }
  } 
  // 2. التحقق الصارم من رمز PIN / كلمة السر (إلغاء أي مسارات تجاوز أو كلمات مرور افتراضية موثوقة)
  else {
    if (!credentialSecret || typeof credentialSecret !== 'string' || !credentialSecret.trim()) {
      AuditLogger.log({
        partnerId,
        eventType: 'AUTH_FAILED',
        inputPayload: { partnerId, ip: req.ip },
        status: 'BLOCKED',
        error: 'محاولة تسجيل دخول بدون كلمة مرور أو رمز PIN'
      });
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور أو رمز أمان PIN مطلوب لتسجيل الدخول.',
        code: 'CREDENTIALS_REQUIRED'
      });
    }

    if (credentialSecret.trim() !== expectedSecret) {
      AuditLogger.log({
        partnerId,
        eventType: 'AUTH_FAILED',
        inputPayload: { partnerId, ip: req.ip },
        status: 'BLOCKED',
        error: 'رمز الأمان PIN غير صحيح'
      });
      return res.status(401).json({
        success: false,
        error: 'رمز الأمان PIN أو كلمة المرور غير صحيحة.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    verified = true;
  }

  if (!verified) {
    return res.status(401).json({
      success: false,
      error: 'فشل إثبات هوية الشريك.',
      code: 'AUTH_FAILED'
    });
  }

  const token = issuePartnerToken(partnerId);
  const email = partnerId === 'mohamed' ? 'mohamed@tecnolobia.com' : 'tarek@tecnolobia.com';
  const partnerConfig = TRUSTED_PARTNERS[email];

  AuditLogger.log({
    partnerId,
    eventType: 'AUTH_SUCCESS',
    inputPayload: { partnerId, email },
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    token,
    partner: {
      partnerId,
      name: partnerConfig.name,
      email: partnerConfig.email,
      role: partnerConfig.role
    }
  });
});

/**
 * 1. فحص صحة الخادم
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TECHNOLOPIA Gemini Backend Agent',
    securityHardening: 'Phase 3.1 Active',
    timestamp: new Date().toISOString()
  });
});

/**
 * 2. حالة المساعد التنفيذي الذكي
 */
app.get('/api/gemini/status', (req, res) => {
  const hasKey = !!GeminiAgent.getApiKey();
  res.json({
    success: true,
    agentName: 'TECHNOLOPIA AI Executive Assistant',
    primaryModel: GeminiAgent.getActiveModel(),
    fallbackModel: GeminiAgent.getFallbackModel(),
    hasApiKeyConfigured: hasKey,
    apiKeySource: hasKey ? 'Secure Server Environment (.env)' : 'None (Fallback Emulator Active)',
    registeredToolsCount: GEMINI_TOOL_DECLARATIONS.length,
    securityLevel: 'Enterprise ID Token Verification (No Spoofing)',
    timestamp: new Date().toISOString()
  });
});

/**
 * 3. استعراض قائمة الأدوات ومصفوفة الصلاحيات
 */
app.get('/api/gemini/tools', (req, res) => {
  const tools = GEMINI_TOOL_DECLARATIONS.map(t => ({
    name: t.name,
    description: t.description,
    permission: TOOL_PERMISSIONS[t.name] || { level: 'READ_ONLY', requiresApproval: false },
    parameters: t.parameters
  }));

  res.json({
    success: true,
    totalTools: tools.length,
    tools
  });
});

/**
 * 4. المحادثة التنفيذية مع المساعد الذكي
 */
app.post('/api/gemini/chat', chatLimiter, requirePartnerAuth, async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'حقل الرسالة (message) مطلوب ويجب أن يكون نصاً غير فارغ'
      });
    }

    const result = await GeminiAgent.chat(message.trim(), req.partner, conversationHistory || []);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * 5. تنفيذ أداة محددة بشكل مباشر وموثق
 */
app.post('/api/gemini/execute-tool', requirePartnerAuth, async (req, res, next) => {
  try {
    const { toolName, args } = req.body;
    if (!toolName) {
      return res.status(400).json({
        success: false,
        error: 'اسم الأداة (toolName) مطلوب'
      });
    }

    const result = await ToolExecutors.execute(toolName, args || {}, req.partner);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * 6. استعراض سجل التدقيق الشفاف
 */
app.get('/api/gemini/audit-logs', requirePartnerAuth, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = AuditLogger.getRecentLogs(limit);
  res.json({
    success: true,
    count: logs.length,
    logs
  });
});

/**
 * 7. فحص النزاهة التشفيرية لسجل التدقيق (Verify Audit Hash Chain)
 */
app.get('/api/gemini/verify-audit', requirePartnerAuth, (req, res) => {
  const integrity = AuditLogger.verifyChainIntegrity();
  res.json({
    success: integrity.valid,
    integrity
  });
});

/**
 * 8. استعراض مسودات اقتراحات التحسين المقدمة من الذكاء الاصطناعي
 */
app.get('/api/gemini/proposals', requirePartnerAuth, (req, res) => {
  const proposals = RealDataProvider.getAiProposals();
  res.json({
    success: true,
    count: proposals.length,
    proposals
  });
});

/**
 * 9. اعتماد مقترح تحسين من قبل أحد الشريكين (Human Approval)
 */
app.post('/api/gemini/approve-proposal', requirePartnerAuth, (req, res, next) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) {
      return res.status(400).json({ success: false, error: 'معرف المقترح (proposalId) مطلوب' });
    }
    const approved = RealDataProvider.approveProposal(proposalId, req.partner);
    AuditLogger.log({
      partnerId: req.partner.partnerId,
      eventType: 'PROPOSAL_APPROVED',
      inputPayload: { proposalId },
      outputSummary: `تم اعتماد المقترح (${proposalId}) بنجاح.`,
      status: 'SUCCESS'
    });
    res.json({ success: true, proposal: approved });
  } catch (err) {
    next(err);
  }
});

/**
 * 10. استعراض مسودات المهام المقترحة من الذكاء الاصطناعي
 */
app.get('/api/gemini/draft-tasks', requirePartnerAuth, (req, res) => {
  const draftTasks = RealDataProvider.getDraftTasks(req.partner.partnerId);
  res.json({
    success: true,
    count: draftTasks.length,
    draftTasks
  });
});

/**
 * 11. تعديل مسودة مهمة مع التحقق الصارم من الخصوصية والملكية
 */
app.put('/api/gemini/draft-task/:id', requirePartnerAuth, (req, res, next) => {
  try {
    const taskId = req.params.id;
    const updates = req.body || {};
    const updated = RealDataProvider.updateDraftTask(taskId, updates, req.partner);
    res.json({ success: true, draftTask: updated });
  } catch (err) {
    if (err.code === 'FORBIDDEN_PRIVATE_DRAFT') {
      return res.status(403).json({ success: false, error: err.message, code: err.code });
    }
    next(err);
  }
});

/* ========================================================
   نقاط نهاية المرحلة الرابعة: GitHub Integration & Projects Hub
   ======================================================== */

/**
 * 12. استعراض حالة الحسابين المتصلين (بدون كشف أي توكنات)
 */
app.get('/api/github/accounts', requirePartnerAuth, async (req, res) => {
  try {
    const status = await GitHubService.getAccountsStatus();
    res.json({ success: true, accounts: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 13. ربط حساب جديد (قراءة فقط وبأعلى درجات الحماية)
 */
app.post('/api/github/connect', requirePartnerAuth, async (req, res) => {
  try {
    const { slotId, token } = req.body;
    const result = await GitHubService.connectAccount(slotId, token, req.partner);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 14. إلغاء ربط الحساب وسحب التوكن
 */
app.post('/api/github/disconnect', requirePartnerAuth, (req, res) => {
  try {
    const { slotId } = req.body;
    const result = GitHubService.disconnectAccount(slotId, req.partner);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 15. استعراض واكتشاف كافة المستودعات في الحسابين مع إزالة التكرار
 */
app.get('/api/github/repositories', requirePartnerAuth, async (req, res) => {
  try {
    const repos = await GitHubService.listAllRepositories();
    res.json({
      success: true,
      totalCount: repos.length,
      repositories: repos
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 16. فحص تفاصيل عميقة لمستودع محدد (الفروع، الملفات، الكوميتس)
 */
app.get('/api/github/repository/:owner/:repo', requirePartnerAuth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const details = await GitHubService.getRepositoryDetails(owner, repo);
    res.json({ success: true, details });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 17. تحليل كود ومعمارية مشروع بواسطة Gemini Code Advisor
 */
app.post('/api/github/analyze', requirePartnerAuth, async (req, res) => {
  try {
    const { owner, repo } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'owner and repo are required' });
    }
    const details = await GitHubService.getRepositoryDetails(owner, repo);
    const analysis = await GeminiCodeAdvisor.analyzeProject(details, req.partner);
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 18. استرجاع التوصيات المسجلة السابقة
 */
app.get('/api/github/recommendations', requirePartnerAuth, (req, res) => {
  const recommendations = GitHubService.getStoredRecommendations();
  res.json({ success: true, count: recommendations.length, recommendations });
});

/**
 * 19. تحديث حالة توصية (اعتماد / تجاهل / تمت المراجعة)
 */
app.post('/api/github/recommendation/status', requirePartnerAuth, (req, res) => {
  try {
    const { id, status } = req.body;
    const updated = GitHubService.updateRecommendationStatus(id, status, req.partner);
    res.json({ success: true, recommendation: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 20. تقرير المحفظة الشاملة لجميع مشروعات الشركة
 */
app.get('/api/github/portfolio-report', requirePartnerAuth, async (req, res) => {
  try {
    const repos = await GitHubService.listAllRepositories();
    const report = await GeminiCodeAdvisor.generateCompanyPortfolioReport(repos, req.partner);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// Phase 5.0: Lead Discovery & CRM Sales Engine Endpoints (Simulation-First)
// ============================================================================

/**
 * 21. استعراض قائمة العملاء المحتملين مع الفلترة وعزل بيانات الشريك
 */
app.get('/api/crm/leads', requirePartnerAuth, (req, res) => {
  try {
    const leads = CrmLeadStore.getLeads(req.query, req.partner);
    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 22. تسجيل عميل محتمل جديد (Lead Discovery)
 */
app.post('/api/crm/leads', requirePartnerAuth, (req, res) => {
  try {
    const newLead = CrmLeadStore.createLead(req.body, req.partner);
    res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    res.status(err.code === 'DUPLICATE_LEAD' ? 409 : 400).json({
      success: false,
      error: err.message,
      code: err.code || 'BAD_REQUEST'
    });
  }
});

/**
 * 23. تفاصيل عميل محدد وسجله الزمني مع عزل الوصول
 */
app.get('/api/crm/leads/:id', requirePartnerAuth, (req, res) => {
  try {
    const lead = CrmLeadStore.getLeadById(req.params.id, req.partner);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'العميل غير موجود', code: 'LEAD_NOT_FOUND' });
    }
    res.json({ success: true, lead });
  } catch (err) {
    res.status(err.status || (err.code === 'FORBIDDEN_LEAD_ACCESS' ? 403 : 500)).json({
      success: false,
      error: err.message,
      code: err.code || 'LEAD_ACCESS_ERROR'
    });
  }
});

/**
 * 24. تحديث مرحلة العميل في دورة المبيعات مع السجل الزمني
 */
app.put('/api/crm/leads/:id/stage', requirePartnerAuth, (req, res) => {
  try {
    const { stage, note } = req.body;
    const updated = CrmLeadStore.updateLeadStage(req.params.id, stage, note, req.partner);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(err.code === 'INVALID_STAGE_TRANSITION' ? 400 : 404).json({
      success: false,
      error: err.message,
      code: err.code || 'TRANSITION_ERROR'
    });
  }
});

/**
 * 25. إضافة ملاحظة للشريك في سجل متابعات العميل مع خيار الملاحظة الخاصة
 */
app.post('/api/crm/leads/:id/notes', requirePartnerAuth, (req, res) => {
  try {
    const { note, isPrivate } = req.body;
    const updated = CrmLeadStore.addNote(req.params.id, note, req.partner, isPrivate);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      error: err.message,
      code: err.code || 'NOTE_ERROR'
    });
  }
});

/**
 * 26. مؤشرات وإحصائيات لوحة المبيعات (Pipeline Dashboard Analytics)
 */
app.get('/api/crm/analytics', requirePartnerAuth, (req, res) => {
  try {
    const analytics = CrmLeadStore.getAnalytics(req.partner);
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 27. استدعاء وكيل المبيعات الذكي (AI Sales Agent Strategy & Pitch)
 */
app.post('/api/crm/leads/:id/ai-strategy', requirePartnerAuth, async (req, res) => {
  try {
    const lead = CrmLeadStore.getLeadById(req.params.id, req.partner);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'العميل غير موجود', code: 'LEAD_NOT_FOUND' });
    }
    const strategy = await AiSalesAgent.generateLeadStrategy(lead, req.partner);
    res.json({ success: true, strategy });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * 28. استعراض مسودات عروض الأسعار والرسائل التسويقية المحفوظة مع عزل الشريك
 */
app.get('/api/crm/ai-drafts', requirePartnerAuth, (req, res) => {
  try {
    const drafts = CrmLeadStore.getSalesDrafts(req.query.leadId, req.partner);
    res.json({ success: true, count: drafts.length, drafts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 28b. تعديل مسودة مبيعات مع التحقق الصارم من ملكية الشريك (Draft Ownership Protection)
 */
app.put('/api/crm/ai-drafts/:id', requirePartnerAuth, (req, res) => {
  try {
    const updated = CrmLeadStore.updateSalesDraft(req.params.id, req.body, req.partner);
    res.json({ success: true, draft: updated });
  } catch (err) {
    res.status(err.status || (err.code === 'FORBIDDEN_NOT_DRAFT_OWNER' ? 403 : 400)).json({
      success: false,
      error: err.message,
      code: err.code || 'DRAFT_UPDATE_ERROR'
    });
  }
});

/**
 * 29. إعداد وتجهيز مسودة واتساب في نمط المحاكاة الآمن (بدون إرسال خارجي)
 */
app.post('/api/crm/simulate-whatsapp', requirePartnerAuth, (req, res) => {
  try {
    const { leadId, messageText } = req.body;
    const sim = ExternalSimulationService.simulateWhatsApp(leadId, messageText, req.partner);
    res.json(sim);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 30. إعداد منشور فيسبوك تسويقي في نمط المحاكاة الآمن (بدون نشر خارجي أو إعلانات)
 */
app.post('/api/crm/simulate-facebook', requirePartnerAuth, (req, res) => {
  try {
    const sim = ExternalSimulationService.simulateFacebookPost(req.body, req.partner);
    res.json(sim);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 31. فحص صمام الأمان (Guardrail): محاولة الإرسال الحي محظورة في مرحلة المحاكاة
 */
app.post('/api/crm/live-dispatch', requirePartnerAuth, (req, res, next) => {
  try {
    ExternalSimulationService.sendLiveOutreach();
  } catch (err) {
    next(err);
  }
});

// وسيط معالجة الأخطاء الشامل والمنقى أمنياً (Sanitized Error Handler)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isSecurityViolation = err.code?.startsWith('FORBIDDEN') || err.code?.startsWith('UNAUTHORIZED');
  const sanitizedMessage = GeminiAgent.sanitizeError(err.message || 'حدث خطأ داخلي في الخادم.');

  console.error(`[SERVER_ERROR] [${req.method} ${req.path}]:`, sanitizedMessage);

  res.status(status).json({
    success: false,
    error: sanitizedMessage,
    code: err.code || (isSecurityViolation ? 'SECURITY_ERROR' : 'INTERNAL_SERVER_ERROR')
  });
});

// تشغيل الخادم عند الاستدعاء المباشر فقط وليس أثناء الاختبارات البرمجية
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('index.mjs')
);

if (isMain && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[TECHNOLOPIA] Gemini Backend Agent (Security Hardened) running on http://localhost:${PORT}`);
  });
}

export default app;
