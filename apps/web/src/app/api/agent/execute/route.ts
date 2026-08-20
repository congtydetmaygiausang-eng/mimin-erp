// API: Thuc thi action sau khi user confirm (HITL step 2)
// 2026-08-05 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit-log";
import { canCreate, canEdit, canDelete, type Role, type Module } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// POST /api/agent/execute
// Body: { action: 'createLenhCat' | 'updateCongDoan' | 'deletePhieu' | 'approvePhieu', payload: {...}, user: { id, email, role } }
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin chua cau hinh" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { action, payload, user } = body;

    if (!action || !payload || !user) {
      return NextResponse.json({ error: "Thieu action/payload/user" }, { status: 400 });
    }

    const role = user.role as Role;
    const logUser = { id: user.id, email: user.email, name: user.name || user.email, role, title: role, source: "supabase" as const };

    // Re-check permission
    const modMap: Record<string, Module> = {
      "createLenhCat": "lenh-cat",
      "updateCongDoan": "lenh-cat",
      "deletePhieu": "lenh-cat", // default, override by loaiPhieu
      "approvePhieu": "lenh-cat",
    };

    let moduleCheck: Module = modMap[action] || "lenh-cat";
    if (action === "deletePhieu" || action === "approvePhieu") {
      const subModMap: Record<string, Module> = {
        "lenh-cat": "lenh-cat",
        "phan-cong": "lenh-cat",
        "khach-hang": "khach-hang",
        "nha-cung-cap": "nha-cung-cap",
        "bang-luong": "bang-luong",
        "cong-no": "cong-no-cong-doan",
      };
      if (payload.loaiPhieu && subModMap[payload.loaiPhieu]) {
        moduleCheck = subModMap[payload.loaiPhieu];
      }
    }

    // Check action type
    let hasPerm = false;
    if (action === "createLenhCat") hasPerm = canCreate(role, moduleCheck);
    else if (action === "updateCongDoan" || action === "approvePhieu") hasPerm = canEdit(role, moduleCheck);
    else if (action === "deletePhieu") hasPerm = canDelete(role, moduleCheck);

    if (!hasPerm) {
      return NextResponse.json(
        { error: `Role "${role}" KHONG co quyen ${action} trong module "${moduleCheck}"` },
        { status: 403 }
      );
    }

    // Thuc thi action
    let result: any;
    switch (action) {
      case "createLenhCat": {
        const lenhId = `LC-${Date.now()}`;
        const { data, error } = await supabaseAdmin.from("lenh_cat").insert({
          id: lenhId,
          khach_hang: payload.maKH,
          ten_sp: payload.tenSP,
          tong_sl: payload.tongSL,
          han_hoan_thanh: payload.hanHoanThanh,
          ghi_chu: payload.ghiChu || "",
          trang_thai: "Moi",
          loai_lenh: "Cat vai",
          ngay_tao: new Date().toISOString(),
          nguoi_tao: user.email,
        }).select().single();

        if (error) throw new Error(error.message);
        result = { id: lenhId, ...data };
        logAudit({ user: logUser, action: "create", module: "ai-agent", description: `AI tao lenh cat ${lenhId}: ${payload.tenSP}`, success: true });
        break;
      }

      case "updateCongDoan": {
        const { data, error } = await supabaseAdmin
          .from("phan_cong")
          .update({
            trang_thai: payload.trangThai,
            ghi_chu: payload.ghiChu || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.phanCongId)
          .select()
          .single();

        if (error) throw new Error(error.message);
        result = data;
        logAudit({ user: logUser, action: "update", module: "ai-agent", description: `AI cap nhat cong doan ${payload.phanCongId} -> ${payload.trangThai}`, success: true });
        break;
      }

      case "deletePhieu": {
        const tableMap: Record<string, string> = {
          "lenh-cat": "lenh_cat",
          "phan-cong": "phan_cong",
          "khach-hang": "khach_hang",
          "nha-cung-cap": "nha_cung_cap",
        };
        const table = tableMap[payload.loaiPhieu];
        if (!table) throw new Error("Loai phieu khong hop le");

        const { error } = await supabaseAdmin.from(table).delete().eq("id", payload.phieuId);
        if (error) throw new Error(error.message);
        result = { deleted: true, id: payload.phieuId, loai: payload.loaiPhieu };
        logAudit({
          user: logUser,
          action: "delete",
          module: "ai-agent",
          description: `AI xoa ${payload.loaiPhieu} ${payload.phieuId}. Ly do: ${payload.lyDo}`,
          success: true,
        });
        break;
      }

      case "approvePhieu": {
        // Chưa triển khai workflow duyệt phan_cong/lenh_cat thật (cần xác định
        // rõ bảng nào lưu trạng thái duyệt cho từng loaiPhieu trước khi làm).
        // Trước đây trả về "approved: true" + ghi audit log "đã duyệt" dù
        // KHÔNG đổi gì trong Supabase - người xem audit log tưởng đã duyệt
        // thật. Giờ trả lỗi rõ ràng thay vì giả vờ thành công.
        logAudit({
          user: logUser,
          action: payload.hanhDong === "duyet" ? "approve" : "reject",
          module: "ai-agent",
          description: `AI thử ${payload.hanhDong} ${payload.loaiPhieu} ${payload.phieuId} nhưng tính năng chưa triển khai`,
          success: false,
          errorMessage: "approvePhieu chưa triển khai",
        });
        return NextResponse.json(
          { error: `Tính năng duyệt/từ chối phiếu qua AI chưa được triển khai cho loại "${payload.loaiPhieu}". Vui lòng duyệt trực tiếp trên màn hình nghiệp vụ tương ứng.` },
          { status: 501 }
        );
      }

      default:
        return NextResponse.json({ error: `Action khong ho tro: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
