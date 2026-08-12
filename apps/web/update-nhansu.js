const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ejcuqyaiwabfygyesvxj.supabase.co', 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd');

const rawData = [
  { ma_nv: 'GS001', ho_ten: 'Phạm Văn Đệ', don_gia_sp: 'Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ', luong_cb: 0 },
  { ma_nv: 'GS002', ho_ten: 'NGUYỄN THỊ MỸ NHI', don_gia_sp: 'Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ', luong_cb: 0 },
  { ma_nv: 'GS003', ho_ten: 'VÕ THỊ PHƯỜNG', don_gia_sp: 'Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ', luong_cb: 0 },
  { ma_nv: 'GS004', ho_ten: 'NGUYỄN NGỌC CẨM VY', don_gia_sp: '', luong_cb: 8000000 },
  { ma_nv: 'GS005', ho_ten: 'ĐỖ THỊ HUYỀN', don_gia_sp: '', luong_cb: 7000000 },
  { ma_nv: 'GS006', ho_ten: 'BÙI THỊ THANH', don_gia_sp: '', luong_cb: 8000000 },
  { ma_nv: 'GS007', ho_ten: 'NGUYỄN THỊ BÉ', don_gia_sp: 'Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ', luong_cb: 0 },
  { ma_nv: 'GS008', ho_ten: 'HUỲNH XUÂN HÒA', don_gia_sp: '', luong_cb: 10000000 },
  { ma_nv: 'GS009', ho_ten: 'NGUYỄN MINH ĐỨC', don_gia_sp: 'Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ', luong_cb: 0 },
  { ma_nv: 'GS010', ho_ten: 'TRƯƠNG MINH TÂM', don_gia_sp: 'Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ', luong_cb: 0 },
  { ma_nv: 'GS011', ho_ten: 'LÊ ĐỊNH', don_gia_sp: 'Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ', luong_cb: 0 },
  { ma_nv: 'GS012', ho_ten: 'DƯƠNG TẤN VĨNH', don_gia_sp: 'Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ', luong_cb: 0 },
  { ma_nv: 'GS013', ho_ten: 'NGUYỄN QUỐC MINH', don_gia_sp: 'Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ', luong_cb: 0 },
  { ma_nv: 'GS014', ho_ten: 'TRƯƠNG VĂN NHẪN', don_gia_sp: 'Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ', luong_cb: 0 },
  { ma_nv: 'GS015', ho_ten: 'NGUYỄN QUỐC HẬU', don_gia_sp: '', luong_cb: 7000000 },
  { ma_nv: 'GS016', ho_ten: 'LƯƠNG HOÀNG PHI', don_gia_sp: '', luong_cb: 0 },
  { ma_nv: 'GS017', ho_ten: 'NGUYỄN VĂN RUỘNG', don_gia_sp: 'Chung: 750đ', luong_cb: 0 }
];

async function updateDb() {
  for (const row of rawData) {
    console.log("Updating", row.ho_ten);
    const { error } = await supabase.from("nhan_su").update({
      luong_cung: row.luong_cb,
      luong_cb: row.luong_cb,
      don_gia_sp: row.don_gia_sp
    }).ilike("ho_ten", row.ho_ten);
    
    if (error) {
      console.error("Error for", row.ho_ten, error.message);
    }
  }
  console.log("Done updating luong and don gia!");
}
updateDb();
