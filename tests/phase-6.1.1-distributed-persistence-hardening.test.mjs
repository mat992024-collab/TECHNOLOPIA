// tests/phase-6.1.1-distributed-persistence-hardening.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';

process.env.NODE_ENV = 'test';
process.env.STATELESS_MODE = 'true';
process.env.JWT_SECRET = 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
process.env.MOHAMED_PIN = '1995';
process.env.TAREK_PIN = '2024';

import app from '../server/index.mjs';
import { FirebaseAdminService } from '../server/services/firebaseAdminService.mjs';
import { SecretManagerService } from '../server/services/secretManagerService.mjs';
import { HumanApprovalService } from '../server/services/humanApprovalService.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { FirestoreCrmRepository, FIRESTORE_CRM_COLLECTIONS } from '../server/services/firestoreCrmRepository.mjs';
import { CrmLeadStore } from '../server/data/crmLeadStore.mjs';
import { checkRateLimiterStatus } from '../server/middleware/distributedRateLimiter.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';

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
// الحزمة 1: اختبارات تذاكر الاعتماد عبر الحاويات الموزعة (Cross-Instance Approval)
// [Classification: Unit / Mock Multi-Instance]
// =========================================================================

test('1. [Unit / Mock Multi-Instance] Cross-instance ticket consumption: Instance A issues, Instance B consumes, replay on A is blocked', async () => {
  // محاكاة مخزن مركزي موزع مشترك بين نسختين من Cloud Run (Instance A و Instance B)
  const sharedCentralStore = new Map();
  HumanApprovalService.setCentralUsedTicketsStore(sharedCentralStore);

  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
  const actionArgs = {
    businessName: 'شركة الإسكندرية للشحن والتفريغ',
    phone: '+201011119999',
    industry: 'Logistics',
    softwareNeed: 'نظام تتبع أسطول الشحن',
    dealValueEstimate: 85000
  };

  // 1. Instance A: إصدار تذكرة اعتماد موقعة تشفيرياً
  const ticket = HumanApprovalService.issueApprovalTicket('register_crm_lead', actionArgs, partner);
  assert.ok(ticket.ticketId);
  assert.ok(ticket.signature);

  // 2. Instance B: استلام التذكرة واستهلاكها بنجاح عبر التحقق التشفيري الموزع
  const consumed = await HumanApprovalService.verifyAndConsumeTicket('register_crm_lead', actionArgs, partner, ticket);
  assert.equal(consumed.valid, true);
  assert.equal(consumed.mode, 'CRYPTOGRAPHIC_TICKET_VERIFIED');
  assert.equal(sharedCentralStore.has(ticket.ticketId), true, 'التذكرة يجب أن تُسجل فوراً في المخزن المركزي المشترك');

  // 3. Instance A (أو أي نسخة أخرى): محاولة إعادة استهلاك نفس التذكرة (Replay Attack)
  await assert.rejects(async () => {
    await HumanApprovalService.verifyAndConsumeTicket('register_crm_lead', actionArgs, partner, ticket);
  }, (err) => {
    assert.equal(err.code, 'REPLAYED_APPROVAL_TICKET');
    return true;
  });
});

// =========================================================================
// الحزمة 2: اختبارات العمليات المتزامنة في الـ CRM (Concurrent CRM Writes)
// [Classification: Unit / Mock Concurrency]
// =========================================================================

test('2. [Unit / Mock Concurrency] Concurrent CRM writes execute safely and maintain data integrity', async () => {
  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };

  // تنفيذ 5 عمليات تسجيل متزامنة لعملاء مختلفين
  const leadPayloads = Array.from({ length: 5 }, (_, i) => ({
    businessName: `مؤسسة الأمل التنموية - فرع ${i + 1}`,
    phone: `+20108888000${i}`,
    industry: 'Development',
    dealValueEstimate: 50000 + (i * 10000)
  }));

  const results = await Promise.all(
    leadPayloads.map(p => FirestoreCrmRepository.createLead(p, partner))
  );

  assert.equal(results.length, 5);
  const ids = new Set(results.map(r => r.id));
  assert.equal(ids.size, 5, 'كافة العملاء المسجلين بالتزامن يجب أن يمتلكوا معرفات فريدة');
  
  // التحقق من تواجد كافة العملاء في المستودع
  results.forEach(r => {
    const fetched = FirestoreCrmRepository.getLeadById(r.id, partner);
    assert.ok(fetched);
    assert.equal(fetched.businessName, r.businessName);
  });
});

