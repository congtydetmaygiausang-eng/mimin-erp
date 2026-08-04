import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "your-secret-key";


const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const rawFile = path.join(__dirname, "../raw_kh.txt");
  const content = fs.readFileSync(rawFile, "utf-8");
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Remove the header line
  lines.shift();

  const values: any[] = [];

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;

    const ma_kh = parts[0]?.trim() || "";
    const ten_kh = parts[1]?.trim() || "";
    const sdt = parts[2]?.trim() || "";
    const email = parts[3]?.trim() || "";
    const dia_chi = parts[4]?.trim() || "";
    const loai = parts[5]?.trim() || "";
    const mst = parts[6]?.trim() || "";
    const danh_gia = parts[7]?.trim() || "";
    
    let congNoStr = parts[8]?.trim() || "0";
    congNoStr = congNoStr.replace(/[^0-9]/g, "");
    let cong_no = parseInt(congNoStr, 10);
    if (isNaN(cong_no)) cong_no = 0;

    let rawGhiChu = parts[9]?.trim() || "";
    
    let ghi_chu = [];
    if (mst) ghi_chu.push(`MST: ${mst}`);
    if (danh_gia) ghi_chu.push(`Đánh giá: ${danh_gia} sao`);
    if (rawGhiChu) ghi_chu.push(rawGhiChu);
    
    const finalGhiChu = ghi_chu.join(". ");
    
    values.push({
      ma_kh,
      ten_kh,
      loai,
      dia_chi,
      sdt,
      email,
      cong_no,
      ghi_chu: finalGhiChu
    });
  }

  console.log("⏳ Đang xoá dữ liệu cũ...");
  await supabase.from("khach_hang").delete().neq("ma_kh", "DELETE_ALL"); // Tricky way to delete all

  console.log(`⏳ Đang đẩy ${values.length} dòng dữ liệu Khách hàng lên Supabase...`);
  
  // Insert in chunks of 50 to avoid payload limits
  for (let i = 0; i < values.length; i += 50) {
    const chunk = values.slice(i, i + 50);
    const { error } = await supabase.from("khach_hang").insert(chunk);
    if (error) {
      console.error("❌ Lỗi khi insert chunk:", error);
      return;
    }
  }

  console.log("🎉 ĐÃ ĐẨY DỮ LIỆU THÀNH CÔNG! Anh có thể F5 lại web để xem.");
}

run();
