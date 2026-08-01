import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// API routes không hoạt động với output: "export" - đánh dấu force-static để build pass
// (Trong production, các API này sẽ không chạy - cần chuyển sang server runtime)
export const dynamic = "force-static";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin is not configured" }, { status: 500 });
  }
  const admin = supabaseAdmin;

  try {
    const { data: { users }, error } = await admin.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to UserAccount format for frontend
    const formattedUsers = await Promise.all(users.map(async (user) => {
      let meta = user.user_metadata || {};
      
      // Auto-migrate if missing role
      if (!meta.role) {
        const emailPrefix = user.email?.split("@")[0].toLowerCase() || "user";
        const roleMap: Record<string, string> = {
          admin: "admin",
          accountant: "accountant",
          finishing: "finishing",
          planner: "planner",
          qc: "qc",
          sewing: "sewing",
          warehouse: "warehouse",
        };
        const defaultRole = roleMap[emailPrefix] || "user";
        
        const phongBanMap: Record<string, string> = {
          admin: "ban-giam-doc",
          planner: "mua-hang",
          warehouse: "kho-soi",
          sewing: "to-may",
          qc: "qc",
          finishing: "hoan-thien",
          accountant: "ke-toan",
        };
        const defaultPhongBan = phongBanMap[defaultRole] || "khac";
        
        meta = {
          name: emailPrefix === "admin" ? "Admin" : emailPrefix,
          role: defaultRole,
          phongBan: defaultPhongBan,
          chucVu: "Nhân viên",
          sdt: "",
        };

        // Update in Supabase (fire and forget or await)
        await admin.auth.admin.updateUserById(user.id, { user_metadata: meta });
      }

      return {
        id: user.id,
        email: user.email,
        name: meta.name || user.email?.split("@")[0] || "User",
        role: meta.role || "user",
        phongBan: meta.phongBan || "khac",
        chucVu: meta.chucVu || "Nhân viên",
        sdt: meta.sdt || "",
        trangThai: user.banned_until ? "disabled" : "active",
        ngayTao: new Date(user.created_at).toISOString().slice(0, 10),
        lanDangNhapCuoi: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : undefined,
      };
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin is not configured" }, { status: 500 });
  }
  const admin = supabaseAdmin;

  try {
    const body = await req.json();
    const { email, password, name, role, phongBan, chucVu, sdt } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email và password là bắt buộc" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        phongBan,
        chucVu,
        sdt,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data.user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
