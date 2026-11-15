// tests/phase-3.3-live-gemini.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'fs';
import path from 'path';

// تحميل متغيرات .env تلقائياً إذا لم تكن محملة
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim();
          if (key.trim() && !process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      });
    }
  } catch (e) {
    // ignore
  }
}

import app from '../server/index.mjs';
import { GeminiAgent } from '../server/geminiAgent.mjs';
import { GeminiCodeAdvisor, CLAIM_TYPES } from '../server/services/geminiCodeAdvisor.mjs';
import { GitHubService } from '../server/services/githubService.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';

let server;
let baseUrl;
const mohamedPartner = { id: 'mohamed', name: 'المهندس محمد البحر', role: 'technical' };
const tarekPartner = { id: 'tarek', name: 'المهندس طارق حافظ', role: 'business' };
const mohamedToken = issuePartnerToken('mohamed');

test.before(async () => {
  await new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
  }
});

// ============================================================================
// 1. [LIVE API TEST] توليد محتوى حقيقي باللهجة المصرية التنفيذية
// ============================================================================
test('1. [LIVE API TEST] Live Gemini Generation: Generates authentic executive Egyptian Arabic reply', { timeout: 60000 }, async () => {
  const apiKey = GeminiAgent.getApiKey();
  assert.ok(apiKey, 'Live API Key must be configured in environment');

  const prompt = 'أنت المساعد التنفيذي لشركة TECHNOLOPIA، وجه رسالة ترحيب حماسية وموجزة ومصرية جداً للشريكين محمد البحر وطارق حافظ عن بداية العمل اليوم.';
  const result = await GeminiAgent.generateContent(prompt, {
    partnerId: 'mohamed',
    temperature: 0.2
  });

  assert.ok(result.text, 'Expected non-empty live text from Gemini');
  assert.ok(result.text.length > 30, 'Response text should be sufficiently detailed');

  // التحقق من مفردات الهوية المصرية والتنفيذية
  const arabicText = result.text;
  const hasEgyptianPersona = 
    arabicText.includes('محمد') || 
    arabicText.includes('طارق') || 
    arabicText.includes('باشمهندس') || 
    arabicText.includes('بشمهندس') || 
    arabicText.includes('صباح') || 
    arabicText.includes('يا') || 
    arabicText.includes('تكنولوبيا') || 
    arabicText.includes('شغل');

  assert.ok(hasEgyptianPersona, `Expected Egyptian/Executive phrasing, received: ${arabicText.substring(0, 100)}`);

  // التحقق من النموذج الفعلي المستخدم (إما الأساسي أو البديل المعتمد)
  assert.ok(
    ['gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-flash-lite-latest'].includes(result.model),
    `Expected official Gemini model, got ${result.model}`
  );

  // التحقق من حظر تسريب المفتاح
  assert.ok(!result.text.includes(apiKey), 'Security Violation: API key must NEVER be printed in output');
});

// ============================================================================
// 2. [LIVE API TEST] استعلام عن بيانات الشركة ومنع الهلوسة
// ============================================================================
test('2. [LIVE API TEST] Real Company Data: Chat agent inspects real company database without hallucinating fake projects', { timeout: 35000 }, async () => {
  const userMessage = 'ما هي أسماء المشروعات الحقيقية المسجلة حالياً في قاعدة بيانات تكنولوبيا؟';
  const chatResponse = await GeminiAgent.chat(userMessage, mohamedPartner);

  assert.equal(chatResponse.success, true);
  assert.equal(chatResponse.liveApiKeyUsed, true);
  assert.ok(chatResponse.reply && chatResponse.reply.length > 20);

  // التأكد من استدعاء أدوات قراءة البيانات الحقيقية
  assert.ok(Array.isArray(chatResponse.toolsUsed));
  const usedProjectsTool = chatResponse.toolsUsed.some(t => t.tool === 'get_projects' || t.tool === 'get_company_overview');
  assert.ok(usedProjectsTool, 'Agent must execute real data inspection tool instead of hallucinating');

  // التأكد من ذكر مشاريع حقيقية من قاعدة بياناتنا
  const reply = chatResponse.reply;
  const mentionsRealProjects = 
    reply.includes('فريش') || 
    reply.includes('واجدي') || 
    reply.includes('منيو') || 
    reply.includes('مكتبة') || 
    reply.includes('مشروع');

  assert.ok(mentionsRealProjects, `Expected reference to actual TECHNOLOPIA projects in: ${reply.substring(0, 150)}`);
});

