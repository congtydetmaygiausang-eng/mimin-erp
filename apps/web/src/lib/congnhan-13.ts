// DEPRECATED: dùng users.ts (canonical - Task 3 v89.6.3)
// File này chỉ re-export để backward-compat với 11 nơi import cũ
// Xóa sau khi verify không còn reference (sẽ làm ở v90)

export { CONG_NHAN_13, MODULE_SX_INFO } from "./users";
export type { ModuleSX } from "./users";