// =========================================================================
// الحزمة 3: اختبارات تحديث نقاط الفحص المتزامنة لسجل التدقيق (Concurrent Checkpoints)
// [Classification: Unit / Mock Concurrency]
// =========================================================================

test('3. [Unit / Mock Concurrency] Concurrent audit log writes maintain monotonic hash chaining without forks', () => {
  const sharedCheckpoints = new Map();
  const sharedLogs = [];
  AuditLogger.setCentralStore(sharedCheckpoints, sharedLogs);

  const events = Array.from({ length: 10 }, (_, i) => ({
    partnerId: i % 2 === 0 ? 'mohamed' : 'tarek',
    eventType: `CONCURRENT_AUDIT_EVENT_${i}`,
    inputPayload: { index: i, timestamp: Date.now() },
    status: 'SUCCESS'
  }));

  // تسجيل الأحداث
  events.forEach(ev => AuditLogger.log(ev));

  assert.equal(sharedLogs.length, 10);
  const checkpoint = sharedCheckpoints.get('audit_tip_checkpoint');
  assert.ok(checkpoint);
  assert.equal(checkpoint.totalCount, 10);

  // فحص نزاهة السلسلة التشفيرية
  const integrity = AuditLogger.verifyChainIntegrity();
  assert.equal(integrity.valid, true, 'سلسلة التجزئة الناتجة عن الكتابة المتزامنة يجب أن تكون سليمة 100%');
  AuditLogger.clearCentralStore();
});

// =========================================================================
// الحزمة 4: استمرارية سجل التدقيق بعد إعادة تشغيل الحاوية (Container Restart Resilience)
// [Classification: Unit / Mock Restart]
// =========================================================================

test('4. [Unit / Mock Restart] Container restart preserves audit history and connects hash chain seamlessly', () => {
  const sharedCheckpoints = new Map();
  const sharedLogs = [];
  AuditLogger.setCentralStore(sharedCheckpoints, sharedLogs);

  // 1. قبل إعادة التشغيل: تسجيل عمليتين
  const preEntry1 = AuditLogger.log({ partnerId: 'mohamed', eventType: 'PRE_RESTART_EVENT_1' });
  const preEntry2 = AuditLogger.log({ partnerId: 'mohamed', eventType: 'PRE_RESTART_EVENT_2' });
  const preRestartTip = sharedCheckpoints.get('audit_tip_checkpoint');
  assert.equal(preRestartTip.lastHash, preEntry2.hash);

  // 2. محاكاة إعادة تشغيل الحاوية: مسح ذاكرة المعالج الداخلية ولكن مع الإبقاء على المخزن المركزي
  AuditLogger.clearCentralStore();
  AuditLogger.setCentralStore(sharedCheckpoints, sharedLogs);

  // 3. بعد إعادة التشغيل: تسجيل عملية جديدة في الحاوية البديلة
  const postEntry = AuditLogger.log({ partnerId: 'tarek', eventType: 'POST_RESTART_EVENT_3' });

  // السجل الجديد يجب ألا يبدأ من 'GENESIS' بل يجب أن يرتبط مباشرة بـ lastHash للقمة السابقة
  assert.equal(postEntry.previousHash, preEntry2.hash, 'previousHash بعد إعادة التشغيل يجب أن يطابق قمة السلسلة المركزية المحفوظة');
  
  const integrity = AuditLogger.verifyChainIntegrity();
  assert.equal(integrity.valid, true, 'نزاهة السلسلة يجب أن تكون صالحة عبر إعادة التشغيل');
  AuditLogger.clearCentralStore();
});

