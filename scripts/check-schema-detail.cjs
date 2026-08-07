// Check schema chi tiet bang service_role key (secrets tu Vercel env)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error('Missing URL or SERVICE_KEY');
  process.exit(1);
}

const TABLES = [
  'phan_cong', 'nhan_su', 'lenh_cat', 'cong_no', 'nha_cung_cap', 'users',
  'xuong_gia_cong', 'khach_hang_si', 'kho', 'san_pham', 'gia_cong', 'giao_dich_kho',
];

async function getSchema(table) {
  // Use PostgREST introspection - service_role can see all
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
  });
  if (r.status === 404) return { status: 404 };
  if (!r.ok) return { status: r.status, body: (await r.text()).substring(0, 100) };
  const d = await r.json();
  if (!Array.isArray(d) || d.length === 0) return { status: 200, empty: true };
  return { status: 200, columns: Object.keys(d[0]) };
}

async function getCount(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Prefer': 'count=exact' }
  });
  if (!r.ok) return '?';
  const cr = r.headers.get('content-range');
  return cr ? cr.split('/')[1] : '0';
}

async function main() {
  console.log('=== Schema chi tiet (service_role) ===\n');
  for (const t of TABLES) {
    const res = await getSchema(t);
    const cnt = await getCount(t);
    if (res.status === 404) {
      console.log(`❌ ${t}: KHONG TON TAI`);
    } else if (res.status === 200 && res.empty) {
      console.log(`📭 ${t} (${cnt} rows, RONG - schema can xem qua Dashboard)`);
    } else if (res.status === 200) {
      console.log(`✅ ${t} (${cnt} rows): ${res.columns.join(', ')}`);
    } else {
      console.log(`⚠️  ${t}: status ${res.status}, body: ${res.body}`);
    }
  }
}
main();
