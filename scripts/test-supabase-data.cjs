// Test Supabase connection + check data real
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  console.log('=== TEST 1: san_pham (5 records) ===');
  const r1 = await fetch(url + '/rest/v1/san_pham?select=*&limit=5', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d1 = await r1.json();
  console.log('HTTP:', r1.status);
  console.log('Records:', Array.isArray(d1) ? d1.length : 'ERROR');
  if (Array.isArray(d1) && d1.length > 0) {
    console.log('First record keys:', Object.keys(d1[0]).join(', '));
    console.log('Sample:', JSON.stringify(d1[0], null, 2).substring(0, 600));
  } else {
    console.log('Body:', JSON.stringify(d1).substring(0, 400));
  }

  console.log('\n=== TEST 2: count all san_pham ===');
  const r2 = await fetch(url + '/rest/v1/san_pham?select=ma_sp&limit=1000', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d2 = await r2.json();
  console.log('Total:', Array.isArray(d2) ? d2.length : 'ERROR');
  if (Array.isArray(d2)) {
    console.log('Ma SP list:', d2.map(x => x.ma_sp).join(', '));
  }

  console.log('\n=== TEST 3: check columns moi (trang_thai, da_ban, etc.) ===');
  const r3 = await fetch(url + '/rest/v1/san_pham?select=trang_thai,da_ban,ncc,chat_lieu,luot_xem,rating,hinh_anh&limit=3', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d3 = await r3.json();
  console.log('HTTP:', r3.status);
  if (Array.isArray(d3) && d3.length > 0) {
    console.log('OK - co data:', JSON.stringify(d3, null, 2).substring(0, 500));
  } else {
    console.log('ERROR body:', JSON.stringify(d3).substring(0, 400));
  }
}

main().catch(e => { console.error('FAIL:', e); process.exit(1); });
