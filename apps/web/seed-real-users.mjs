import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nftlwdcsmlpeiazhuoho.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdGx3ZGNzbWxwZWlhemh1b2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDcyNjAwMywiZXhwIjoyMTAwMzAyMDAzfQ.Bhj7_Z2EP4pjlgXulZ4i36megdb0Y7QeJn686hIwlzQ";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const defaultPassword = "miminpassword123";

const usersToCreate = [
  { email: "sang@mimin.vn", name: "Sang", maNV: "NV035", phongBan: "ban-giam-doc", role: "admin", chucVu: "Ban Giám Đốc" },
  { email: "giau@mimin.vn", name: "Giàu", maNV: "NV001", phongBan: "ban-giam-doc", role: "admin", chucVu: "Ban Giám Đốc" },
  { email: "thanh@mimin.vn", name: "Thanh", maNV: "NV002", phongBan: "ke-toan", role: "accountant", chucVu: "Phòng Kế Toán" },
  { email: "huyen@mimin.vn", name: "Huyền", maNV: "NV003", phongBan: "khac", role: "planner", chucVu: "Phòng Kinh Doanh" },
  { email: "vy@mimin.vn", name: "Vy", maNV: "NV004", phongBan: "khac", role: "planner", chucVu: "Phòng Marketing" },
  { email: "hau@mimin.vn", name: "Hậu", maNV: "NV005", phongBan: "kho-tp", role: "warehouse", chucVu: "Phòng Kho" },
  
  // Tổ May - Cắt
  { email: "giang@mimin.vn", name: "Giang", maNV: "NV006", phongBan: "to-may", role: "sewing", chucVu: "Tổ May - Cắt" },
  { email: "de@mimin.vn", name: "De", maNV: "NV007", phongBan: "to-may", role: "sewing", chucVu: "Tổ May - Cắt" },
  { email: "phu@mimin.vn", name: "Phú", maNV: "NV008", phongBan: "to-may", role: "sewing", chucVu: "Tổ May - Cắt" },
  
  // Tổ Hoàn Thiện - ĐG
  { email: "nhi@mimin.vn", name: "Nhi", maNV: "NV009", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Đóng Gói" },
  { email: "phuong@mimin.vn", name: "Phương", maNV: "NV010", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Đóng Gói" },
  { email: "tim@mimin.vn", name: "Tim", maNV: "NV015", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Đóng Gói" },
  { email: "phien@mimin.vn", name: "Phiên", maNV: "NV016", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Đóng Gói" },
  
  // Tổ Hoàn Thiện - Ủi
  { email: "tuyen@mimin.vn", name: "Tuyến", maNV: "NV011", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Ủi" },
  { email: "huynh@mimin.vn", name: "Huỳnh", maNV: "NV012", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Ủi" },
  { email: "thuy@mimin.vn", name: "Thúy", maNV: "NV013", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Ủi" },
  { email: "anhui@mimin.vn", name: "Anh", maNV: "NV014", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Ủi" },
  
  // Tổ Hoàn Thiện - Khuy nút
  { email: "ruong@mimin.vn", name: "Ruộng", maNV: "NV017", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Khuy nút" },
  { email: "khoi@mimin.vn", name: "Khôi", maNV: "NV018", phongBan: "hoan-thien", role: "finishing", chucVu: "Tổ Hoàn Thiện - Khuy nút" },
];

async function seed() {
  console.log("Bat dau tao 19 users...");
  let count = 0;
  
  for (const user of usersToCreate) {
    console.log(`Dang tao: ${user.email}...`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
        phongBan: user.phongBan,
        chucVu: user.chucVu,
        maNV: user.maNV,
        sdt: ""
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log(` -> User ${user.email} da ton tai! Cap nhat metadata...`);
        
        // Fetch existing user to get ID
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData.users.find(u => u.email === user.email);
        if (existingUser) {
           await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
             user_metadata: {
               name: user.name,
               role: user.role,
               phongBan: user.phongBan,
               chucVu: user.chucVu,
               maNV: user.maNV,
               sdt: ""
             },
             password: defaultPassword
           });
           console.log(` -> Da cap nhat ${user.email}`);
           count++;
        }
      } else {
        console.error(` -> Loi tao ${user.email}: ${error.message}`);
      }
    } else {
      console.log(` -> Tao thanh cong: ${user.email}`);
      count++;
    }
  }
  
  console.log(`Hoan tat! Da tao/cap nhat: ${count} users.`);
}

seed();
