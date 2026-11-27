const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.resolve(__dirname, '../../../../.env.production'), 'utf8');
const matchKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const serviceKey = matchKey ? matchKey[1].replace(/['"]/g, '').trim() : '';
const sb = createClient('https://ejcuqyaiwabfygyesvxj.supabase.co', serviceKey);

async function run() {
  const { data, error } = await sb.from('cham_cong').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total cham_cong rows:', data ? data.length : 0);
  if (data && data.length > 0) {
    const months = Array.from(new Set(data.map(r => (r.ngay || '').slice(0, 7)))).sort();
    console.log('Months in DB:', months);
    months.forEach(m => {
      const inMonth = data.filter(r => (r.ngay || '').startsWith(m));
      console.log(`Month ${m}: ${inMonth.length} records`);
    });
    // Check some sample records
    console.log('Sample record:', data[0]);
  }
}
run();
