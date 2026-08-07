// Dump toàn bộ 17 SP thật từ Supabase
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  const r = await fetch(url + '/rest/v1/san_pham?select=*&order=ma_sp', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d = await r.json();
  console.log(`Total: ${d.length} SP\n`);
  console.log('| Mã | Tên | Loại | Mã DM | Định mức |');
  console.log('|---|---|---|---|---|');
  for (const sp of d) {
    console.log(`| ${sp.ma_sp} | ${sp.ten_sp} | ${sp.loai_sp} | ${sp.ma_dm} | ${sp.dinh_muc} |`);
  }

  console.log('\n=== Columns hien co ===');
  if (d[0]) console.log(Object.keys(d[0]).join(', '));
}
main();
