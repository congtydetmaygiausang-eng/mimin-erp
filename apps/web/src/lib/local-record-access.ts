import { can } from "./permissions";
import { localActiveAccount } from "./local-account-store";
import { canAccessProductionOrder, canAccessStage, hasAccountPermission, inAssignment, matchesEmployee } from "./account-access";
import type { LenhCat } from "./data/lenh-cat-store";

export function canManageLocalOrder(order: LenhCat): boolean {
  const account = localActiveAccount();
  return Boolean(account?.kind === "employee" && hasAccountPermission(account, "lenh-cat", "edit", can)
    && (inAssignment(account, order) || matchesEmployee(account, order.phuTrachSX)));
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function assertLocalProductionPatch(order: LenhCat, patch: Partial<LenhCat>) {
  const account = localActiveAccount();
  if (!canAccessProductionOrder(account, order, can)) throw new Error("Lệnh không thuộc phạm vi được giao");
  if (canManageLocalOrder(order)) return;
  // Stage workers can change stage results only; assignment, pricing and order ownership stay with the coordinator.
  const allowed = new Set(["phanCong", "dsMau", "tongSLThucTe"]);
  for (const key of Object.keys(patch) as (keyof LenhCat)[]) {
    if (!allowed.has(key) && !same(order[key], patch[key])) throw new Error("Không có quyền sửa thông tin chung của lệnh");
  }
  if (patch.phanCong) {
    if (patch.phanCong.length !== order.phanCong.length) throw new Error("Không có quyền thêm hoặc xóa công đoạn");
    for (let index = 0; index < patch.phanCong.length; index++) {
      const next = patch.phanCong[index];
      const old = order.phanCong[index];
      if (same(old, next)) continue;
      if (old.id !== next.id || !canAccessStage(account, old, "edit", can)) throw new Error("Không có quyền cập nhật công đoạn này");
      for (const field of ["nguoiMa", "nguoiTen", "loaiNguoi", "donGia", "userIds", "team", "department", "daThanhToan", "trangThaiTT"] as const) {
        if (!same(old[field], next[field])) throw new Error("Không có quyền thay đổi phân công hoặc đơn giá");
      }
    }
  }
  if (patch.dsMau) {
    if (patch.dsMau.length !== order.dsMau.length) throw new Error("Không có quyền thay đổi màu của lệnh");
    patch.dsMau.forEach((next, index) => {
      const old = order.dsMau[index];
      const { tyLeSizeChiTiet: before, ...oldInfo } = old;
      const { tyLeSizeChiTiet: after, ...newInfo } = next;
      if (!same(oldInfo, newInfo)) throw new Error("Chỉ được cập nhật số lượng công đoạn được giao");
      for (const id of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
        if (!same(before?.[id], after?.[id])) {
          const stage = order.phanCong.find(item => item.id === id);
          if (!stage || !canAccessStage(account, stage, "edit", can)) throw new Error("Không có quyền cập nhật bảng size công đoạn này");
        }
      }
    });
  }
  if (patch.tongSLThucTe !== undefined && patch.tongSLThucTe !== order.tongSLThucTe) {
    const cutting = order.phanCong.find(stage => stage.id === "cat");
    if (!cutting || !canAccessStage(account, cutting, "edit", can)) throw new Error("Chỉ khâu cắt được chốt số lượng thực tế");
  }
}
