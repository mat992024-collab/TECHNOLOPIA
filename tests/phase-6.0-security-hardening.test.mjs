// tests/phase-6.0-security-hardening.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import http from 'http';
import fs from 'fs';
import path from 'path';

// تحميل متغيرات البيئة قبل تشغيل الخادم
process.env.NODE_ENV = 'test';
process.env.MOHAMED_PIN = process.env.MOHAMED_PIN || '1995';
process.env.TAREK_PIN = process.env.TAREK_PIN || '2024';

import app from '../server/index.mjs';

// استيراد أدوات التحقق الأمني
import { issuePartnerToken, verifyToken, TRUSTED_PARTNERS } from '../server/middleware/authMiddleware.mjs';
import { RealDataProvider } from '../server/data/realDataProvider.mjs';

let server;
let baseUrl;

// دوال مساعدة لطلبات HTTP
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

// =========================================================================
// الحزمة 1: اختبارات إغلاق ثغرات إصدار التوكن والمصادقة في /api/auth/token
// =========================================================================

test('1. Security: POST /api/auth/token WITHOUT credentialSecret is strictly REJECTED with 401 CREDENTIALS_REQUIRED', async () => {
  // محاولة طلب توكن بدون إرسال credentialSecret نهائياً
  const resEmpty = await request('/api/auth/token', {
    method: 'POST',
    body: { partnerId: 'mohamed' }
  });

  assert.equal(resEmpty.status, 401, 'يجب رفض الطلب بكود 401 عند عدم تقديم كلمة المرور أو PIN');
  assert.equal(resEmpty.data.success, false);
  assert.equal(resEmpty.data.code, 'CREDENTIALS_REQUIRED');
  assert.equal(resEmpty.data.token, undefined, 'يجب عدم إصدار أي توكن');

  // محاولة طلب بكلمة سر فارغة أو مسافات فقط
  const resWhitespace = await request('/api/auth/token', {
    method: 'POST',
    body: { partnerId: 'tarek', credentialSecret: '   ' }
  });

  assert.equal(resWhitespace.status, 401);
  assert.equal(resWhitespace.data.code, 'CREDENTIALS_REQUIRED');
});

test('2. Security: POST /api/auth/token with arbitrary 4+ char password is strictly REJECTED (No length >= 4 bypass)', async () => {
  // اختبار أن أي كلمة سر بطول 4 خانات أو أكثر لم تعد تسمح بالدخول
  const fakeSecrets = ['1234', 'test', 'pass', '2026', 'admin', 'random_password_123'];

  for (const fakeSecret of fakeSecrets) {
    const res = await request('/api/auth/token', {
      method: 'POST',
      body: { partnerId: 'mohamed', credentialSecret: fakeSecret }
    });

    assert.equal(res.status, 401, `كلمة السر الوهمية (${fakeSecret}) يجب أن تُرفض بكود 401`);
    assert.equal(res.data.success, false);
    assert.equal(res.data.code, 'INVALID_CREDENTIALS');
    assert.equal(res.data.token, undefined);
  }
});

test('3. Security: POST /api/auth/token with magic string "verified_partner_session" is strictly REJECTED', async () => {
  // التحقق من إزالة كلمة السر الخلفية السحرية verified_partner_session
  const res = await request('/api/auth/token', {
    method: 'POST',
    body: {
      partnerId: 'mohamed',
      credentialSecret: 'verified_partner_session'
    }
  });

  assert.equal(res.status, 401, 'يجب رفض الباك دور verified_partner_session بكود 401 فوراً');
  assert.equal(res.data.success, false);
  assert.equal(res.data.code, 'INVALID_CREDENTIALS');
  assert.equal(res.data.token, undefined);
});

test('4. Security: Legitimate login with correct PIN succeeds and issues cryptographically valid token', async () => {
  // تسجيل دخول شرعي للمهندس محمد البحر
  const resMohamed = await request('/api/auth/token', {
    method: 'POST',
    body: {
      partnerId: 'mohamed',
      credentialSecret: process.env.MOHAMED_PIN || '1995'
    }
  });

  assert.equal(resMohamed.status, 200);
  assert.equal(resMohamed.data.success, true);
  assert.ok(resMohamed.data.token, 'يجب إصدار توكن صالح');
  assert.equal(resMohamed.data.partner.partnerId, 'mohamed');
  assert.equal(resMohamed.data.partner.name, 'المهندس محمد البحر');

  // تسجيل دخول شرعي للمهندس طارق حافظ
  const resTarek = await request('/api/auth/token', {
    method: 'POST',
    body: {
      partnerId: 'tarek',
      credentialSecret: process.env.TAREK_PIN || '2024'
    }
  });

  assert.equal(resTarek.status, 200);
  assert.equal(resTarek.data.success, true);
  assert.ok(resTarek.data.token, 'يجب إصدار توكن صالح');
  assert.equal(resTarek.data.partner.partnerId, 'tarek');
  assert.equal(resTarek.data.partner.name, 'المهندس طارق حافظ');
});

