"use client";

// ============ LENH CAT MODAL (Giai đoạn 1 - Mavis) ============
// Form 4 sections theo layout anh Sang yeu cau:
//   Section 1: Thong tin chung & Ke hoach (Loai SP, Ma SP, Tong SL, Size, Han, Phu trach Cat)
//   Section 2: Vai (multi-mau, so kg, don gia) → auto tinh gia vai BQ
//   Section 3: Phu lieu (Bo co, Khoa, Cuc, Chi, Nhan, Tui PE...) → auto tinh chi phi / SP
//   Section 4: Phan cong gia cong 5 khau (Cat, May Ao, May Quan, InTheu, UiQC)
//   Section 5: Bang tinh gia von san xuat (COGS) tu dong
// Buttons: [Huy bo] [Phat lenh & Dieu chuyen]
//
// Giai doan 1: Focus Section 1 + 5 (form + COGS auto + luu DB)
// Giai doan 2 (sau): Auto tru kho + Phan cong/Cong no

import { useEffect, useMemo, useState } from "react";
import {
  X, Plus, Trash2, AlertTriangle, Sparkles, Shirt, Package, Scissors,
  Calculator, TrendingUp, Save, Send, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import {
  type LenhCat, type LoaiSP, type LenhCatVai, type LenhCatPhuLieu,
  type PhanCongGiaCong, type TrangThaiLenhCat,
  LOAI_SP_LABELS, TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE,
  tinhCOGS, useLenhCat,
} from "@/lib/data/lenh-cat-store";

// Constants
const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL"];
const DEFAULT_HAO_HUT = 1.5; // 1.5%
const DEFAULT_DON_GIA = {
  cat: 3500,
  mayAo: 22000,
  mayQuan: 18000,
  inTheu: 4500,
  uiQC: 3000,
};

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string | null; // Nếu có → edit mode, ngược lại → create
}

