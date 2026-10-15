"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Phone, Search, X, UserPlus } from "lucide-react";
import { type KhachHangUI } from "@/lib/data/khach-hang-store";

export function removeAccents(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function cleanDigits(val: string): string {
  return (val || "").replace(/\D/g, "");
}

export function parseCustomerName(rawName: string) {
  const parts = (rawName || "").split(/[-–—]/).map((p) => p.trim()).filter(Boolean);
  const tenChinh = parts[0] || rawName || "";
  const khuVuc = parts.slice(1).join(" - ");
  return { tenChinh, khuVuc };
}

export function scoreCustomer(kh: KhachHangUI, rawQuery: string): number {
  const q = rawQuery.trim();
  if (!q) return 0;

  const qAcc = removeAccents(q);
  const qDigits = cleanDigits(q);

  const { tenChinh, khuVuc } = parseCustomerName(kh.ten || "");
  const tenChinhAcc = removeAccents(tenChinh);
  const tenFullAcc = removeAccents(kh.ten || "");
  const khuVucAcc = removeAccents(khuVuc);
  const maAcc = removeAccents(kh.maKH || "");
  const sdtDigits = cleanDigits(kh.sdt || "");
  const diaChiAcc = removeAccents(kh.diaChi || "");

  let score = 0;

  // 1. ƯU TIÊN SỐ ĐIỆN THOẠI KHI NGƯỜI DÙNG NHẬP CHUỖI SỐ
  if (qDigits.length >= 3 && sdtDigits) {
    if (sdtDigits === qDigits) {
      score = Math.max(score, 100_000);
    } else if (sdtDigits.startsWith(qDigits)) {
      score = Math.max(score, 90_000);
    } else if (sdtDigits.endsWith(qDigits)) {
      score = Math.max(score, 85_000);
    } else if (sdtDigits.includes(qDigits)) {
      score = Math.max(score, 75_000);
    }

    // Xử lý linh hoạt lệch số 0 đầu (0987... vs 987...)
    const sdtNoZero = sdtDigits.replace(/^0/, "");
    const qNoZero = qDigits.replace(/^0/, "");
    if (qNoZero.length >= 3) {
      if (sdtNoZero === qNoZero) {
        score = Math.max(score, 98_000);
      } else if (sdtNoZero.startsWith(qNoZero)) {
        score = Math.max(score, 88_000);
      } else if (sdtNoZero.includes(qNoZero)) {
        score = Math.max(score, 70_000);
      }
    }
  }

  // 2. ƯU TIÊN TÊN KHÁCH HÀNG (TÊN CHÍNH)
  if (qAcc) {
    // Trùng khớp hoàn toàn tên chính có dấu
    if (tenChinh.toLowerCase() === q.toLowerCase()) {
      score = Math.max(score, 98_000);
    }
    // Trùng khớp tên chính không dấu
    else if (tenChinhAcc === qAcc) {
      score = Math.max(score, 94_000);
    }

    // Khớp theo từng từ trong tên chính (Word Match: gõ "Hòa" khớp trọn từ "Hòa" trong "Trịnh Thị Hòa")
    const wordsTenChinh = tenChinh.toLowerCase().split(/\s+/);
    const wordsTenChinhAcc = tenChinhAcc.split(/\s+/);
    const qWordsAcc = qAcc.split(/\s+/).filter(Boolean);

    const allWordsInTenChinh = qWordsAcc.length > 0 && qWordsAcc.every((w) => wordsTenChinhAcc.includes(w));
    if (allWordsInTenChinh) {
      const hasExactCasedWord = wordsTenChinh.some((w) => w === q.toLowerCase());
      score = Math.max(score, 86_000 + (hasExactCasedWord ? 4_000 : 0));
    }

    // Tên chính bắt đầu bằng từ khóa
    if (tenChinhAcc.startsWith(qAcc)) {
      score = Math.max(score, 82_000);
    }
    // Tên chính chứa chuỗi từ khóa
    else if (tenChinhAcc.includes(qAcc)) {
      score = Math.max(score, 65_000);
    }
    // Tên đầy đủ chứa từ khóa ở phần khác (ngoài khu vực)
    else if (tenFullAcc.includes(qAcc) && !khuVucAcc.includes(qAcc)) {
      score = Math.max(score, 50_000);
    }

    // 3. KHỚP MÃ KHÁCH HÀNG (KH-xxx)
    if (maAcc === qAcc || (kh.maKH || "").toLowerCase() === q.toLowerCase()) {
      score = Math.max(score, 95_000);
    } else if (maAcc.includes(qAcc) || (qDigits && maAcc.includes(qDigits))) {
      score = Math.max(score, 60_000);
    }

    // 4. NẾU CHỈ KHỚP Ở HẬU TỐ KHU VỰC / TỈNH THÀNH (-Khánh Hòa, -Biên Hòa,...)
    // Điểm thấp hơn hẳn để không chiếm chỗ người có tên thật là từ khóa tìm kiếm
    if (score === 0 && khuVucAcc.includes(qAcc)) {
      const wordsKhuVucAcc = khuVucAcc.split(/\s+/);
      if (wordsKhuVucAcc.includes(qAcc)) {
        score = 15_000;
      } else {
        score = 10_000;
      }
    }

    // 5. Khớp email
    const emailAcc = removeAccents(kh.email || "");
    if (score === 0 && emailAcc && emailAcc.includes(qAcc)) {
      score = 8_000;
    }

    // 6. Khớp địa chỉ chi tiết
    if (score === 0 && diaChiAcc.includes(qAcc)) {
      score = 5_000;
    }
  }

  return score;
}

export interface SearchableCustomerSelectProps {
  value: string;
  valueType?: "maKH" | "ten";
  onChange: (value: string, customer?: KhachHangUI) => void;
  customers: KhachHangUI[];
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function SearchableCustomerSelect({
  value,
  valueType = "maKH",
  onChange,
  customers = [],
  placeholder = "-- Chọn khách hàng --",
  allowCustom = false,
  className = "",
  buttonClassName = "",
}: SearchableCustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Tìm khách hàng đang được chọn theo valueType hoặc fallback
  const selected = useMemo(() => {
    if (!value) return null;
    if (valueType === "ten") {
      return (
        customers.find((c) => c.ten === value) ||
        customers.find((c) => (c.ten || "").toLowerCase() === value.toLowerCase()) ||
        customers.find((c) => c.maKH === value) ||
        null
      );
    }
    return (
      customers.find((c) => c.maKH === value) ||
      customers.find((c) => c.ten === value) ||
      null
    );
  }, [customers, value, valueType]);

  const selectedInfo = useMemo(() => {
    if (!selected) return null;
    return parseCustomerName(selected.ten || "");
  }, [selected]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim();
    if (!q) return customers;

    return customers
      .map((c) => ({ customer: c, score: scoreCustomer(c, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.customer);
  }, [customers, search]);

  const handleSelect = (c: KhachHangUI) => {
    const returnVal = valueType === "ten" ? c.ten : c.maKH;
    onChange(returnVal, c);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleSelectCustom = () => {
    const customName = search.trim();
    if (!customName) return;
    onChange(customName, undefined);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative z-30 ${className}`}>
      {/* Box trigger chọn khách hàng */}
      <div
        className={`flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus-within:ring-2 focus-within:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 ${
          open ? "ring-2 ring-cyan-500 border-cyan-500 dark:ring-cyan-400 dark:border-cyan-400" : ""
        } ${selected ? "bg-slate-50/60 dark:bg-slate-800/90" : ""} ${buttonClassName}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 rounded bg-slate-200/90 px-1.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {selected.maKH}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-sm">
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedInfo?.tenChinh || selected.ten}
              </span>
              {selectedInfo?.khuVuc && (
                <span className="rounded bg-emerald-100/70 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {selectedInfo.khuVuc}
                </span>
              )}
              {selected.sdt && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <Phone className="h-3 w-3" />
                  {selected.sdt}
                </span>
              )}
            </div>
          </div>
        ) : value ? (
          /* Trường hợp có value dạng text tự do nhưng không nằm trong danh mục */
          <div className="flex min-w-0 flex-1 items-center gap-2 text-slate-900 dark:text-white font-medium">
            <span>{value}</span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Khách vãng lai
            </span>
          </div>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {(selected || value) && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title="Xóa lựa chọn"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Popover kết quả tìm kiếm */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Nhập tên khách hàng, số điện thoại hoặc mã KH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mb-1.5 flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {search.trim()
                ? `Tìm thấy ${filteredCustomers.length} khách hàng`
                : `Danh sách khách hàng (${customers.length})`}
            </span>
            {search.trim() && (
              <span className="text-[11px] italic text-emerald-600 dark:text-emerald-400">
                Ưu tiên đúng tên & SĐT
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {/* Tùy chọn nhập khách mới nếu cho phép allowCustom */}
            {allowCustom && search.trim() && (
              <button
                type="button"
                onClick={handleSelectCustom}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-cyan-400 bg-cyan-50/60 p-2.5 text-left text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100/80 dark:border-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200"
              >
                <UserPlus className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>
                  Sử dụng tên: <span className="font-bold underline">&quot;{search.trim()}&quot;</span> (Khách mới)
                </span>
              </button>
            )}

            {filteredCustomers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Không tìm thấy khách hàng nào khớp với &quot;{search}&quot;
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Thử tìm bằng tên riêng, số điện thoại hoặc mã KH (Ví dụ: Hòa, 098..., KH-890)
                </p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const info = parseCustomerName(c.ten || "");
                const isSelected =
                  valueType === "ten" ? c.ten === value : c.maKH === value;

                return (
                  <button
                    key={c.id || c.maKH}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`group flex w-full flex-col gap-1 rounded-xl p-2.5 text-left text-sm transition ${
                      isSelected
                        ? "border border-cyan-500 bg-cyan-50/70 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-100"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 rounded bg-slate-200/90 px-1.5 py-0.5 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {c.maKH}
                        </span>
                        <span className="truncate font-bold text-slate-900 group-hover:text-cyan-700 dark:text-white dark:group-hover:text-cyan-400">
                          {info.tenChinh}
                        </span>
                        {info.khuVuc && (
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {info.khuVuc}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {c.sdt ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <Phone className="h-3 w-3" />
                          {c.sdt}
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa có SĐT</span>
                      )}
                      {c.diaChi && (
                        <span className="truncate max-w-[260px] text-slate-500 dark:text-slate-400" title={c.diaChi}>
                          📍 {c.diaChi}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default SearchableCustomerSelect;
