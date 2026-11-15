// tests/phase-6.2-unified-firestore-crm.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'fs';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.CRM_ISOLATED_MODE = 'true';
process.env.MOHAMED_PIN = process.env.MOHAMED_PIN || '1995';
process.env.TAREK_PIN = process.env.TAREK_PIN || '2024';

// تحميل متغيرات .env إن وجدت
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
import { 
  FirestoreCrmRepository, 
  CRM_LEAD_STAGES, 
  VALID_STAGE_TRANSITIONS, 
  FIRESTORE_CRM_COLLECTIONS 
} from '../server/services/firestoreCrmRepository.mjs';
import { CrmLeadStore } from '../server/data/crmLeadStore.mjs';
import { ToolExecutors } from '../server/tools/toolExecutors.mjs';
import { RealDataProvider } from '../server/data/realDataProvider.mjs';
import { AiSalesAgent } from '../server/services/aiSalesAgent.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';

let server;
let baseUrl;
const mohamedPartner = { id: 'mohamed', name: 'المهندس محمد البحر', role: 'technical' };
const tarekPartner = { id: 'tarek', name: 'المهندس طارق حافظ', role: 'business' };
const mohamedToken = issuePartnerToken('mohamed');
const tarekToken = issuePartnerToken('tarek');

test.before(async () => {
  FirestoreCrmRepository.setIsolatedMode(true);
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
// 1. إنشاء عميل محتمل في بيئة Firestore المعزولة والتحقق من صحة المخطط
// ============================================================================
test('1. Firestore CRM Engine: Create a CRM lead in isolated test environment with complete normalized schema', async () => {
  const uniquePhone = `010${Date.now().toString().slice(-8)}`;
  const payload = {
    businessName: 'سلسلة صيدليات الأندلس الحديثة',
    industry: 'صيدليات ورعاية صحية',
    softwareNeed: 'نظام ربط الفروع وتتبع تواريخ صلاحية الأدوية والروشتات الإلكترونية',
    source: 'field_sales',
    priority: 'high',
    dealValueEstimate: 28000,
    phone: uniquePhone,
    contactPerson: 'د. سامح الأندلسي',
    city: 'الإسكندرية',
    address: 'شارع جمال عبد الناصر - ميامي'
  };

  const created = FirestoreCrmRepository.createLead(payload, mohamedPartner);

  assert.ok(created.id, 'يجب توليد معرف فريد للعميل');
  assert.equal(created.businessName, payload.businessName);
  assert.equal(created.industry, payload.industry);
  assert.equal(created.softwareNeed, payload.softwareNeed);
  assert.equal(created.stage, CRM_LEAD_STAGES.NEW_LEAD, 'المرحلة الافتراضية للعميل الجديد هي NEW_LEAD');
  assert.equal(created.dealValueEstimate, 28000);
  assert.equal(created.collectedAmount, 0, 'المبلغ المحصل يجب أن يكون صفراً عند الإنشاء');
  assert.equal(created.invoicedAmount, 0);
  assert.equal(created.outstandingBalance, 28000, 'الرصيد المتبقي يساوي قيمة الصفقة التقديرية');
  assert.equal(created.isContractSigned, false);
  assert.equal(created.isPaymentCollected, false);
  assert.equal(created.assignedPartner, 'mohamed');
  assert.equal(created.ownerPartnerId, 'mohamed');
  assert.equal(created.sourceOfTruth, 'firestore');
  assert.equal(created.isRealProspect, true);
  assert.ok(Array.isArray(created.history));
  assert.ok(created.history.length >= 1);
  assert.equal(created.history[0].toStage, CRM_LEAD_STAGES.NEW_LEAD);
});

// ============================================================================
// 2. استرجاع العميل عبر Backend API و CrmLeadStore
// ============================================================================
test('2. Backend Lead Retrieval: Retrieve the created lead via CrmLeadStore.getLeadById and REST API', async () => {
  const uniquePhone = `011${Date.now().toString().slice(-8)}`;
  const lead = CrmLeadStore.createLead({
    businessName: 'معمل تبارك للتحاليل الطبية',
    industry: 'مختبرات طبية',
    softwareNeed: 'بوابة إرسال نتائج التحاليل عبر واتساب والباركود',
    dealValueEstimate: 14000,
    phone: uniquePhone,
    contactPerson: 'د. محمد تبارك'
  }, mohamedPartner);

  // 1. استرجاع عبر CrmLeadStore المباشر
  const fetched = CrmLeadStore.getLeadById(lead.id, mohamedPartner);
  assert.ok(fetched);
  assert.equal(fetched.id, lead.id);
  assert.equal(fetched.businessName, 'معمل تبارك للتحاليل الطبية');
  assert.equal(fetched.dealValueEstimate, 14000);

  // 2. استرجاع عبر REST API المحمي
  const res = await fetch(`${baseUrl}/api/crm/leads/${lead.id}`, {
    headers: { 'Authorization': `Bearer ${mohamedToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.lead.id, lead.id);
  assert.equal(data.lead.businessName, 'معمل تبارك للتحاليل الطبية');
});

// ============================================================================
// 3. استرجاع العميل عبر أداة الذكاء الاصطناعي get_crm_leads للـ AI CEO
// ============================================================================
test('3. AI CEO Integration: Retrieve lead through get_crm_leads tool executor reading unified Firestore repository', async () => {
  const uniquePhone = `012${Date.now().toString().slice(-8)}`;
  const lead = CrmLeadStore.createLead({
    businessName: 'مصنع الأهرام للكرتون المضلع',
    industry: 'صناعة وتعبئة',
    softwareNeed: 'حساب تكاليف خامات الكرتون وتتبع أوامر التشغيل',
    dealValueEstimate: 35000,
    phone: uniquePhone
  }, mohamedPartner);

  // استدعاء الأداة المعتمدة للـ AI CEO
  const toolResult = await ToolExecutors.execute('get_crm_leads', { search: 'الأهرام للكرتون' }, mohamedPartner);

  assert.equal(toolResult.success, true);
  assert.equal(toolResult.tool, 'get_crm_leads');
  assert.equal(toolResult.permissionLevel, 'READ_ONLY');
  assert.ok(Array.isArray(toolResult.data));

  const found = toolResult.data.find(l => l.id === lead.id);
  assert.ok(found, 'يجب أن تقرأ أداة الـ AI CEO العميل الجديد مباشرة من مستودع Firestore الموحد');
  assert.equal(found.businessName, 'مصنع الأهرام للكرتون المضلع');
  assert.equal(found.dealValueEstimate, 35000);
  assert.equal(found.sourceOfTruth, 'firestore');
});

// ============================================================================
// 4. ترقية مرحلة العميل والتحقق من حفظ السجل وقواعد الانتقال
// ============================================================================
test('4. State Machine & Lifecycle: Update lead stage with validation and history logging', async () => {
  const uniquePhone = `015${Date.now().toString().slice(-8)}`;
  const lead = CrmLeadStore.createLead({
    businessName: 'مركز النور التعليمي',
    industry: 'تعليم وتدريب',
    softwareNeed: 'منظومة حضور الطلاب بالباركود وسداد المصروفات',
    dealValueEstimate: 12000,
    phone: uniquePhone
  }, tarekPartner);

  // 1. انتقال شرعي: NEW_LEAD -> CONTACTED
  const updated = CrmLeadStore.updateLeadStage(
    lead.id, 
    CRM_LEAD_STAGES.CONTACTED, 
    'تم إجراء مكالمة هاتفية مع مدير المركز لتحديد موعد العرض التجريبي', 
    tarekPartner
  );

  assert.equal(updated.stage, CRM_LEAD_STAGES.CONTACTED);
  assert.ok(updated.updatedAt);
  assert.ok(updated.history.length >= 2);
  const lastHistory = updated.history[updated.history.length - 1];
  assert.equal(lastHistory.fromStage, CRM_LEAD_STAGES.NEW_LEAD);
  assert.equal(lastHistory.toStage, CRM_LEAD_STAGES.CONTACTED);
  assert.equal(lastHistory.changedBy, 'tarek');

  // 2. رفض قفزة غير شرعية: الانتقال مباشرة من CONTACTED إلى WON دون المرور بـ PROPOSAL_SENT أو NEGOTIATION
  assert.throws(() => {
    CrmLeadStore.updateLeadStage(lead.id, CRM_LEAD_STAGES.WON, 'محاولة قفزة غير شرعية', tarekPartner);
  }, (err) => {
    return err.code === 'INVALID_STAGE_TRANSITION';
  });
});

// ============================================================================
// 5. استرجاع ملخص مسار المبيعات عبر get_crm_pipeline_summary
// ============================================================================
test('5. Sales Pipeline Analytics: Retrieve accurate pipeline summary via get_crm_pipeline_summary tool', async () => {
  const toolResult = await ToolExecutors.execute('get_crm_pipeline_summary', {}, tarekPartner);

  assert.equal(toolResult.success, true);
  assert.equal(toolResult.tool, 'get_crm_pipeline_summary');
  const summary = toolResult.data;

  assert.ok(typeof summary.totalLeads === 'number');
  assert.ok(summary.totalLeads >= 1);
  assert.ok(typeof summary.totalPipelineValue === 'number');
  assert.ok(typeof summary.totalContractedWonValue === 'number');
  assert.ok(typeof summary.totalCollectedCash === 'number');
  assert.ok(typeof summary.totalOutstandingReceivables === 'number');
  assert.ok(typeof summary.conversionRate === 'number');
  assert.ok(summary.stageBreakdown[CRM_LEAD_STAGES.NEW_LEAD]);
  assert.ok(summary.stageBreakdown[CRM_LEAD_STAGES.CONTACTED]);
  assert.ok(summary.stageBreakdown[CRM_LEAD_STAGES.WON]);
  assert.ok(summary.partnerPerformance.mohamed);
  assert.ok(summary.partnerPerformance.tarek);
});

// ============================================================================
// 6. منع تسجيل عميل مكرر بنفس رقم الهاتف (Anti-Duplicate Prevention)
// ============================================================================
test('6. Duplicate Prevention: Detect and reject duplicate lead registration by phone number', async () => {
  const duplicatePhone = `01099${Date.now().toString().slice(-6)}`;
  
  // إنشاء العميل الأول بنجاح
  CrmLeadStore.createLead({
    businessName: 'شركة الفيروز للتوزيع',
    industry: 'توزيع وتجارة',
    softwareNeed: 'تطبيق مندوبي المبيعات ونقاط التوزيع',
    phone: duplicatePhone
  }, mohamedPartner);

  // 1. محاولة إنشاء عميل ثانٍ بنفس رقم الهاتف عبر CrmLeadStore المباشر
  assert.throws(() => {
    CrmLeadStore.createLead({
      businessName: 'مؤسسة الفيروز للتجارة العامة',
      industry: 'تجارة',
      softwareNeed: 'نظام فواتير',
      phone: duplicatePhone
    }, tarekPartner);
  }, (err) => {
    return err.code === 'DUPLICATE_LEAD';
  });

  // 2. محاولة إنشاء نفس الهاتف عبر HTTP API والتأكد من كود 409
  const res = await fetch(`${baseUrl}/api/crm/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`
    },
    body: JSON.stringify({
      businessName: 'فرع الفيروز الإضافي',
      industry: 'تجارة',
      softwareNeed: 'نظام مخازن',
      phone: duplicatePhone
    })
  });

  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.code, 'DUPLICATE_LEAD');
});

// ============================================================================
// 7. عزل بيانات الشريك والعملاء الخاصين والملاحظات السرية
// ============================================================================
test('7. Partner Privacy & Isolation: Reject unauthorized partner access on private leads and private notes', async () => {
  const privatePhone = `01288${Date.now().toString().slice(-6)}`;
  const privateLead = CrmLeadStore.createLead({
    businessName: 'مشروع سري تقني خاص بالمهندس محمد',
    industry: 'تقنية عميقة',
    softwareNeed: 'نظام تشفير خاص',
    phone: privatePhone,
    isPrivate: true,
    ownerPartnerId: 'mohamed',
    assignedPartner: 'mohamed'
  }, mohamedPartner);

  // 1. طارق يحاول الوصول المباشر للعميل الخاص بمحمد
  assert.throws(() => {
    CrmLeadStore.getLeadById(privateLead.id, tarekPartner);
  }, (err) => {
    return err.code === 'FORBIDDEN_LEAD_ACCESS';
  });

  // 2. طارق يستعلم عن قائمة العملاء -> العميل الخاص بمحمد محجوب تماماً
  const tarekList = CrmLeadStore.getLeads({}, tarekPartner);
  const leaked = tarekList.find(l => l.id === privateLead.id);
  assert.equal(leaked, undefined, 'العميل الخاص لا يجوز أن يظهر في استعلامات الشريك الآخر');

  // 3. عزل الملاحظات الخاصة على عميل مشترك
  const sharedPhone = `01177${Date.now().toString().slice(-6)}`;
  const sharedLead = CrmLeadStore.createLead({
    businessName: 'مستشفى السلام التخصصي',
    industry: 'رعاية صحية',
    softwareNeed: 'حجز العمليات والعيادات الخارجية',
    phone: sharedPhone,
    isPrivate: false,
    assignedPartner: 'both'
  }, mohamedPartner);

  // طارق يضيف ملاحظة خاصة به
  CrmLeadStore.addNote(sharedLead.id, 'ملاحظة خاصة بطارق: تفاوضت على عمولة 10% إضافية', tarekPartner, true);

  // محمد يسترجع العميل المشترك -> لا يرى ملاحظة طارق الخاصة
  const mohamedView = CrmLeadStore.getLeadById(sharedLead.id, mohamedPartner);
  const leakedNote = mohamedView.privateNotes?.find(n => n.partnerId === 'tarek');
  assert.equal(leakedNote, undefined, 'الملاحظات الخاصة لشريك لا تظهر للشريك الآخر');
});

// ============================================================================
// 8. ضمان عدم إنشاء معاملات مالية أو تعديل الأرصدة عند توليد عروض AI
// ============================================================================
test('8. AI Financial Guardrails: AI-generated sales proposals NEVER create financial transactions or alter balances', async () => {
  // رصد الوضع المالي الأولي للشركة
  const initialFinances = RealDataProvider.getFinancialSummary();
  const initialCash = initialFinances.totalRevenue;
  const initialNet = initialFinances.netProfit;
  const initialMohamed = initialFinances.distributions.partnerMohamedShare;
  const initialTarek = initialFinances.distributions.partnerTarekShare;
  const initialTransactionsCount = RealDataProvider.getTransactions?.().length || 0;

  // تسجيل عميل وتوليد مسودة عرض سعر بالذكاء الاصطناعي
  const testPhone = `01544${Date.now().toString().slice(-6)}`;
  const lead = CrmLeadStore.createLead({
    businessName: 'سوبر ماركت خير زمان',
    industry: 'سوبرماركت وتجزئة',
    softwareNeed: 'كاشير وميزان باركود وجرد آلي',
    dealValueEstimate: 16000,
    phone: testPhone
  }, mohamedPartner);

  // استدعاء أداة صياغة العرض للـ AI CEO
  const draftResult = await ToolExecutors.execute('draft_sales_proposal', {
    leadId: lead.id,
    customPitchAngle: 'التركيز على ميزة وزن الخضار وربط الميزان الإلكتروني'
  }, mohamedPartner);

  assert.equal(draftResult.success, true);
  assert.equal(draftResult.data.action, 'DRAFT_CREATED');
  assert.equal(draftResult.data.status, 'draft_pending_review');
  assert.ok(draftResult.data.draft);
  assert.equal(draftResult.data.draft.requiresPartnerApproval, true);
  assert.match(draftResult.data.draft.pricingDisclaimer || draftResult.data.draft.pricingNote, /استرشادي غير ملزم/);

  // التحقق القاطع من عدم تأثر الأرصدة أو القوائم المالية
  const afterFinances = RealDataProvider.getFinancialSummary();
  assert.equal(afterFinances.totalRevenue, initialCash, 'الإيرادات المالية لم تتغير بعد توليد مسودة عرض سعر');
  assert.equal(afterFinances.netProfit, initialNet, 'صافي الأرباح لم يتغير نهائياً');
  assert.equal(afterFinances.distributions.partnerMohamedShare, initialMohamed);
  assert.equal(afterFinances.distributions.partnerTarekShare, initialTarek);

  const afterTransactionsCount = RealDataProvider.getTransactions?.().length || 0;
  assert.equal(afterTransactionsCount, initialTransactionsCount, 'لم تُنشأ أي معاملة مالية بسجل الحسابات');
});

// ============================================================================
// 9. التحقق من سلامة التوزيع الرباعي 25% × 4 والدقة التامة على مستوى القرش
// ============================================================================
test('9. Financial Distribution Integrity: 4-way 25% profit distribution and exact piastre precision', async () => {
  // اختبار التوزيع في بيانات الشركة الحقيقية
  const finances = RealDataProvider.getFinancialSummary();
  assert.equal(finances.isRealData, true);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.partnerTarekShare);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.devFundShare);
  assert.equal(finances.distributions.partnerMohamedShare, finances.distributions.sadaqahShare);

  // اختبار مبلغ netProfit فردي بالكسور (100.03 ج.م) ومعالجة باقي القرش
  const netProfit = 100.03;
  const mohamedCents = Math.floor(netProfit * 0.25 * 100) / 100;
  const tarekCents = Math.floor(netProfit * 0.25 * 100) / 100;
  const devCents = Math.floor(netProfit * 0.25 * 100) / 100;
  const sadaqahCents = Math.round((netProfit - (mohamedCents + tarekCents + devCents)) * 100) / 100;

  assert.equal(mohamedCents, 25.00);
  assert.equal(tarekCents, 25.00);
  assert.equal(devCents, 25.00);
  assert.equal(sadaqahCents, 25.03); // كسر الـ 3 قروش يذهب للصدقة الجارية
  assert.equal(Math.round((mohamedCents + tarekCents + devCents + sadaqahCents) * 100) / 100, netProfit);
});

// ============================================================================
// 10. اختبار معاينة الترحيل (Dry Run) والتنفيذ التكراري الآمن (Idempotent Migration)
// ============================================================================
test('10. Cloud Migration Engine: Dry Run preview and idempotent migration with zero production writes', async () => {
  // 1. معاينة الترحيل (Preview / Dry Run)
  const preview = FirestoreCrmRepository.previewMigration();
  assert.equal(preview.mode, 'DRY_RUN_PREVIEW');
  assert.equal(preview.isProductionWriteBlocked, true);
  assert.ok(preview.totalSourceRecords > 0);
  assert.ok(preview.validRecords > 0);
  assert.equal(preview.readyToMigrate, true);

  // 2. تنفيذ الترحيل في المستودع المعزول
  const firstExec = FirestoreCrmRepository.executeMigration({ dryRun: false });
  assert.equal(firstExec.success, true);
  assert.equal(firstExec.mode, 'ISOLATED_IDEMPOTENT_MIGRATION');

  // 3. إعادة تنفيذ الترحيل للمرة الثانية للتأكد من خاصية عدم التكرار (Idempotency)
  const secondExec = FirestoreCrmRepository.executeMigration({ dryRun: false });
  assert.equal(secondExec.success, true);
  assert.equal(secondExec.migratedCount, 0, 'في الترحيل المتكرر يجب أن يكون عدد السجلات المرحلة صفراً');
  assert.ok(secondExec.skippedDuplicates >= preview.validRecords, 'يجب تخطي كافة السجلات المكررة مسبقاً');
});

// ============================================================================
// 11. صمام الأمان: أدوات كتابة CRM للذكاء الاصطناعي تتطلب تأكيد الشريك الصريح
// ============================================================================
test('11. AI Autonomous Action Boundary: Mutating CRM tools require explicit partner confirmation', async () => {
  const proposalPhone = `01033${Date.now().toString().slice(-6)}`;

  // 1. استدعاء أداة register_crm_lead دون تأكيد الشريك (isConfirmedByPartner غير موجود أو false)
  const unconfirmedRegister = await ToolExecutors.execute('register_crm_lead', {
    businessName: 'مكتبة الأوائل الفجالة',
    phone: proposalPhone,
    industry: 'مكتبات وتوزيع كتب',
    softwareNeed: 'نظام إدارة الإعارة والباركود',
    dealValueEstimate: 9000
  }, mohamedPartner);

  assert.equal(unconfirmedRegister.success, true);
  assert.equal(unconfirmedRegister.data.action, 'SUGGESTION_ONLY');
  assert.equal(unconfirmedRegister.data.status, 'pending_partner_confirmation');
  assert.match(unconfirmedRegister.data.message, /اقتراح/);

  // التحقق من عدم إنشاء العميل في قاعدة البيانات فعلياً
  const searchResult = CrmLeadStore.getLeads({ search: 'مكتبة الأوائل الفجالة' }, mohamedPartner);
  assert.equal(searchResult.length, 0, 'لا يجوز تسجيل العميل في المستودع قبل تأكيد الشريك');

  // 2. استدعاء أداة register_crm_lead مع تأكيد الشريك (isConfirmedByPartner: true)
  const confirmedRegister = await ToolExecutors.execute('register_crm_lead', {
    businessName: 'مكتبة الأوائل الفجالة',
    phone: proposalPhone,
    industry: 'مكتبات وتوزيع كتب',
    softwareNeed: 'نظام إدارة الإعارة والباركود',
    dealValueEstimate: 9000,
    isConfirmedByPartner: true
  }, mohamedPartner);

  assert.equal(confirmedRegister.success, true);
  assert.equal(confirmedRegister.data.action, 'EXECUTED_SUCCESSFULLY');
  assert.equal(confirmedRegister.data.status, 'created');
  assert.ok(confirmedRegister.data.lead.id);

  // 3. محاولة ترقية مرحلة العميل دون تأكيد الشريك
  const unconfirmedStageUpdate = await ToolExecutors.execute('update_crm_lead_stage', {
    leadId: confirmedRegister.data.lead.id,
    targetStage: CRM_LEAD_STAGES.CONTACTED,
    note: 'تم التواصل واقتراح الترقية'
  }, mohamedPartner);

  assert.equal(unconfirmedStageUpdate.data.action, 'SUGGESTION_ONLY');
  assert.equal(unconfirmedStageUpdate.data.status, 'pending_partner_confirmation');

  // التأكد من أن مرحلة العميل لا تزال NEW_LEAD
  const leadAfterSuggestion = CrmLeadStore.getLeadById(confirmedRegister.data.lead.id, mohamedPartner);
  assert.equal(leadAfterSuggestion.stage, CRM_LEAD_STAGES.NEW_LEAD);

  // 4. ترقية المرحلة مع تأكيد الشريك
  const confirmedStageUpdate = await ToolExecutors.execute('update_crm_lead_stage', {
    leadId: confirmedRegister.data.lead.id,
    targetStage: CRM_LEAD_STAGES.CONTACTED,
    note: 'تم التواصل رسمياً واعتماد الترقية',
    isConfirmedByPartner: true
  }, mohamedPartner);

  assert.equal(confirmedStageUpdate.data.action, 'EXECUTED_SUCCESSFULLY');
  assert.equal(confirmedStageUpdate.data.lead.stage, CRM_LEAD_STAGES.CONTACTED);
});
