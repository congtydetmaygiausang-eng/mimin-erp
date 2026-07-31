"use client";

import { useState } from "react";
import { Clipboard, Upload, Loader2, CheckCircle2, AlertCircle, Database, FileText } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { logAudit } from "@/lib/audit-log";

const STORAGE_KEY = "mimin_lark_sheet_import";

interface SheetRow {
  maPhieu?: string;
  lenhSX?: string;
  maSP?: string;
  tenSP?: string;
  khau?: string;
  phanLoai?: string;
  mau?: string;
  size?: string;
  slGiao?: number;
  slNhan?: number;
  slDat?: number;
  slLoi?: number;
  donGia?: number;
  thanhTien?: number;
  nguoiNhan?: string;
  trangThai?: string;
  ghiChu?: string;
}

export default function LarkSheetImportPage() {
  const { user } = useSession();
  const [pasted, setPasted] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [imported, setImported] = useState(0);
  const [parsing, setParsing] = useState(false);

  const parseData = () => {
    setParsing(true);
    try {
      // Try TSV (tab-separated) hoặc CSV
      const lines = pasted.trim().split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("Cần ít nhất 2 dòng (1 header + 1 data)");
        return;
      }

      // Detect separator
      const firstLine = lines[0];
      const sep = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

      // Parse header
      const headerRaw = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      console.log("Headers:", headerRaw);

      // Map common Vietnamese headers → field names
      const headerMap: Record<string, string> = {
        "mã_phiếu": "maPhieu",
        "ma_phieu": "maPhieu",
        "phiếu": "maPhieu",
        "mã_lệnh_sx": "lenhSX",
        "ma_lenh_sx": "lenhSX",
        "lenh_sx": "lenhSX",
        "lsx": "lenhSX",
        "lệnh_sx": "lenhSX",
        "mã_sp": "maSP",
        "ma_sp": "maSP",
        "mã_sản_phẩm": "maSP",
        "ma_san_pham": "maSP",
        "sản_phẩm": "tenSP",
        "san_pham": "tenSP",
        "tên_sp": "tenSP",
        "khâu": "khau",
        "khau": "khau",
        "loại_sp": "phanLoai",
        "loai_sp": "phanLoai",
        "phân_loại": "phanLoai",
        "màu": "mau",
        "mau": "mau",
        "size": "size",
        "sl_giao": "slGiao",
        "số_lượng_giao": "slGiao",
        "sl_nhận": "slNhan",
        "sl_nhan": "slNhan",
        "số_lượng_nhận": "slNhan",
        "sl_đạt": "slDat",
        "sl_dat": "slDat",
        "số_lượng_đạt": "slDat",
        "sl_lỗi": "slLoi",
        "sl_loi": "slLoi",
        "số_lượng_lỗi": "slLoi",
        "đơn_giá": "donGia",
        "don_gia": "donGia",
        "thành_tiền": "thanhTien",
        "thanh_tien": "thanhTien",
        "người_nhận": "nguoiNhan",
        "nguoi_nhan": "nguoiNhan",
        "trạng_thái": "trangThai",
        "trang_thai": "trangThai",
        "ghi_chú": "ghiChu",
        "ghi_chu": "ghiChu",
      };

      const headers = headerRaw.map((h) => headerMap[h] || h);

      // Parse rows
      const parsed: SheetRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep);
        if (cols.length < 2) continue;
        const row: SheetRow = {};
        for (let j = 0; j < headers.length; j++) {
          const val = (cols[j] || "").trim();
          const field = headers[j] as keyof SheetRow;
          if (["slGiao", "slNhan", "slDat", "slLoi", "donGia", "thanhTien"].includes(field)) {
            (row as any)[field] = parseInt(val.replace(/[^\d-]/g, "")) || 0;
          } else {
            (row as any)[field] = val;
          }
        }
        parsed.push(row);
      }

      setRows(parsed);
      toast.success(`Đã parse ${parsed.length} dòng`);
      logAudit({
        user, action: "create", module: "lark-sync" as any,
        description: `Import ${parsed.length} dòng từ Lark Sheet`, success: true,
      });
    } catch (e: any) {
      toast.error("Lỗi parse: " + e.message);
    } finally {
      setParsing(false);
    }
  };

  const saveToLocal = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    setImported(rows.length);
    toast.success(`✅ Đã lưu ${rows.length} dòng vào localStorage`);
    logAudit({
      user, action: "create", module: "lark-sync" as any,
      description: `Lưu ${rows.length} dòng Sheet vào localStorage`, success: true,
    });
  };

  const loadSample = () => {
    const sample = `Mã phiếu\tMã lệnh SX\tMã SP\tKhâu\tLoại SP\tMàu\tSize\tSL giao\tSL nhận\tSL đạt\tSL lỗi\tĐơn giá\tThành tiền\tNgười nhận\tTrạng thái\tGhi chú
INTD_001\tLSX-2026-001\tM758\tIn/Thêu/Dập\tBộ trụ trơn\tTrắng ngà\tL/XL/2XL\t500\t500\t498\t2\t0\t0\tBảo Ngân (ngoài)\tHoàn thành\tIn logo + dập chữ
CAT_001\tLSX-2026-001\tM758\tCắt\tBộ trụ trơn\tTrắng ngà\tL/XL/2XL\t500\t500\t498\t2\t1400\t697200\tNV006 Giang\tHoàn thành\tCắt áo trụ 1400đ
UI_001\tLSX-2026-001\tM758\tỦi\tÁo trụ\tTrắng ngà\tL/XL/2XL\t500\t0\t0\t0\t800\t0\tNV011 Tuyền\tChờ giao\tỦi áo trụ
DG_001\tLSX-2026-001\tM758\tGấp xếp\tBộ trắng\tTrắng ngà\tL/XL/2XL\t500\t0\t0\t0\t1500\t0\tNV009 Mỹ Nhi\tChờ gấp\tGấp bộ trắng`;
    setPasted(sample);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7 text-emerald-500" /> Import từ Lark Sheet
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Sheet: <code className="text-xs">Wk2MsKdy4hMTCDttAkijTbHmpjc?sheet=2YoBGM</code> - 
          Copy data từ Sheet rồi paste vào đây (hỗ trợ TSV, CSV, Excel paste)
        </p>
      </div>

      <div className="card p-4 bg-amber-500/10 border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-700">Vì sao cần paste?</div>
            <div className="opacity-80 mt-1">
              App MIMIN ERP chưa có scope <code className="text-xs">sheets:spreadsheet:read</code>. 
              A copy vùng data từ Lark Sheet (Ctrl+A → Ctrl+C) rồi paste vào ô bên dưới. 
              Hỗ trợ: TSV (Excel paste), CSV, dấu chấm phẩy.
            </div>
            <div className="mt-2 text-xs opacity-70">
              Header mẫu: <code>Mã phiếu | Mã lệnh SX | Mã SP | Khâu | Loại SP | Màu | Size | SL giao | SL nhận | SL đạt | SL lỗi | Đơn giá | Thành tiền | Người nhận | Trạng thái | Ghi chú</code>
            </div>
          </div>
        </div>
      </div>

      {/* Paste area */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Clipboard className="w-4 h-4" /> Paste data từ Lark Sheet
          </h3>
          <button onClick={loadSample} className="text-xs text-blue-500 underline">
            Load dữ liệu mẫu
          </button>
        </div>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Dán dữ liệu từ Lark Sheet vào đây (Ctrl+V)..."
          className="w-full h-48 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={parseData}
            disabled={parsing || !pasted.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Parse ({pasted.split("\n").filter((l) => l.trim()).length - 1} dòng)
          </button>
          {rows.length > 0 && (
            <button onClick={saveToLocal} className="btn-secondary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Lưu vào localStorage ({rows.length} dòng)
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">📋 Preview ({rows.length} dòng)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Mã phiếu</th>
                  <th className="p-2 text-left">LSX</th>
                  <th className="p-2 text-left">Mã SP</th>
                  <th className="p-2 text-left">Khâu</th>
                  <th className="p-2 text-right">Giao</th>
                  <th className="p-2 text-right">Nhận</th>
                  <th className="p-2 text-right">Đạt</th>
                  <th className="p-2 text-right">Lỗi</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Tiền</th>
                  <th className="p-2 text-left">Người nhận</th>
                  <th className="p-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2 font-mono">{r.maPhieu}</td>
                    <td className="p-2 font-mono">{r.lenhSX}</td>
                    <td className="p-2 font-mono">{r.maSP}</td>
                    <td className="p-2">{r.khau}</td>
                    <td className="p-2 text-right">{r.slGiao}</td>
                    <td className="p-2 text-right">{r.slNhan}</td>
                    <td className="p-2 text-right text-emerald-600 font-bold">{r.slDat}</td>
                    <td className="p-2 text-right text-rose-600">{r.slLoi}</td>
                    <td className="p-2 text-right">{(r.donGia || 0).toLocaleString()}</td>
                    <td className="p-2 text-right font-semibold">{((r.thanhTien || 0)).toLocaleString()}</td>
                    <td className="p-2 truncate max-w-[150px]">{r.nguoiNhan}</td>
                    <td className="p-2">{r.trangThai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <div className="text-center py-2 text-xs opacity-60">
                ... và {rows.length - 20} dòng nữa
              </div>
            )}
          </div>
          <div className="mt-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/20 text-sm">
            <div className="font-semibold text-emerald-700">📊 Tổng kết:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
              <div>Tổng dòng: <b>{rows.length}</b></div>
              <div>Tổng giao: <b>{rows.reduce((s, r) => s + (r.slGiao || 0), 0).toLocaleString()}</b></div>
              <div>Tổng đạt: <b className="text-emerald-600">{rows.reduce((s, r) => s + (r.slDat || 0), 0).toLocaleString()}</b></div>
              <div>Tổng tiền: <b className="text-violet-600">{rows.reduce((s, r) => s + (r.thanhTien || 0), 0).toLocaleString()}đ</b></div>
            </div>
          </div>
        </div>
      )}

      {imported > 0 && (
        <div className="card p-4 bg-emerald-500/10 border-emerald-500/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="font-semibold text-emerald-700">Đã lưu {imported} dòng vào localStorage</div>
              <div className="text-xs opacity-70">Có thể xem ở các trang Workflow / Tổng hợp / Test Data Thật</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
