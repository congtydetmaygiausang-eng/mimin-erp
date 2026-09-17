const path = require('node:path');
process.loadEnvFile(path.join(__dirname, '../apps/web/.env.local'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';
if (!url || !key) throw new Error('Missing public Supabase configuration');
const columns = ['facebook_url', 'luong_cung', 'rating', 'ngay_vao', 'dia_chi_tam_tru'];
(async () => {
  for (const column of columns) {
    const response = await fetch(`${url}/rest/v1/nhan_su?select=${column}&limit=0`, { headers: { apikey: key } });
    const body = await response.json();
    console.log(column, response.status, response.ok ? 'OK' : body.code);
  }
})().catch(() => { console.error('Schema check connection failed'); process.exitCode = 1; });
