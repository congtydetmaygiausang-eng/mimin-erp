// run-via-api.mjs
// Chạy migration qua Supabase REST API (không cần direct DB connection)
// Requires: SUPABASE_URL + SERVICE_ROLE_KEY

const PROJECT_REF = 'nftlwdcsmlpeiazhuoho';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// ⚠️ Cần thay bằng service_role key thật từ Settings > API
// Lấy tại: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/api
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE';

async function runSQL(sql, label) {
  console.log(`📄 ${label}...`);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    const text = await res.text();
    if (res.ok) {
      console.log(`✅ ${label} - OK`);
      return true;
    } else {
      console.log(`⚠️  ${label} - Status ${res.status}: ${text.slice(0, 200)}`);
      return false;
    }
  } catch (e) {
    console.error(`❌ ${label} - Error: ${e.message}`);
    return false;
  }
}

// Tạo bảng users trước tiên (test)
const TEST_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    nhom TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'worker',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  SELECT 'users table created' as result;
`;

console.log('🚀 Testing Supabase REST API...');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`KEY: ${SERVICE_ROLE_KEY.slice(0, 20)}...\n`);

// Test nếu key hợp lệ
const testRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  }
});
console.log(`API Health: ${testRes.status} ${testRes.statusText}`);

// Thử insert 1 record test để xem RLS/permissions
const insertTest = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
    'Prefer': 'count=exact',
  }
});
const body = await insertTest.text();
console.log(`Users table query: ${insertTest.status} - ${body.slice(0, 100)}`);