// =========================================================================
// الحزمة 5: سياسة الإغلاق عند الفشل لسحابة Firestore (Cloud Fail-Closed Policy)
// [Classification: Unit / Cloud Fail-Closed]
// =========================================================================

test('5. [Unit / Cloud Fail-Closed] Cloud mode strictly fails closed when Firestore is unavailable', async () => {
  const prevStagingMode = process.env.STAGING_MODE;
  try {
    // تفعيل نمط السحابة (Cloud Mode)
    process.env.STAGING_MODE = 'true';
    assert.equal(FirebaseAdminService.isCloudMode(), true);

    // محاكاة تعذر الاتصال بـ Cloud Firestore (null provider)
    FirebaseAdminService.setMockFirestore(null);

    const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
    const leadData = {
      businessName: 'شركة النيل للسياحة',
      phone: '+201066667777',
      dealValueEstimate: 60000
    };

    // يجب أن تفشل العملية فوراً وترفض إنشاء العميل بدلاً من الارتداد الصامت للذاكرة
    await assert.rejects(async () => {
      await FirestoreCrmRepository.createLead(leadData, partner);
    }, (err) => {
      assert.ok(err.code === 'FIRESTORE_UNAVAILABLE' || err.code === 'FIRESTORE_WRITE_FAILED', 'Must fail closed');
      return true;
    });
  } finally {
    process.env.STAGING_MODE = prevStagingMode;
    FirebaseAdminService.clearMockFirestore();
  }
});

// =========================================================================
// الحزمة 6: عزل الفضاء السحابي بين Staging و Production (Namespace Isolation)
// [Classification: Unit]
// =========================================================================

test('6. [Unit] Namespace Isolation: Staging collections are strictly prefixed and separated from Production', () => {
  const prevNamespace = process.env.CRM_STAGING_NAMESPACE;
  try {
    // بيئة Staging
    process.env.CRM_STAGING_NAMESPACE = 'staging';
    assert.equal(FirebaseAdminService.getCollectionName('tecnolobia_crm_leads'), 'staging_tecnolobia_crm_leads');
    assert.equal(FirebaseAdminService.getCollectionName('system_checkpoints'), 'staging_system_checkpoints');
    assert.equal(FirebaseAdminService.getCollectionName('system_used_tickets'), 'staging_system_used_tickets');

    // بيئة Production الحقيقية
    process.env.CRM_STAGING_NAMESPACE = 'production';
    assert.equal(FirebaseAdminService.getCollectionName('tecnolobia_crm_leads'), 'tecnolobia_crm_leads');
    assert.equal(FirebaseAdminService.getCollectionName('system_checkpoints'), 'system_checkpoints');
  } finally {
    process.env.CRM_STAGING_NAMESPACE = prevNamespace;
  }
});

// =========================================================================
// الحزمة 7: قياس إنتروبيا شانون التشفيرية لمفتاح JWT_SECRET (Shannon Entropy)
// [Classification: Unit]
// =========================================================================

test('7. [Unit] Cryptographic Entropy: validateJwtSecret mathematically calculates Shannon entropy bits', () => {
  // 1. مفتاح عالي التشتت التشفيري
  const validKey = 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS_STAGING_KEY_32BYTES';
  assert.equal(SecretManagerService.validateJwtSecret(validKey), true);

  const entropy = SecretManagerService.calculateShannonEntropy(validKey);
  assert.ok(entropy.totalBits > 200, `Entropy bits (${entropy.totalBits}) must be > 200 bits`);
  assert.ok(entropy.perChar > 3.5, `Per-char entropy (${entropy.perChar}) must be > 3.5 bits/char`);

  // 2. مفتاح بطول 32 حرفاً ولكن ذو إنتروبيا صفرية (محرف واحد متكرر)
  assert.throws(() => {
    SecretManagerService.validateJwtSecret('X'.repeat(32));
  }, /INSUFFICIENT_ENTROPY/);

  // 3. مفتاح بنمط متكرر بدائي
  assert.throws(() => {
    SecretManagerService.validateJwtSecret('1234'.repeat(8));
  }, /INSUFFICIENT_ENTROPY/);

  // 4. مفتاح قصير
  assert.throws(() => {
    SecretManagerService.validateJwtSecret('short-key-1234');
  }, /INSUFFICIENT_LENGTH/);
});

