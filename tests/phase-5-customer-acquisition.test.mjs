// tests/phase-5-customer-acquisition.test.mjs
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
  } catch {
    // ignore
  }
}

import app from '../server/index.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';
import { CrmLeadStore, CRM_LEAD_STAGES } from '../server/data/crmLeadStore.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { ExternalSimulationService } from '../server/services/externalSimulationService.mjs';
import { GeminiAgent } from '../server/geminiAgent.mjs';
import { RealDataProvider } from '../server/data/realDataProvider.mjs';
import { AiSalesAgent, OFFICIAL_PRICING_DISCLAIMER } from '../server/services/aiSalesAgent.mjs';

let server;
let baseUrl;
const mohamedToken = issuePartnerToken('mohamed');
const tarekToken = issuePartnerToken('tarek');

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
// 1. اختبارات أمان المصادقة والصلاحيات (Auth Security)
// ============================================================================
test('1. Auth Security: Unauthenticated request to CRM endpoints is rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/crm/leads`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'AUTH_REQUIRED');
});

test('2. Auth Security: Authenticated partner can retrieve CRM leads and pipeline data', async () => {
  const res = await fetch(`${baseUrl}/api/crm/leads`, {
    headers: { 'Authorization': `Bearer ${mohamedToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.leads));
  assert.ok(data.leads.length >= 1);
});

// ============================================================================
// 2. اختبارات اكتشاف وتسجيل العملاء المحتملين (Lead Discovery)
// ============================================================================
test('3. Lead Discovery: Registering a legitimate prospect lead succeeds with schema validation', async () => {
  const testPhone = `011${Date.now().toString().slice(-8)}`;
  const payload = {
    businessName: 'كافيه وكريب الباشا',
    industry: 'مطاعم وسياحة',
    softwareNeed: 'كاشير بون سريع ومنيو باركود QR',
    source: 'facebook',
    priority: 'high',
    dealValueEstimate: 8500,
    dealProbability: 50,
    assignedPartner: 'tarek',
    phone: testPhone,
    contactPerson: 'أ. حسام الباشا',
    city: 'الإسكندرية',
    address: 'جليم - على البحر',
    initialNote: 'تواصل عبر رسائل صفحة الفيسبوك يسأل عن سعر الكاشير'
  };

  const res = await fetch(`${baseUrl}/api/crm/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.lead.businessName, 'كافيه وكريب الباشا');
  assert.equal(data.lead.stage, CRM_LEAD_STAGES.NEW_LEAD);
  assert.equal(data.lead.assignedPartner, 'tarek');
  assert.ok(data.lead.history.length >= 1);
  assert.equal(data.lead.history[0].toStage, CRM_LEAD_STAGES.NEW_LEAD);
  assert.equal(data.lead.history[0].changedBy, 'tarek');
});

test('4. Data Integrity: Duplicate lead registration with the same phone is rejected with 409', async () => {
  const duplicatePayload = {
    businessName: 'فرع مكرر لنفس الكافيه',
    phone: '01012345678', // رقم مطعم البرنس المسجل بالفعل
    softwareNeed: 'برنامج إضافي'
  };

  const res = await fetch(`${baseUrl}/api/crm/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify(duplicatePayload)
  });

  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.code, 'DUPLICATE_LEAD');
});

// ============================================================================
// 3. دورة حياة العميل الاحترافية والانتقالات المشروعة (CRM Lifecycle)
// ============================================================================
test('5. Lifecycle Flow: Valid stage transitions (NEW_LEAD -> CONTACTED -> INTERESTED -> PROPOSAL_SENT -> NEGOTIATION -> WON) succeed and log history', async () => {
  // إنشاء عميل جديد للاختبار
  const leadPhone = `012${Date.now().toString().slice(-8)}`;
  const created = CrmLeadStore.createLead({
    businessName: 'سلسلة صيدليات النور',
    industry: 'رعاية صحية وتجزئة',
    softwareNeed: 'الربط مع الفوترة الإلكترونية السحابية',
    phone: leadPhone,
    dealValueEstimate: 16000
  }, { id: 'mohamed', name: 'المهندس محمد البحر' });

  // 1. الانتقال إلى CONTACTED
  let res = await fetch(`${baseUrl}/api/crm/leads/${created.id}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify({ stage: CRM_LEAD_STAGES.CONTACTED, note: 'مكالمة زووم مع مدير المشتريات' })
  });
  assert.equal(res.status, 200);

  // 2. الانتقال إلى INTERESTED
  res = await fetch(`${baseUrl}/api/crm/leads/${created.id}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify({ stage: CRM_LEAD_STAGES.INTERESTED, note: 'أبدى اهتماماً كبيراً بعد مشاهدة العرض' })
  });
  assert.equal(res.status, 200);

  // 3. الانتقال إلى PROPOSAL_SENT
  res = await fetch(`${baseUrl}/api/crm/leads/${created.id}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify({ stage: CRM_LEAD_STAGES.PROPOSAL_SENT, note: 'إرسال العرض الفني والمالي الرسمي' })
  });
  assert.equal(res.status, 200);

  // 4. الانتقال إلى NEGOTIATION
  res = await fetch(`${baseUrl}/api/crm/leads/${created.id}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify({ stage: CRM_LEAD_STAGES.NEGOTIATION, note: 'جلسة تفاوض على دفعة التعاقد والصيانة' })
  });
  assert.equal(res.status, 200);

  // 5. إتمام التعاقد WON
  res = await fetch(`${baseUrl}/api/crm/leads/${created.id}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify({ stage: CRM_LEAD_STAGES.WON, note: 'توقيع العقد واستلام الدفعة المقدمة' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.lead.stage, CRM_LEAD_STAGES.WON);
  assert.equal(data.lead.dealProbability, 100);

  // فحص تاريخ التنقلات وسلسلة التدقيق
  const history = data.lead.history;
  assert.ok(history.length >= 6);
  assert.equal(history[history.length - 1].toStage, CRM_LEAD_STAGES.WON);
  assert.equal(history[history.length - 1].changedBy, 'tarek');
});

test('6. Security Rules: Illegal stage transition (e.g. NEW_LEAD directly to WON) is rejected with 400', async () => {
  const leadPhone = `015${Date.now().toString().slice(-8)}`;
  const created = CrmLeadStore.createLead({
    businessName: 'مكتب استشارات هندسية',
    industry: 'خدمات هندسية',
    softwareNeed: 'نظام إدارة المشاريع والمهام',
    phone: leadPhone
  }, { id: 'mohamed', name: 'المهندس محمد البحر' });

  // محاولة قفزة غير مشروعة من NEW_LEAD مباشرة إلى WON
  const res = await fetch(`${baseUrl}/api/crm/leads/${created.id}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify({ stage: CRM_LEAD_STAGES.WON, note: 'محاولة قفزة غير منطقية' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.code, 'INVALID_STAGE_TRANSITION');
});

// ============================================================================
// 4. وكيل المبيعات الذكي (AI Sales Agent)
// ============================================================================
test('7. AI Sales Agent: Generates tailored strategy & proposal draft with non-binding disclaimer', async () => {
  const leads = CrmLeadStore.getLeads();
  const targetLead = leads[0]; // مطعم البرنس

  const res = await fetch(`${baseUrl}/api/crm/leads/${targetLead.id}/ai-strategy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.strategy);
  assert.ok(data.strategy.recommendedService.includes('كاشير') || data.strategy.recommendedService.includes('فريش') || data.strategy.recommendedService.includes('مطعم'));
  assert.ok(data.strategy.indicativePriceMin > 0);
  assert.ok(data.strategy.indicativePriceMax >= data.strategy.indicativePriceMin);
  assert.match(data.strategy.pricingNote, /استرشادي غير ملزم/);
  assert.equal(data.strategy.status, 'pending_partner_review');
  assert.ok(data.strategy.marketingPitchMessage.length > 50);

  // التأكد من حفظ المسودة في سجل المسودات المركزي
  const draftsRes = await fetch(`${baseUrl}/api/crm/ai-drafts?leadId=${targetLead.id}`, {
    headers: { 'Authorization': `Bearer ${tarekToken}` }
  });
  const draftsData = await draftsRes.json();
  assert.ok(draftsData.drafts.length >= 1);
});

// ============================================================================
// 5. صمامات الأمان وضوابط المحاكاة (Simulation-First Guardrails)
// ============================================================================
test('8. Simulation Mode: WhatsApp outreach prepares copyable draft without making external API calls', async () => {
  const leads = CrmLeadStore.getLeads();
  const targetLead = leads[0];

  const res = await fetch(`${baseUrl}/api/crm/simulate-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify({
      leadId: targetLead.id,
      messageText: 'رسالة تجريبية منضبطة في نمط المحاكاة الآمن'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.mode, 'SIMULATION_ONLY');
  assert.equal(data.isLiveDispatched, false);
  assert.equal(data.readyToCopy, true);
  assert.ok(data.previewUrl.startsWith('https://wa.me/'));
  assert.match(data.disclaimer, /وضع المحاكاة الآمن/);
});

test('9. Simulation Mode: Facebook social post generates preview without publishing to Facebook or spending budget', async () => {
  const res = await fetch(`${baseUrl}/api/crm/simulate-facebook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify({
      title: 'حملة كاشير المطاعم - الإسكندرية',
      targetNiche: 'أصحاب المطاعم والكافيهات',
      postBody: 'وداعاً لعجز الشيفتات وطوابير المطبخ مع نظام كاشير فريش الذكي.',
      budgetEstimate: 0
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.mode, 'SIMULATION_ONLY');
  assert.equal(data.isLivePublished, false);
  assert.match(data.disclaimer, /وضع المحاكاة الآمن/);
});

test('10. Safety Guardrail: Real live external dispatch is strictly BLOCKED by system policy', async () => {
  const res = await fetch(`${baseUrl}/api/crm/live-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    }
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'EXTERNAL_INTEGRATION_BLOCKED');
  assert.match(data.error, /الإرسال الخارجي المباشر معطل في مرحلة المحاكاة/);
});

// ============================================================================
// 6. لوحة متابعة المبيعات والإحصائيات (Sales Pipeline Analytics)
// ============================================================================
test('11. Sales Dashboard Analytics: Calculates pipeline value, conversion rates, and detects overdue follow-ups', async () => {
  const res = await fetch(`${baseUrl}/api/crm/analytics`, {
    headers: { 'Authorization': `Bearer ${tarekToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  const analytics = data.analytics;

  assert.ok(analytics.totalLeads >= 2);
  assert.ok(typeof analytics.totalPipelineValue === 'number');
  assert.ok(typeof analytics.totalWonValue === 'number');
  assert.ok(typeof analytics.conversionRate === 'number');
  assert.ok(analytics.stageBreakdown[CRM_LEAD_STAGES.NEW_LEAD]);
  assert.ok(analytics.stageBreakdown[CRM_LEAD_STAGES.WON]);
  assert.ok(analytics.partnerPerformance.mohamed);
  assert.ok(analytics.partnerPerformance.tarek);
  assert.ok(Array.isArray(analytics.overdueFollowUps));
});

// ============================================================================
// 7. سلامة سجل التدقيق وعزل الملاحظات (Audit Trail & Note History)
// ============================================================================
test('12. Partner Notes: Adding partner note records timestamped note and logs audit event', async () => {
  const leads = CrmLeadStore.getLeads();
  const targetLead = leads[0];

  const noteText = 'تم الاتفاق مع صاحب المطعم على موعد المعاينة يوم الأحد القادم الساعة 5 مساءً';
  const res = await fetch(`${baseUrl}/api/crm/leads/${targetLead.id}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify({ note: noteText })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.lead.notes.some(n => n.includes(noteText)));

  // فحص سجل التدقيق
  const logs = AuditLogger.getRecentLogs(5);
  const noteLog = logs.find(l => l.eventType === 'CRM_NOTE_ADDED');
  assert.ok(noteLog);
  assert.equal(noteLog.partnerId, 'tarek');
});

// ============================================================================
// 8. اختبارات المراجعة النهائية الصارمة للمرحلة الخامسة (Phase 5.0 Final Review Tests)
// ============================================================================

test('13. Final Review Point 1: Gemini Model Configuration & Cascade Integrity (No gemini-2.5-flash)', async () => {
  // 1. التحقق من النموذج الأساسي المعتمد
  const activeModel = GeminiAgent.getActiveModel();
  assert.equal(activeModel, 'gemini-3.8-flash');

  // 2. التحقق من استبعاد النموذج الموقوف gemini-2.5-flash
  const fallbackModel = GeminiAgent.getFallbackModel();
  assert.notEqual(fallbackModel, 'gemini-2.5-flash');
  assert.ok(['gemini-3-flash-preview', 'gemini-flash-lite-latest'].includes(fallbackModel));

  // 3. التحقق من عمل وكيل المبيعات الذكي بالنموذج الحي أو المحرك المحلي بدون أي اعتماد على 2.5
  const mockLead = {
    id: `lead-model-audit-${Date.now()}`,
    businessName: 'كافيه تجريبي للتدقيق',
    industry: 'مطاعم',
    softwareNeed: 'كاشير وبون سريع',
    dealValueEstimate: 7000
  };
  const partner = { id: 'mohamed', name: 'المهندس محمد البحر' };
  const strategy = await AiSalesAgent.generateLeadStrategy(mockLead, partner);
  assert.ok(strategy);
  assert.notEqual(strategy.generatedByModel, 'gemini-2.5-flash');
  assert.ok(strategy.generatedByModel.includes('gemini') || strategy.generatedByModel.includes('Deterministic'));
});

test('14. Final Review Point 2: Financial Accuracy & WON != Collected Funds Separation', async () => {
  // 1. تسجيل عميل جديد بقيمة متفق عليها 15,000 ج.م
  const phone = `012${Date.now().toString().slice(-8)}`;
  const created = CrmLeadStore.createLead({
    businessName: 'شركة الساحل للاستيراد',
    industry: 'تجارة واستيراد',
    softwareNeed: 'الفاتورة الإلكترونية والمخازن',
    phone,
    dealValueEstimate: 15000
  }, { id: 'tarek', name: 'المهندس طارق حافظ' });

  assert.equal(created.collectedAmount, 0);
  assert.equal(created.outstandingBalance, 15000);
  assert.equal(created.isPaymentCollected, false);
  assert.equal(created.isContractSigned, false);

  // 2. ترقية العميل عبر المراحل وصولاً إلى WON
  CrmLeadStore.updateLeadStage(created.id, CRM_LEAD_STAGES.CONTACTED, 'مكالمة هاتفية', { id: 'tarek', name: 'المهندس طارق حافظ' });
  CrmLeadStore.updateLeadStage(created.id, CRM_LEAD_STAGES.INTERESTED, 'أبدى اهتماماً', { id: 'tarek', name: 'المهندس طارق حافظ' });
  CrmLeadStore.updateLeadStage(created.id, CRM_LEAD_STAGES.PROPOSAL_SENT, 'إرسال العرض', { id: 'tarek', name: 'المهندس طارق حافظ' });
  CrmLeadStore.updateLeadStage(created.id, CRM_LEAD_STAGES.NEGOTIATION, 'تفاوض نهائي', { id: 'tarek', name: 'المهندس طارق حافظ' });
  const wonLead = CrmLeadStore.updateLeadStage(created.id, CRM_LEAD_STAGES.WON, 'توقيع العقد الرسمي', { id: 'tarek', name: 'المهندس طارق حافظ' });

  // 3. التحقق الحاسم: WON يعني توقيع العقد فقط ولا يعني تحصيل الأموال!
  assert.equal(wonLead.stage, CRM_LEAD_STAGES.WON);
  assert.equal(wonLead.isContractSigned, true);
  assert.equal(wonLead.isPaymentCollected, false, 'WON stage must NOT imply payment collected!');
  assert.equal(wonLead.collectedAmount, 0, 'Collected cash remains 0 until actual financial transaction receipt');

  // 4. التحقق من لوحة التحليلات والفصل بين قيمة التعاقد والنقدية المحصلة
  const analytics = CrmLeadStore.getAnalytics({ id: 'tarek', role: 'partner' });
  assert.ok(analytics.totalContractedWonValue >= 15000);
  assert.ok(analytics.outstandingReceivables >= 15000);
  assert.match(analytics.financialDistinctionNotice, /لا يُعد دليلاً على تحصيل الأموال/);

  // 5. التحقق الصارم من صون معادلة الأرباح الـ 25% وعدم تأثرها بمراحل CRM
  const finances = RealDataProvider.getFinancialSummary();
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.partnerTarekShare);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.devFundShare);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.sadaqahShare);
});

test('15. Final Review Point 3: AI Pricing & Sales Promises (Non-binding, no unauthorized discounts/installments)', async () => {
  const mockLead = {
    id: `lead-pricing-audit-${Date.now()}`,
    businessName: 'مطبعة المستقبل الفني',
    industry: 'مطابع ودعاية',
    softwareNeed: 'حساب هالك الزنكات وأوامر الشغل',
    dealValueEstimate: 12000,
    contactInfo: { contactPerson: 'أ. سامح', city: 'الإسكندرية' }
  };
  const partner = { id: 'tarek', name: 'المهندس طارق حافظ' };
  const strategy = await AiSalesAgent.generateLeadStrategy(mockLead, partner);

  // التحقق من أن السعر استرشادي وليس رسمياً
  assert.equal(strategy.isOfficialPrice, false);
  assert.equal(strategy.isBindingOffer, false);
  assert.equal(strategy.requiresPartnerApproval, true);
  assert.ok(strategy.pricingDisclaimer);
  assert.match(strategy.pricingDisclaimer, /استرشادي/);
  assert.match(strategy.pricingDisclaimer, /غير ملزم/);
  assert.match(strategy.pricingDisclaimer, /يُحظر تقديم أي وعود بخصومات أو تقسيط أو خدمات مجانية/);

  // التحقق من خلو الرسالة من أي وعود بخصومات غير معتمدة أو تقسيط وهمي
  assert.doesNotMatch(strategy.marketingPitchMessage, /خصم خاص 50%/);
  assert.doesNotMatch(strategy.marketingPitchMessage, /تقسيط بدون فوائد/);
  assert.doesNotMatch(strategy.marketingPitchMessage, /ضمان مدى الحياة/);
});

test('16. Final Review Point 4: Partner Data Isolation, Private Notes, & Draft Ownership Protection', async () => {
  // 1. محمد ينشئ عميلاً محتملاً خاصاً به (isPrivate: true)
  const phone = `010${Date.now().toString().slice(-8)}`;
  const privateLead = CrmLeadStore.createLead({
    businessName: 'مشروع سري خاص بمحمد',
    industry: 'استشارات خاصة',
    softwareNeed: 'نظام حماية خاص',
    phone,
    isPrivate: true,
    ownerPartnerId: 'mohamed',
    assignedPartner: 'mohamed'
  }, { id: 'mohamed', name: 'المهندس محمد البحر' });

  // 2. طارق يحاول الوصول المباشر للعميل الخاص بمحمد عبر API
  const resForbidden = await fetch(`${baseUrl}/api/crm/leads/${privateLead.id}`, {
    headers: { 'Authorization': `Bearer ${tarekToken}` }
  });
  assert.equal(resForbidden.status, 403);
  const dataForbidden = await resForbidden.json();
  assert.equal(dataForbidden.code, 'FORBIDDEN_LEAD_ACCESS');

  // 3. محمد يستطيع الوصول بنجاح لعميله الخاص
  const resMohamed = await fetch(`${baseUrl}/api/crm/leads/${privateLead.id}`, {
    headers: { 'Authorization': `Bearer ${mohamedToken}` }
  });
  assert.equal(resMohamed.status, 200);

  // 4. عزل الملاحظات الخاصة (Private Notes Isolation)
  // محمد يضيف ملاحظة سرية خاصة به
  const privateNoteText = 'ملاحظة سرية: العميل طلب شروط خاصة جداً لا يراها إلا محمد';
  await fetch(`${baseUrl}/api/crm/leads/${privateLead.id}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify({ note: privateNoteText, isPrivate: true })
  });

  // التحقق من أن طارق لا يرى العميل الخاص في قائمته
  const tarekLeads = CrmLeadStore.getLeads({}, { id: 'tarek', name: 'المهندس طارق حافظ' });
  const leakedLead = tarekLeads.find(l => l.id === privateLead.id);
  assert.equal(leakedLead, undefined, 'Private lead of Mohamed must NOT appear in Tarek lead list!');

  // 5. حماية ملكية مسودات المبيعات (Draft Ownership Protection)
  const privateDraft = CrmLeadStore.saveSalesDraft({
    leadId: privateLead.id,
    businessName: privateLead.businessName,
    partnerId: 'mohamed',
    isPrivate: true,
    outreachPitchMessage: 'مسودة خاصة بمحمد'
  });

  // طارق يحاول تعديل مسودة محمد الخاصة
  const resTamper = await fetch(`${baseUrl}/api/crm/ai-drafts/${privateDraft.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`
    },
    body: JSON.stringify({ outreachPitchMessage: 'محاولة تعديل غير مصرح بها من طارق' })
  });
  assert.equal(resTamper.status, 403);
  const tamperData = await resTamper.json();
  assert.equal(tamperData.code, 'FORBIDDEN_NOT_DRAFT_OWNER');

  // 6. التحقق من منع انتحال الهوية (Anti-Spoofing) على مسارات CRM
  const resSpoof = await fetch(`${baseUrl}/api/crm/leads`, {
    headers: {
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'tarek'
    }
  });
  assert.equal(resSpoof.status, 403);
  const spoofData = await resSpoof.json();
  assert.equal(spoofData.code, 'FORBIDDEN_IMPERSONATION');
});
