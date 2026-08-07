// Check schema chi tiet cac bang lien quan FK
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

const TABLES = [
  'phan_cong',     // Bang phan cong cong doan (thay cho gia_cong)
  'nhan_su',       // Bang nhan su
  'lenh_cat',      // Bang lenh cat
  'cong_no',       // Bang cong no
  'xuong_gia_cong',// (neu da tao)
  'khach_hang_si', // (neu da tao)
  'kho',           // (neu da tao)
  'nha_cung_cap',  // (can auth)
  'users',         // Bang user (custom, khong phai auth.users)
  'auth.users',    // Supabase auth users
];

async function getCols(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  if (r.status === 404) return { status: 404 };
  if (!r.ok) return { status: r.status, body: await r.text().catch(() => '') };
  const d = await r.json();
  if (!Array.isArray(d) || d.length === 0) return { status: 200, empty: true, columns: null };
  return { status: 200, empty: false, columns: Object.keys(d[0]), sample: d[0] };
}

async function getCount(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Prefer': 'count=exact' }
  });
  if (!r.ok) return '?';
  const cr = r.headers.get('content-range');
  return cr ? cr.split('/')[1] : '0';
}

async function main() {
  console.log('=== Schema chi tiet ===\n');
  for (const t of TABLES) {
    const res = await getCols(t);
    const cnt = await getCount(t);
    if (res.status === 404) {
      console.log(`❌ ${t}: KHONG TON TAI`);
    } else if (res.status === 401) {
      console.log(`🔒 ${t}: CAN AUTH (401) - bang co the ton tai nhung can quyen`);
    } else if (res.status === 200 && res.empty) {
      console.log(`📭 ${t}: ton tai, RONG (${cnt} rows, schema khong xac dinh duoc qua REST API)`);
    } else if (res.status === 200) {
      console.log(`✅ ${t} (${cnt} rows):`);
      console.log(`   Columns: ${res.columns.join(', ')}`);
      console.log(`   Sample: ${JSON.stringify(res.sample).substring(0, 250)}`);
    } else {
      console.log(`⚠️  ${t}: status ${res.status}, body: ${res.body.substring(0, 100)}`);
    }
  }

  // Try information_schema for schema
  console.log('\n=== Try information_schema ===');
  const r = await fetch(`${url}/rest/v1/rpc/get_schema_info`, {
    method: 'POST',
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log('RPC get_schema_info:', r.status, (await r.text()).substring(0, 200));
}
main();
