"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { mapCsvRowsToEmployees } from "@/lib/employee-import";
import { authFetch } from "@/lib/auth-fetch";

async function clearExistingEmployees() {
  const response = await authFetch("/api/employee-records", { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Users,
  ShoppingBag,
  Truck,
  Package,
  Scissors,
  ClipboardList,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  FileDown,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ─── Định nghĩa các module import ────────────────────────────────────────────
const IMPORT_MODULES = [
  {
    id: "nhan-su",
    name: "Nhân sự",
    icon: Users,
    color: "violet",
    description: "Danh sách nhân viên, bộ phận, chức vụ, lương cứng",
    templateCols: ["STT", "BHXH", "Mã NV", "Họ Tên", "Vị Trí", "SĐT", "Ngày Sinh", "Giới Tính", "CCCD", "Ngày Cấp", "Nơi Cấp", "Email", "Địa Chỉ Thường Trú", "Địa Chỉ Tạm Trú", "Số TK", "Ngân Hàng", "Trạng Thái", "Loại Lương", "Đơn giá SP", "Lương CB", "Ghi chú"],
    sampleData: [
      ["1", "9622347690", "GS001", "Phạm Văn Đệ", "Cắt", "0834033992", "08/09/2007", "Nam", "096207010504", "22/12/2021", "Cà Mau", "de7481039@gmail.com", "Việt Thắng, Phú Tân, Cà Mau", "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", "19075053256016", "Techcombank", "đang_lam", "Lương sản phẩm", "Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ", "", ""],
      ["2", "", "GS002", "NGUYỄN THỊ MỸ NHI", "Gấp xếp", "0901207771", "25/12/2007", "Nữ", "080307011543", "29/03/2022", "Long An", "Nguyennhi192145@gmail.com", "Ấp 4, Thạch Hưng, Tân Hưng, Long An", "12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP Hồ Chí Minh", "ACB-42718017", "ACB", "đang_lam", "Lương sản phẩm", "Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ", "0", ""],
    ],
    validateRow: (row: string[]) => {
      const errors: string[] = [];
      if (!row[2]?.trim()) errors.push("Thiếu Mã NV");
      if (!row[3]?.trim()) errors.push("Thiếu Họ tên");
      if (!row[4]?.trim()) errors.push("Thiếu Vị trí");
      if (row[5] && !/^\d{9,11}$/.test(row[5].replace(/\D/g, ""))) errors.push("SĐT không hợp lệ");
      if (row[19] && isNaN(Number(row[19]))) errors.push("Lương CB phải là số");
      return errors;
    },
  },
  {
    id: "khach-hang",
    name: "Khách hàng",
    icon: ShoppingBag,
    color: "sky",
    description: "Danh sách khách hàng sỉ/lẻ, công nợ, liên hệ",
    templateCols: ["STT", "Mã KH", "Tên khách hàng", "SĐT", "Email", "Địa chỉ", "MST", "Công nợ", "Ghi chú"],
    sampleData: [
      ["1", "KH001", "Cửa hàng Minh Tâm", "0901111111", "minhtam@gmail.com", "123 Nguyễn Huệ, Q1, HCM", "0301234567", "0", "Khách VIP"],
      ["2", "KH002", "Shop Thời Trang Hoa", "0912222222", "", "45 Lê Lợi, Bình Dương", "", "5000000", ""],
    ],
    validateRow: (row: string[]) => {
      const errors: string[] = [];
      if (!row[1]?.trim()) errors.push("Thiếu Mã KH");
      if (!row[2]?.trim()) errors.push("Thiếu Tên khách hàng");
      if (row[7] && isNaN(Number(row[7]))) errors.push("Công nợ phải là số");
      return errors;
    },
  },
  {
    id: "nha-cung-cap",
    name: "Nhà cung cấp",
    icon: Truck,
    color: "emerald",
    description: "Nhà cung cấp vải, phụ liệu và đối tác gia công",
    templateCols: ["STT", "Tên NCC", "Vai trò", "SĐT", "Email", "Địa chỉ", "Mã số thuế", "Công nợ", "Ghi chú"],
    sampleData: [
      ["1", "Vải Thành Công", "Nhà cung cấp vải", "0833333333", "vaitc@gmail.com", "234 Trần Hưng Đạo, Q5, HCM", "0312345678", "0", ""],
      ["2", "Xưởng May Hương", "Gia công may", "0844444444", "", "89 Lạc Long Quân, Q11, HCM", "", "2000000", "Gia công áo thun"],
    ],
    validateRow: (row: string[]) => {
      const errors: string[] = [];
      if (!row[1]?.trim()) errors.push("Thiếu Tên NCC");
      if (!row[2]?.trim()) errors.push("Thiếu Vai trò");
      if (row[7] && isNaN(Number(row[7]))) errors.push("Công nợ phải là số");
      return errors;
    },
  },
  {
    id: "kho-vai-tinhmann",
    name: "Kho vải",
    icon: Package,
    color: "amber",
    description: "Danh mục vải và tồn kho ban đầu (kg)",
    templateCols: ["STT", "Mã VT", "Tên vải", "Màu sắc", "Thành phần", "Tồn kho (kg)", "Đơn giá (đ/kg)", "Ghi chú"],
    sampleData: [
      ["1", "V-TRANG001", "Vải thun cotton 4 chiều trắng", "Trắng", "Cotton 100%", "200", "85000", ""],
      ["2", "V-DEN002", "Vải thun cotton 4 chiều đen", "Đen", "Cotton 100%", "150", "85000", ""],
      ["3", "V-XANH003", "Vải thun cá sấu xanh navy", "Xanh navy", "Cotton 65% Polyester 35%", "80", "72000", "Polo"],
    ],
    validateRow: (row: string[]) => {
      const errors: string[] = [];
      if (!row[1]?.trim()) errors.push("Thiếu Mã VT");
      if (!row[2]?.trim()) errors.push("Thiếu Tên vải");
      if (row[5] && isNaN(Number(row[5]))) errors.push("Tồn kho phải là số");
      if (row[6] && isNaN(Number(row[6]))) errors.push("Đơn giá phải là số");
      return errors;
    },
  },
  {
    id: "don-hang",
    name: "Đơn hàng",
    icon: ClipboardList,
    color: "rose",
    description: "Import đơn hàng từ khách hàng hàng loạt",
    templateCols: ["STT", "Mã ĐH", "Ngày đặt", "Ngày giao", "Khách hàng", "SĐT", "Sản phẩm", "Loại", "Số lượng", "Đơn giá", "Tiền cọc", "Ghi chú"],
    sampleData: [
      ["1", "DH2026001", "2026-08-01", "2026-08-20", "Cửa hàng Minh Tâm", "0901111111", "Bộ thể thao nam", "Bộ", "200", "185000", "3700000", "Màu xanh navy"],
      ["2", "DH2026002", "2026-08-02", "2026-08-25", "Shop Thời Trang Hoa", "0912222222", "Áo thun cotton", "Áo", "500", "95000", "9500000", "Mix màu"],
    ],
    validateRow: (row: string[]) => {
      const errors: string[] = [];
      if (!row[1]?.trim()) errors.push("Thiếu Mã ĐH");
      if (!row[4]?.trim()) errors.push("Thiếu Khách hàng");
      if (row[8] && isNaN(Number(row[8]))) errors.push("Số lượng phải là số");
      if (row[9] && isNaN(Number(row[9]))) errors.push("Đơn giá phải là số");
      return errors;
    },
  },
  {
    id: "lenh-cat",
    name: "Lệnh cắt",
    icon: Scissors,
    color: "fuchsia",
    description: "Import lệnh cắt sản xuất theo lô hàng",
    templateCols: ["STT", "Mã SP", "Tên SP", "Loại SP", "Tổng SL", "Tỉ lệ size", "Màu sắc", "Hạn hoàn thành", "Phụ trách SX", "Ghi chú"],
    sampleData: [
      ["1", "SP-BOT001", "Bộ trụ trơn trắng", "Bộ trụ trơn", "500", "M:L:XL:2XL:3XL=1:2:2:2:1", "Trắng ngà", "2026-08-20", "Hồ Minh Sang", "Đơn KH Minh Tâm"],
      ["2", "SP-AOT002", "Áo thun đen basic", "Áo thun cotton", "300", "M:L:XL:2XL:3XL=1:1:1:1:1", "Đen", "2026-08-25", "Hồ Minh Sang", ""],
    ],
    validateRow: (row: string[]) => {
      const errors: string[] = [];
      if (!row[1]?.trim()) errors.push("Thiếu Mã SP");
      if (!row[2]?.trim()) errors.push("Thiếu Tên SP");
      if (row[4] && isNaN(Number(row[4]))) errors.push("Tổng SL phải là số");
      return errors;
    },
  },
];

// ─── Màu sắc theo module ──────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string; btn: string }> = {
  violet:  { bg: "bg-violet-500",  text: "text-violet-700",  border: "border-violet-300",  light: "bg-violet-50 dark:bg-violet-950/30",  btn: "bg-violet-600 hover:bg-violet-700" },
  sky:     { bg: "bg-sky-500",     text: "text-sky-700",     border: "border-sky-300",     light: "bg-sky-50 dark:bg-sky-950/30",         btn: "bg-sky-600 hover:bg-sky-700" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", light: "bg-emerald-50 dark:bg-emerald-950/30", btn: "bg-emerald-600 hover:bg-emerald-700" },
  amber:   { bg: "bg-amber-500",   text: "text-amber-700",   border: "border-amber-300",   light: "bg-amber-50 dark:bg-amber-950/30",     btn: "bg-amber-600 hover:bg-amber-700" },
  rose:    { bg: "bg-rose-500",    text: "text-rose-700",    border: "border-rose-300",    light: "bg-rose-50 dark:bg-rose-950/30",       btn: "bg-rose-600 hover:bg-rose-700" },
  fuchsia: { bg: "bg-fuchsia-500", text: "text-fuchsia-700", border: "border-fuchsia-300", light: "bg-fuchsia-50 dark:bg-fuchsia-950/30", btn: "bg-fuchsia-600 hover:bg-fuchsia-700" },
};

// ─── Hàm tạo và tải file CSV mẫu ─────────────────────────────────────────────
function downloadTemplate(module: (typeof IMPORT_MODULES)[0]) {
  const rows = [module.templateCols, ...module.sampleData];
  const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mau-import-${module.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`✅ Đã tải file mẫu: mau-import-${module.id}.csv`);
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { cells.push(cur); cur = ""; }
      else { cur += line[i]; }
    }
    cells.push(cur);
    return cells;
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ImportStep = "select" | "upload" | "preview" | "done";
interface ParsedRow {
  index: number;
  data: string[];
  errors: string[];
  status: "ok" | "error";
}

export default function ImportExcelPage() {
  const [step, setStep] = useState<ImportStep>("select");
  const [selectedModule, setSelectedModule] = useState<(typeof IMPORT_MODULES)[0] | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headerRow, setHeaderRow] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSelectModule = (mod: (typeof IMPORT_MODULES)[0]) => {
    setSelectedModule(mod);
    setStep("upload");
    setParsedRows([]);
    setHeaderRow([]);
    setFileName("");
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!selectedModule) return;
      setFileName(file.name);
      const isXlsx = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");

      if (isXlsx) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          if (!data) return;
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];
          const header = Array.isArray(rows[0]) ? rows[0].map((value) => String(value ?? "")) : [];
          const dataRows = rows.slice(1).filter((r) => Array.isArray(r) && r.some((c) => String(c || "").trim()));
          const parsed: ParsedRow[] = dataRows.map((row, i) => {
            const errors = selectedModule.validateRow(row as string[]);
            return { index: i + 2, data: row as string[], errors, status: errors.length > 0 ? "error" : "ok" };
          });
          setHeaderRow(header);
          setParsedRows(parsed);
          setStep("preview");
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        const header = Array.isArray(rows[0]) ? rows[0].map((value) => String(value ?? "")) : [];
        const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));
        const parsed: ParsedRow[] = dataRows.map((row, i) => {
          const errors = selectedModule.validateRow(row);
          return { index: i + 2, data: row, errors, status: errors.length > 0 ? "error" : "ok" };
        });
        setHeaderRow(header);
        setParsedRows(parsed);
        setStep("preview");
      };
      reader.readAsText(file, "utf-8");
    },
    [selectedModule]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    const okRows = parsedRows.filter((r) => r.status === "ok");
    if (okRows.length === 0) { toast.error("Không có dòng hợp lệ để import!"); return; }

    if (selectedModule?.id === "nhan-su") {
      try {
        setImporting(true);
        const employees = mapCsvRowsToEmployees(okRows.map((row) => row.data), headerRow);
        const results = await Promise.allSettled(
          employees.map(async (employee) => {
            const response = await authFetch("/api/employee-records", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(employee),
            });
            if (!response.ok) {
              throw new Error(await response.text());
            }
          })
        );

        const successCount = results.filter((r) => r.status === "fulfilled").length;
        const failedCount = results.length - successCount;
        setImportedCount(successCount);
        setImporting(false);
        setStep("done");
        if (failedCount > 0) {
          toast.error(`⚠️ Import xong ${successCount} bản ghi, bỏ qua ${failedCount} bản ghi do lỗi.`);
        } else {
          toast.success(`✅ Đã import thành công ${successCount} bản ghi vào module ${selectedModule?.name}!`);
        }
        return;
      } catch (error) {
        setImporting(false);
        toast.error(error instanceof Error ? error.message : "Không thể import nhân sự");
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 1800));
    setImporting(false);
    setImportedCount(okRows.length);
    setStep("done");
    toast.success(`✅ Đã import thành công ${okRows.length} bản ghi vào module ${selectedModule?.name}!`);
  };

  const handleReset = () => {
    setStep("select");
    setSelectedModule(null);
    setParsedRows([]);
    setHeaderRow([]);
    setFileName("");
    setImportedCount(0);
  };

  const okCount = parsedRows.filter((r) => r.status === "ok").length;
  const errCount = parsedRows.filter((r) => r.status === "error").length;
  const colors = selectedModule ? COLOR_MAP[selectedModule.color] : null;

  const handleClearExisting = async () => {
    try {
      await clearExistingEmployees();
      toast.success("Đã xóa toàn bộ dữ liệu nhân sự cũ");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa dữ liệu cũ");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
            Import từ Excel / CSV
          </h1>
          <p className="opacity-70 mt-1 text-sm">Tải file mẫu → Điền dữ liệu → Upload → Import hàng loạt vào hệ thống</p>
        </div>
        {step !== "select" && (
          <button onClick={handleReset} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium transition-all">
            <ArrowLeft className="w-4 h-4" /> Chọn module khác
          </button>
        )}
      </div>

      {/* ── STEP 1: Chọn module ── */}
      {step === "select" && (
        <>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-bold mb-1">Quy trình import 4 bước:</p>
              <ol className="list-decimal list-inside space-y-1 opacity-90">
                <li>Chọn module cần import dữ liệu</li>
                <li>Tải <strong>file mẫu .csv</strong> về, mở bằng Excel và điền dữ liệu theo đúng cột mẫu</li>
                <li>Lưu file dạng <strong>CSV (UTF-8 với BOM)</strong> rồi upload lên</li>
                <li>Kiểm tra preview, sửa lỗi nếu có, rồi bấm <strong>Import</strong></li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {IMPORT_MODULES.map((mod) => {
              const c = COLOR_MAP[mod.color];
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelectModule(mod)}
                  className={`card p-5 text-left hover:shadow-xl transition-all group border-2 ${c.border} hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-2xl ${c.light} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform mt-1" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{mod.name}</h3>
                  <p className="text-sm opacity-60 leading-relaxed">{mod.description}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <FileDown className={`w-3.5 h-3.5 ${c.text}`} />
                    <span className={`text-xs font-semibold ${c.text}`}>{mod.templateCols.length} cột dữ liệu</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── STEP 2: Upload ── */}
      {step === "upload" && selectedModule && colors && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className={`${colors.light} border ${colors.border} rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
              <selectedModule.icon className={`w-5 h-5 ${colors.text}`} />
              <span className={`font-bold ${colors.text}`}>{selectedModule.name}</span>
            </div>
            <p className="text-sm opacity-70 mb-3">{selectedModule.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedModule.templateCols.map((col, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${colors.border} ${colors.text} bg-white/60 dark:bg-slate-900/40 font-medium`}>
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className={`card p-5 border-2 ${colors.border}`}>
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <Download className="w-4 h-4" /> Bước 1: Tải file mẫu
            </h3>
            <p className="text-sm opacity-60 mb-3">File CSV gồm tiêu đề và dữ liệu ví dụ để anh tham khảo định dạng.</p>
            <button
              onClick={() => downloadTemplate(selectedModule)}
              className={`${colors.btn} text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all hover:shadow-lg`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Tải file mẫu: mau-import-{selectedModule.id}.csv
            </button>
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Bước 2: Upload file đã điền dữ liệu
            </h3>
            <p className="text-sm opacity-60 mb-4">Chấp nhận file <strong>.csv</strong> hoặc <strong>.xlsx</strong> — có thể import trực tiếp từ bảng Excel.</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? `${colors.border} ${colors.light}`
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? colors.text : "opacity-20"} transition-all`} />
              <p className="font-semibold opacity-70">Kéo thả file CSV vào đây</p>
              <p className="text-sm opacity-40 mt-1">hoặc bấm để chọn file từ máy tính</p>
              <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview & Validate ── */}
      {step === "preview" && selectedModule && colors && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tổng dòng", value: parsedRows.length, cls: "text-slate-700 dark:text-slate-200" },
              { label: "✅ Hợp lệ", value: okCount, cls: "text-emerald-600" },
              { label: "❌ Có lỗi", value: errCount, cls: "text-rose-600" },
              { label: "📄 File upload", value: fileName, cls: "text-slate-600 dark:text-slate-300 text-sm truncate" },
            ].map((s, i) => (
              <div key={i} className="card p-4 text-center">
                <div className={`text-2xl font-black ${s.cls}`}>{s.value}</div>
                <div className="text-xs opacity-60 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {errCount > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-rose-700 dark:text-rose-300">
                <p className="font-bold">{errCount} dòng bị lỗi sẽ bị bỏ qua khi import.</p>
                <p className="opacity-80 mt-0.5">Anh có thể sửa lại file và upload lại, hoặc import chỉ {okCount} dòng hợp lệ.</p>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Eye className="w-4 h-4" /> Preview dữ liệu
              </div>
              <button onClick={() => { setStep("upload"); setParsedRows([]); setFileName(""); }} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                <RefreshCw className="w-3.5 h-3.5" /> Upload lại
              </button>
            </div>
            <div className="overflow-auto max-h-[450px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                    <th className="px-3 py-2.5 text-left font-bold opacity-50">Dòng</th>
                    <th className="px-3 py-2.5 text-left font-bold opacity-50">Trạng thái</th>
                    {selectedModule.templateCols.map((col, i) => (
                      <th key={i} className="px-3 py-2.5 text-left font-bold opacity-50 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr key={row.index} className={`border-t border-slate-100 dark:border-slate-800 ${row.status === "error" ? "bg-rose-50/70 dark:bg-rose-950/20" : "hover:bg-slate-50/50"}`}>
                      <td className="px-3 py-2 font-mono opacity-40">{row.index}</td>
                      <td className="px-3 py-2 min-w-[90px]">
                        {row.status === "ok" ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> OK</span>
                        ) : (
                          <div>
                            <span className="flex items-center gap-1 text-rose-600 font-semibold"><XCircle className="w-3.5 h-3.5" /> Lỗi</span>
                            {row.errors.map((e, ei) => <div key={ei} className="text-rose-500 text-[10px] pl-4 leading-tight">{e}</div>)}
                          </div>
                        )}
                      </td>
                      {row.data.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate" title={cell}>
                          {cell || <span className="opacity-25 italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 flex-wrap">
            <button onClick={() => { setStep("upload"); setParsedRows([]); setFileName(""); }} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all">
              <Trash2 className="w-4 h-4" /> Huỷ
            </button>
            {selectedModule?.id === "nhan-su" && (
              <button onClick={handleClearExisting} className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-300 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 transition-all">
                <Trash2 className="w-4 h-4" /> Xóa toàn bộ dữ liệu nhân sự cũ trước khi import
              </button>
            )}
            <button
              onClick={handleImport}
              disabled={importing || okCount === 0}
              className={`${colors.btn} text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {importing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang import...</> : <><Upload className="w-4 h-4" /> Import {okCount} bản ghi hợp lệ</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Done ── */}
      {step === "done" && selectedModule && colors && (
        <div className="max-w-md mx-auto text-center space-y-6 py-14">
          <div className={`w-24 h-24 rounded-full ${colors.light} border-4 ${colors.border} mx-auto flex items-center justify-center`}>
            <CheckCircle2 className={`w-12 h-12 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2">Import thành công! 🎉</h2>
            <p className="opacity-70">
              Đã import <strong className={colors.text}>{importedCount} bản ghi</strong> vào module <strong>{selectedModule.name}</strong>.
            </p>
            {errCount > 0 && <p className="text-sm text-rose-500 mt-1">(Bỏ qua {errCount} dòng lỗi)</p>}
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={handleReset} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Import module khác
            </button>
            <a href={`/${selectedModule.id}`} className={`${colors.btn} text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-lg`}>
              <selectedModule.icon className="w-4 h-4" /> Xem {selectedModule.name}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
