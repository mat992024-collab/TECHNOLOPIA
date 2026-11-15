// tests/phase-6.1-cloud-run-staging.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';

// ضبط متغيرات البيئة قبل تشغيل الخادم
process.env.NODE_ENV = 'test';
process.env.STATELESS_MODE = 'true';
process.env.JWT_SECRET = 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
process.env.MOHAMED_PIN = '1995';
process.env.TAREK_PIN = '2024';

import app from '../server/index.mjs';
import { SecretManagerService } from '../server/services/secretManagerService.mjs';
import { HumanApprovalService } from '../server/services/humanApprovalService.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { ToolExecutors } from '../server/tools/toolExecutors.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';
import { checkRateLimiterStatus } from '../server/middleware/distributedRateLimiter.mjs';

let server;
let baseUrl;

async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

test.before(async () => {
  await new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
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

// =========================================================================
// الحزمة 1: اختبارات فحص الحيوية والجاهزية وترويسات الأمان (Health & Security Headers)
// =========================================================================

test('1. Liveness Probe: GET /api/health returns 200 with cloudStaging status', async () => {
  const res = await request('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'healthy');
  assert.equal(res.data.cloudStaging, 'Phase 6.1 Active');
  assert.ok(res.data.timestamp);
});

test('2. Readiness Probe: GET /api/health/ready returns 200 with checks for secrets, rateLimiter, and stateless persistence', async () => {
  const res = await request('/api/health/ready');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ready');
  assert.equal(res.data.service, 'TECHNOLOPIA Cloud Run Staging Backend');
  assert.ok(res.data.checks.secrets.ready);
  assert.ok(res.data.checks.rateLimiter.status.includes('active'));
  assert.equal(res.data.checks.statelessPersistence.active, true);
});

test('3. Security Headers: Responses include all mandatory enterprise protection headers', async () => {
  const res = await request('/api/health');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.ok(res.headers.get('strict-transport-security')?.includes('max-age=31536000'));
  assert.equal(res.headers.get('x-xss-protection'), '0');
});

test('4. CORS Whitelist: Whitelisted origin is allowed, unlisted origin is rejected', async () => {
  const allowedRes = await request('/api/health', {
    headers: { 'Origin': 'https://tecnolobia-ceo.web.app' }
  });
  assert.equal(allowedRes.status, 200);
  assert.equal(allowedRes.headers.get('access-control-allow-origin'), 'https://tecnolobia-ceo.web.app');

  const blockedRes = await request('/api/health', {
    headers: { 'Origin': 'https://malicious-attacker-domain.evil' }
  });
  assert.notEqual(blockedRes.headers.get('access-control-allow-origin'), 'https://malicious-attacker-domain.evil');
});

// =========================================================================
// الحزمة 2: اختبارات إدارة الأسرار والتشفير المقاوم لهجمات التوقيت (Secret Manager & Salted PBKDF2)
// =========================================================================

test('5. SecretManager: validateJwtSecret enforces 256-bit entropy (Shannon entropy and 32+ chars)', () => {
  // مفتاح عالي التشتت التشفيري (Shannon entropy > 4.0 bits/char)
  const validSecret = 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
  assert.equal(SecretManagerService.validateJwtSecret(validSecret), true);

  // مفتاح 32 حرفاً ولكن بدون إنتروبيا حقيقية (محرف متكرر) - يجب رفضه
  assert.throws(() => {
    SecretManagerService.validateJwtSecret('A'.repeat(32));
  }, /INSUFFICIENT_ENTROPY/);

  // مفتاح قصير أقل من 32 حرفاً
  assert.throws(() => {
    SecretManagerService.validateJwtSecret('short-secret-key-1234');
  }, /INSUFFICIENT_LENGTH/);
});

test('6. SecretManager: Salted PBKDF2 PIN verification prevents timing attacks and verifies hashes', () => {
  const pin = '1995';
  const mohamedHash = SecretManagerService.hashPin(pin, 'mohamed');
  assert.equal(mohamedHash.length, 64, 'PBKDF2 SHA-256 hash must be 64 hex characters');

  // التحقق الإيجابي مع التجزئة المملحة
  assert.equal(SecretManagerService.verifyPin(pin, mohamedHash, 'mohamed'), true);

  // رفض الرمز الخاطئ مع التجزئة
  assert.equal(SecretManagerService.verifyPin('0000', mohamedHash, 'mohamed'), false);

  // التحقق الإيجابي مع السر المباشر
  assert.equal(SecretManagerService.verifyPin('1995', '1995', 'mohamed'), true);

  // المقارنة الثابتة زمنياً ترفض الأطوال المختلفة فوراً
  assert.equal(SecretManagerService.verifyPin('19951', '1995', 'mohamed'), false);
});

// =========================================================================
// الحزمة 3: تذاكر الاعتماد البشري الموقعة تشفيرياً (Cryptographic Human Approval Tickets)
// =========================================================================

test('7. Human Approval: Calling register_crm_lead without confirmation issues a single-use signed ticket', async () => {
  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
  const args = {
    businessName: 'شركة النيل السحابية للحلول البرمجية',
    phone: '+201011112222',
    industry: 'Cloud Infrastructure',
    softwareNeed: 'نظام إدارة سحابي متكامل',
    dealValueEstimate: 75000
  };

  const result = await ToolExecutors.execute('register_crm_lead', args, partner);
  assert.equal(result.data.action, 'SUGGESTION_ONLY');
  assert.equal(result.data.status, 'pending_partner_confirmation');
  assert.ok(result.data.approvalTicket, 'يجب إصدار تذكرة اعتماد موقعة');
  assert.ok(result.data.approvalTicket.ticketId.startsWith('ticket-'));
  assert.equal(result.data.approvalTicket.toolName, 'register_crm_lead');
  assert.equal(result.data.approvalTicket.partnerId, 'mohamed');
  assert.ok(result.data.approvalTicket.signature);
  assert.ok(result.data.approvalTicket.payloadHash);
  assert.ok(result.data.approvalTicket.expiresAt > Date.now());
});

test('8. Human Approval: Executing with a valid approval ticket succeeds and creates lead', async () => {
  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
  const args = {
    businessName: 'مستشفى الشفاء التخصصي - فرع الإسكندرية',
    phone: '+201033334444',
    industry: 'Healthcare',
    softwareNeed: 'ERP طبي متكامل',
    dealValueEstimate: 120000
  };

  // 1. طلب التذكرة
  const suggestion = await ToolExecutors.execute('register_crm_lead', args, partner);
  const ticket = suggestion.data.approvalTicket;
  assert.ok(ticket);

  // 2. التنفيذ مع التذكرة الموقعة
  const executionArgs = {
    ...args,
    approvalTicket: ticket
  };

  const executed = await ToolExecutors.execute('register_crm_lead', executionArgs, partner);
  assert.equal(executed.data.action, 'EXECUTED_SUCCESSFULLY');
  assert.equal(executed.data.status, 'created');
  assert.equal(executed.data.lead.businessName, 'مستشفى الشفاء التخصصي - فرع الإسكندرية');
});

test('9. Security: Replay Attack - Attempting to reuse an already consumed ticket is strictly blocked', async () => {
  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
  const args = {
    businessName: 'مكتب الأهرام للمحاماة والاستشارات',
    phone: '+201055556666',
    industry: 'Legal Services',
    softwareNeed: 'نظام أرشفة قانونية',
    dealValueEstimate: 45000
  };

  // إصدار التذكرة
  const suggestion = await ToolExecutors.execute('register_crm_lead', args, partner);
  const ticket = suggestion.data.approvalTicket;

  // الاستهلاك الأول (ناجح)
  const firstExec = await ToolExecutors.execute('register_crm_lead', { ...args, approvalTicket: ticket }, partner);
  assert.equal(firstExec.data.action, 'EXECUTED_SUCCESSFULLY');

  // محاولة إعادة الاستخدام (Replay Attack) - يجب أن تفشل
  await assert.rejects(async () => {
    await ToolExecutors.execute('register_crm_lead', { ...args, approvalTicket: ticket }, partner);
  }, (err) => {
    assert.equal(err.code, 'REPLAYED_APPROVAL_TICKET');
    return true;
  });
});

test('10. Security: Payload Tampering - Modifying dealValueEstimate after ticket issuance is strictly blocked', async () => {
  const partner = { id: 'tarek', name: 'Eng. Tarek Hafez' };
  const args = {
    businessName: 'مصانع الدلتا للصناعات الغذائية',
    phone: '+201077778888',
    industry: 'Food Production',
    softwareNeed: 'إدارة خطوط الإنتاج والمستودعات',
    dealValueEstimate: 90000
  };

  // إصدار التذكرة لقيمة 90,000 ج.م
  const suggestion = await ToolExecutors.execute('register_crm_lead', args, partner);
  const ticket = suggestion.data.approvalTicket;

  // محاولة تلاعب بالحمولة: تغيير القيمة إلى 150,000 ج.م مع نفس التذكرة
  const tamperedArgs = {
    ...args,
    dealValueEstimate: 150000,
    approvalTicket: ticket
  };

  await assert.rejects(async () => {
    await ToolExecutors.execute('register_crm_lead', tamperedArgs, partner);
  }, (err) => {
    assert.equal(err.code, 'APPROVAL_PAYLOAD_MISMATCH');
    return true;
  });
});

test('11. Security: Cross-Partner Execution - Mohamed cannot execute a ticket issued exclusively to Tarek', async () => {
  const tarekPartner = { id: 'tarek', name: 'Eng. Tarek Hafez' };
  const mohamedPartner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };

  const args = {
    businessName: 'شركة سيناء للتعدين والمقاولات',
    phone: '+201099990000',
    industry: 'Mining & Construction',
    softwareNeed: 'نظام إدارة المشاريع الميدانية',
    dealValueEstimate: 180000
  };

  // إصدار التذكرة لطارق
  const suggestion = await ToolExecutors.execute('register_crm_lead', args, tarekPartner);
  const ticket = suggestion.data.approvalTicket;
  assert.equal(ticket.partnerId, 'tarek');

  // محاولة محمد لتنفيذ تذكرة طارق
  await assert.rejects(async () => {
    await ToolExecutors.execute('register_crm_lead', { ...args, approvalTicket: ticket }, mohamedPartner);
  }, (err) => {
    assert.equal(err.code, 'CROSS_PARTNER_APPROVAL_FORBIDDEN');
    return true;
  });
});

test('12. Security: Expired Ticket - Expired ticket past TTL is strictly rejected', async () => {
  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
  const args = {
    businessName: 'شركة النور للمقاولات',
    phone: '+201022223333'
  };

  const expiredTicket = {
    ticketId: 'ticket-expired-12345',
    toolName: 'register_crm_lead',
    partnerId: 'mohamed',
    payloadHash: HumanApprovalService.computePayloadHash('register_crm_lead', args, 'mohamed'),
    issuedAt: Date.now() - 15 * 60 * 1000,
    expiresAt: Date.now() - 5 * 60 * 1000 // منتهية الصلاحية منذ 5 دقائق
  };

  // توقيع التذكرة المنتهية
  const signPayload = `${expiredTicket.ticketId}|${expiredTicket.toolName}|${expiredTicket.partnerId}|${expiredTicket.payloadHash}|${expiredTicket.expiresAt}`;
  expiredTicket.signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(signPayload).digest('hex');

  await assert.rejects(async () => {
    await HumanApprovalService.verifyAndConsumeTicket('register_crm_lead', args, partner, expiredTicket);
  }, (err) => {
    assert.equal(err.code, 'EXPIRED_APPROVAL_TICKET');
    return true;
  });
});

// =========================================================================
// الحزمة 4: السجل التدقيقي التشفيري عديم الحالة (Stateless Ephemeral Audit Logging)
// =========================================================================

test('13. Stateless Persistence: AuditLogger operates securely without local disk writes and maintains hash chain', () => {
  assert.equal(AuditLogger.isStatelessMode(), true);

  const entry1 = AuditLogger.log({
    partnerId: 'mohamed',
    eventType: 'CLOUD_RUN_STAGING_DEPLOY_TEST',
    inputPayload: { cluster: 'us-central1', revision: 'tecnolobia-staging-00001' },
    status: 'SUCCESS'
  });

  assert.ok(entry1.hash);
  assert.ok(entry1.previousHash);

  const entry2 = AuditLogger.log({
    partnerId: 'tarek',
    eventType: 'CLOUD_RUN_STAGING_CONFIG_VERIFIED',
    inputPayload: { status: 'verified' },
    status: 'SUCCESS'
  });

  assert.equal(entry2.previousHash, entry1.hash, 'سلسلة التجزئة التشفيرية يجب أن تكون متصلة');

  const integrity = AuditLogger.verifyChainIntegrity();
  assert.equal(integrity.valid, true, 'نزاهة سلسلة التدقيق التشفيرية يجب أن تكون صالحة 100%');

  // التحقق من الحظر الصريح للتعديل والحذف
  assert.throws(() => AuditLogger.updateLog(), /SECURITY_VIOLATION/);
  assert.throws(() => AuditLogger.deleteLog(), /SECURITY_VIOLATION/);
});

// =========================================================================
// الحزمة 5: حدود استهلاك الموارد الموزعة (Distributed Rate Limiting)
// =========================================================================

test('14. Distributed Rate Limiter: checkRateLimiterStatus reports active protection across all tiers', () => {
  const status = checkRateLimiterStatus();
  assert.ok(status.status.includes('active'));
  assert.equal(status.isDistributed, false);
  assert.equal(status.storeType, 'in_memory_instance_local');
  assert.ok(status.deploymentWarning);
  assert.deepEqual(status.protectedTiers, ['auth', 'chat', 'mutations', 'global']);
});
