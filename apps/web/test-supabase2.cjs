const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const newRow = {
     id: `TP${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5)}`,
     ma_sp: "TEST123",
     ten_sp: "Test Product",
     mau: "Tim",
     so_luong: 10,
     trang_thai: "con",
     ngay_nhap: new Date().toISOString(),
     phan_loai: "AoPolo",
     lsx: `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-6)}`,
     vi_tri: "Khu A1",
     don_gia: 0,
     gia_tri: 0,
     gia_ban_le: 0,
     gia_ban_si: 0,
     gia_von: 0
  };
  const res = await supabase.from('kho_thanh_pham').insert([newRow]);
  console.log("INSERT RES:", res);
}
check();
