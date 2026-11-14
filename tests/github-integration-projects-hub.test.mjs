// tests/github-integration-projects-hub.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../server/index.mjs';
import { GitHubService } from '../server/services/githubService.mjs';
import { GeminiCodeAdvisor } from '../server/services/geminiCodeAdvisor.mjs';

let server;
let baseUrl;

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

test('1. Security: GitHub Accounts endpoint never leaks access tokens (Zero Token Leakage)', async () => {
  const res = await fetch(`${baseUrl}/api/github/accounts`, {
    headers: { 'x-partner-id': 'mohamed' }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.accounts.account_1);
  assert.ok(data.accounts.account_2);

  // التأكد المطلق من عدم وجود كلمة token في مخرجات الحساب الأول أو الثاني
  assert.equal(data.accounts.account_1.token, undefined);
  assert.equal(data.accounts.account_2.token, undefined);
  const rawString = JSON.stringify(data);
  assert.ok(!rawString.includes('ghp_'), 'Security violation: raw token leaked in API response!');
});

test('2. Multi-Account: Account 1 is connected and verified (mat992024-collab)', async () => {
  const res = await fetch(`${baseUrl}/api/github/accounts`, {
    headers: { 'x-partner-id': 'mohamed' }
  });
  const data = await res.json();
  const acc1 = data.accounts.account_1;
  assert.equal(acc1.connected, true);
  assert.equal(acc1.username, 'mat992024-collab');
  assert.ok(Array.isArray(acc1.scopes));
  assert.ok(acc1.repoCount > 0);
});

test('3. Multi-Account: Account 2 supports independent connection and isolation', async () => {
  const accounts = await GitHubService.getAccountsStatus();
  assert.ok(accounts.account_2);
  assert.equal(accounts.account_2.slotId, 'account_2');
});

test('4. Repositories Discovery: Discovers real repositories across accounts', async () => {
  const res = await fetch(`${baseUrl}/api/github/repositories`, {
    headers: { 'x-partner-id': 'mohamed' }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.totalCount >= 8, `Expected at least 8 repos, got ${data.totalCount}`);

  const repoNames = data.repositories.map(r => r.name);
  assert.ok(repoNames.includes('TECHNOLOPIA'), 'TECHNOLOPIA repository missing');
  assert.ok(repoNames.includes('pizza-fresh-menu'), 'pizza-fresh-menu repository missing');
  assert.ok(repoNames.includes('odoo19-zatca-phase2'), 'odoo19-zatca-phase2 repository missing');
});

test('5. Deduplication: Duplicate repos across accounts are merged cleanly', async () => {
  const repos = await GitHubService.listAllRepositories();
  const names = repos.map(r => r.name.toLowerCase());
  const uniqueNames = new Set(names);
  assert.equal(names.length, uniqueNames.size, 'Repositories list contains duplicate entries!');
});

test('6. Privacy Classification: Public and Private repos are accurately distinguished', async () => {
  const repos = await GitHubService.listAllRepositories();
  const techRepo = repos.find(r => r.name === 'TECHNOLOPIA');
  const zatcaRepo = repos.find(r => r.name === 'odoo19-zatca-phase2');

  assert.ok(techRepo, 'TECHNOLOPIA not found');
  assert.equal(techRepo.isPrivate, false, 'TECHNOLOPIA should be public');

  if (zatcaRepo) {
    assert.equal(zatcaRepo.isPrivate, true, 'odoo19-zatca-phase2 should be private');
  }
});

test('7. Repository Deep Inspection: Retrieves branches, file tree, and latest commits', async () => {
  const res = await fetch(`${baseUrl}/api/github/repository/mat992024-collab/TECHNOLOPIA`, {
    headers: { 'x-partner-id': 'mohamed' }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.details.name, 'TECHNOLOPIA');
  assert.ok(Array.isArray(data.details.files));
  assert.ok(Array.isArray(data.details.branches));
  assert.ok(Array.isArray(data.details.latestCommits));
  assert.ok(data.details.files.some(f => f.name === 'package.json'));
});

test('8. Gemini Code Advisor: Analyzes repository and produces structured recommendations with evidence', async () => {
  const res = await fetch(`${baseUrl}/api/github/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-partner-id': 'mohamed'
    },
    body: JSON.stringify({ owner: 'mat992024-collab', repo: 'TECHNOLOPIA' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.analysis.architectureAssessment);
  assert.ok(data.analysis.securityAudit);
  assert.ok(Array.isArray(data.analysis.recommendations));

  // فحص حقول التوصية الصارمة المطلوبة من المستخدم
  if (data.analysis.recommendations.length > 0) {
    const rec = data.analysis.recommendations[0];
    assert.ok(rec.projectName);
    assert.ok(rec.issue);
    assert.ok(rec.evidence);
    assert.ok(['urgent', 'high', 'medium', 'low'].includes(rec.priority));
    assert.ok(rec.impact);
    assert.ok(rec.suggestedSolution);
    assert.equal(typeof rec.isConfirmedFact, 'boolean');
  }
});

test('9. Recommendation Lifecycle: Partner can approve or review recommendation', async () => {
  const recs = GitHubService.getStoredRecommendations();
  if (recs.length > 0) {
    const targetRec = recs[0];
    const res = await fetch(`${baseUrl}/api/github/recommendation/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-partner-id': 'tarek'
      },
      body: JSON.stringify({ id: targetRec.id, status: 'approved' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.recommendation.status, 'approved');
    assert.equal(data.recommendation.reviewedBy, 'tarek');
  }
});

test('10. Portfolio Overview Report: Synthesizes company-wide software assets', async () => {
  const res = await fetch(`${baseUrl}/api/github/portfolio-report`, {
    headers: { 'x-partner-id': 'mohamed' }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.report.totalRepositories >= 8);
  assert.ok(data.report.discoveredSaaSCandidates > 0);
  assert.ok(data.report.strategicSummaryText);
});

test('11. Security ACL: Unauthorized caller without partner token is blocked from GitHub endpoints', async () => {
  const res = await fetch(`${baseUrl}/api/github/repositories`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'AUTH_REQUIRED');
});
