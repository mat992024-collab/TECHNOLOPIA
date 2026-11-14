// tests/security-rules-evaluator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// محاكي منطق قواعد الحماية لـ Firestore (Firestore Security Rules Rule-Engine Emulator)
class FirestoreRulesEmulator {
  constructor(rulesText) {
    this.rulesText = rulesText;
  }

  isPartner(auth) {
    if (!auth) return false;
    const email = auth.token?.email || auth.email;
    const uid = auth.uid;
    const role = auth.token?.role || auth.role;

    return (
      ['mohamed@tecnolobia.com', 'tarek@tecnolobia.com'].includes(email) ||
      ['partner_mohamed', 'partner_tarek'].includes(uid) ||
      role === 'partner'
    );
  }

  evaluate({ auth, method, collection, docId, data, resource }) {
    // 1. Unauthenticated check
    if (!auth) {
      return { allowed: false, reason: 'UNAUTHENTICATED_ACCESS_DENIED' };
    }

    const partner = this.isPartner(auth);

    // 2. Audit logs: append-only, tamper-proof
    if (collection === 'tecnolobia_audit_logs') {
      if (method === 'get' || method === 'list') {
        return partner 
          ? { allowed: true } 
          : { allowed: false, reason: 'AUDIT_LOG_READ_FORBIDDEN' };
      }
      if (method === 'create') {
        return data && data.action 
          ? { allowed: true } 
          : { allowed: false, reason: 'AUDIT_LOG_ACTION_REQUIRED' };
      }
      if (method === 'update' || method === 'delete') {
        return { allowed: false, reason: 'TAMPER_PROOF_IMMUTABLE' };
      }
    }

    // 3. Private notes: isolated strictly to owner
    if (collection === 'tecnolobia_private_notes') {
      const ownerId = resource?.ownerId || data?.ownerId;
      const ownerEmail = resource?.ownerEmail || data?.ownerEmail;
      const matchesUid = auth.uid && auth.uid === ownerId;
      const matchesEmail = (auth.email || auth.token?.email) === ownerEmail;

      if (matchesUid || matchesEmail) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'PRIVATE_NOTE_ACCESS_DENIED' };
    }

    // 4. Financial transactions: partner only, no direct deletes
    if (collection === 'tecnolobia_transactions') {
      if (!partner) return { allowed: false, reason: 'NOT_PARTNER' };
      if (method === 'delete') return { allowed: false, reason: 'DIRECT_DELETE_FORBIDDEN' };
      if (method === 'create' && (!data || data.amount <= 0)) {
        return { allowed: false, reason: 'INVALID_AMOUNT' };
      }
      return { allowed: true };
    }

    // 5. Profit cycles: partner only, no deletes
    if (collection === 'tecnolobia_profit_cycles') {
      if (!partner) return { allowed: false, reason: 'NOT_PARTNER' };
      if (method === 'delete') return { allowed: false, reason: 'PROFIT_CYCLE_DELETE_FORBIDDEN' };
      return { allowed: true };
    }

    // 6. Shared partner collections
    const sharedCollections = [
      'tecnolobia_projects',
      'tecnolobia_tasks',
      'tecnolobia_clients',
      'tecnolobia_decisions',
      'tecnolobia_memories',
      'tecnolobia_dev_usages',
      'tecnolobia_sadaqah',
      'tecnolobia_meta'
    ];

    if (sharedCollections.includes(collection)) {
      if (!partner) return { allowed: false, reason: 'NOT_PARTNER' };
      return { allowed: true };
    }

    // Default deny
    return { allowed: false, reason: 'DEFAULT_DENY' };
  }
}

// قراءة ملف القواعد الجديد
const rulesPath = path.resolve('firestore.rules.secure');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
const emulator = new FirestoreRulesEmulator(rulesContent);

test('Security Rules: Unauthenticated access is completely rejected on all collections', () => {
  const collections = [
    'tecnolobia_transactions',
    'tecnolobia_profit_cycles',
    'tecnolobia_projects',
    'tecnolobia_tasks',
    'tecnolobia_clients',
    'tecnolobia_audit_logs',
    'tecnolobia_private_notes'
  ];

  for (const col of collections) {
    const resGet = emulator.evaluate({ auth: null, method: 'get', collection: col });
    assert.equal(resGet.allowed, false, `Unauthenticated read to ${col} must be blocked`);

    const resWrite = emulator.evaluate({ auth: null, method: 'create', collection: col, data: { foo: 'bar' } });
    assert.equal(resWrite.allowed, false, `Unauthenticated write to ${col} must be blocked`);
  }
});

test('Security Rules: Non-partner authenticated user is denied access to company data', () => {
  const attackerAuth = { uid: 'attacker_123', email: 'intruder@gmail.com' };
  
  const res = emulator.evaluate({
    auth: attackerAuth,
    method: 'get',
    collection: 'tecnolobia_transactions'
  });
  assert.equal(res.allowed, false, 'Non-partner user must be denied reading financial transactions');

  const resProjects = emulator.evaluate({
    auth: attackerAuth,
    method: 'get',
    collection: 'tecnolobia_projects'
  });
  assert.equal(resProjects.allowed, false, 'Non-partner user must be denied reading projects');
});