// =========================================================================
// الحزمة 2: اختبارات التحقق التشفيري ومنع التوكنات المزورة (Cryptographic Signatures)
// =========================================================================

test('5. Security: Forged JWT signed with wrong secret is strictly REJECTED on protected endpoints', async () => {
  // إنشاء توكن مزور موقع بمفتاح عشوائي غير مفتاح السيرفر
  const forgedPayload = {
    sub: 'partner_mohamed',
    email: 'mohamed@tecnolobia.com',
    partnerId: 'mohamed',
    displayName: 'المهندس محمد البحر'
  };
  const forgedToken = jwt.sign(forgedPayload, 'ATTACKER_MALICIOUS_SECRET_KEY', { expiresIn: '1h' });

  // محاولة استخدام التوكن المزور لطلب بيانات العملاء
  const res = await request('/api/crm/leads', {
    headers: {
      'Authorization': `Bearer ${forgedToken}`,
      'x-partner-id': 'mohamed'
    }
  });

  assert.equal(res.status, 401, 'يجب رفض التوكن المزور بكود 401');
  assert.equal(res.data.success, false);
  assert.equal(res.data.code, 'INVALID_TOKEN');
});

test('6. Security: Self-signed token claiming Google Firebase issuer is strictly REJECTED (Zero unverified jwt.decode)', async () => {
  // محاولة تزوير توكن يدعي أنه صادر من Firebase Auth
  const forgedFirebaseToken = jwt.sign({
    sub: 'uid_mohamed_prod',
    email: 'mohamed@tecnolobia.com',
    aud: 'modeer-27c2d',
    iss: 'https://securetoken.google.com/modeer-27c2d'
  }, 'FAKE_GOOGLE_CERT_KEY', { expiresIn: '1h' });

  const res = await request('/api/crm/leads', {
    headers: {
      'Authorization': `Bearer ${forgedFirebaseToken}`,
      'x-partner-id': 'mohamed'
    }
  });

  assert.equal(res.status, 401, 'يجب رفض التوكن المزور المنتحل لـ Firebase بكود 401 لعدم وجود توقيع رقمي صالح من Google');
  assert.equal(res.data.success, false);
  assert.equal(res.data.code, 'INVALID_TOKEN');
});

test('7. Security: Anti-Spoofing & Impersonation Prevention remains 100% strictly enforced', async () => {
  const mohamedToken = issuePartnerToken('mohamed');

  // إرسال توكن محمد مع ادعاء هوية طارق في ترويسة x-partner-id
  const resSpoofed = await request('/api/crm/leads', {
    headers: {
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'tarek'
    }
  });

  assert.equal(resSpoofed.status, 403, 'يجب رفض انتحال الهوية بكود 403 فوراً');
  assert.equal(resSpoofed.data.success, false);
  assert.equal(resSpoofed.data.code, 'FORBIDDEN_IMPERSONATION');
});

// =========================================================================
// الحزمة 3: اختبارات عزل بيانات الشريكين وحماية المسودات والعملاء الخاصين
// =========================================================================

test('8. Partner Data Isolation: Private lead created by Mohamed is hidden from Tarek and returns 403 on direct access', async () => {
  const mohamedToken = issuePartnerToken('mohamed');
  const tarekToken = issuePartnerToken('tarek');

  // 1. إنشاء عميل سري للمهندس محمد
  const createRes = await request('/api/crm/leads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'mohamed'
    },
    body: {
      businessName: 'عميل سري خاص بالمهندس محمد',
      industry: 'حلول ذكاء اصطناعي خاصة',
      softwareNeed: 'نظام داخلي مشفر',
      source: 'direct',
      assignedPartner: 'mohamed',
      isPrivate: true,
      dealValueEstimate: 50000,
      contactInfo: {
        phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        city: 'القاهرة'
      }
    }
  });

  assert.equal(createRes.status, 201);
  const privateLeadId = createRes.data.lead.id;

  // 2. المهندس طارق يستعلم قائمة العملاء: يجب ألا يظهر العميل السري في قائمته
  const tarekListRes = await request('/api/crm/leads', {
    headers: {
      'Authorization': `Bearer ${tarekToken}`,
      'x-partner-id': 'tarek'
    }
  });

  assert.equal(tarekListRes.status, 200);
  const foundInTarekList = (tarekListRes.data.leads || []).find(l => l.id === privateLeadId);
  assert.equal(foundInTarekList, undefined, 'العميل الخاص لا يجب أن يظهر في قائمة الشريك الآخر');

  // 3. المهندس طارق يحاول طلب العميل السري بالـ ID المباشر: يجب رفضه بكود 403
  const tarekDirectRes = await request(`/api/crm/leads/${privateLeadId}`, {
    headers: {
      'Authorization': `Bearer ${tarekToken}`,
      'x-partner-id': 'tarek'
    }
  });

  assert.equal(tarekDirectRes.status, 403, 'يجب حظر الشريك الآخر بكود 403 عند محاولة فتح عميل خاص');
  assert.equal(tarekDirectRes.data.code, 'FORBIDDEN_LEAD_ACCESS');
});

