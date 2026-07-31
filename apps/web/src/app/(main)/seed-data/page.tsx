"use client";
import { useState, useEffect } from "react";
import {
  Database, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Play, Trash2,
  Users, Package, Scissors, Hammer, Brush, Tag, Sparkles as Iron, Box,
  TrendingUp, Clock, Wallet, ArrowRight, FileText, Download, Upload,
  Layers, ChevronRight,
} from "lucide-react";
import { CONG_NHAN_13, MODULE_SX_INFO, type ModuleSX } from "@/lib/congnhan-13";
import { KH_SI_FULL, NCC_FULL, XUONG_GIA_CONG } from "@/lib/master-data-full";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";

const STORAGE_KEYS = {
  PHIEU: "polomimin_phieu_workflow_v1",
  NHAN_VIEN: "polomimin_nhan_vien_v1",
  NCC: "polomimin_ncc_v1",
  KH: "polomimin_kh_v1",
  XUONG: "polomimin_xuong_v1",
  KHO: "polomimin_kho_v1",
  CONG_NO: "polomimin_cong_no_v1",
  LSX_TONG: "polomimin_lsx_tong_v1",
  SEED_DONE: "polomimin_seed_done_v1",
};

const MODULE_ICONS = {
  cat: Scissors,
  "khuy-nut": Tag,
  ui: Iron,
  "dong-goi": Box,
  intd: Brush,
  may: Hammer,
};

