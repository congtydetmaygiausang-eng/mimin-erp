const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../apps/web/src/lib', file), 'utf8');
  const context = { exports: {}, ...globals, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText, context);
  return context.exports;
}

async function main() {
  const storage = new Map();
  const key = 'mimin_local_account_links_v1';
  const activeKey = 'mimin_local_active_account_v1';
  const admin = { id: 'TK-admin', name: 'Admin', email: 'admin@example.com', roles: ['admin'],
    kind: 'employee', employeeCode: 'NV-01', partnerCode: '', supplierCode: '',
    department: '', team: '', scope: 'COMPANY', active: true };
  const member = { ...admin, id: 'TK-member', email: 'member@example.com', employeeCode: 'NV-02', roles: ['sewing'] };
  storage.set(key, JSON.stringify([admin, member]));
  const store = load('local-account-store.ts', {
    react: {}, './users': { USERS: [] }, './permissions': { ALL_ROLES: ['admin', 'sewing', 'partner', 'supplier'] },
    './local-account-mode': { LOCAL_ACCOUNT_MODE: true },
  }, { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    window: { dispatchEvent() {} }, Event: class {} });
  store.saveLocalAccount({ ...member, email: '  MEMBER@EXAMPLE.COM  ' });
  assert.equal(store.readLocalAccounts().find(x => x.id === member.id).email, 'member@example.com');
  assert.throws(() => store.saveLocalAccount({ ...member, email: 'ADMIN@example.com' }), /Email đã/);
  assert.throws(() => store.saveLocalAccount({ ...member, email: 'invalid' }), /Email không/);
  assert.throws(() => store.saveLocalAccount({ ...admin, active: false }), /quản trị viên/);
  assert.throws(() => store.saveLocalAccount({ ...member, scope: 'INVALID' }), /Phạm vi/);
  assert.throws(() => store.saveLocalAccount({ ...member, employeeCode: admin.employeeCode }), /Nhân viên đã/);
  const supplier = { ...member, id: 'TK-supplier', kind: 'supplier', supplierCode: 'NCC-01', email: 'supplier@example.com', roles: ['supplier'] };
  store.saveLocalAccount(supplier);
  assert.equal(store.readLocalAccounts().find(x => x.id === supplier.id).scope, 'ASSIGNED');
  assert.throws(() => store.saveLocalAccount({ ...supplier, roles: ['admin'] }), /bên ngoài/);
  store.selectLocalAccount(member.id);
  assert.throws(() => store.saveLocalAccount(member), /quản trị viên/);
  storage.set(key, JSON.stringify([{ ...admin, active: false }, member]));
  storage.set(activeKey, admin.id);
  assert.equal(store.localActiveAccount(), null);
  assert.throws(() => store.saveLocalAccount(member), /quản trị viên/);
  storage.set(activeKey, 'deleted-account');
  storage.set(key, JSON.stringify([admin, member]));
  assert.equal(store.localActiveAccount(), null);
  console.log('PASS: local account validation, duplicate links, last admin, external roles, inactive sessions');

  const access = load('account-access.ts', { './production-stage-order': { productionStageRank: () => 2 } });
  const permit = () => true;
  const partner = { ...supplier, kind: 'partner', partnerCode: 'DT-01', roles: ['partner'] };
  const stage = { id: 'may', tenCongDoan: 'May', loaiNguoi: 'xuong_ngoai', nguoiMa: 'DT-01' };
  assert.equal(access.canAccessStage(partner, stage, 'view', permit), true);
  assert.equal(access.canAccessStage(partner, { ...stage, nguoiMa: 'DT-02' }, 'view', permit), false);
  assert.equal(access.canAccessStage(partner, { ...stage, userIds: ['someone-else'] }, 'view', permit), false);
  assert.equal(access.canAccessStage({ ...partner, active: false }, stage, 'view', permit), false);
  assert.equal(access.canAccessBusinessRecord(supplier, { maNcc: 'NCC-01' }, 'dat-ncc-phu-lieu', 'view', permit), true);
  assert.equal(access.canAccessBusinessRecord(supplier, { maNcc: 'NCC-02' }, 'dat-ncc-phu-lieu', 'view', permit), false);
  assert.equal(access.canAccessBusinessRecord(supplier, { maNcc: 'NCC-01' }, 'lenh-cat', 'view', permit), false);
  assert.equal(access.inAssignment({ ...member, scope: 'TEAM', team: 'MAY-01' }, { team: 'MAY-02' }), false);
  assert.equal(access.inAssignment({ ...member, scope: 'TEAM', team: 'MAY-01' }, { team: 'MAY-01' }), true);
  console.log('PASS: partner/supplier isolation, explicit assignments, team scope, locked access');

  let validToken = false;
  let profile = { role: 'admin', isActive: true };
  const api = load('api-auth.ts', {
    'server-only': {}, 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    '@/lib/supabase/admin': { supabaseAdmin: {
      auth: { getUser: async () => ({ data: { user: validToken ? { id: 'real-user', email: 'a@example.com', app_metadata: { role: 'admin' } } : null }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) }),
    } },
  });
  const request = token => ({ headers: { get: name => name === 'authorization' ? token : 'forged-admin@example.com' } });
  assert.equal((await api.requireAdmin(request(''))).response.status, 401);
  assert.equal((await api.requireAdmin(request('Bearer bad'))).response.status, 401);
  validToken = true;
  assert.equal((await api.requireAdmin(request('Bearer valid'))).ok, true);
  profile = { role: 'admin', isActive: false };
  assert.equal((await api.requireAdmin(request('Bearer valid'))).response.status, 403);
  profile = null;
  assert.equal((await api.requireAuth(request('Bearer valid'))).response.status, 403);
  profile = { role: 'sewing', isActive: true };
  assert.equal((await api.requireAdmin(request('Bearer valid'))).response.status, 403);
  assert.equal((await api.requireAuth(request('Bearer valid'))).ok, true);
  console.log('PASS: forged headers, invalid tokens, locked/deleted users, current ERP role');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
