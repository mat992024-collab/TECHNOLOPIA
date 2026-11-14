// server/index.mjs
import express from 'express';
import cors from 'cors';
import { requirePartnerAuth } from './middleware/authMiddleware.mjs';
import { GeminiAgent } from './geminiAgent.mjs';
import { ToolExecutors } from './tools/toolExecutors.mjs';
import { GEMINI_TOOL_DECLARATIONS, TOOL_PERMISSIONS } from './tools/toolDefinitions.mjs';
import { AuditLogger } from './services/auditLogger.mjs';
import { RealDataProvider } from './data/realDataProvider.mjs';

const app = express();
const PORT = process.env.PORT || 5001;

// وسائط الحماية وقراءة الجسم
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tecnolobia-ceo.web.app',
    'https://modeer-27c2d.web.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

/**
 * 1. فحص صحة الخادم
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TECHNOLOPIA Gemini Backend Agent',
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
    primaryModel: 'gemini-1.5-flash',
    fallbackModel: 'gemini-1.5-pro',
    hasApiKeyConfigured: hasKey,
    apiKeySource: hasKey ? 'Secure Server Environment (.env)' : 'None (Fallback Emulator Active)',
    registeredToolsCount: GEMINI_TOOL_DECLARATIONS.length,
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
 * 4. المحادثة التنفيذية مع المساعد الذكي واستدعاء الأدوات تلقائياً
 */
app.post('/api/gemini/chat', requirePartnerAuth, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'حقل الرسالة (message) مطلوب ويجب أن يكون نصاً'
      });
    }

    const result = await GeminiAgent.chat(message, req.partner, conversationHistory || []);
    res.json(result);
  } catch (err) {
    console.error('Gemini chat error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'حدث خطأ أثناء معالجة استشارة المساعد الذكي'
    });
  }
});

/**
 * 5. تنفيذ أداة محددة بشكل مباشر وموثق
 */
app.post('/api/gemini/execute-tool', requirePartnerAuth, async (req, res) => {
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
    res.status(400).json({
      success: false,
      error: err.message
    });
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
 * 7. استعراض مسودات اقتراحات التحسين المقدمة من الذكاء الاصطناعي
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
 * 8. استعراض مسودات المهام المقترحة من الذكاء الاصطناعي
 */
app.get('/api/gemini/draft-tasks', requirePartnerAuth, (req, res) => {
  const draftTasks = RealDataProvider.getDraftTasks();
  res.json({
    success: true,
    count: draftTasks.length,
    draftTasks
  });
});

import { fileURLToPath } from 'url';

// تشغيل الخادم عند الاستدعاء المباشر فقط وليس أثناء الاختبارات البرمجية
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('index.mjs')
);

if (isMain && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[TECHNOLOPIA] Gemini Backend Agent running on http://localhost:${PORT}`);
  });
}

export default app;
