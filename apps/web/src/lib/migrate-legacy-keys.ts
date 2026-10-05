// Auto-migrate: Copy data from legacy keys to canonical ones
// Chạy 1 lần khi user login hoặc mở app

const LEGACY_TO_CANONICAL: Record<string, string> = {
  "mimin_user_accounts": "mimin_users_v2",  // → users.ts đã canonicalize
  "polomimin_user_accounts": "mimin_users_v2",
  "mimin_kho_v1": "mimin_kho_vai_v2",         // → kho-vai-tinhmann.ts
  "polomimin_kho_v1": "mimin_kho_vai_v2",
  "mimin_master_ncc": "mimin_ncc_v2",         // → nha_cung_cap (master-data-full)
  "polomimin_master_ncc": "mimin_ncc_v2",
};

let migrated = false;

export function migrateLegacyKeys(): void {
  if (typeof window === "undefined" || migrated) return;
  // Tự động dọn dẹp các cache dữ liệu nhân sự cũ (38 NV) và khách hàng cũ (2 KH mock)
  const PURGE_KEYS = [
    "mimin_nhan_su_v1",
    "polomimin_nhan_su_v1",
    "mimin_khach_hang_v1",
    "polomimin_khach_hang_v1"
  ];
  for (const k of PURGE_KEYS) {
    try { localStorage.removeItem(k); } catch {}
  }
  for (const [oldKey, newKey] of Object.entries(LEGACY_TO_CANONICAL)) {
    const oldData = localStorage.getItem(oldKey);
    if (oldData) {
      const newData = localStorage.getItem(newKey);
      // Chỉ copy nếu chưa có data mới
      if (!newData) {
        localStorage.setItem(newKey, oldData);
        console.log(`[MIGRATE] ${oldKey} → ${newKey}`);
      }
      // Xóa key cũ để tránh nhầm lẫn
      localStorage.removeItem(oldKey);
    }
  }
  migrated = true;
}