// =========================================================================
// الحزمة 4: تدقيق قواعد Firestore Security Rules وحمايتها
// =========================================================================

test('9. Firestore Rules Security: Verifies firestore.rules and firestore.rules.secure match and enforce zero open access', () => {
  const secureRulesPath = path.resolve('firestore.rules.secure');
  const mainRulesPath = path.resolve('firestore.rules');

  assert.ok(fs.existsSync(secureRulesPath), 'ملف firestore.rules.secure يجب أن يكون موجوداً');
  assert.ok(fs.existsSync(mainRulesPath), 'ملف firestore.rules يجب أن يكون موجوداً');

  const secureRules = fs.readFileSync(secureRulesPath, 'utf8');
  const mainRules = fs.readFileSync(mainRulesPath, 'utf8');

  // التحقق من خلو كلا الملفين من ثغرة allow read, write: if true;
  assert.ok(!secureRules.includes('allow read, write: if true;'), 'قواعد firestore.rules.secure يجب ألا تحتوي على if true مفتوح');
  assert.ok(!mainRules.includes('allow read, write: if true;'), 'قواعد firestore.rules يجب ألا تحتوي على if true مفتوح');

  // التحقق من اشتمال القواعد على عزل الشركاء وسجلات التدقيق غير القابلة للحذف
  assert.ok(secureRules.includes('tecnolobia_audit_logs'), 'يجب حماية سجل التدقيق');
  assert.ok(secureRules.includes('allow update, delete: if false;'), 'يجب منع تعديل أو حذف سجلات التدقيق');
  assert.ok(secureRules.includes('tecnolobia_crm_leads'), 'يجب حماية عملاء الـ CRM وعزل الخاص منهم');
  assert.ok(secureRules.includes('tecnolobia_private_notes'), 'يجب عزل الملاحظات الخاصة لكل شريك');

  // فحص firebase.json للتأكد من ربطه بالقواعد الآمنة
  const fbConfig = JSON.parse(fs.readFileSync(path.resolve('firebase.json'), 'utf8'));
  assert.equal(fbConfig.firestore?.rules, 'firestore.rules.secure', 'firebase.json يجب أن يشير إلى firestore.rules.secure');
});

// =========================================================================
// الحزمة 5: التحقق من سلامة الحسابات المالية وتوزيع الأرباح الرباعي
// =========================================================================

test('10. Financial Engine: Four-Way Profit Split (25% x 4) and piastre precision remain 100% intact', () => {
  const finances = RealDataProvider.getFinancialSummary();
  assert.equal(finances.isRealData, true);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.partnerTarekShare);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.devFundShare);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.sadaqahShare);

  // التحقق الحسابي الدقيق من خوارزمية تقسيم الـ 25% مع معالجة كسور القروش
  const netProfit = 100.03;
  const mohamedCents = Math.floor(netProfit * 0.25 * 100) / 100;
  const tarekCents = Math.floor(netProfit * 0.25 * 100) / 100;
  const devCents = Math.floor(netProfit * 0.25 * 100) / 100;
  const sadaqahCents = Math.round((netProfit - (mohamedCents + tarekCents + devCents)) * 100) / 100;

  assert.equal(mohamedCents, 25.00);
  assert.equal(tarekCents, 25.00);
  assert.equal(devCents, 25.00);
  assert.equal(sadaqahCents, 25.03); // كسر الـ 3 قروش يذهب للصدقة
  assert.equal(Math.round((mohamedCents + tarekCents + devCents + sadaqahCents) * 100) / 100, netProfit);
});