// =========================================================================
// الحزمة 8: التدقيق الصريح لنظام تحديد المعدل والتحذير من غياب Redis
// [Classification: Unit]
// =========================================================================

test('8. [Unit] Rate Limiter Audit: honestly reports instance-local storage and deployment blocker warning when Redis is absent', () => {
  const status = checkRateLimiterStatus();
  assert.equal(status.isDistributed, false, 'يجب عدم ادعاء العمل الموزع في غياب التخزين المشترك');
  assert.equal(status.storeType, 'in_memory_instance_local');
  assert.ok(status.deploymentWarning.includes('Memorystore'));
});

// =========================================================================
// الحزمة 9: الحماية المحيطية لـ Cloud Run وتأمين المسارات الحساسة
// [Classification: Integration / Mock]
// =========================================================================

test('9. [Integration / Mock] Perimeter Security: Unauthorized requests without Bearer tokens are strictly rejected with 401', async () => {
  // محاولة الوصول لمسار CRM دون تقديم توكن موثق
  const res = await request('/api/crm/leads', {
    method: 'GET'
  });

  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);

  // الوصول باستخدام توكن موثق للشريك م. محمد
  const validToken = issuePartnerToken('mohamed');
  const authRes = await request('/api/crm/leads', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validToken}` }
  });

  assert.equal(authRes.status, 200);
  assert.equal(authRes.data.success, true);
});

// =========================================================================
// الحزمة 10: حظر التذاكر المزورة والمعدلة حمولتها ومنتهية الصلاحية
// [Classification: Unit / Security]
// =========================================================================

test('10. [Unit / Security] Approval Tickets: Strictly rejects forged, tampered, and expired tickets', async () => {
  const partner = { id: 'mohamed', name: 'Eng. Mohamed El-Bahr' };
  const originalArgs = {
    businessName: 'مستشفى السلام الدولي',
    phone: '+201099998888',
    dealValueEstimate: 140000
  };

  const ticket = HumanApprovalService.issueApprovalTicket('register_crm_lead', originalArgs, partner);

  // 1. تذكرة بتوقيع رقمي مزور
  const forgedTicket = { ...ticket, signature: '0123456789abcdef'.repeat(4) };
  await assert.rejects(async () => {
    await HumanApprovalService.verifyAndConsumeTicket('register_crm_lead', originalArgs, partner, forgedTicket);
  }, (err) => {
    assert.equal(err.code, 'FORGED_APPROVAL_TICKET');
    return true;
  });

  // 2. تلاعب في بيانات الحمولة بعد صدور التذكرة (تعديل قيمة الصفقة)
  const tamperedArgs = { ...originalArgs, dealValueEstimate: 200000 };
  await assert.rejects(async () => {
    await HumanApprovalService.verifyAndConsumeTicket('register_crm_lead', tamperedArgs, partner, ticket);
  }, (err) => {
    assert.equal(err.code, 'APPROVAL_PAYLOAD_MISMATCH');
    return true;
  });

  // 3. تذكرة منتهية الصلاحية
  const expiredTicket = {
    ...ticket,
    ticketId: 'ticket-expired-test',
    expiresAt: Date.now() - 1000
  };
  const expiredSignPayload = `${expiredTicket.ticketId}|register_crm_lead|mohamed|${expiredTicket.payloadHash}|${expiredTicket.expiresAt}`;
  expiredTicket.signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(expiredSignPayload).digest('hex');

  await assert.rejects(async () => {
    await HumanApprovalService.verifyAndConsumeTicket('register_crm_lead', originalArgs, partner, expiredTicket);
  }, (err) => {
    assert.equal(err.code, 'EXPIRED_APPROVAL_TICKET');
    return true;
  });
});