export default function LenhCatModal({ open, onClose, editId }: Props) {
  const { dsLenhCat, themLenhCat, suaLenhCat } = useLenhCat();
  const editing = editId ? dsLenhCat.find((l) => l.id === editId) : null;

  // ============ Form state ============
  const [loaiSP, setLoaiSP] = useState<LoaiSP>("BoTru");
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [tongSL, setTongSL] = useState(500);
  const [hanHoanThanh, setHanHoanThanh] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [phanBoSize, setPhanBoSize] = useState<{ size: string; sl: number }[]>([
    { size: "M", sl: 100 },
    { size: "L", sl: 200 },
    { size: "XL", sl: 150 },
    { size: "2XL", sl: 50 },
  ]);
  const [phuTrachCat, setPhuTrachCat] = useState("NV002");
  const [ghiChu, setGhiChu] = useState("");

  // Section 2 - Vải
  const [dsVai, setDsVai] = useState<LenhCatVai[]>([]);
  // Section 3 - Phụ liệu
  const [dsPhuLieu, setDsPhuLieu] = useState<LenhCatPhuLieu[]>([]);
  // Section 4 - Phân công
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>({
    cat: { nguoiMa: "NV002", nguoiTen: "Nguyễn Thị Mỹ Nhi (Cắt)", donGia: DEFAULT_DON_GIA.cat },
    mayAo: { nguoiMa: "GS002", nguoiTen: "Xưởng may Liễu", donGia: DEFAULT_DON_GIA.mayAo },
    mayQuan: { nguoiMa: "GS001", nguoiTen: "Xưởng may Hương (Quần)", donGia: DEFAULT_DON_GIA.mayQuan },
    inTheu: { nguoiMa: "DT-IT-005", nguoiTen: "In Bảo Ngân", donGia: DEFAULT_DON_GIA.inTheu },
    uiQC: { nguoiMa: "NV010", nguoiTen: "Trương Minh Tâm (Ủi)", donGia: DEFAULT_DON_GIA.uiQC },
  });
  const [haoHutPhanTram, setHaoHutPhanTram] = useState(DEFAULT_HAO_HUT);

  // UI state
  const [showSection2, setShowSection2] = useState(false);
  const [showSection3, setShowSection3] = useState(false);
  const [showSection4, setShowSection4] = useState(false);
  const [showSection5, setShowSection5] = useState(true); // COGS luôn hiện

  // ============ Load data khi edit ============
  useEffect(() => {
    if (editing) {
      setLoaiSP(editing.loaiSP);
      setMaSP(editing.maSP);
      setTenSP(editing.tenSP);
      setTongSL(editing.tongSL);
      setHanHoanThanh(editing.hanHoanThanh);
      setPhanBoSize(editing.phanBoSize);
      setPhuTrachCat(editing.phuTrachCat);
      setGhiChu(editing.ghiChu || "");
      setDsVai(editing.dsVai);
      setDsPhuLieu(editing.dsPhuLieu);
      setPhanCong(editing.phanCong);
      setHaoHutPhanTram(editing.haoHutPhanTram);
    }
  }, [editing]);

  // ============ ESC to close ============
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ============ Auto-fill tenSP khi đổi loaiSP ============
  useEffect(() => {
    if (!maSP && tenSP === "") {
      setTenSP(LOAI_SP_LABELS[loaiSP]);
    }
  }, [loaiSP, maSP, tenSP]);

  // ============ Real-time COGS ============
  const bangCOGS = useMemo(
    () => tinhCOGS(loaiSP, tongSL, dsVai, dsPhuLieu, phanCong, haoHutPhanTram),
    [loaiSP, tongSL, dsVai, dsPhuLieu, phanCong, haoHutPhanTram]
  );

  // ============ Tính tổng phân bổ size ============
  const tongPhanBoSize = phanBoSize.reduce((s, p) => s + p.sl, 0);
  const sizeHopLe = tongPhanBoSize === tongSL;

  if (!open) return null;

  // ============ Handlers ============
  const handlePhuTrachCatChange = (maNV: string) => {
    setPhuTrachCat(maNV);
    const nv = REAL_NHAN_VIEN.find((n) => n.ma === maNV);
    if (nv) {
      // Có thể lưu tên vào form data
    }
  };

  const handlePhanCongChange = (
    khau: keyof PhanCongGiaCong,
    field: "nguoiMa" | "donGia",
    value: string | number
  ) => {
    setPhanCong((prev) => {
      const current = prev[khau];
      if (!current) return prev;
      if (field === "nguoiMa") {
        const maNV = value as string;
        const nv = REAL_NHAN_VIEN.find((n) => n.ma === maNV);
        return {
          ...prev,
          [khau]: {
            ...current,
            nguoiMa: maNV,
            nguoiTen: nv?.ten || maNV,
          },
        };
      } else {
        return {
          ...prev,
          [khau]: { ...current, donGia: value as number },
        };
      }
    });
  };

  // ============ Add/Remove Vải ============
  const addVai = () => {
    if (KHO_VAI.length === 0) {
      toast.error("Chưa có dữ liệu vải");
      return;
    }
    const v = KHO_VAI[0];
    setDsVai((prev) => [
      ...prev,
      { maVai: v.maVT, tenVai: v.tenVT, soKg: 100, donGia: v.donGia || 70000 },
    ]);
  };

  const updateVai = (idx: number, field: keyof LenhCatVai, value: string | number) => {
    setDsVai((prev) => {
      const next = [...prev];
      const current = { ...next[idx], [field]: value };
      // Auto-fill tên vải khi đổi mã
      if (field === "maVai") {
        const v = KHO_VAI.find((x) => x.maVT === value);
        if (v) {
          current.tenVai = v.tenVT;
          if (v.donGia) current.donGia = v.donGia;
        }
      }
      next[idx] = current;
      return next;
    });
  };

  const removeVai = (idx: number) => {
    setDsVai((prev) => prev.filter((_, i) => i !== idx));
  };

  // ============ Add/Remove Phụ liệu ============
  const addPhuLieu = () => {
    if (KHO_VAT_TU.length === 0) {
      toast.error("Chưa có dữ liệu phụ liệu");
      return;
    }
    const p = KHO_VAT_TU[0];
    setDsPhuLieu((prev) => [
      ...prev,
      { maPL: p.maVT, tenPL: p.tenVT, soLuong: 500, donGia: p.donGia || 1000, dvt: p.dvt || "cái" },
    ]);
  };

  const updatePhuLieu = (idx: number, field: keyof LenhCatPhuLieu, value: string | number) => {
    setDsPhuLieu((prev) => {
      const next = [...prev];
      const current = { ...next[idx], [field]: value };
      if (field === "maPL") {
        const p = KHO_VAT_TU.find((x) => x.maVT === value);
        if (p) {
          current.tenPL = p.tenVT;
          if (p.donGia) current.donGia = p.donGia;
          current.dvt = p.dvt || "cái";
        }
      }
      next[idx] = current;
      return next;
    });
  };

  const removePhuLieu = (idx: number) => {
    setDsPhuLieu((prev) => prev.filter((_, i) => i !== idx));
  };

  // ============ Phân bổ size helpers ============
  const addSizeRow = () => {
    const used = new Set(phanBoSize.map((p) => p.size));
    const next = SIZE_OPTIONS.find((s) => !used.has(s));
    if (next) setPhanBoSize((prev) => [...prev, { size: next, sl: 0 }]);
  };

  const updateSizeRow = (idx: number, field: "size" | "sl", value: string | number) => {
    setPhanBoSize((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeSizeRow = (idx: number) => {
    setPhanBoSize((prev) => prev.filter((_, i) => i !== idx));
  };

  // ============ Submit ============
  const handleSubmit = () => {
    // Validate
    if (!maSP.trim()) {
      toast.error("Vui lòng nhập Mã SP");
      return;
    }
    if (!tenSP.trim()) {
      toast.error("Vui lòng nhập Tên SP");
      return;
    }
    if (tongSL < 1) {
      toast.error("Tổng SL phải >= 1");
      return;
    }
    if (phanBoSize.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 size");
      return;
    }
    if (phanBoSize.some((p) => p.sl < 1)) {
      toast.error("Mỗi size phải có SL >= 1");
      return;
    }
    if (!sizeHopLe) {
      toast.error(
        `Tổng phân bổ size (${tongPhanBoSize}) chưa khớp Tổng SL (${tongSL})`
      );
      return;
    }
    if (dsVai.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 loại vải");
      return;
    }
    if (dsPhuLieu.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 phụ liệu");
      return;
    }

    // Tìm tên người phụ trách cắt
    const phuTrachCatTen = REAL_NHAN_VIEN.find((n) => n.ma === phuTrachCat)?.ten || phuTrachCat;

    const data = {
      loaiSP,
      maSP: maSP.trim(),
      tenSP: tenSP.trim(),
      tongSL,
      hanHoanThanh,
      phanBoSize,
      phuTrachCat,
      phuTrachCatTen,
      ghiChu: ghiChu.trim(),
      dsVai,
      dsPhuLieu,
      phanCong,
      haoHutPhanTram,
    };

    if (editing) {
      suaLenhCat(editing.id, data, null);
      toast.success(`✅ Đã cập nhật ${editing.id}`);
    } else {
      const newLC = themLenhCat(data, null);
      toast.success(`✅ Đã tạo ${newLC.id} - ${tenSP} (${tongSL} sp, COGS: ${formatVND(bangCOGS.giaVon1SP)}/sp)`);
    }
    onClose();
  };

  // ============ Render ============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white p-4 flex items-center justify-between">
          <div>
            <div className="text-xs opacity-90">📑 {editing ? "Sửa" : "Thêm"} lệnh cắt</div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              {editing ? editing.id : "Tạo lệnh cắt mới (LC-2026-XXXX)"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ============ SECTION 1: Thông tin chung & Kế hoạch ============ */}
          <Section title="1. Thông tin chung & Kế hoạch" icon={<Info className="w-4 h-4" />} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Loại SP */}
              <div>
                <label className="text-xs font-medium block mb-1">Loại SP *</label>
                <select
                  className="input w-full"
                  value={loaiSP}
                  onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}
                >
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Mã SP */}
              <div>
                <label className="text-xs font-medium block mb-1">Mã SP *</label>
                <input
                  className="input w-full"
                  value={maSP}
                  onChange={(e) => setMaSP(e.target.value.toUpperCase())}
                  placeholder="VD: M758, M873, M775"
                />
              </div>

              {/* Tên SP */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium block mb-1">Tên SP *</label>
                <input
                  className="input w-full"
                  value={tenSP}
                  onChange={(e) => setTenSP(e.target.value)}
                  placeholder="VD: Bộ trụ trơn (M758)"
                />
              </div>

              {/* Tổng SL */}
              <div>
                <label className="text-xs font-medium block mb-1">Tổng SL cắt *</label>
                <input
                  type="number"
                  min={1}
                  className="input w-full"
                  value={tongSL}
                  onChange={(e) => setTongSL(Math.max(1, parseInt(e.target.value) || 0))}
                />
              </div>

              {/* Hạn hoàn thành */}
              <div>
                <label className="text-xs font-medium block mb-1">Hạn hoàn thành *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={hanHoanThanh}
                  onChange={(e) => setHanHoanThanh(e.target.value)}
                />
              </div>

              {/* Phụ trách cắt */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium block mb-1">Phụ trách cắt *</label>
                <select
                  className="input w-full"
                  value={phuTrachCat}
                  onChange={(e) => handlePhuTrachCatChange(e.target.value)}
                >
                  {REAL_NHAN_VIEN.filter((n) => n.boPhan?.toLowerCase().includes("cắt")).map((n) => (
                    <option key={n.ma} value={n.ma}>
                      {n.ma} - {n.ten} ({n.boPhan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân bổ size */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium">
                    Phân bổ size *
                    <span className={`ml-2 ${sizeHopLe ? "text-emerald-600" : "text-rose-600"}`}>
                      ({tongPhanBoSize} / {tongSL})
                    </span>
                  </label>
                  <button
                    onClick={addSizeRow}
                    className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm size
                  </button>
                </div>
                <div className="space-y-1.5">
                  {phanBoSize.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="input w-24"
                        value={p.size}
                        onChange={(e) => updateSizeRow(idx, "size", e.target.value)}
                      >
                        {SIZE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        className="input flex-1"
                        value={p.sl}
                        onChange={(e) => updateSizeRow(idx, "sl", Math.max(0, parseInt(e.target.value) || 0))}
                      />
                      <span className="text-xs opacity-60 w-20">cái</span>
                      <button
                        onClick={() => removeSizeRow(idx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {!sizeHopLe && (
                  <div className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Tổng phân bổ size chưa khớp tổng SL
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium block mb-1">Ghi chú</label>
                <textarea
                  className="input w-full min-h-[50px]"
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Ghi chú thêm (VD: Ưu tiên lô W28 cho khách VIP...)"
                />
              </div>
            </div>
          </Section>

          {/* ============ SECTION 2: Vải ============ */}
          <Section
            title={`2. Khởi tạo vải & trừ kho (${dsVai.length} loại)`}
            icon={<Package className="w-4 h-4" />}
            open={showSection2}
            onToggle={() => setShowSection2(!showSection2)}
            badge={dsVai.length > 0 ? formatVND(bangCOGS.tongTienVai) : "—"}
          >
            <div className="space-y-2">
              {dsVai.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="input col-span-4"
                    value={v.maVai}
                    onChange={(e) => updateVai(idx, "maVai", e.target.value)}
                  >
                    {KHO_VAI.map((kv) => (
                      <option key={kv.maVT} value={kv.maVT}>
                        {kv.maVT} - {kv.tenVT}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className="input col-span-2"
                    value={v.soKg}
                    onChange={(e) => updateVai(idx, "soKg", Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="kg"
                  />
                  <input
                    type="number"
                    min={0}
                    className="input col-span-3"
                    value={v.donGia}
                    onChange={(e) => updateVai(idx, "donGia", Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="đ/kg"
                  />
                  <div className="col-span-2 text-right text-xs font-mono text-emerald-600">
                    {formatVNDShort(v.soKg * v.donGia)}
                  </div>
                  <button
                    onClick={() => removeVai(idx)}
                    className="col-span-1 p-1.5 text-rose-600 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addVai}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm vải
              </button>
            </div>
          </Section>

          {/* ============ SECTION 3: Phụ liệu ============ */}
          <Section
            title={`3. Khởi tạo phụ liệu & trừ kho (${dsPhuLieu.length} loại)`}
            icon={<Sparkles className="w-4 h-4" />}
            open={showSection3}
            onToggle={() => setShowSection3(!showSection3)}
            badge={dsPhuLieu.length > 0 ? formatVND(bangCOGS.tongTienPhuLieu) : "—"}
          >
            <div className="space-y-2">
              {dsPhuLieu.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="input col-span-4"
                    value={p.maPL}
                    onChange={(e) => updatePhuLieu(idx, "maPL", e.target.value)}
                  >
                    {KHO_VAT_TU.map((kpl) => (
                      <option key={kpl.maVT} value={kpl.maVT}>
                        {kpl.maVT} - {kpl.tenVT}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    className="input col-span-2"
                    value={p.soLuong}
                    onChange={(e) => updatePhuLieu(idx, "soLuong", Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <input
                    type="text"
                    readOnly
                    className="input col-span-1 text-center text-[10px]"
                    value={p.dvt}
                  />
                  <input
                    type="number"
                    min={0}
                    className="input col-span-2"
                    value={p.donGia}
                    onChange={(e) => updatePhuLieu(idx, "donGia", Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <div className="col-span-2 text-right text-xs font-mono text-emerald-600">
                    {formatVNDShort(p.soLuong * p.donGia)}
                  </div>
                  <button
                    onClick={() => removePhuLieu(idx)}
                    className="col-span-1 p-1.5 text-rose-600 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addPhuLieu}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm phụ liệu
              </button>
            </div>
          </Section>

          {/* ============ SECTION 4: Phân công gia công ============ */}
          <Section
            title="4. Phân công gia công & đơn giá"
            icon={<Shirt className="w-4 h-4" />}
            open={showSection4}
            onToggle={() => setShowSection4(!showSection4)}
            badge={dsVai.length > 0 ? formatVND(bangCOGS.tongCong) : "—"}
          >
            <div className="space-y-3">
              {/* Cắt */}
              <PhanCongRow
                label="Cắt"
                value={phanCong.cat}
                onChangeNguoi={(v) => handlePhanCongChange("cat", "nguoiMa", v)}
                onChangeGia={(v) => handlePhanCongChange("cat", "donGia", v)}
                required
              />
              {/* May Áo (cho cả Áo & Bộ) */}
              {phanCong.mayAo && (
                <PhanCongRow
                  label={loaiSP.startsWith("Bo") ? "May Áo" : "May"}
                  value={phanCong.mayAo}
                  onChangeNguoi={(v) => handlePhanCongChange("mayAo", "nguoiMa", v)}
                  onChangeGia={(v) => handlePhanCongChange("mayAo", "donGia", v)}
                  required
                />
              )}
              {/* May Quần (chỉ Bộ) */}
              {loaiSP.startsWith("Bo") && phanCong.mayQuan && (
                <PhanCongRow
                  label="May Quần"
                  value={phanCong.mayQuan}
                  onChangeNguoi={(v) => handlePhanCongChange("mayQuan", "nguoiMa", v)}
                  onChangeGia={(v) => handlePhanCongChange("mayQuan", "donGia", v)}
                />
              )}
              {/* In/Thêu (optional) */}
              {phanCong.inTheu && (
                <PhanCongRow
                  label="In / Thêu (optional)"
                  value={phanCong.inTheu}
                  onChangeNguoi={(v) => handlePhanCongChange("inTheu", "nguoiMa", v)}
                  onChangeGia={(v) => handlePhanCongChange("inTheu", "donGia", v)}
                  optional
                />
              )}
              {/* Ủi + QC */}
              <PhanCongRow
                label="Ủi + QC + Đóng gói"
                value={phanCong.uiQC}
                onChangeNguoi={(v) => handlePhanCongChange("uiQC", "nguoiMa", v)}
                onChangeGia={(v) => handlePhanCongChange("uiQC", "donGia", v)}
                required
              />

              {/* Hao hụt */}
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <label className="text-xs font-medium">Hao hụt (%):</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="input w-24"
                  value={haoHutPhanTram}
                  onChange={(e) => setHaoHutPhanTram(Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <span className="text-xs opacity-60">% áp dụng trên (Vải + PL + Công)</span>
              </div>
            </div>
          </Section>

          {/* ============ SECTION 5: Bảng COGS ============ */}
          <Section
            title="5. Bảng tính giá vốn sản xuất (COGS Summary)"
            icon={<Calculator className="w-4 h-4" />}
            defaultOpen
            highlight
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cột trái - Vải + PL */}
              <div className="space-y-2">
                <COGSRow label="Tổng tiền vải" value={bangCOGS.tongTienVai} sub={`BQ: ${formatVND(bangCOGS.giaVaiBQ)}/sp`} color="emerald" />
                <COGSRow label="Tổng tiền phụ liệu" value={bangCOGS.tongTienPhuLieu} sub={`BQ: ${formatVND(bangCOGS.giaPhuLieuBQ)}/sp`} color="sky" />
                <COGSRow label={`Tiền công cắt`} value={bangCOGS.congCat} sub={`${formatVND(phanCong.cat.donGia)} × ${tongSL} sp`} color="violet" />
                <COGSRow label={`Tiền công may${loaiSP.startsWith("Bo") ? " (Áo + Quần)" : ""}`} value={bangCOGS.congMay} color="violet" />
                {bangCOGS.congInTheu > 0 && <COGSRow label="Tiền công in/thêu" value={bangCOGS.congInTheu} color="violet" />}
                <COGSRow label="Tiền công ủi + QC" value={bangCOGS.congUiQC} color="violet" />
                <COGSRow label={`Hao hụt (${haoHutPhanTram}%)`} value={bangCOGS.tienHaoHut} color="amber" />
              </div>
              {/* Cột phải - Tổng kết */}
              <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-violet-500/20 flex flex-col justify-center">
                <div className="text-xs opacity-70 mb-1">TỔNG GIÁ VỐN DỰ KIẾN</div>
                <div className="text-3xl md:text-4xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                  {formatVNDShort(bangCOGS.giaVon1SP)}
                </div>
                <div className="text-xs opacity-60 mt-1">
                  / 1 {loaiSP.startsWith("Bo") ? "bộ" : "áo"}
                </div>
                <div className="mt-3 pt-3 border-t border-violet-500/20">
                  <div className="text-xs opacity-70">Tổng giá trị lô ({tongSL} sp):</div>
                  <div className="text-lg font-bold text-emerald-600 tabular-nums">
                    {formatVNDShort(bangCOGS.tongGiaVon)}
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs opacity-70 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {editing ? "Đang sửa" : "Tạo mới"} • COGS: <b className="text-emerald-600">{formatVND(bangCOGS.giaVon1SP)}/sp</b>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ❌ Huỷ bỏ
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-fuchsia-700 flex items-center gap-1.5 shadow-lg shadow-violet-500/20"
              >
                <Send className="w-4 h-4" />
                🚀 Phát lệnh & Điều chuyển
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Sub-components ============
function Section({
  title,
  icon,
  children,
  defaultOpen = false,
  open: openProp,
  onToggle,
  badge,
  highlight = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: () => void;
  badge?: string;
  highlight?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : internalOpen;
  const toggle = isControlled ? onToggle! : () => setInternalOpen(!internalOpen);

  return (
    <div className={`card overflow-hidden ${highlight ? "ring-2 ring-violet-500/40" : ""}`}>
      <button
        onClick={toggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/30"
      >
        <h3 className="text-sm font-bold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {badge && <span className="text-xs font-mono text-emerald-600">{badge}</span>}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {isOpen && <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>{children}</div>}
    </div>
  );
}

function COGSRow({ label, value, sub, color = "emerald" }: { label: string; value: number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-sky-600 dark:text-sky-400",
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/40 dark:bg-white/5 border" style={{ borderColor: "var(--border)" }}>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="text-[10px] opacity-60">{sub}</div>}
      </div>
      <div className={`text-base font-bold tabular-nums ${colorMap[color]}`}>
        {formatVNDShort(value)}
      </div>
    </div>
  );
}

function PhanCongRow({
  label,
  value,
  onChangeNguoi,
  onChangeGia,
  required = false,
  optional = false,
}: {
  label: string;
  value: { nguoiMa: string; nguoiTen: string; donGia: number };
  onChangeNguoi: (v: string) => void;
  onChangeGia: (v: number) => void;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <label className="col-span-3 text-xs font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
        {optional && <span className="opacity-50 text-[10px]"> (tùy chọn)</span>}
      </label>
      <select
        className="input col-span-6"
        value={value.nguoiMa}
        onChange={(e) => onChangeNguoi(e.target.value)}
      >
        {REAL_NHAN_VIEN.map((n) => (
          <option key={n.ma} value={n.ma}>
            {n.ma} - {n.ten} ({n.boPhan})
          </option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        className="input col-span-2"
        value={value.donGia}
        onChange={(e) => onChangeGia(Math.max(0, parseInt(e.target.value) || 0))}
        placeholder="đ/sp"
      />
      <div className="col-span-1 text-xs opacity-60 text-center">đ/sp</div>
    </div>
  );
}
