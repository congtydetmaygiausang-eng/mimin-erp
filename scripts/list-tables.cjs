// List all tables in public schema
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  // Try common table names
  const tables = [
    'san_pham', 'san_pham_mau', 'san_pham_size', 'san_pham_hinh_anh',
    'mau_vai', 'kho_vai', 'kho_phu_lieu', 'khach_hang', 'nha_cung_cap',
    'nhan_su', 'don_hang', 'lenh_cat', 'cong_no', 'users',
    'audit_logs', 'agents', 'agent_tools', 'agent_runs', 'don_hang_items',
  ];

  for (const t of tables) {
    const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    if (r.ok) {
      const d = await r.json();
      if (d.length > 0) {
        console.log(`\n=== ${t} (has data) ===`);
        console.log('Columns:', Object.keys(d[0]).join(', '));
        console.log('Sample:', JSON.stringify(d[0], null, 2).substring(0, 400));
      } else {
        const r2 = await fetch(`${url}/rest/v1/${t}?select=*&limit=0`, {
          headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Prefer': 'count=exact' }
        });
        const cnt = r2.headers.get('content-range');
        console.log(`${t}: empty (${cnt || '0'})`);
      }
    } else if (r.status === 404) {
      // not exist
    } else {
      console.log(`${t}: HTTP ${r.status}`);
    }
  }
}
main();
