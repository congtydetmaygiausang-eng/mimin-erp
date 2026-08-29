"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users, Package, ShoppingCart, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";

const SEARCHABLE = [
  { type: "page", label: "Dashboard",       href: "/dashboard/",     keywords: ["dashboard", "tổng quan", "trang chủ"], icon: FileText },
  { type: "page", label: "Lệnh cắt",       href: "/lenh-cat/",      keywords: ["lệnh cắt", "cutting", "lsx", "m758"], icon: Scissors },
  { type: "page", label: "Khách hàng",      href: "/khach-hang/",    keywords: ["khách hàng", "kh", "customer"], icon: Users },
  { type: "page", label: "Nhân sự",         href: "/nhan-su/",       keywords: ["nhân sự", "nv", "employee"], icon: Users },
  { type: "page", label: "Bảng lương",      href: "/bang-luong-auto/", keywords: ["bảng lương", "lương", "salary"], icon: FileText },
  { type: "page", label: "Cảnh báo",        href: "/canh-bao/",      keywords: ["cảnh báo", "alert", "warning"], icon: FileText },
  { type: "page", label: "Kho vải",         href: "/kho-vai-tinhmann/", keywords: ["kho vải", "vải", "kho"], icon: Package },
  { type: "page", label: "Kho phụ liệu",    href: "/kho-phu-lieu/",  keywords: ["kho phụ liệu", "phụ liệu"], icon: Package },
  { type: "page", label: "Kho thành phẩm",  href: "/kho-thanh-pham/", keywords: ["kho thành phẩm", "thành phẩm"], icon: Package },
  { type: "page", label: "Master Data",     href: "/master-data/",   keywords: ["master data", "ncc", "kh sỉ"], icon: FileText },
  { type: "page", label: "Gia công ngoài",  href: "/doi-tac-gia-cong/", keywords: ["gia công", "đối tác"], icon: Users },
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
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Khi modal mở, auto focus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ(""); // reset text khi đóng
    }
  }, [open]);

  // Logic search cải tiến
  const normalizedQ = q.trim().toLowerCase();
  
  // Trọng số kết quả: Khớp tên (cao), Khớp từ khóa (vừa)
  const scoredResults = SEARCHABLE.map(s => {
    let score = 0;
    const labelLower = s.label.toLowerCase();
    
    if (labelLower === normalizedQ) score = 100;
    else if (labelLower.startsWith(normalizedQ)) score = 80;
    else if (labelLower.includes(normalizedQ)) score = 50;
    
    // Nếu chưa khớp tên, tìm trong keywords
    if (score === 0) {
      for (const kw of s.keywords) {
        if (kw === normalizedQ) {
          score = 70; break;
        }
        else if (kw.startsWith(normalizedQ)) {
          score = 60; break;
        }
        else if (kw.includes(normalizedQ)) {
          score = 30; break;
        }
      }
    }
    return { ...s, score };
  }).filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const results = normalizedQ === "" ? SEARCHABLE.slice(0, 6) : scoredResults.slice(0, 8);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      {/* TRIGGER BUTTON (Thay thế ô input cũ) */}
      <div className="flex-1 max-w-md px-2 sm:px-4 flex items-center justify-end sm:justify-start">
        {/* Mobile trigger */}
        <button
          onClick={() => setOpen(true)}
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-lg backdrop-blur-sm transition-all"
          aria-label="Tìm kiếm"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Desktop trigger */}
        <button
          onClick={() => setOpen(true)}
          className="hidden sm:flex w-full h-9 items-center justify-between px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/70 shadow-sm transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Tìm kiếm tính năng...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white/80 font-mono font-semibold">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* COMMAND PALETTE MODAL */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* BACKDROP */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setOpen(false)} 
          />
          
          {/* MODAL CONTENT */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* SEARCH INPUT */}
            <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-blue-500 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 h-16 bg-transparent border-none outline-none px-4 text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                placeholder="Tìm kiếm danh mục, tính năng, báo cáo..."
              />
              <button 
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SEARCH RESULTS */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {q.trim() === "" && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Truy cập nhanh
                </div>
              )}
              
              {results.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 font-medium">Không tìm thấy kết quả nào cho "{q}"</div>
                  <div className="text-sm text-slate-400 mt-1">Vui lòng thử lại với từ khóa khác</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.href}
                        onClick={() => handleSelect(r.href)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl flex items-center gap-3 group transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 flex items-center justify-center shrink-0 border border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900 shadow-sm transition-all">
                          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                            {r.label}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {r.href}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* FOOTER */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-sm">Enter</kbd> Chọn</span>
                <span className="flex items-center gap-1"><kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-sm">ESC</kbd> Đóng</span>
              </div>
              <div>MIMIN Global Search</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
