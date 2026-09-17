const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const mapping = require('../apps/web/src/lib/employee-records');
const source = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/(main)/nhan-su/components/NVFormModal.tsx'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
function setup({ fail = false, codes = ['NV-TEST'], changes = {} } = {}) {
  const states = []; let cursor = 0; const requests = []; const saved = [];
  const employee = { maNV: 'NV-TEST', hoTen: ' Test Employee ', sdt: ' 0900000000 ', stt: 1,
    avatar: 'https://example.test/signed-old', avatarPath: 'nhan-su/test/old-avatar',
    cccdFrontImage: 'https://example.test/front', cccdFrontPath: 'nhan-su/test/front',
    cccdBackImage: 'https://example.test/back', cccdBackPath: 'nhan-su/test/back', ...changes };
  const context = { exports: {}, fetch, FormData, crypto: require('node:crypto'), require(name) {
    if (name === 'react') return {
      useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; }, useEffect() {},
    };
    if (name === 'react/jsx-runtime') return require('../apps/web/node_modules/react/jsx-runtime');
    if (name.includes('employee-records')) return mapping;
    if (name.includes('auth-fetch')) return { authFetch: async (url, options) => {
      requests.push({ url, options });
      if (url.includes('uploads')) return { ok: true, json: async () => ({ path: 'nhan-su/test/new-avatar' }) };
      const body = JSON.parse(options.body);
      return { ok: !fail, json: async () => fail ? { error: 'Save failed' } : { record: { ...mapping.toSupabaseEmployeeRecord(body), stt: 42 } } };
    } };
    return new Proxy({}, { get: (_, key) => String(key) });
  } };
  vm.runInNewContext(js, context);
  const render = () => { cursor = 0; return context.exports.NVFormModal({ mode: 'edit', nv: employee, existingCount: 1, existingCodes: codes, onClose() {}, onSave: async (record) => saved.push(record) }); };
  return { render, states, requests, saved };
}
(async () => {
  let env = setup();
  await env.render().props.children[0].props.onSubmit();
  assert.equal(env.requests.length, 1, 'One record write per save');
  assert.equal(env.saved[0].stt, 42, 'Use server-assigned order');
  const payload = JSON.parse(env.requests[0].options.body);
  assert.equal(payload.avatar, 'nhan-su/test/old-avatar');
  assert.equal(payload.cccdFrontImage, 'nhan-su/test/front');
  assert.equal(payload.hoTen, 'Test Employee');
  env = setup({ fail: true });
  await assert.rejects(env.render().props.children[0].props.onSubmit, /Save failed/);
  assert.equal(env.saved.length, 0);
  env = setup(); env.render(); env.states[0] = { ...env.states[0], maNV: 'OTHER' };
  // Existing code collision must fail before an upload or record write.
  env = setup({ codes: ['NV-TEST', 'OTHER'] }); env.render(); env.states[0] = { ...env.states[0], maNV: 'OTHER' };
  await assert.rejects(env.render().props.children[0].props.onSubmit, /tồn tại/);
  assert.equal(env.requests.length, 0);
  env = setup(); env.render();
  env.states[1] = { avatar: { dataUrl: 'data:image/png;base64,YQ==', name: 'portrait.png', type: 'image/png' } };
  await env.render().props.children[0].props.onSubmit();
  assert.equal(env.requests.length, 2, 'One image upload plus one record save');
  assert.equal(JSON.parse(env.requests[1].options.body).avatar, 'nhan-su/test/new-avatar');
  console.log('PASS employee form: single save, durable image paths, upload replacement, server response, duplicate code and failure');
})().catch((error) => { console.error(error); process.exitCode = 1; });
