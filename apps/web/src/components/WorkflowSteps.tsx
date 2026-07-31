"use client";

import { useState, useEffect } from "react";
import { Play, CheckCircle2, FileText, Package, AlertTriangle, Camera, X, Save, Cloud, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { useSession } from "@/components/session-provider";
import { tinhThanhTien, tinhConNo, type PhieuWorkflow, type TrangThaiPhieu, TRANG_THAI_COLORS } from "@/lib/workflow-data";
import { isLarkEnabled } from "@/lib/lark";
import { autoPushPhieu } from "@/lib/lark-sync-engine";

const STORAGE_KEY = "mimin_phieu_workflow_v1";

function getAllPhieu(): Record<string, PhieuWorkflow> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllPhieu(map: Record<string, PhieuWorkflow>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function WorkflowActions({ phieu, onUpdate }: { phieu: PhieuWorkflow; onUpdate: (p: PhieuWorkflow) => void }) {
  const { user } = useSession();
  const [showModal, setShowModal] = useState<null | "tiep-nhan" | "hoan-thanh" | "bao-cao">(null);

  // Init phiếu vào localStorage nếu chưa có
  useEffect(() => {
    const all = getAllPhieu();
    if (!all[phieu.id]) {
      all[phieu.id] = phieu;
      saveAllPhieu(all);
    }
  }, [phieu.id]);

  const handleTiepNhan = () => {
    const updated: PhieuWorkflow = {
      ...phieu,
      trangThai: "Đang làm",
      ngayNhan: new Date().toISOString().slice(0, 10),
    };
    const all = getAllPhieu();
    all[phieu.id] = updated;
    saveAllPhieu(all);
    onUpdate(updated);
    logAudit({ user, action: "update", module: "lenh-cat", description: `Tiếp nhận phiếu ${phieu.id}`, resourceId: phieu.id, resourceName: phieu.id, success: true });
    toast.success(`Đã tiếp nhận phiếu ${phieu.id}`);
    // Auto push lên Lark
    if (isLarkEnabled()) {
      autoPushPhieu(updated, user).then((r) => {
        if (r.status === "success") toast.success("☁️ Đã đồng bộ Lark");
        else if (r.status === "error") toast.error(`Lark sync: ${r.message}`);
        else toast.info(`Lark: ${r.message}`);
      });
    }
    setShowModal(null);
  };

  const handleHoanThanh = (data: { soLuongNhan: number; soLuongDat: number; soLuongLoi: number; soLuongThieu: number; soLuongSua?: number; ghiChu?: string }) => {
    const thanhTien = tinhThanhTien(data.soLuongDat, phieu.donGia);
    const conNo = tinhConNo(thanhTien, phieu.daThanhToan);
    const updated: PhieuWorkflow = {
      ...phieu,
      soLuongNhan: data.soLuongNhan,
      soLuongDat: data.soLuongDat,
      soLuongLoi: data.soLuongLoi,
      soLuongThieu: data.soLuongThieu,
      soLuongSua: data.soLuongSua || 0,
      trangThai: data.soLuongLoi > 0 || data.soLuongThieu > 0 ? "Lỗi" : "Hoàn thành",
      ngayHoanThanh: new Date().toISOString().slice(0, 10),
      thanhTien,
      conNo,
      ghiChu: data.ghiChu || phieu.ghiChu,
    };
    const all = getAllPhieu();
    all[phieu.id] = updated;
    saveAllPhieu(all);
    onUpdate(updated);
    logAudit({
      user,
      action: "update",
      module: "lenh-cat",
      description: `Hoàn thành ${phieu.id}: Đạt ${data.soLuongDat}, Lỗi ${data.soLuongLoi}, Thiếu ${data.soLuongThieu}`,
      resourceId: phieu.id,
      resourceName: phieu.id,
      newValue: { soLuongDat: data.soLuongDat, soLuongLoi: data.soLuongLoi, thanhTien },
      success: true,
    });
    toast.success(`Đã hoàn thành ${phieu.id} - Thành tiền: ${thanhTien.toLocaleString("vi-VN")}đ`);
    // Auto push lên Lark
    if (isLarkEnabled()) {
      autoPushPhieu(updated, user).then((r) => {
        if (r.status === "success") toast.success("☁️ Đã đồng bộ Lark");
        else if (r.status === "error") toast.error(`Lark sync: ${r.message}`);
        else toast.info(`Lark: ${r.message}`);
      });
    }
    setShowModal(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {phieu.trangThai === "Chờ giao" || (phieu.trangThai as any) === "Chờ gấp" ? (
          <button
            onClick={() => setShowModal("tiep-nhan")}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Play className="w-4 h-4" /> Tiếp nhận
          </button>
        ) : null}

        {(phieu.trangThai === "Đang làm" || (phieu.trangThai as any) === "Đang may" || phieu.trangThai === "Đã nhận") ? (
          <button
            onClick={() => setShowModal("hoan-thanh")}
            className="btn-primary flex items-center gap-1.5 text-sm bg-emerald-500 hover:bg-emerald-600"
          >
            <CheckCircle2 className="w-4 h-4" /> Hoàn thành
          </button>
        ) : null}

        <button
          onClick={() => setShowModal("bao-cao")}
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <FileText className="w-4 h-4" /> Báo cáo
        </button>

        <span className={`px-2 py-1.5 rounded text-xs font-medium ${TRANG_THAI_COLORS[phieu.trangThai as keyof typeof TRANG_THAI_COLORS] || "bg-slate-500/15 text-slate-700"}`}>
          {phieu.trangThai}
        </span>
      </div>

      {showModal === "tiep-nhan" && (
        <TiepNhanModal phieu={phieu} onConfirm={handleTiepNhan} onClose={() => setShowModal(null)} />
      )}
      {showModal === "hoan-thanh" && (
        <HoanThanhModal phieu={phieu} onConfirm={handleHoanThanh} onClose={() => setShowModal(null)} />
      )}
      {showModal === "bao-cao" && (
        <BaoCaoModal phieu={phieu} onClose={() => setShowModal(null)} />
      )}
    </>
  );
}

function TiepNhanModal({ phieu, onConfirm, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-500" /> Tiếp nhận phiếu {phieu.id}
        </h3>
        <div className="space-y-2 text-sm mb-4">
          <div><b>Mã lệnh SX:</b> {phieu.lenhSX}</div>
          <div><b>Sản phẩm:</b> {phieu.maSP} - {phieu.phanLoai}</div>
          <div><b>Số lượng giao:</b> <span className="font-bold text-brand-700">{phieu.soLuongGiao}</span></div>
          <div><b>Hạn hoàn thành:</b> {phieu.hanHoanThanh}</div>
        </div>
        <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs mb-4">
          ⚠️ <b>Kiểm soát bắt buộc</b> (theo Lark chị Giàu):
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Đã có mẫu được duyệt chưa?</li>
            <li>Đã kiểm mã, màu, size chưa?</li>
            <li>Phụ liệu đi kèm đầy đủ chưa? (cổ, nút, dây kéo)</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button onClick={onConfirm} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Xác nhận tiếp nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function HoanThanhModal({ phieu, onConfirm, onClose }: any) {
  const [nhan, setNhan] = useState(phieu.soLuongNhan || phieu.soLuongGiao);
  const [dat, setDat] = useState(phieu.soLuongDat || phieu.soLuongGiao);
  const [loi, setLoi] = useState(phieu.soLuongLoi || 0);
  const [thieu, setThieu] = useState(phieu.soLuongThieu || 0);
  const [sua, setSua] = useState(phieu.soLuongSua || 0);
  const [ghiChu, setGhiChu] = useState(phieu.ghiChu || "");

  const thanhTien = tinhThanhTien(dat, phieu.donGia);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Hoàn thành {phieu.id}
        </h3>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 p-3 rounded bg-slate-100 dark:bg-slate-800">
            <div><b>SL giao:</b> {phieu.soLuongGiao}</div>
            <div><b>Đơn giá:</b> {phieu.donGia.toLocaleString("vi-VN")}đ</div>
          </div>

          <NumberField label="SL nhận về" value={nhan} onChange={setNhan} />
          <NumberField label="SL đạt yêu cầu" value={dat} onChange={setDat} highlight />
          <NumberField label="SL lỗi" value={loi} onChange={setLoi} color="red" />
          <NumberField label="SL thiếu" value={thieu} onChange={setThieu} color="orange" />
          {phieu.id.startsWith("MAY_") && (
            <NumberField label="SL sửa lại" value={sua} onChange={setSua} color="amber" />
          )}

          <div>
            <label className="text-xs font-medium opacity-70 block mb-1">Ghi chú</label>
            <textarea
              className="input min-h-[60px]"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Mô tả lỗi, phát sinh..."
            />
          </div>

          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs opacity-70">Thành tiền (theo SL đạt)</div>
              <div className="text-2xl font-bold text-emerald-700">{thanhTien.toLocaleString("vi-VN")}đ</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button
            onClick={() => onConfirm({ soLuongNhan: nhan, soLuongDat: dat, soLuongLoi: loi, soLuongThieu: thieu, soLuongSua: sua, ghiChu })}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Lưu kết quả
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, highlight, color }: any) {
  const colorClass = color === "red" ? "border-red-300" : color === "orange" ? "border-orange-300" : color === "amber" ? "border-amber-300" : "";
  return (
    <div>
      <label className="text-xs font-medium opacity-70 block mb-1">{label}</label>
      <input
        type="number"
        className={`input ${highlight ? "font-bold text-emerald-700 text-lg" : ""} ${colorClass}`}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </div>
  );
}

function BaoCaoModal({ phieu, onClose }: any) {
  const thanhTien = tinhThanhTien(phieu.soLuongDat, phieu.donGia);
  const conNo = tinhConNo(thanhTien, phieu.daThanhToan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-500" /> Báo cáo phiếu {phieu.id}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2 p-3 rounded bg-slate-100 dark:bg-slate-800">
            <div><b>Phiếu:</b> {phieu.id}</div>
            <div><b>LSX:</b> {phieu.lenhSX}</div>
            <div><b>SP:</b> {phieu.maSP} {phieu.phanLoai}</div>
            <div><b>Màu/size:</b> {phieu.mau} {phieu.size}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Giao" value={phieu.soLuongGiao} color="sky" />
            <Stat label="Nhận" value={phieu.soLuongNhan} color="violet" />
            <Stat label="Đạt" value={phieu.soLuongDat} color="emerald" />
            <Stat label="Lỗi" value={phieu.soLuongLoi} color="red" />
            <Stat label="Thiếu" value={phieu.soLuongThieu} color="orange" />
            {phieu.soLuongSua > 0 && <Stat label="Sửa" value={phieu.soLuongSua} color="amber" />}
          </div>

          <div className="p-3 rounded bg-brand-500/10 border border-brand-500/30">
            <div className="flex justify-between mb-1"><span>Đơn giá:</span><b>{phieu.donGia.toLocaleString("vi-VN")}đ</b></div>
            <div className="flex justify-between mb-1"><span>Thành tiền:</span><b className="text-emerald-700">{thanhTien.toLocaleString("vi-VN")}đ</b></div>
            <div className="flex justify-between mb-1"><span>Đã thanh toán:</span><b>{phieu.daThanhToan.toLocaleString("vi-VN")}đ</b></div>
            <div className="flex justify-between"><span>Còn nợ:</span><b className={conNo > 0 ? "text-red-600" : "text-emerald-600"}>{conNo.toLocaleString("vi-VN")}đ</b></div>
          </div>

          <div className="p-3 rounded bg-slate-100 dark:bg-slate-800">
            <div className="text-xs opacity-70 mb-1">Trạng thái</div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${TRANG_THAI_COLORS[phieu.trangThai as keyof typeof TRANG_THAI_COLORS] || ""}`}>
              {phieu.trangThai}
            </span>
          </div>

          {phieu.ghiChu && (
            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs">
              <b>Ghi chú:</b> {phieu.ghiChu}
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn-primary w-full mt-4">Đóng</button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: any) {
  const colorClass = {
    sky: "bg-sky-500/10 text-sky-700",
    violet: "bg-violet-500/10 text-violet-700",
    emerald: "bg-emerald-500/10 text-emerald-700",
    red: "bg-red-500/10 text-red-700",
    orange: "bg-orange-500/10 text-orange-700",
    amber: "bg-amber-500/10 text-amber-700",
  }[color as string] || "bg-slate-500/10";
  return (
    <div className={`p-2 rounded ${colorClass}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
