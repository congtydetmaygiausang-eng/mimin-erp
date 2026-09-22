const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('kho_thanh_pham').select('id, ma_sp, mau, so_luong, trang_thai, lsx').eq('ma_sp', 'PJ-258-NN');
    console.log(JSON.stringify(data, null, 2));
}
check();
