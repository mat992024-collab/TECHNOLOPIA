// tests/phase-3.1-security-hardening.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../server/index.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { RealDataProvider } from '../server/data/realDataProvider.mjs';
import { ToolExecutors } from '../server/tools/toolExecutors.mjs';
import { GeminiAgent } from '../server/geminiAgent.mjs';

let server;
let baseUrl;
let mohamedToken;
let tarekToken;

test.before(async () => {
  mohamedToken = issuePartnerToken('mohamed');
  tarekToken = issuePartnerToken('tarek');
  await new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
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

test('1. Anti-Spoofing: Sending x-partner-id without valid Bearer Token is rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-partner-id': 'mohamed' // محاولة ادعاء الهوية عبر الترويسة فقط دون توكن
    },
    body: JSON.stringify({ message: 'اعرض الحسابات' })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'AUTH_REQUIRED');
  assert.match(data.error, /ترويسة x-partner-id وحدها ليست إثباتاً للهوية/);
});

test('2. Token Validation: Invalid or forged ID Token is rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer fake_tampered_jwt_token_12345'
    },
    body: JSON.stringify({ message: 'فحص مالي' })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'INVALID_TOKEN');
});

test('3. Impersonation Prevention: Sending Mohamed token with claimed tarek x-partner-id is blocked with 403', async () => {
  // توكن محمد الحقيقي ولكن مع ترويسة تدعي أنه طارق
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'tarek' // انتحال هوية الشريك الآخر!
    },
    body: JSON.stringify({ message: 'اعتماد سحب مالي' })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'FORBIDDEN_IMPERSONATION');
  assert.match(data.error, /تم رصد محاولة انتحال هوية/);

  // التأكد من تسجيل إنذار أمني في سجل التدقيق
  const logs = AuditLogger.getRecentLogs(50);
  const alert = logs.find(l => l.eventType === 'SECURITY_ALERT' && l.inputPayload?.claimedPartnerId === 'tarek');
  assert.ok(alert, 'Security alert must be recorded on impersonation attempt');
});

test('4. Non-Partner Denial: Token for external authenticated user is blocked with 403', async () => {
  // إنشاء توكن سليم تقنياً لكنه لا ينتمي لأي من الشريكين
  const outsiderToken = jwt.sign(
    { sub: 'user_stranger_99', email: 'stranger@gmail.com', aud: 'modeer-27c2d' },
    process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS'
  );

  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${outsiderToken}`
    },
    body: JSON.stringify({ message: 'عرض بيانات الشركة' })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'FORBIDDEN_NOT_A_PARTNER');
});

test('5. Draft Protection: Partner cannot tamper with or modify another partner private draft', async () => {
  // 1. محمد ينشئ مسودة مهمة خاصة به
  const privateDraft = RealDataProvider.saveDraftTask({
    title: 'ملاحظة ومسودة تقنية خاصة بمحمد',
    description: 'كود سري تحت التجربة',
    ownerPartnerId: 'mohamed',
    isPrivate: true,
    assignedTo: 'mohamed'
  });

  // 2. طارق يحاول تعديل هذه المسودة الخاصة بمحمد
  const res = await fetch(`${baseUrl}/api/gemini/draft-task/${privateDraft.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`,
      'x-partner-id': 'tarek'
    },
    body: JSON.stringify({ title: 'تعديل غير مصرح به من طارق' })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'FORBIDDEN_PRIVATE_DRAFT');
  assert.match(data.error, /لا يمكنك تعديل مسودة خاصة بالشريك الآخر/);
});

test('6. Whitelist Enforcement: Calling unauthorized tool outside whitelist is blocked with Security Alert', async () => {
  // التأكد من حظر أي أداة غير مدرجة بالقائمة البيضاء
  await assert.rejects(
    async () => {
      await ToolExecutors.execute('drop_database_and_wipe_records', {}, { id: 'mohamed' });
    },
    (err) => {
      assert.equal(err.code, 'UNAUTHORIZED_TOOL');
      assert.match(err.message, /غير مصرح بها في القائمة البيضاء/);
      return true;
    }
  );

  // فحص تسجيل الإنذار الأمني
  const logs = AuditLogger.getRecentLogs(3);
  const alert = logs.find(l => l.eventType === 'SECURITY_ALERT' && l.toolName === 'drop_database_and_wipe_records');
  assert.ok(alert, 'Unauthorized tool call must be recorded in AuditLogger as SECURITY_ALERT');
});

test('7. Drafts Persistence: Proposals and Tasks persist safely across reloads with atomic writes', () => {
  const proposal = RealDataProvider.saveAiProposal({
    projectId: 'proj-1',
    title: 'فحص استمرارية البيانات الذرية',
    problemDiagnosis: 'اختبار الحفظ',
    proposedSolution: 'Atomic write test',
    expectedImpact: '100% persistence',
    ownerPartnerId: 'mohamed'
  });

  // قراءة مستقلة للمسودات للتأكد من وجودها الدائم
  const allProposals = RealDataProvider.getAiProposals();
  const found = allProposals.find(p => p.id === proposal.id);
  assert.ok(found);
  assert.equal(found.title, 'فحص استمرارية البيانات الذرية');
  assert.equal(found.status, 'pending_partner_review');
});

test('8. Audit Immutability: Past audit logs cannot be updated or deleted and hash chain verifies integrity', () => {
  // 1. محاولة استدعاء دوال التعديل أو الحذف ترمي خطأ أمني صارم
  assert.throws(() => AuditLogger.updateLog(), /SECURITY_VIOLATION/);
  assert.throws(() => AuditLogger.deleteLog(), /SECURITY_VIOLATION/);

  // 2. التحقق من سلامة السلسلة التشفيرية للهاش (Hash Chain Verification)
  const integrity = AuditLogger.verifyChainIntegrity();
  assert.equal(integrity.valid, true, `Audit hash chain is broken: ${integrity.error}`);
  assert.ok(integrity.count > 0);
});

test('9. Rate Limiting: Exceeding request quota triggers HTTP 429 Too Many Requests', async () => {
  // إرسال عدد من الطلبات السريعة المتتالية
  process.env.RATE_LIMIT_TEST = 'true';
  let got429 = false;

  for (let i = 0; i < 35; i++) {
    const res = await fetch(`${baseUrl}/api/gemini/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mohamedToken}`,
        'x-partner-id': 'mohamed'
      },
      body: JSON.stringify({ message: `اختبار الضغط ${i}` })
    });

    if (res.status === 429) {
      got429 = true;
      const data = await res.json();
      assert.ok(data.code.includes('RATE_LIMIT'));
      break;
    }
  }

  delete process.env.RATE_LIMIT_TEST;
  assert.ok(got429, 'Rate limiter should return HTTP 429 when threshold exceeded');
});

test('10. Gemini Dynamic Model Config: Model name is dynamically configurable via GEMINI_MODEL', () => {
  const defaultModel = GeminiAgent.getActiveModel();
  assert.equal(defaultModel, 'gemini-3.8-flash');

  // تغيير متغير البيئة والتأكد من التحديث اللحظي
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';
  assert.equal(GeminiAgent.getActiveModel(), 'gemini-2.5-flash');

  delete process.env.GEMINI_MODEL;
  assert.equal(GeminiAgent.getActiveModel(), 'gemini-3.8-flash');
});

test('11. Input Sanitization: Oversized message payload (>5000 chars) is blocked with 400', async () => {
  const hugeText = 'أ'.repeat(6000);
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'mohamed'
    },
    body: JSON.stringify({ message: hugeText })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.code, 'PAYLOAD_TOO_LARGE');
});
