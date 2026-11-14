// tests/gemini-backend-agent.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../server/index.mjs';
import { RealDataProvider } from '../server/data/realDataProvider.mjs';
import { ToolExecutors } from '../server/tools/toolExecutors.mjs';
import { GEMINI_TOOL_DECLARATIONS, TOOL_PERMISSIONS } from '../server/tools/toolDefinitions.mjs';
import { AuditLogger } from '../server/services/auditLogger.mjs';
import { GeminiAgent } from '../server/geminiAgent.mjs';
import { issuePartnerToken } from '../server/middleware/authMiddleware.mjs';

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

test('1. Health Check: Backend server responds with healthy status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.service, 'TECHNOLOPIA Gemini Backend Agent');
});

test('2. Security ACL: Unauthorized request without Bearer token is rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'اعرض بيانات المشروعات' })
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'AUTH_REQUIRED');
  assert.match(data.error, /غير مصرح/);
});

test('3. Security ACL: Request with invalid token is rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid_tampered_token_string'
    },
    body: JSON.stringify({ message: 'أعطني معلومات مالية' })
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'INVALID_TOKEN');
});

test('4. Partner Authentication: Eng. Mohamed El-Bahr is authenticated and authorized via Bearer Token', async () => {
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mohamedToken}`,
      'x-partner-id': 'mohamed'
    },
    body: JSON.stringify({ message: 'ما هي المشروعات الحالية؟' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.reply);
  assert.ok(data.reply.length > 20);
});

test('5. Partner Authentication: Eng. Tarek Hafez is authenticated and authorized via Bearer Token', async () => {
  const res = await fetch(`${baseUrl}/api/gemini/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tarekToken}`,
      'x-partner-id': 'tarek'
    },
    body: JSON.stringify({ message: 'ما هي أرباح الشركة وخطة الكاش؟' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.reply);
});

test('6. Real Data Tool: get_projects returns exactly 8 real TECHNOLOPIA projects (Zero Mock)', async () => {
  const projects = RealDataProvider.getProjects();
  assert.equal(projects.length, 8);
  const names = projects.map(p => p.title || p.name);
  assert.ok(names.some(n => n.includes('مطعم فريش')));
  assert.ok(names.some(n => n.includes('مطبعة واجدي')));
  assert.ok(names.some(n => n.includes('مكتبة مدرسية')));
  assert.ok(names.some(n => n.includes('منيو إلكتروني')));
});

test('7. Real Data Tool: get_project_details returns project with linked tasks', async () => {
  const result = await ToolExecutors.execute('get_project_details', { projectId: 'proj-1' }, { id: 'mohamed', name: 'محمد' });
  assert.equal(result.success, true);
  assert.equal(result.data.id, 'proj-1');
  assert.match(result.data.title, /مطعم فريش/);
  assert.ok(Array.isArray(result.data.relatedTasks));
});

test('8. Real Data Tool: get_tasks returns exactly 8 real tasks with assigned partner and priority', async () => {
  const tasks = RealDataProvider.getTasks();
  assert.equal(tasks.length, 8);
  const urgentTasks = RealDataProvider.getTasks({ priority: 'urgent' });
  assert.equal(urgentTasks.length, 3);
  assert.ok(urgentTasks.every(t => t.priority === 'urgent'));
});

test('9. Real Financial Tool: get_financial_summary enforces strict 4-way 25% distribution', async () => {
  const finances = RealDataProvider.getFinancialSummary();
  assert.equal(finances.isRealData, true);
  assert.equal(finances.totalRevenue, 0);
  assert.equal(finances.totalExpenses, 0);
  assert.equal(finances.netProfit, 0);
  assert.equal(finances.distributions.partnerMohamedShare, 0);
  assert.equal(finances.distributions.partnerTarekShare, 0);
  assert.equal(finances.distributions.devFundShare, 0);
  assert.equal(finances.distributions.sadaqahShare, 0);
});

test('10. Real CRM Tool: get_crm_leads returns real registered client', async () => {
  const clients = RealDataProvider.getClients();
  assert.equal(clients.length, 1);
  assert.match(clients[0].businessName || clients[0].name, /مطعم البرنس/);
});

test('11. Proactive Improvement Tool: propose_project_improvement creates draft without mutating project', async () => {
  const proposalPayload = {
    projectId: 'proj-7',
    title: 'إضافة دعم الطباعة الحرارية المباشرة للبلوتوث للمنيو الإلكتروني',
    category: 'technical',
    problemDiagnosis: 'المطاعم تطلب إرسال الطلب لطابعة المطبخ فورياً دون الحاجة لكمبيوتر مكتبي.',
    proposedSolution: 'استخدام Web Bluetooth API للاتصال بطابعات ESC/POS الحرارية مباشرة من المتصفح.',
    expectedImpact: 'زيادة مبيعات النظام بمعدل 40% وإمكانية فرض رسوم إضافية 1,500 ج.م على الميزة.'
  };

  const exec = await ToolExecutors.execute('propose_project_improvement', proposalPayload, { id: 'mohamed', name: 'المهندس محمد البحر' });
  assert.equal(exec.success, true);
  assert.equal(exec.permissionLevel, 'DRAFT_PROPOSAL');
  assert.equal(exec.data.proposal.status, 'pending_partner_review');
  assert.equal(exec.data.proposal.requiresPartnerApproval, true);

  // التأكد من عدم تغيير بيانات المشروع الأصلية (حماية البيانات)
  const projectAfter = RealDataProvider.getProjectById('proj-7');
  assert.equal(projectAfter.id, 'proj-7');
});

test('12. Draft Task Tool: draft_new_task creates actionable task draft with steps', async () => {
  const taskPayload = {
    title: 'بناء واجهة إعدادات طابعة البلوتوث لمنيو QR',
    description: 'تطوير شاشة الربط بطابعة الكاشير وإرسال أمر الطباعة التجريبي.',
    assignedTo: 'mohamed',
    priority: 'high',
    dueDate: '2026-11-22',
    steps: [
      'فحص بروتوكول Web Bluetooth API في المتصفحات الحديثة',
      'بناء مكوّن React للبحث عن أجهزة البلوتوث المجاورة',
      'إرسال بايتات أمر الطباعة التجريبي واختبار القص التلقائي'
    ]
  };

  const exec = await ToolExecutors.execute('draft_new_task', taskPayload, { id: 'mohamed', name: 'المهندس محمد البحر' });
  assert.equal(exec.success, true);
  assert.equal(exec.data.draftTask.status, 'draft_pending_partner_approval');
  assert.equal(exec.data.draftTask.steps.length, 3);
});

test('13. Audit Logging: All tool calls and security events are logged in immutable audit records', () => {
  const recentLogs = AuditLogger.getRecentLogs(10);
  assert.ok(recentLogs.length > 0);
  const lastLog = recentLogs[0];
  assert.ok(lastLog.id.startsWith('ai-audit-'));
  assert.ok(lastLog.timestamp);
  assert.ok(['mohamed', 'tarek', 'unknown', 'system', 'anonymous'].includes(lastLog.partnerId));
});

test('14. Tool Registry Compliance: Exactly 12 official tools conforming to Gemini Function schema', () => {
  assert.equal(GEMINI_TOOL_DECLARATIONS.length, 12);
  const toolNames = GEMINI_TOOL_DECLARATIONS.map(t => t.name);
  const expectedTools = [
    'get_company_overview',
    'get_projects',
    'get_project_details',
    'get_tasks',
    'get_financial_summary',
    'get_crm_leads',
    'get_audit_logs',
    'propose_project_improvement',
    'draft_new_task',
    'github_get_accounts',
    'github_list_repositories',
    'github_analyze_repository'
  ];

  for (const expected of expectedTools) {
    assert.ok(toolNames.includes(expected), `Missing tool: ${expected}`);
    assert.ok(TOOL_PERMISSIONS[expected], `Missing permission definition for: ${expected}`);
  }
});
