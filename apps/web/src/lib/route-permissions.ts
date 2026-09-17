import type { Module } from "@/lib/permissions";

/** Nguồn duy nhất ánh xạ URL sang module quyền. */
export const ROUTE_MODULES: ReadonlyArray<readonly [string, Module]> = [
  ["/cong-viec-duoc-giao", "dashboard"],
  ["/danh-muc-vat-tu-san-xuat", "dat-ncc-phu-lieu"], ["/phieu-dat-ncc-phu-lieu", "dat-ncc-phu-lieu"],
  ["/mang-luoi-san-xuat", "nha-cung-cap"], ["/nha-cung-cap", "nha-cung-cap"], ["/doi-tac-gia-cong", "nha-cung-cap"], ["/cong-nhan-gia-cong", "nha-cung-cap"], ["/master-data", "nha-cung-cap"], ["/kham-pha", "nha-cung-cap"],
  ["/hoa-don-dien-tu", "hoa-don"], ["/thanh-toan-misa-mock", "hoa-don"], ["/thanh-toan-thanh-cong", "hoa-don"],
  ["/role-workspaces", "workspace"], ["/phan-quen-cua-toi", "workspace"], ["/huong-dan-vai-tro", "workspace"],
  ["/quan-ly-tai-khoan", "cai-dat"], ["/phan-quyen-tuy-chinh", "phan-quyen-tuy-chinh"], ["/mohinh-phan-quyen-chuan", "cai-dat"], ["/kien-truc-phan-quyen", "cai-dat"],
  ["/bang-dieu-hanh-sx", "bang-dieu-hanh-sx"], ["/doi-soat-tien-cong", "doi-soat-tien-cong"], ["/doi-soat", "doi-soat-tien-cong"], ["/tong-hop-cong-doan", "bao-cao"],
  ["/ke-hoach-san-xuat", "ke-hoach-sx"], ["/lenh-tong", "ke-hoach-sx"], ["/san-xuat-erp", "ke-hoach-sx"], ["/lsx-m758-demo", "ke-hoach-sx"],
  ["/kho-vai-tinhmann", "kho-vai"], ["/kho-soi-day-chuyen", "kho-vai"], ["/so-det-nhuom", "kho-vai"], ["/soi-det-nhuom-erp", "kho-vai"], ["/mini-soi-det", "kho-vai"], ["/det-nhuom-flow", "kho-vai"], ["/flow-tong-quan", "kho-vai"],
  ["/kho-thanh-pham", "kho-thanh-pham"], ["/kiem-ke-mobile", "kho-thanh-pham"], ["/lo-hang-mobile", "kho-thanh-pham"], ["/nhap-kho-mobile", "kho-thanh-pham"], ["/xuat-kho-mobile", "kho-thanh-pham"], ["/trang-chu-kho", "kho-thanh-pham"],
  ["/kho-phu-lieu", "kho-phu-lieu"], ["/kho-mau", "kho-phu-lieu"], ["/bang-luong-auto", "bang-luong"], ["/bang-luong", "bang-luong"], ["/cham-cong", "cham-cong"], ["/cong-no", "cong-no-cong-doan"],
  ["/bang-gia", "don-hang"], ["/don-hang", "don-hang"], ["/khach-hang", "khach-hang"], ["/giao-hang", "giao-hang"], ["/van-chuyen", "van-chuyen"], ["/danh-muc-sp", "danh-muc-sp"],
  ["/lenh-cat", "lenh-cat"], ["/workflow", "lenh-cat"], ["/cong-thuc-dinh-muc", "lenh-cat"], ["/may", "to-may"], ["/to-may-work", "to-may"], ["/to-cat-work", "to-cat"],
  ["/ui-intd", "to-in-theu"], ["/ui-khuy-nut", "to-khuy-nut"], ["/ui-ui", "to-ui"], ["/ui-dong-goi", "to-dong-goi"],
  ["/qc", "kiem-tra-chat-luong"], ["/to-qc-work", "kiem-tra-chat-luong"], ["/kiem-tra-cl", "kiem-tra-chat-luong"], ["/trang-chu-qc", "kiem-tra-chat-luong"],
  ["/hoan-thien", "hoan-thien"], ["/to-ht-work", "hoan-thien"], ["/trang-chu-hoan-thien", "hoan-thien"], ["/cong-viec-hoan-thien", "hoan-thien"], ["/san-luong-hoan-thien", "hoan-thien"], ["/tien-cong-hoan-thien", "hoan-thien"], ["/ban-giao-hoan-thien", "hoan-thien"],
  ["/gia-cong-ngoai", "gia-cong-ngoai"], ["/trang-chu-gia-cong", "trang-chu-gia-cong"], ["/cong-viec", "cong-viec-gia-cong"], ["/san-luong", "san-luong-gia-cong"], ["/tien-cong", "tien-cong-gia-cong"], ["/ban-giao", "ban-giao-gia-cong"],
  ["/dashboard", "dashboard"], ["/realtime", "realtime"], ["/canh-bao", "bao-cao"], ["/bao-cao", "bao-cao"], ["/nhan-su", "nhan-su"], ["/tin-nhan", "tin-nhan"], ["/bang-tin", "tin-nhan"],
  ["/profile", "dashboard"], ["/ca-nhan", "dashboard"], ["/mau-da-thich", "so-do-chien-luoc"], ["/so-do-chien-luoc", "so-do-chien-luoc"],
  ["/agents-chat", "cai-dat"], ["/agents", "cai-dat"], ["/ai-assistant", "cai-dat"], ["/auto-action-flow", "cai-dat"], ["/audit-log", "audit-log"], ["/backup-restore", "cai-dat"], ["/cai-dat", "cai-dat"], ["/import-excel", "cai-dat"], ["/seed-data", "cai-dat"], ["/supabase-status", "cai-dat"], ["/test-kiem-thu", "cai-dat"], ["/test-phan-quyen", "cai-dat"], ["/test-real-data", "cai-dat"],
  ["/lark-auto-setup", "cai-dat"], ["/lark-base-manager", "cai-dat"], ["/lark-callback", "cai-dat"], ["/lark-card-builder", "cai-dat"], ["/lark-control-center", "cai-dat"], ["/lark-login", "cai-dat"], ["/lark-settings", "cai-dat"], ["/lark-setup", "cai-dat"], ["/lark-sheet-import", "cai-dat"], ["/lark-sync-engine", "cai-dat"], ["/lark-sync-overview", "cai-dat"], ["/lark-webhook-docs", "cai-dat"],
] as const;

export function getModuleForPath(pathname: string): Module | null {
  const match = ROUTE_MODULES.find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
  return match?.[1] || null;
}
