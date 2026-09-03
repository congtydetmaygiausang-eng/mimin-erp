"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import PageGuard from "@/components/PageGuard";

const MODULE_CLASSES: Record<string, string> = {
  "/dashboard": "bg-module-dashboard",
  "/lenh-cat": "bg-module-lenh-cat",
  "/khach-hang": "bg-module-khach-hang",
  "/ke-hoach-san-xuat": "bg-module-ke-hoach",
  "/nhan-su": "bg-module-nhan-su",
  "/nha-cung-cap": "bg-module-nha-cung-cap",
  "/doi-tac-gia-cong": "bg-module-doi-tac-gia-cong",
  "/cong-nhan-gia-cong": "bg-module-doi-tac-gia-cong",
  "/san-xuat-erp": "bg-[#ECE7DC]",
  "/kho-vai-tinhmann": "bg-module-kho",
  "/kho-phu-lieu": "bg-module-kho",
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
