require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('kho_thanh_pham').select('*').eq('ma_sp', 'PJ-258-NN');
  console.log("Data for PJ-258-NN:", JSON.stringify(data, null, 2));
}
run();
