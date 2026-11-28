const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../.env.production');
const content = fs.readFileSync(envPath, 'utf8');
const serviceKey = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/^["']|["']$/g, '');
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const sb = createClient(url, serviceKey);

async function cleanupTestAccounts() {
  const testEmails = [
    'codex-rls-test-1794480968422@mimin.vn',
    'test-admin-1794530896973@mimin.vn',
    'test-probe-1794530844836@mimin.vn',
    'test-probe-1794531440502@mimin.vn',
    'test-probe-bucket-1794532191871@mimin.vn',
    'test-probe-ns-1794531526742@mimin.vn',
    'test-probe-sign-1794533108529@mimin.vn',
    'test-probe-sign-1794533169205@mimin.vn',
    'trananhtuan737@gmail.com'
  ];

  console.log('Cleaning up', testEmails.length, 'test accounts...');

  for (const email of testEmails) {
    const { data: user } = await sb.from('users').select('id, email').eq('email', email).maybeSingle();
    if (user) {
      console.log('Deleting user:', user.email, user.id);
      // Delete from public.users
      const { error: err1 } = await sb.from('users').delete().eq('id', user.id);
      if (err1) console.error('Error deleting from users:', err1);
      // Delete from auth.users
      const { error: err2 } = await sb.auth.admin.deleteUser(user.id);
      if (err2) console.error('Error deleting from auth:', err2);
      console.log('Deleted successfully:', email);
    } else {
      console.log('User not found:', email);
    }
  }

  const { data: remaining } = await sb.from('users').select('id, email, name, role');
  console.log('Remaining accounts count:', remaining?.length);
  console.log(remaining?.map(u => `${u.name} (${u.email})`));
}

cleanupTestAccounts();
