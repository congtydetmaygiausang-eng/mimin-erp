"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import PageGuard from "@/components/PageGuard";

// Mapping route -> background class (sep Sang chot 2026-08-06)
// Su dung class bg-module-img-* de hien thi anh that sep gui
const MODULE_CLASSES: Record<string, string> = {
  "/dashboard": "bg-module-dashboard",
  "/lenh-cat": "bg-module-img-lenh-cat",
  "/khach-hang": "bg-module-img-khach-hang",
  "/ke-hoach-san-xuat": "bg-module-img-ke-hoach",
  "/nhan-su": "bg-module-img-nhan-su",
  "/nha-cung-cap": "bg-module-nha-cung-cap",
  "/doi-tac-gia-cong": "bg-module-doi-tac-gia-cong",
  "/cong-nhan-gia-cong": "bg-module-doi-tac-gia-cong",
  "/kho-vai-tinhmann": "bg-module-img-kho",
  "/kho-phu-lieu": "bg-module-img-kho",
  "/don-hang": "bg-module-img-don-hang",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const matched = Object.keys(MODULE_CLASSES).find((p) => pathname?.startsWith(p));
  const moduleClass = matched ? MODULE_CLASSES[matched] : "bg-module-default";
  return (
    <AppShell moduleClass={moduleClass}>
      <PageGuard>{children}</PageGuard>
    </AppShell>
  );
}
