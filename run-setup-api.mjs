import { readFileSync } from 'fs';

const PROJECT_REF = 'ejcuqyaiwabfygyesvxj';
const PAT = process.env.SUPABASE_PAT || 'your-pat-here';

async function run() {
  console.log('Đang đọc file SQL...');
  let sql = readFileSync('APPLY-SUPABASE-MANUAL.sql', 'utf8');
  
  // Clean start
  sql = 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;' + sql;

  console.log('Đang gửi lệnh thiết lập cơ sở dữ liệu lên Supabase...');
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
      console.log('✅ Cài đặt dữ liệu thành công!');
    } else {
      const errorText = await res.text();
      console.error('❌ Thất bại:', res.status, errorText);
    }
  } catch (error) {
    console.error('❌ Lỗi kết nối:', error.message);
  }
}

run();
