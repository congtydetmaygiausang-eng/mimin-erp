// Get all distinct loai_sp from DB
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  // Get all loai_sp values
  const r = await fetch(url + '/rest/v1/san_pham?select=loai_sp&limit=1000', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d = await r.json();
  const counts = {};
  d.forEach(x => {
    counts[x.loai_sp] = (counts[x.loai_sp] || 0) + 1;
  });
  console.log('Distinct loai_sp in DB:');
  for (const [k, v] of Object.entries(counts)) {
    console.log(' -', JSON.stringify(k), ':', v, 'records');
  }

  // Get all ma_dm
  const r2 = await fetch(url + '/rest/v1/san_pham?select=ma_dm&limit=1000', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d2 = await r2.json();
  const maDmCounts = {};
  d2.forEach(x => {
    maDmCounts[x.ma_dm] = (maDmCounts[x.ma_dm] || 0) + 1;
  });
  console.log('\nDistinct ma_dm:');
  for (const [k, v] of Object.entries(maDmCounts)) {
    console.log(' -', JSON.stringify(k), ':', v, 'records');
  }
}
main();
