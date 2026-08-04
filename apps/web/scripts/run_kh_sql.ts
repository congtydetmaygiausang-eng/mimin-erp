import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const dbUrl = "postgresql://postgres:HtUkba9rRPdDmigJ@db.ejcuqyaiwabfygyesvxj.supabase.co:5432/postgres";


const client = new Client({
  connectionString: dbUrl,
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Đã kết nối Supabase thành công!");

    // Đọc file SQL
    const sqlPath = path.join(__dirname, '../NAP-DU-LIEU-KHACH-HANG.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("⏳ Đang đẩy 128 dòng dữ liệu Khách hàng lên Supabase...");
    
    // Thực thi SQL
    await client.query(sql);

    console.log("🎉 ĐÃ ĐẨY DỮ LIỆU THÀNH CÔNG! Anh có thể F5 lại web để xem.");
  } catch (err) {
    console.error("❌ Lỗi khi đẩy dữ liệu:", err);
  } finally {
    await client.end();
  }
}

run();
