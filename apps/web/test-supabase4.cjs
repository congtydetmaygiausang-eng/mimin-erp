const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const data = {
        tenSP: "Bộ Polo MANPJ Phối Ngực Thanh Lịch",
        loaiSP: "BoTru",
        giaVonDuKien: 0,
        giaBanLe: 0,
        giaBanSi: 0,
        bangSize: {
            sizes: ["S", "M", "L"],
            ratios: [1, 2, 1]
        }
    };
    const m = {
        ten: "Tím",
        soLuongKho: 10,
        img: "some_image_url"
    };
    const id = "BPJ-279-NNL";
    
    const newRow = {
       id: `TP${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5)}`,
       ma_sp: id,
       ten_sp: data.tenSP || id,
       mau: m.ten,
       so_luong: m.soLuongKho,
       trang_thai: m.soLuongKho > 0 ? "con" : "het",
       ngay_nhap: new Date().toISOString(),
       phan_loai: data.loaiSP || "AoPolo",
       lsx: `LTK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-6)}`,
       vi_tri: "Khu A1",
       don_gia: data.giaVonDuKien || 0,
       gia_tri: (m.soLuongKho || 0) * (data.giaVonDuKien || 0),
       gia_ban_le: data.giaBanLe || 0,
       gia_ban_si: data.giaBanSi || 0,
       gia_von: data.giaVonDuKien || 0,
       hinh_anh: [m.img]
    };
    
    if (data.bangSize && data.bangSize.sizes) {
       const tongRatio = data.bangSize.ratios.reduce((s, r) => s + r, 0) || 1;
       let conLai = m.soLuongKho;
       newRow.chi_tiet_size = data.bangSize.sizes.map((size, index) => {
          if (index === data.bangSize.sizes.length - 1) return { size, sl: conLai };
          const ratio = data.bangSize.ratios[index] || 0;
          const chia = Math.round((ratio / tongRatio) * m.soLuongKho);
          conLai -= chia;
          return { size, sl: Math.max(0, chia) };
       });
    }

    console.log("Inserting:", newRow);
    const { error, data: insertedData } = await supabase.from("kho_thanh_pham").insert([newRow]);
    if (error) {
        console.error("ERROR:", error);
    } else {
        console.log("SUCCESS:", insertedData);
    }
}
check();
