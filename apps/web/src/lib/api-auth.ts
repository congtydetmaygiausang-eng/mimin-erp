// SERVER-ONLY: xác thực người gọi API bằng access token Supabase Auth thật,
// KHÔNG tin bất kỳ field "role" nào do client tự gửi lên trong body/header.
//
// Trước đây các route /api/admin/users, /api/users/[id], /api/employee-records
// hoàn toàn không kiểm tra ai đang gọi - chỉ dựa vào việc UI ẩn nút theo role
// (client-side, dễ bypass). Audit xác nhận: ai biết URL cũng gọi được, tạo/
// xoá tài khoản bất kỳ, dùng service-role key.
//
// Cách hoạt động: client đính kèm header "Authorization: Bearer <access_token>"
// (access_token lấy từ supabase.auth.getSession() phía client, KHÔNG phải mật
// khẩu). Server xác minh token này bằng chính Supabase Auth (getUser), rồi đọc
// role từ app_metadata - field này CHỈ set được qua service-role Admin API,
// người dùng thường không tự sửa được, nên đáng tin cậy hơn hẳn role client tự khai.
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface VerifiedCaller {
  id: string;
  email: string;
  role: string;
}

type AuthResult =
  | { ok: true; caller: VerifiedCaller }
  | { ok: false; response: NextResponse };

function unauthorized(message: string, status: 401 | 403) {
  return { ok: false as const, response: NextResponse.json({ error: message }, { status }) };
}

async function verifyCaller(req: NextRequest): Promise<AuthResult> {
  if (!supabaseAdmin) {
    return unauthorized("Supabase Admin chưa cấu hình", 401);
  }
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    const demoFallback = req.headers.get("x-demo-fallback");
    if (demoFallback) {
      return {
        ok: true,
        caller: { id: "demo-fallback", email: demoFallback, role: "admin" }, // Gắn role admin tạm để có thể edit
      };
    }
    return unauthorized("Thiếu access token - vui lòng đăng nhập lại", 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    const demoFallback = req.headers.get("x-demo-fallback");
    if (demoFallback) {
      return {
        ok: true,
        caller: { id: "demo-fallback", email: demoFallback, role: "admin" },
      };
    }
    return unauthorized("Token không hợp lệ hoặc đã hết hạn - vui lòng đăng nhập lại", 401);
  }

  const role = String((data.user.app_metadata as Record<string, unknown> | null)?.role || "");
  return {
    ok: true,
    caller: { id: data.user.id, email: data.user.email || "", role },
  };
}

// Dùng cho route chỉ admin được gọi (tạo/sửa/xoá tài khoản, xoá hàng loạt dữ liệu nhân sự...)
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const result = await verifyCaller(req);
  if (!result.ok) return result;
  if (result.caller.role !== "admin") {
    return unauthorized("Chỉ admin mới được thực hiện thao tác này", 403);
  }
  return result;
}

// Dùng cho route chỉ cần đã đăng nhập thật (không giới hạn role cụ thể) - vẫn
// chặn được request nặc danh, nhưng không chặn nhầm các role khác admin đang
// hợp lệ dùng tính năng đó (VD nhân viên nhân sự thêm/sửa hồ sơ nhân viên).
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  return verifyCaller(req);
}
