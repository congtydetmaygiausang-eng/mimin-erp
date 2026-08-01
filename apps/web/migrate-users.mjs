import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nftlwdcsmlpeiazhuoho.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdGx3ZGNzbWxwZWlhemh1b2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDcyNjAwMywiZXhwIjoyMTAwMzAyMDAzfQ.Bhj7_Z2EP4pjlgXulZ4i36megdb0Y7QeJn686hIwlzQ";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function migrate() {
  console.log("Fetching users...");
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  console.log(`Found ${users.length} users. Checking metadata...`);
  for (const user of users) {
    let meta = user.user_metadata || {};
    if (!meta.role) {
      console.log(`Migrating user: ${user.email}`);
      const emailPrefix = user.email?.split("@")[0].toLowerCase() || "user";
      const roleMap = {
        admin: "admin", accountant: "accountant", finishing: "finishing",
        planner: "planner", qc: "qc", sewing: "sewing", warehouse: "warehouse",
      };
      const defaultRole = roleMap[emailPrefix] || "user";
      
      const phongBanMap = {
        admin: "ban-giam-doc", planner: "mua-hang", warehouse: "kho-soi",
        sewing: "to-may", qc: "qc", finishing: "hoan-thien", accountant: "ke-toan",
      };
      const defaultPhongBan = phongBanMap[defaultRole] || "khac";
      
      meta = {
        name: emailPrefix === "admin" ? "Admin" : emailPrefix,
        role: defaultRole,
        phongBan: defaultPhongBan,
        chucVu: "Nhân viên",
        sdt: "",
      };
      await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: meta });
      console.log(` -> Updated ${user.email} with role: ${defaultRole}`);
    } else {
      console.log(`Skip ${user.email}, already has role: ${meta.role}`);
    }
  }
  console.log("Migration complete.");
}

migrate();
