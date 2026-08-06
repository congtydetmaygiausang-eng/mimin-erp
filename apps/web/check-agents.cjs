// Check bảng agent_usage_logs và các bảng liên quan
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const pubKey = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)[1].trim();

async function check(tbl) {
  const r = await fetch(`${url}/rest/v1/${tbl}?select=*&limit=1`, {
    headers: { apikey: pubKey, Authorization: `Bearer ${pubKey}` },
  });
  const text = await r.text();
  if (r.status === 200) {
    try {
      const data = JSON.parse(text);
      const cols = Array.isArray(data) && data[0] ? Object.keys(data[0]) : [];
      console.log(`✅ ${tbl}: EXISTS (${cols.length} cols: ${cols.slice(0, 8).join(', ')}${cols.length > 8 ? '...' : ''})`);
    } catch {
      console.log(`✅ ${tbl}: EXISTS`);
    }
  } else if (r.status === 404) {
    console.log(`❌ ${tbl}: NOT FOUND (404)`);
  } else {
    let msg = text;
    try { msg = JSON.parse(text).message; } catch {}
    console.log(`⚠️  ${tbl}: ${r.status} - ${msg?.substring(0, 80) || text.substring(0, 80)}`);
  }
}

(async () => {
  const tables = [
    'agent_usage_logs',
    'agent_execution_logs',
    'agent_tool_logs',
    'agents',
    'agent_personas',
    'agent_aliases',
  ];
  for (const t of tables) {
    await check(t);
  }
})();