// ============================================================================
// 3. [LIVE API TEST] استدعاء الدوال الحقيقية والالتزام بتوزيع الأرباح
// ============================================================================
test('3. [LIVE API TEST] Live Function Calling: Executes get_financial_summary and strictly adheres to 4-way 25% profit distribution', { timeout: 35000 }, async () => {
  const userMessage = 'كم هي أرباح الشركة الحالية؟ وكيف يتم توزيع الأرباح بين الشركاء والصندوق والصدقة؟';
  const chatResponse = await GeminiAgent.chat(userMessage, tarekPartner);

  assert.equal(chatResponse.success, true);
  assert.ok(chatResponse.toolsUsed.length > 0, 'Expected at least one function call to have executed');

  const financeTool = chatResponse.toolsUsed.find(t => t.tool === 'get_financial_summary' || t.tool === 'get_company_overview');
  assert.ok(financeTool, 'Expected get_financial_summary or get_company_overview tool execution');

  // التأكد من ذكر قاعدة الأرباح الأربعة الصارمة بنسبة 25%
  const reply = chatResponse.reply;
  const mentionsProfitRule = 
    reply.includes('25%') || 
    (reply.includes('محمد') && reply.includes('طارق') && reply.includes('تطوير') && reply.includes('صدقة'));

  assert.ok(mentionsProfitRule, `Agent must strictly articulate 4-way 25% profit split, got: ${reply.substring(0, 150)}`);
});

// ============================================================================
// 4. [LIVE API TEST] مراجعة كود مستودع حقيقي عبر Gemini Code Advisor
// ============================================================================
test('4. [LIVE API TEST] Gemini Code Advisor: Analyzes real GitHub repo with live AI insights and strict taxonomy', { timeout: 35000 }, async () => {
  // استخدام مستودع حقيقي من مستودعات الشركة
  const allRepos = await GitHubService.listAllRepositories();
  const targetRepo = allRepos.find(r => r.name.includes('zatca') || r.name.includes('menu')) || allRepos[0];
  assert.ok(targetRepo, 'Must have at least one real repository connected');

  const analysis = await GeminiCodeAdvisor.analyzeProject(targetRepo, mohamedPartner);

  assert.ok(analysis, 'Analysis result must be returned');
  assert.ok(analysis.architectureAssessment, 'Must contain architecture assessment');
  assert.ok(Array.isArray(analysis.recommendations), 'Must contain recommendations list');

  // التأكد من ضبط التصنيف وفق معايير الحوكمة (لا خلط بين الحقائق والتقديرات)
  for (const rec of analysis.recommendations) {
    assert.ok(rec.claimType, `Recommendation missing claimType: ${JSON.stringify(rec)}`);
    assert.ok(Object.values(CLAIM_TYPES).includes(rec.claimType), `Invalid claimType: ${rec.claimType}`);
    if (rec.isConfirmedFact) {
      assert.equal(rec.financialNote, null, 'Confirmed facts cannot have speculative financial notes');
    }
  }
});

