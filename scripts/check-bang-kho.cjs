// Check bang kho da ton tai chua
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  const r = await fetch(url + '/rest/v1/kho?select=*&limit=1', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  console.log('Status:', r.status);
  if (r.ok) {
    const d = await r.json();
    console.log('Data:', d);
  } else {
    console.log('Body:', (await r.text()).substring(0, 300));
  }
}
main();
