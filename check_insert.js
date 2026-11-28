const u = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const k = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";

async function checkColumns() {
  const r = await fetch(`${u}/rest/v1/kho_thanh_pham?limit=1`, {
    headers: { apikey: k, Authorization: 'Bearer ' + k }
  });
  const data = await r.json();
  if (Array.isArray(data) && data[0]) {
    console.log('kho_thanh_pham columns:', Object.keys(data[0]));
  } else {
    console.log('Result:', data);
  }
}

checkColumns().catch(console.error);