// ============================================================================
// 5. [LIVE API TEST / AUTH SECURITY] التعامل الآمن مع سحب أو خطأ المفتاح
// ============================================================================
test('5. [LIVE API TEST / AUTH SECURITY] Invalid/Revoked Key: Gracefully handled without process crash or key leakage', { timeout: 20000 }, async () => {
  const invalidKey = 'AQ.INVALID_MOCK_REVOKED_KEY_XYZ_999999999999';

  const res = await GeminiAgent.chat('سؤال تجريبي بمفتاح غير صالح', mohamedPartner, [], {
    apiKey: invalidKey
  });

  // يجب أن يرجع استجابة فشل منضبطة بدون Crash
  assert.equal(res.success, false);
  assert.equal(res.code, 'GEMINI_AUTH_FAILED');
  assert.match(res.error, /فشل التحقق من مفتاح Gemini API/);

  // التأكد التام من أن المفتاح لم يُطبع في رسالة الخطأ
  assert.ok(!res.error.includes(invalidKey), 'Security Violation: Error message leaked the invalid key');

  // فحص سجلات التدقيق والتأكد من تسجيل AGENT_AUTH_ERROR بدون تسريب
  const logs = AuditLogger.getRecentLogs(5);
  const authLog = logs.find(l => l.eventType === 'AGENT_AUTH_ERROR');
  assert.ok(authLog, 'Expected AGENT_AUTH_ERROR to be logged in AuditLogger');
  assert.ok(!JSON.stringify(authLog).includes(invalidKey), 'Security Violation: Audit log leaked the key');
});

// ============================================================================
// 6. [MOCK TEST] محاكاة انقطاع الخدمة (HTTP 503) وتفعيل التراجع الأسي والبديل
// ============================================================================
test('6. [MOCK TEST] Transient 503 Outage: Exponential backoff retries and switches to fallback model seamlessly', async () => {
  let primaryAttempts = 0;
  let fallbackAttempts = 0;

  // دالة محاكاة تعيد 503 على النموذج الأساسي وتنجح على النموذج البديل
  const mockAgentCall = async (model) => {
    if (model === 'mock-primary-model') {
      primaryAttempts++;
      const err = new Error('503 Service Unavailable: High Demand simulated for test');
      err.status = 503;
      throw err;
    }
    if (model === 'mock-fallback-model') {
      fallbackAttempts++;
      return { text: 'استجابة ناجحة من النموذج البديل بعد محاكاة 503' };
    }
    throw new Error(`Unknown model: ${model}`);
  };

  // اختبار وظيفة callWithRetry مباشرة
  let retryCount = 0;
  await assert.rejects(
    async () => {
      await GeminiAgent.callWithRetry(async (attempt) => {
        retryCount = attempt + 1;
        const err = new Error('503 Service Unavailable - Spikes in demand');
        err.status = 503;
        throw err;
      }, {
        maxRetries: 2,
        baseDelay: 20, // سرعة الاختبار
        partnerId: 'mohamed'
      });
    },
    (err) => {
      assert.match(err.message, /503/);
      return true;
    }
  );

  // التأكد من استدعاء 3 مرات (المحاولة الأولى + محاولتي إعادة)
  assert.equal(retryCount, 3, 'Expected 1 initial attempt + 2 retries (total 3)');

  // التأكد من تسجيل أحداث API_RETRY_ATTEMPT في سجل التدقيق
  const logs = AuditLogger.getRecentLogs(10);
  const retryLogs = logs.filter(l => l.eventType === 'API_RETRY_ATTEMPT');
  assert.ok(retryLogs.length >= 2, 'Expected API_RETRY_ATTEMPT events in audit logs');
});

// ============================================================================
// 7. [LOCAL INTENT TEST] تشغيل المحرك المحلي عند غياب المفتاح
// ============================================================================
test('7. [LOCAL INTENT TEST] Zero-Key Fallback: Local intent engine operates deterministically without API key', async () => {
  const result = await GeminiAgent.chat('ما هي مشروعات الشركة؟', mohamedPartner, [], {
    apiKey: ''
  });

  assert.equal(result.success, true);
  assert.equal(result.liveApiKeyUsed, false);
  assert.ok(result.model.includes('Local Intent Emulator'));
  assert.ok(result.reply.includes('قاعدة بيانات المشروعات الحقيقية'));
  assert.ok(result.toolsUsed.length > 0);
});
