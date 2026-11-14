// tests/phase-3.2-and-4.1-final-security.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../server/index.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';
import { GitHubService } from '../server/services/githubService.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { GeminiAgent } from '../server/geminiAgent.mjs';
import { GeminiCodeAdvisor, CLAIM_TYPES } from '../server/services/geminiCodeAdvisor.mjs';
import { AUTHORIZED_TOOL_WHITELIST } from '../server/tools/toolExecutors.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SECURE_ACCOUNTS_FILE = path.resolve(__dirname, '../server/data/github_accounts_secure.json');

let server;
let baseUrl;

const mohamedToken = issuePartnerToken('mohamed');
const tarekToken = issuePartnerToken('tarek');
const JWT_SECRET = process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS';

test.before(async () => {
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

// 1. اختبارات التحقق من التوكنات وصلاحيتها
test('1. Auth Security: Missing Bearer token is rejected with 401 AUTH_REQUIRED', async () => {
  const res = await fetch(`${baseUrl}/api/github/accounts`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'AUTH_REQUIRED');
});

test('2. Auth Security: Expired token is rejected with 401 TOKEN_EXPIRED', async () => {
  const expiredToken = jwt.sign(
    {
      sub: 'partner_mohamed',
      email: 'mohamed@tecnolobia.com',
      partnerId: 'mohamed',
      exp: Math.floor(Date.now() / 1000) - 3600 // منتهي الصلاحية قبل ساعة
    },
    JWT_SECRET
  );

  const res = await fetch(`${baseUrl}/api/github/accounts`, {
    headers: { 'Authorization': `Bearer ${expiredToken}` }
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'TOKEN_EXPIRED');
});

test('3. Auth Security: Forged / Invalid signature token is rejected with 401 INVALID_TOKEN', async () => {
  const forgedToken = jwt.sign(
    { sub: 'partner_mohamed', email: 'mohamed@tecnolobia.com' },
    'WRONG_FORGED_SECRET_KEY'
  );

  const res = await fetch(`${baseUrl}/api/github/accounts`, {
    headers: { 'Authorization': `Bearer ${forgedToken}` }
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'INVALID_TOKEN');
});

test('4. Anti-Spoofing: Partner A token with claimed Partner B x-partner-id header is blocked with 403', async () => {
  const res = await fetch(`${baseUrl}/api/github/accounts`, {
    headers: {
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'tarek' // انتحال هوية
    }
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'FORBIDDEN_IMPERSONATION');

  // فحص العكس: توكن طارق مع ترويسة تدعي محمد
  const resReverse = await fetch(`${baseUrl}/api/github/accounts`, {
    headers: {
      'Authorization': `Bearer ${tarekToken}`,
      'x-partner-id': 'mohamed' // انتحال هوية معاكس
    }
  });
  assert.equal(resReverse.status, 403);
  const dataReverse = await resReverse.json();
  assert.equal(dataReverse.code, 'FORBIDDEN_IMPERSONATION');

  // فحص تسجيل الإنذار الأمني
  const logs = AuditLogger.getRecentLogs(20);
  const alert = logs.find(l => l.eventType === 'SECURITY_ALERT' && l.inputPayload?.claimedPartnerId === 'tarek');
  assert.ok(alert, 'Security alert must be logged in audit trail');
});

test('5. Non-Partner Denial: Authenticated non-partner token is blocked with 403 FORBIDDEN_NOT_A_PARTNER', async () => {
  const outsiderToken = jwt.sign(
    { sub: 'user_stranger_101', email: 'intruder@external.com' },
    JWT_SECRET
  );

  const res = await fetch(`${baseUrl}/api/github/repositories`, {
    headers: { 'Authorization': `Bearer ${outsiderToken}` }
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'FORBIDDEN_NOT_A_PARTNER');
});

// 2. حماية وتشفير توكنات GitHub وعزل الشركاء
test('6. GitHub Token Encryption: Tokens stored on disk are encrypted with AES-256-GCM', () => {
  if (fs.existsSync(SECURE_ACCOUNTS_FILE)) {
    const rawContent = fs.readFileSync(SECURE_ACCOUNTS_FILE, 'utf8');
    // التأكد من عدم وجود أي توكن GitHub نصي مكشوف في الملف
    assert.ok(!rawContent.includes('ghp_'), 'Plaintext GitHub token must never be written to disk!');

    const parsed = JSON.parse(rawContent);
    if (parsed.account_1?.encryptedToken) {
      assert.ok(parsed.account_1.encryptedToken.encrypted, 'Must have encrypted field');
      assert.ok(parsed.account_1.encryptedToken.iv, 'Must have iv field');
      assert.ok(parsed.account_1.encryptedToken.authTag, 'Must have authTag field');
    }
  }
});

test('7. Partner Account Isolation: Tarek cannot connect or modify Mohamed slot (account_1)', async () => {
  await assert.rejects(
    async () => {
      await GitHubService.connectAccount('account_1', 'ghp_fake_test_token_123', { partnerId: 'tarek' });
    },
    (err) => {
      assert.equal(err.code, 'FORBIDDEN_PARTNER_ACCESS');
      assert.match(err.message, /مخصصة حصرياً للشريك التقني/);
      return true;
    }
  );
});

test('8. Partner Account Isolation: Mohamed cannot connect or modify Tarek slot (account_2)', async () => {
  await assert.rejects(
    async () => {
      await GitHubService.connectAccount('account_2', 'ghp_fake_test_token_456', { partnerId: 'mohamed' });
    },
    (err) => {
      assert.equal(err.code, 'FORBIDDEN_PARTNER_ACCESS');
      assert.match(err.message, /مخصصة حصرياً لشريك الأعمال/);
      return true;
    }
  );
});

test('9. Strict Read-Only: All mutating operations on GitHub throw READ_ONLY_VIOLATION', () => {
  assert.throws(() => GitHubService.createCommit(), /READ_ONLY_VIOLATION/);
  assert.throws(() => GitHubService.pushBranch(), /READ_ONLY_VIOLATION/);
  assert.throws(() => GitHubService.createPullRequest(), /READ_ONLY_VIOLATION/);
  assert.throws(() => GitHubService.deleteRepository(), /READ_ONLY_VIOLATION/);
});

// 3. سجل التدقيق وسلسلة التجزئة المشفرة ونقطة الفحص الموقعة
test('10. Audit Logger: Chain integrity verified with SHA-256 and signed tip checkpoint', () => {
  const result = AuditLogger.verifyChainIntegrity();
  assert.equal(result.valid, true, `Audit integrity check failed: ${result.error}`);
  assert.ok(result.count > 0);

  // التأكد من حظر التعديل والحذف
  assert.throws(() => AuditLogger.updateLog(), /SECURITY_VIOLATION/);
  assert.throws(() => AuditLogger.deleteLog(), /SECURITY_VIOLATION/);
});

// 4. ترقية وتوحيد نموذج Gemini
test('11. Gemini Model Upgrade: Active model resolves to gemini-3.8-flash and is dynamic', () => {
  const activeModel = GeminiAgent.getActiveModel();
  assert.equal(activeModel, process.env.GEMINI_MODEL || 'gemini-3.8-flash');

  // التأكد من أن النموذج المختار ليس 1.5-flash
  if (!process.env.GEMINI_MODEL) {
    assert.equal(activeModel, 'gemini-3.8-flash');
  }
});

// 5. القائمة البيضاء للأدوات الـ 12
test('12. Tool Whitelist: Exactly 12 tools authorized (9 Executive + 3 GitHub Read-Only)', () => {
  assert.equal(AUTHORIZED_TOOL_WHITELIST.size, 12);
  assert.ok(AUTHORIZED_TOOL_WHITELIST.has('github_get_accounts'));
  assert.ok(AUTHORIZED_TOOL_WHITELIST.has('github_list_repositories'));
  assert.ok(AUTHORIZED_TOOL_WHITELIST.has('github_analyze_repository'));
  assert.ok(AUTHORIZED_TOOL_WHITELIST.has('get_company_overview'));
});

// 6. تصنيف توصيات Gemini Code Advisor
test('13. Code Advisor Taxonomy: Strictly separates confirmed facts from market and financial estimates', async () => {
  const mockRepo = {
    name: 'odoo19-zatca-phase2',
    fullName: 'mat992024-collab/odoo19-zatca-phase2',
    language: 'Python',
    files: [{ name: 'README.md', type: 'file' }] // بدون .gitignore
  };

  const analysis = await GeminiCodeAdvisor.analyzeProject(mockRepo, { partnerId: 'mohamed' });
  assert.ok(Array.isArray(analysis.recommendations));

  // البحث عن حقيقة برمجية مؤكدة (غياب .gitignore)
  const gitignoreFact = analysis.recommendations.find(r => r.targetFile === '.gitignore');
  if (gitignoreFact) {
    assert.equal(gitignoreFact.claimType, CLAIM_TYPES.CONFIRMED_TECHNICAL_FACT);
    assert.equal(gitignoreFact.isConfirmedFact, true);
    assert.equal(gitignoreFact.financialNote, null);
  }

  // البحث عن توصية ZATCA وفحص تصنيفها كفرصة تجارية وليس كحقيقة مؤكدة
  const zatcaRec = analysis.recommendations.find(r => r.targetFile === 'odoo19-zatca-phase2');
  if (zatcaRec) {
    assert.equal(zatcaRec.claimType, CLAIM_TYPES.BUSINESS_OPPORTUNITY);
    assert.equal(zatcaRec.isConfirmedFact, false);
    assert.ok(zatcaRec.financialNote.includes('تقدير سوقي استرشادي غير مضمون'));
  }
});
