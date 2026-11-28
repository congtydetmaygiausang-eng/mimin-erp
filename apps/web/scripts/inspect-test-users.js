const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../.env.production');
const content = fs.readFileSync(envPath, 'utf8');
const serviceKey = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/^["']|["']$/g, '');
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const sb = createClient(url, serviceKey);

async function check() {
  const { data, error } = await sb.from('users').select('*').eq('email', 'trananhtuan737@gmail.com');
  console.log('User trananhtuan:', data, error);
}

check();