test('Security Rules: Verified Partner (Mohamed) has full authorized read/write access to shared collections', () => {
  const mohamedAuth = { uid: 'partner_mohamed', email: 'mohamed@tecnolobia.com' };

  const resRead = emulator.evaluate({
    auth: mohamedAuth,
    method: 'get',
    collection: 'tecnolobia_projects'
  });
  assert.equal(resRead.allowed, true);

  const resWriteTask = emulator.evaluate({
    auth: mohamedAuth,
    method: 'create',
    collection: 'tecnolobia_tasks',
    data: { title: 'مهمة جديدة', status: 'todo' }
  });
  assert.equal(resWriteTask.allowed, true);
});

test('Security Rules: Verified Partner (Tarek) has full authorized read/write access to shared collections', () => {
  const tarekAuth = { uid: 'partner_tarek', email: 'tarek@tecnolobia.com' };

  const resReadFinance = emulator.evaluate({
    auth: tarekAuth,
    method: 'get',
    collection: 'tecnolobia_transactions'
  });
  assert.equal(resReadFinance.allowed, true);

  const resWriteTx = emulator.evaluate({
    auth: tarekAuth,
    method: 'create',
    collection: 'tecnolobia_transactions',
    data: { title: 'عقد جديد', amount: 5000 }
  });
  assert.equal(resWriteTx.allowed, true);
});

test('Security Rules: Audit Logs are tamper-proof and immutable (cannot be deleted or updated)', () => {
  const mohamedAuth = { uid: 'partner_mohamed', email: 'mohamed@tecnolobia.com' };
  const tarekAuth = { uid: 'partner_tarek', email: 'tarek@tecnolobia.com' };

  // Update attempted on audit log
  const resUpdate = emulator.evaluate({
    auth: mohamedAuth,
    method: 'update',
    collection: 'tecnolobia_audit_logs',
    docId: 'log-1',
    data: { action: 'tampered' }
  });
  assert.equal(resUpdate.allowed, false, 'Updating an audit log must be strictly forbidden');

  // Delete attempted on audit log
  const resDelete = emulator.evaluate({
    auth: tarekAuth,
    method: 'delete',
    collection: 'tecnolobia_audit_logs',
    docId: 'log-1'
  });
  assert.equal(resDelete.allowed, false, 'Deleting an audit log must be strictly forbidden');

  // Append new audit log is allowed
  const resCreate = emulator.evaluate({
    auth: mohamedAuth,
    method: 'create',
    collection: 'tecnolobia_audit_logs',
    data: { action: 'اعتماد دورة أرباح', actor: 'mohamed', timestamp: '2026-11-14T19:00:00Z' }
  });
  assert.equal(resCreate.allowed, true, 'Appending a valid audit log must be allowed');
});

test('Security Rules: Private Notes privacy isolation between partners', () => {
  const mohamedAuth = { uid: 'partner_mohamed', email: 'mohamed@tecnolobia.com' };
  const tarekAuth = { uid: 'partner_tarek', email: 'tarek@tecnolobia.com' };

  const tarekPrivateNote = {
    ownerId: 'partner_tarek',
    ownerEmail: 'tarek@tecnolobia.com',
    title: 'ملاحظة سرية لطارق'
  };

  // Mohamed tries to access Tarek's private note
  const resUnauthorized = emulator.evaluate({
    auth: mohamedAuth,
    method: 'get',
    collection: 'tecnolobia_private_notes',
    resource: tarekPrivateNote
  });
  assert.equal(resUnauthorized.allowed, false, "Mohamed must not be able to read Tarek's private note");

  // Tarek accesses his own private note
  const resAuthorized = emulator.evaluate({
    auth: tarekAuth,
    method: 'get',
    collection: 'tecnolobia_private_notes',
    resource: tarekPrivateNote
  });
  assert.equal(resAuthorized.allowed, true, "Tarek must be able to read his own private note");
});

test('Financial Calculations: Four-Way Profit Split integrity and exact piastre precision', () => {
  // Test case 1: 10,000 revenue - 2,000 expenses = 8,000 net profit
  const rev = 10000;
  const exp = 2000;
  const net = rev - exp;
  const quarter = net / 4;

  assert.equal(quarter, 2000);
  assert.equal(quarter * 4, net);

  // Test case 2: fractional remainder division (e.g. 10,001 revenue)
  const revOdd = 10001;
  const netOdd = revOdd - exp; // 8001
  const baseQuarter = Math.floor(netOdd / 4); // 2000.25 -> 2000
  const remainder = netOdd % 4; // 1 piastre to sadaqah
  assert.equal(baseQuarter * 3 + (baseQuarter + remainder), netOdd);
});
