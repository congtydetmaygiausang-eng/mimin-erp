const fs = require('fs');
const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../../node_modules/@supabase/supabase-js'));

const envPath = path.resolve(__dirname, '../../../../.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const matchKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const serviceKey = matchKey ? matchKey[1].replace(/['"]/g, '').trim() : '';
const sb = createClient('https://ejcuqyaiwabfygyesvxj.supabase.co', serviceKey);

sb.from('lenh_cat').select('id, ma_sp, mau_cong_doan, phan_cong').in('id', ['LC-2026-0014', 'LC-2026-0015']).then(({data, error}) => {
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
});
