// Check schema cac bang lien quan den 4 lien ket FK
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

const TABLES = [
  'gia_cong',        // Lien ket voi xuong_gia_cong (1)
  'cong_no',         // Lien ket voi xuong_gia_cong (1) + voi lenh_cat
  'lenh_cat',        // Lien ket voi san_pham, khach_hang_si (2)
  'kho',             // Lien ket voi nha_cung_cap (3)
  'kho_vai',         // variant
  'kho_phu_lieu',    // variant
  'giao_dich_kho',   // giao dich nhap/xuat kho
  'nhan_su',         // Lien ket voi users (4)
  'san_pham',        // master
  'khach_hang_si',   // master
  'nha_cung_cap',    // master
  'xuong_gia_cong',  // master
];

async function getCols(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  if (r.status === 404) return null;
  if (!r.ok) return { error: r.status };
  const d = await r.json();
  if (!Array.isArray(d) || d.length === 0) return [];
  return Object.keys(d[0]);
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
  console.log('=== Schema check cho 4 lien ket FK ===\n');
  for (const t of TABLES) {
    const cols = await getCols(t);
    const cnt = await getCount(t);
    if (cols === null) {
      console.log(`❌ ${t}: KHONG TON TAI`);
    } else if (cols.error) {
      console.log(`⚠️  ${t}: HTTP ${cols.error}`);
    } else if (Array.isArray(cols) && cols.length === 0) {
      console.log(`📭 ${t}: ton tai, RONG (0 cols, 0 rows)`);
    } else {
      console.log(`✅ ${t} (${cnt} rows): ${cols.join(', ')}`);
    }
  }
}
main();
