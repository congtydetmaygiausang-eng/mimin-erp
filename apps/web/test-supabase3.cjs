const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: spKho } = await supabase.from('kho_thanh_pham').select('id, ma_sp, mau').eq('ma_sp', 'BPJ-279-NNL').eq('mau', 'Tím');
  console.log("EXISTING:", spKho);
  if (spKho && spKho.length > 0) {
      const res = await supabase.from('kho_thanh_pham').update({
          so_luong: 10,
          trang_thai: "con",
      }).eq('id', spKho[0].id);
      console.log("UPDATE RES:", res);
  }
}
check();
