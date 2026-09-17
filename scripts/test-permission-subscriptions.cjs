const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

// Reproduce Supabase's topic reuse and prohibition on binding after subscribe.
const channels = new Map();
const client = {
  channel(name) {
    if (channels.has(name)) return channels.get(name);
    const channel = {
      subscribed: false,
      on(event, filter, callback) {
        assert.equal(this.subscribed, false, 'Cannot bind after subscribe');
        this.callback = callback;
        return this;
      },
      subscribe() { this.subscribed = true; return this; },
    };
    channels.set(name, channel);
    return channel;
  },
  removeChannel(channel) {
    for (const [name, current] of channels) {
      if (current === channel) channels.delete(name);
    }
  },
};
const source = fs.readFileSync(path.join(__dirname, '../apps/web/src/lib/permissions.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const context = {
  exports: {}, console, crypto: require('node:crypto'),
  require: () => ({ isSupabaseEnabled: true, supabase: client }),
};
vm.runInNewContext(outputText, context);
const subscribe = context.exports.subscribeSharedPermissionMatrix;
let sessionEvents = 0;
let pageEvents = 0;
const stopSession = subscribe(() => sessionEvents++);
const stopPage = subscribe(() => pageEvents++);
assert.equal(channels.size, 2);
for (const channel of channels.values()) channel.callback({ new: { matrix: {} } });
assert.equal(sessionEvents, 1);
assert.equal(pageEvents, 1);
stopPage();
assert.equal(channels.size, 1);
const stopRemount = subscribe(() => {});
assert.equal(channels.size, 2);
stopSession();
stopRemount();
assert.equal(channels.size, 0);
console.log('PASS: concurrent subscribers, event delivery, independent cleanup, remount');

const saved = new Map();
context.window = {};
context.localStorage = { getItem: (key) => saved.get(key) ?? null };
const legacy = context.exports.getLegacyPermissionMatrix;
assert.equal(legacy(), null);
saved.set('mimin_permission_matrix_v3_admin_only', '{"planner":{}}');
const old = JSON.stringify({ planner: { 'lenh-cat': 'ru', 'don-hang': '' } });
saved.set('mimin_permission_matrix_v2', old);
const recovered = legacy();
assert.equal(recovered.planner['lenh-cat'], 'ru');
assert.equal(recovered.planner['don-hang'], '');
assert.equal(recovered.admin['lenh-cat'], 'rcud');
assert.equal(saved.get('mimin_permission_matrix_v2'), old);
assert.equal(saved.get('mimin_permission_matrix_v3_admin_only'), '{"planner":{}}');
saved.set('mimin_permission_matrix_v2', '{"planner":{"lenh-cat":true}}');
assert.throws(legacy);
saved.set('mimin_permission_matrix_v2', '{}');
assert.throws(legacy);
console.log('PASS: legacy recovery preserves edits, explicit denials and saved caches; rejects invalid data');