export default function SeedDataPage() {
  const [seedDone, setSeedDone] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEYS.SEED_DONE);
      if (done) setSeedDone(JSON.parse(done));
    } catch {}
  }, []);

  const addLog = (msg: string) => {
    setLogs((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 20));
  };

  const clearAll = () => {
    if (!confirm("⚠️ Xóa TẤT CẢ data localStorage? Bao gồm: phiếu workflow, NV, NCC, KH, kho, công nợ, LSX?")) return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setSeedDone(null);
    setLogs([]);
    addLog("✅ Đã xóa tất cả localStorage");
  };

  const prepareRealDataEntry = () => {
    if (!confirm("🧹 Anh có muốn XÓA SẠCH Lệnh cắt & Sản lượng mẫu để BẮT ĐẦU NHẬP LIỆU THỰC TẾ?\n\n✅ SẼ GIỮ NGUYÊN 100%: Kho Vải, Bo Phụ liệu, Danh sách Nhân sự & Đối tác Gia công.")) return;
    localStorage.removeItem(STORAGE_KEYS.PHIEU);
    localStorage.removeItem(STORAGE_KEYS.LSX_TONG);
    localStorage.removeItem(STORAGE_KEYS.CONG_NO);
    localStorage.removeItem("mimin_hoan_thien_v1");
    localStorage.removeItem("mimin_qc_v1");
    localStorage.removeItem("mimin_doi_soat_v1");
    localStorage.removeItem("KHO_THANH_PHAM");
    setLogs([]);
    addLog("✅ ĐÃ CHUẨN BỊ SẴN SÀNG: Đã dọn sạch dữ liệu sản xuất mẫu! Đã giữ nguyên Kho vải, Bo phụ liệu, Nhân sự & Xưởng gia công.");
  };

  const runSeed = () => {
    setLogs([]);
    addLog("🚀 Bắt đầu seed data...");
    let count = 0;

    // 1. Seed 32 phiếu workflow (ALL_REAL_PHIEU)
    const phieu = ALL_REAL_PHIEU.map((p) => ({
      id: p.id, lsx: p.lenhSX, lsxCode: p.lenhSX, lenhCat: p.lenhCat, maSP: p.maSP,
      phanLoai: p.phanLoai, kieuMay: p.kieuMay, mau: p.mau, size: p.size,
      soLuongGiao: p.soLuongGiao, soLuongNhan: p.soLuongNhan, soLuongDat: p.soLuongDat,
      soLuongLoi: p.soLuongLoi, soLuongThieu: p.soLuongThieu, soLuongSua: p.soLuongSua,
      nguoiGiao: p.nguoiGiao, nguoiNhan: p.nguoiNhan, tenNguoiNhan: p.tenNguoiNhan,
      ngayGiao: p.ngayGiao, ngayNhan: p.ngayNhan, ngayHoanThanh: p.ngayHoanThanh,
      hanHoanThanh: p.hanHoanThanh, donGia: p.donGia, thanhTien: p.thanhTien,
      daThanhToan: p.daThanhToan, conNo: p.conNo, trangThai: p.trangThai,
      mauDaDuyet: p.mauDaDuyet, nguoiXacNhan: p.nguoiXacNhan, ghiChu: p.ghiChu,
    }));
    localStorage.setItem(STORAGE_KEYS.PHIEU, JSON.stringify(phieu));
    addLog(`✅ Seed ${phieu.length} phiếu workflow (6 LSX × 6 khâu)`);
    count += phieu.length;

    // 2. Seed 13 CN
    const cn = CONG_NHAN_13.map((c) => ({
      maNV: c.maNV, name: c.name, email: c.email, sdt: c.sdt, chucVu: c.chucVu,
      module: c.module, donGia: c.donGia, donVi: c.donVi, phongBan: c.phongBan,
    }));
    localStorage.setItem(STORAGE_KEYS.NHAN_VIEN, JSON.stringify(cn));
    addLog(`✅ Seed ${cn.length} công nhân (3 Cắt + 2 KN + 4 Ủi + 4 ĐG)`);
    count += cn.length;

    // 3. Seed 16 NCC
    localStorage.setItem(STORAGE_KEYS.NCC, JSON.stringify(NCC_FULL));
    addLog(`✅ Seed ${NCC_FULL.length} nhà cung cấp`);
    count += NCC_FULL.length;

    // 4. Seed 12 KH sỉ
    localStorage.setItem(STORAGE_KEYS.KH, JSON.stringify(KH_SI_FULL));
    addLog(`✅ Seed ${KH_SI_FULL.length} khách hàng sỉ`);
    count += KH_SI_FULL.length;

    // 5. Seed 5 xưởng
    localStorage.setItem(STORAGE_KEYS.XUONG, JSON.stringify(XUONG_GIA_CONG));
    addLog(`✅ Seed ${XUONG_GIA_CONG.length} xưởng gia công`);
    count += XUONG_GIA_CONG.length;

    // 6. Seed 5 SKU kho
    const kho = [
      { sku: "VAI-COTTON-TRANG", ten: "Vải cotton trắng",   sl: 1200, donVi: "m",     tonThap: 500,  ngayNhap: "2026-07-25" },
      { sku: "VAI-POLO-XANH",    ten: "Vải polo xanh navy", sl: 350,  donVi: "m",     tonThap: 500,  ngayNhap: "2026-07-20" },
      { sku: "NUT-15MM",         ten: "Nút 15mm đen",        sl: 850,  donVi: "cái",   tonThap: 1000, ngayNhap: "2026-07-22" },
      { sku: "CHI-POLY",         ten: "Chỉ polyester",       sl: 45,   donVi: "cuộn",  tonThap: 20,   ngayNhap: "2026-07-15" },
      { sku: "TUI-PVC",          ten: "Túi PVC đóng gói",    sl: 2500, donVi: "cái",   tonThap: 500,  ngayNhap: "2026-07-28" },
    ];
    localStorage.setItem(STORAGE_KEYS.KHO, JSON.stringify(kho));
    addLog(`✅ Seed ${kho.length} SKU kho vải + phụ liệu`);
    count += kho.length;

    // 7. Seed 4 công nợ
    const congNo = [
      { id: "CN001", kh: "Shop Mẹ Bé Xinh",     no: 45000000, han: "2026-08-15", status: "chua-thu" },
      { id: "CN002", kh: "Đại lý Thanh Hà",     no: 12300000, han: "2026-08-05", status: "chua-thu" },
      { id: "CN003", kh: "Shop Áo Thun Sỉ HN",   no: 8900000,  han: "2026-08-20", status: "da-thu-1-phan" },
      { id: "CN004", kh: "Đại lý Miền Tây",     no: 23400000, han: "2026-08-10", status: "chua-thu" },
    ];
    localStorage.setItem(STORAGE_KEYS.CONG_NO, JSON.stringify(congNo));
    addLog(`✅ Seed ${congNo.length} công nợ khách hàng`);
    count += congNo.length;

    // 8. Seed 6 LSX
    const lsx = [
      { id: "LSX-2026-001", maSP: "M758", tenSP: "Bộ trụ trơn",      soLuong: 500,  status: "dang-sx" },
      { id: "LSX-2026-002", maSP: "M873", tenSP: "Áo thun cotton",   soLuong: 1500, status: "dang-sx" },
      { id: "LSX-2026-003", maSP: "M111", tenSP: "Áo polo trắng",    soLuong: 800,  status: "hoan-thanh" },
      { id: "LSX-2026-004", maSP: "M222", tenSP: "Bộ thể thao nam",  soLuong: 1200, status: "moi" },
      { id: "LSX-2026-005", maSP: "M333", tenSP: "Áo sơ mi nữ",     soLuong: 600,  status: "moi" },
      { id: "LSX-2026-006", maSP: "M555", tenSP: "Quần kaki nam",    soLuong: 700,  status: "moi" },
    ];
    localStorage.setItem(STORAGE_KEYS.LSX_TONG, JSON.stringify(lsx));
    addLog(`✅ Seed ${lsx.length} lệnh sản xuất (M758, M873, M111, M222, M333, M555)`);
    count += lsx.length;

    // Done
    const summary = {
      timestamp: new Date().toISOString(),
      totalRecords: count,
      tables: {
        phieu_workflow: phieu.length,
        cong_nhan: cn.length,
        nha_cung_cap: NCC_FULL.length,
        khach_hang_si: KH_SI_FULL.length,
        xuong_gia_cong: XUONG_GIA_CONG.length,
        kho: kho.length,
        cong_no: congNo.length,
        lenh_sx_tong: lsx.length,
      },
    };
    localStorage.setItem(STORAGE_KEYS.SEED_DONE, JSON.stringify(summary));
    setSeedDone(summary);
    addLog(`🎉 HOÀN THÀNH! Đã seed ${count} records vào localStorage`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-3 md:p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Database className="w-3.5 h-3.5" /> MIMIN OS · Khởi tạo dữ liệu
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">🌱 Seed Data tự động</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Click <b>"Seed ngay"</b> để tạo toàn bộ data test cho hệ thống:
            <b> 6 LSX thật + 32 phiếu workflow + 13 CN + 16 NCC + 12 KH + 5 xưởng + 5 SKU + 4 CN</b>.
            Data sẽ lưu vào <b>localStorage</b> (có thể apply lên Supabase sau).
          </p>
        </div>

        {/* Action buttons */}
        <div className="card p-4 flex flex-col md:flex-row gap-3 items-center">
          <button
            onClick={prepareRealDataEntry}
            className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg shadow-teal-500/20"
          >
            <Sparkles className="w-5 h-5" /> 🧹 Dọn dẹp để BẮT ĐẦU NHẬP LIỆU THỰC TẾ (Giữ Kho & Nhân sự)
          </button>
          <button
            onClick={runSeed}
            className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Seed data mẫu
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-3 bg-rose-100 text-rose-700 rounded-xl font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa tất cả
          </button>
        </div>

        {/* Summary nếu đã seed */}
        {seedDone && (
          <div className="card p-4 bg-emerald-50 border-2 border-emerald-300">
            <h2 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5" /> Đã seed lúc {new Date(seedDone.timestamp).toLocaleString("vi-VN")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(seedDone.tables).map(([k, v]) => (
                <div key={k} className="bg-white p-2 rounded border">
                  <div className="text-[10px] text-slate-500">{k}</div>
                  <div className="text-lg font-bold text-emerald-600">{v as number}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-600">
              Tổng: <b>{seedDone.totalRecords} records</b> đã được lưu vào localStorage.
              Bây giờ a có thể vào các trang khác để test.
            </div>
          </div>
        )}

        {/* Log */}
        {logs.length > 0 && (
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Log
            </h3>
            <div className="bg-slate-900 text-emerald-300 p-3 rounded font-mono text-[11px] space-y-0.5 max-h-60 overflow-y-auto">
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        )}

        {/* Hướng dẫn tiếp */}
        <div className="card p-4 bg-blue-50 border-2 border-blue-300">
          <h3 className="font-bold text-blue-800 mb-2">📋 Sau khi seed xong, a làm tiếp:</h3>
          <ol className="space-y-1.5 text-sm text-slate-700 list-decimal pl-5">
            <li>Click <b>Seed ngay</b> → Đợi 2-3 giây → Thấy 8 bảng có data</li>
            <li>Vào <a href="/dashboard/" className="text-blue-600 underline font-semibold">/dashboard/</a> → Xem số liệu tổng quan</li>
            <li>Vào <a href="/lenh-cat/" className="text-blue-600 underline font-semibold">/lenh-cat/</a> → 6 LSX thật (M758 → M555)</li>
            <li>Vào <a href="/nhan-su/" className="text-blue-600 underline font-semibold">/nhan-su/</a> → 18 NV thật</li>
            <li>Vào <a href="/bang-luong-auto/" className="text-blue-600 underline font-semibold">/bang-luong-auto/</a> → Bảng lương 13 CN</li>
            <li>Vào <a href="/canh-bao/" className="text-blue-600 underline font-semibold">/canh-bao/</a> → Cảnh báo real-time</li>
            <li>Vào <a href="/test-kiem-thu" className="text-blue-600 underline font-semibold">/test-kiem-thu</a> → Test 30 modules</li>
            <li>Vào <a href="/backup-restore/" className="text-blue-600 underline font-semibold">/backup-restore/</a> → Backup data ra JSON</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
