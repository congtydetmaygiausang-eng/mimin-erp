import { readFileSync } from 'fs';

const PROJECT_REF = 'ejcuqyaiwabfygyesvxj';
const PAT = process.env.SUPABASE_PAT || 'your-pat-here';

async function run() {
  const sql = 'SELECT (SELECT count(*) FROM nha_cung_cap) as ncc_count, (SELECT count(*) FROM nhan_su) as ns_count;';
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Kết quả kiểm tra DB:', data);
    } else {
      const errorText = await res.text();
      console.error('❌ Thất bại:', res.status, errorText);
    }
  } catch (error) {
    console.error('❌ Lỗi kết nối:', error.message);
  }
}

run();
