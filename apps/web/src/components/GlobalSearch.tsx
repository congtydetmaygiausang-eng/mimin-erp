"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users, Package, ShoppingCart, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";

const SEARCHABLE = [
  // Pages
  { type: "page", label: "Dashboard",       href: "/dashboard/",     keywords: ["dashboard", "tổng quan", "trang chủ"], icon: FileText },
  { type: "page", label: "Lệnh cắt",       href: "/lenh-cat/",      keywords: ["lệnh cắt", "cutting", "lsx", "m758"], icon: Scissors },
  { type: "page", label: "Khách hàng",      href: "/khach-hang/",    keywords: ["khách hàng", "kh", "customer"], icon: Users },
  { type: "page", label: "Nhân sự",         href: "/nhan-su/",       keywords: ["nhân sự", "nv", "employee"], icon: Users },
  { type: "page", label: "Bảng lương",      href: "/bang-luong-auto/", keywords: ["bảng lương", "lương", "salary"], icon: FileText },
  { type: "page", label: "Cảnh báo",        href: "/canh-bao/",      keywords: ["cảnh báo", "alert", "warning"], icon: FileText },
  { type: "page", label: "Kho vải",         href: "/kho-vai-tinhmann/", keywords: ["kho vải", "vải", "kho"], icon: Package },
  { type: "page", label: "Kho phụ liệu",    href: "/kho-phu-lieu/",  keywords: ["kho phụ liệu", "phụ liệu"], icon: Package },
  { type: "page", label: "Master Data",     href: "/master-data/",   keywords: ["master data", "ncc", "kh sỉ"], icon: FileText },
  { type: "page", label: "UI Cắt",          href: "/ui-cat/",        keywords: ["ui cắt", "công nhân cắt"], icon: Scissors },
  { type: "page", label: "UI Khuy nút",     href: "/ui-khuy-nut/",   keywords: ["ui khuy nút"], icon: Scissors },
  { type: "page", label: "UI Ủi",           href: "/ui-ui/",         keywords: ["ui ủi"], icon: Scissors },
  { type: "page", label: "UI Đóng gói",     href: "/ui-dong-goi/",   keywords: ["ui đóng gói", "ui gấp"], icon: Scissors },
  { type: "page", label: "Đơn hàng",        href: "/don-hang/",      keywords: ["đơn hàng", "order"], icon: ShoppingCart },
  { type: "page", label: "Báo cáo",         href: "/bao-cao/",       keywords: ["báo cáo", "report"], icon: FileText },
  { type: "page", label: "Công nợ",         href: "/cong-no/",       keywords: ["công nợ", "debt"], icon: FileText },
];

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = q.trim() === "" ? [] : SEARCHABLE.filter((s) =>
    s.label.toLowerCase().includes(q.toLowerCase()) ||
    s.keywords.some((k) => k.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 8);

  const handleSelect = (href: string) => {
    router.push(href);
    setQ("");
    setOpen(false);
  };

  return (
    <div className="flex-1 max-w-md relative hidden sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: "var(--text-muted)" }} />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="input pl-9 pr-16"
        placeholder="Tìm kiếm... (Ctrl+K)"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono hidden md:inline">⌘K</kbd>
      {open && q && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-40 card p-1 max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">Không tìm thấy "{q}"</div>
            ) : (
              results.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.href}
                    onClick={() => handleSelect(r.href)}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded flex items-center gap-2 text-sm"
                  >
                    <Icon className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.href}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
