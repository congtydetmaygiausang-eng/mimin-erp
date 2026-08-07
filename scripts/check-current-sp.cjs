// Check current SP in DB vs seed SQL
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  console.log('=== Current SP in DB ===');
  const r = await fetch(url + '/rest/v1/san_pham?select=ma_sp,ten_sp&order=ma_sp', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d = await r.json();
  console.log('Total:', d.length);
  d.forEach(x => console.log(' -', x.ma_sp, ':', x.ten_sp));

  console.log('\n=== Seed SQL target (17 SP) ===');
  const targets = ['M001','A001','A002','Q001','B001','A003','A004','B002','A005','P001','P002','B003','A006','Q002','A007','P003','B004'];
  console.log('Total targets:', targets.length);
  targets.forEach(m => console.log(' -', m));

  console.log('\n=== Diff (in DB but not in seed) ===');
  const inDb = d.map(x => x.ma_sp);
  const inSeed = new Set(targets);
  const onlyInDb = inDb.filter(m => !inSeed.has(m));
  const onlyInSeed = targets.filter(m => !inDb.includes(m));
  console.log('Only in DB:', onlyInDb);
  console.log('Only in seed:', onlyInSeed);
}
main();
