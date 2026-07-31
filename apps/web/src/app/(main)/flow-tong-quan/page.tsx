"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Factory, Package, Truck, Palette, Boxes, ClipboardCheck,
  Plus, ChevronRight, Sparkles, GitBranch, X, CheckCircle2,
  AlertCircle, Clock, ArrowRight, Eye, Save, Trash2, Star,
  Package2, TrendingUp, BarChart3, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  nhapKhoSoi_V2, taoLenhDet, capNhatTrangThaiLenhDet, nghiemThuDet_V2,
  taoMeNhuom, nghiemThuMau_V2, nhapKhoVaiTP,
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllPhieuNghiemThuMau,
  getAllLoVaiTP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type NghiemThuMau, type LoVaiTP,
  type MauNhuom,
} from "@/lib/yarn-production-chain";
import {
  buildMeSoiTongQuan, goiYTachLenhDet, goiYGopMeNhuom, pheDuyetQCMeSoi,
  getAllMeSoi, type MeSoiTongQuan,
} from "@/lib/yarn-me-soi-engine";

// ============ TYPES ============
type StepKey = "khosoi" | "lenhdet" | "nghiemthumoc" | "menhuom" | "nghiemthumau" | "khotp" | "qc";

interface FlowForm {
  step: StepKey;
  maLoSoi: string;
  data?: any;
}

export default function FlowTongQuanPage() {
  const { user } = useSession();
  const [meSois, setMeSois] = useState<string[]>([]);
  const [tongQuans, setTongQuans] = useState<Record<string, MeSoiTongQuan>>({});
  const [form, setForm] = useState<FlowForm | null>(null);
  const [showNewMe, setShowNewMe] = useState(false);

  const refresh = () => {
    const ds = getAllMeSoi();
    setMeSois(ds);
    const map: Record<string, MeSoiTongQuan> = {};
    ds.forEach((m) => {
      const me = buildMeSoiTongQuan(m);
      if (me) map[m] = me;
    });
    setTongQuans(map);
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div className="max-w-full mx-auto space-y-3 animate-fade-in">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 via-rose-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <GitBranch className="w-7 h-7 text-blue-500" /> Flow Tổng Quan - 1 Mẻ Sợi 1 Dòng
            </h1>
            <p className="opacity-70 text-sm">
              Mỗi LSOI = 1 dòng timeline 7 bước. Click vào từng bước để xử lý ngay tại chỗ.
            </p>
          </div>
          <button onClick={() => setShowNewMe(true)} className="btn-primary bg-blue-500">
            <Plus className="w-4 h-4 inline" /> Tạo mẻ sợi mới
          </button>
        </div>
      </div>

      {/* Timeline table */}
      <div className="card p-3 overflow-x-auto">
        <div className="min-w-[1400px]">
          <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-2 text-xs font-semibold sticky top-0 bg-white dark:bg-slate-900 z-10 pb-2 border-b-2">
            <div className="font-bold">Mẻ sợi</div>
            <StepHeader step="khosoi" label="1. Kho sợi" icon={Package} color="blue" />
            <StepHeader step="lenhdet" label="2. Lệnh dệt" icon={Truck} color="violet" />
            <StepHeader step="nghiemthumoc" label="3. Nghiệm thu mộc" icon={CheckCircle2} color="purple" />
            <StepHeader step="menhuom" label="4. Mẻ nhuộm" icon={Palette} color="rose" />
            <StepHeader step="nghiemthumau" label="5. Nghiệm thu màu" icon={CheckCircle2} color="pink" />
            <StepHeader step="khotp" label="6. Kho vải TP" icon={Boxes} color="emerald" />
            <StepHeader step="qc" label="7. QC chất lượng" icon={ClipboardCheck} color="amber" />
          </div>

          {meSois.length === 0 ? (
            <div className="text-center py-12 text-sm opacity-60">
              Chưa có mẻ sợi nào. Click "Tạo mẻ sợi mới" để bắt đầu.
            </div>
          ) : (
            meSois.map((maLo) => {
              const me = tongQuans[maLo];
              if (!me) return null;
              return (
                <FlowRow
                  key={maLo}
                  maLo={maLo}
                  me={me}
                  user={user}
                  onAction={(step: StepKey) => setForm({ step, maLoSoi: maLo })}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Modal form */}
      {form && (
        <StepModal
          form={form}
          user={user}
          onClose={() => setForm(null)}
          onSuccess={() => { refresh(); setForm(null); }}
        />
      )}

      {showNewMe && (
        <NewMeSoiModal
          user={user}
          onClose={() => setShowNewMe(false)}
          onSuccess={() => { refresh(); setShowNewMe(false); }}
        />
      )}
    </div>
  );
}

// ============ STEP HEADER ============
function StepHeader({ step, label, icon: Icon, color }: { step: string; label: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600", violet: "text-violet-600", purple: "text-purple-600",
    rose: "text-rose-600", pink: "text-pink-600", emerald: "text-emerald-600", amber: "text-amber-600",
  };
  return (
    <div className={`flex items-center gap-1 text-center justify-center ${colors[color]}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
  );
}

// ============ FLOW ROW ============
function FlowRow({ maLo, me, user, onAction }: any) {
  return (
    <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-2 items-stretch py-2 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30">
      {/* Cột 1: Mẻ sợi */}
      <div className="font-mono font-bold flex flex-col justify-center p-1">
        <div className="text-sm">{maLo}</div>
        <div className="text-[10px] opacity-60 font-sans">{me.phieuNhap?.tenSoi}</div>
        <div className="text-[10px] opacity-60 font-sans">
          {me.phieuNhap?.soKg || 0}kg · NCC: {me.phieuNhap?.tenNCC?.slice(0, 12) || "?"}
        </div>
        <div className="mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
            me.trangThai === "Hoàn tất" ? "bg-emerald-500" :
            me.trangThai === "Mới nhập" ? "bg-blue-500" :
            me.trangThai === "Đang dệt" ? "bg-violet-500" :
            me.trangThai === "Đã dệt xong" ? "bg-purple-500" :
            me.trangThai === "Đang nhuộm" ? "bg-rose-500" :
            me.trangThai === "Đã nhuộm xong" ? "bg-pink-500" :
            "bg-emerald-500"
          }`}>
            {me.trangThai}
          </span>
        </div>
      </div>

      {/* Step 1: Kho sợi */}
      <StepCell
        icon={Package} color="blue"
        active={!!me.phieuNhap}
        value={me.phieuNhap ? `${me.phieuNhap.soKg}kg` : "Chưa nhập"}
        sub={me.phieuNhap ? `${(me.phieuNhap.thanhTien / 1_000_000).toFixed(1)}tr` : ""}
        onClick={() => onAction("khosoi")}
      />

      {/* Step 2: Lệnh dệt */}
      <StepCell
        icon={Truck} color="violet"
        active={me.lenhDet.length > 0}
        value={`${me.lenhDet.length} lệnh`}
        sub={me.lenhDet.length > 0 ? `${me.tongKgSoiDaGiao}kg sợi` : ""}
        warning={me.lenhDet.some((l: LenhDet) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy")}
        onClick={() => onAction("lenhdet")}
      />

      {/* Step 3: Nghiệm thu mộc */}
      <StepCell
        icon={CheckCircle2} color="purple"
        active={me.lenhDet.some((l: LenhDet) => l.soKgMocNhan)}
        value={me.tongKgMocNhan > 0 ? `${me.tongKgMocNhan}kg` : "Chưa NT"}
        sub={me.haoHutDetPt > 0 ? `Hao hụt ${me.haoHutDetPt.toFixed(1)}%` : ""}
        warning={me.haoHutDetPt > 4}
        onClick={() => onAction("nghiemthumoc")}
      />

      {/* Step 4: Mẻ nhuộm */}
      <StepCell
        icon={Palette} color="rose"
        active={me.meNhuomList.length > 0}
        value={me.meNhuomList.length > 0 ? `${me.meNhuomList.length} mẻ` : "Chưa nhuộm"}
        sub={me.tongKgMocDaNhuom > 0 ? `${me.tongKgMocDaNhuom}kg mộc` : ""}
        warning={me.meNhuomList.some((m: MeNhuom) => m.trangThai !== "Hoàn thành")}
        onClick={() => onAction("menhuom")}
      />

      {/* Step 5: Nghiệm thu màu */}
      <StepCell
        icon={CheckCircle2} color="pink"
        active={me.phieuNghiemThuMau.length > 0}
        value={me.tongKgMauThanhPham > 0 ? `${me.tongKgMauThanhPham.toFixed(0)}kg` : "Chưa NT"}
        sub={me.haoHutNhuomPt > 0 ? `Hao hụt ${me.haoHutNhuomPt.toFixed(1)}%` : ""}
        warning={me.haoHutNhuomPt > 5}
        onClick={() => onAction("nghiemthumau")}
      />

      {/* Step 6: Kho vải TP */}
      <StepCell
        icon={Boxes} color="emerald"
        active={me.loVaiTP.length > 0}
        value={me.tongKgTP > 0 ? `${me.tongKgTP.toFixed(0)}kg` : "Chưa nhập"}
        sub={me.tongGiaTriTP > 0 ? `${(me.tongGiaTriTP / 1_000_000).toFixed(1)}tr` : ""}
        onClick={() => onAction("khotp")}
      />

      {/* Step 7: QC */}
      <StepCell
        icon={ClipboardCheck} color="amber"
        active={me.tongKgTP > 0}
        value={me.tongKgTP > 0 ? `${me.chatLuong.diem}/100` : "—"}
        sub={me.tongKgTP > 0 ? `Xếp loại ${me.chatLuong.xepLoai}` : "Chờ TP"}
        warning={me.chatLuong.diem < 70 && me.tongKgTP > 0}
        success={me.chatLuong.diem >= 80 && me.tongKgTP > 0}
        onClick={() => onAction("qc")}
      />
    </div>
  );
}

// ============ STEP CELL ============
function StepCell({ icon: Icon, color, active, value, sub, warning, success, onClick }: { icon: any; color: string; active: boolean; value: string; sub?: string; warning?: boolean; success?: boolean; onClick: () => void }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600", border: "border-blue-300" },
    violet: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600", border: "border-violet-300" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600", border: "border-purple-300" },
    rose: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600", border: "border-rose-300" },
    pink: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600", border: "border-pink-300" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", border: "border-emerald-300" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", border: "border-amber-300" },
  };
  const c = colors[color];

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded text-left transition cursor-pointer border ${c.border} ${c.bg} ${
        active ? "" : "opacity-60"
      } ${warning ? "ring-2 ring-rose-500" : success ? "ring-2 ring-emerald-500" : ""}`}
    >
      <div className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${c.text}`} />
        <span className={`text-xs font-bold ${c.text}`}>{value}</span>
      </div>
      {sub && <div className="text-[9px] opacity-70 mt-0.5 truncate">{sub}</div>}
    </button>
  );
}

// ============ MODAL FORM ============
function StepModal({ form, user, onClose, onSuccess }: any) {
  const { step, maLoSoi } = form;
  const [loading, setLoading] = useState(false);

  // Form state cho từng step
  const [form1, setForm1] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    ncc: "Cty Sợi Việt Nam", loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s",
    maLoSoi: maLoSoi, soKg: 1000, donGia: 145000, daThanhToan: 0,
    nguoiPhuTrach: user?.name || "Kho sợi", ghiChu: "",
  });

  const [form2, setForm2] = useState({
    ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongDet: "DNT Dệt Bắc Ninh", maLoSoi, loaiSoi: "SOI-COTTON-30",
    soKgGiao: 500, donGiaDet: 8000, tienDuKien: 500 * 8000, soMetDuKien: 2000, nguoiPhuTrach: user?.name || "Xưởng dệt", ghiChu: "",
  });

  const [form3, setForm3] = useState({
    soKgMocNhan: 480, soCayMoc: 24, soKgLoi: 0,
    chiPhiPhatSinh: 0, daThanhToan: 0, khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
  });

  const [form4, setForm4] = useState<MeNhuom>({
    id: "", ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongNhuom: "Cty Nhuộm Hà Đông", maLoMoc: "",
    tongKgXuat: 0, nguoiPhuTrach: user?.name || "Xưởng nhuộm",
    trangThai: "Đã giao mộc", ghiChu: "",
    danhSachMau: [
      { mau: "Đen", soKg: 200, donGiaNhuom: 15000 },
      { mau: "Trắng", soKg: 150, donGiaNhuom: 12000 },
    ],
  });

  const [form5, setForm5] = useState<NghiemThuMau[]>([
    { mau: "Đen", soKgMocGiao: 200, soKgMauNhan: 190, soCayNhan: 9, soKgLoi: 0,
      donGiaNhuom: 15000, chiPhiHoaChat: 200000, chiPhiHoanThien: 100000, chiPhiPhatSinh: 0, daThanhToan: 0 },
  ]);

  const [form6, setForm6] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    loaiVai: "Vải thun cotton 4 chiều", mau: "Trắng", maMau: "M-TRANG-001",
    maLo: `LTP-${Date.now().toString().slice(-4)}`,
    kho: "Kho Vải TP", khu: "Khu A", ke: "A03", tang: "Tầng 2", viTri: "Vị trí 1",
    trangThaiChatLuong: "Đạt" as const, nguoiPhuTrach: user?.name || "Kho TP", ghiChu: "",
    giaVonPerKg: 200000, danhSachCay: [{ stt: 1, kg: 19.6 }, { stt: 2, kg: 20.3 }, { stt: 3, kg: 18.9 }],
  });

  const [form7, setForm7] = useState({ ghiChuQC: "" });

  const goiYTach = useMemo(() => goiYTachLenhDet(maLoSoi), [maLoSoi]);
  const goiYNhuom = useMemo(() => goiYGopMeNhuom(maLoSoi), [maLoSoi]);
  const me = tongQuansAll[maLoSoi];

  // Hàm xử lý riêng cho từng step
  const handleSubmit = () => {
    setLoading(true);
    try {
      let result: any;
      switch (step) {
        case "khosoi":
          result = nhapKhoSoi_V2({ ...form1, nccId: form1.ncc, tenNCC: form1.ncc, khoNhap: "Kho Sợi", khoa: false } as any, user);
          break;
        case "lenhdet":
          result = taoLenhDet(form2, user);
          break;
        case "nghiemthumoc":
          const lenhDangCho = me?.lenhDet.find((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy");
          if (lenhDangCho) {
            result = nghiemThuDet_V2(lenhDangCho.id, form3, user);
          } else { toast.error("Không có lệnh dệt chờ nghiệm thu"); return; }
          break;
        case "menhuom":
          const lenhDaDệt = me?.lenhDet.find((l) => l.trangThai === "Hoàn thành");
          if (lenhDaDệt) {
            result = taoMeNhuom({ ...form4, maLoMoc: `LM-${lenhDaDệt.id}` }, user);
          } else { toast.error("Chưa có lệnh dệt hoàn thành"); return; }
          break;
        case "nghiemthumau":
          const meNhuomCho = me?.meNhuomList.find((m) => m.trangThai !== "Hoàn thành");
          if (meNhuomCho) {
            result = nghiemThuMau_V2(meNhuomCho.id, form5, user?.name || "system", user);
          } else { toast.error("Không có mẻ nhuộm chờ nghiệm thu"); return; }
          break;
        case "khotp":
          const ntm = me?.phieuNghiemThuMau[0];
          if (ntm) {
            result = nhapKhoVaiTP({ ...form6, meNhuomId: ntm.meNhuomId, nghiemThuMauId: ntm.id } as any, user);
          } else { toast.error("Chưa có phiếu nghiệm thu màu"); return; }
          break;
        case "qc":
          const r = pheDuyetQCMeSoi(maLoSoi, user?.name || "QC", form7.ghiChuQC);
          if (r) { toast.success(`✅ QC: ${r.diem}/100 - Xếp loại ${r.xepLoai}`); onSuccess(); }
          return;
      }
      if (result?.ok) { toast.success(result.message); onSuccess(); }
      else if (result) toast.error(result.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-500" />
            Bước {step === "khosoi" ? "1" : step === "lenhdet" ? "2" : step === "nghiemthumoc" ? "3" : step === "menhuom" ? "4" : step === "nghiemthumau" ? "5" : step === "khotp" ? "6" : "7"} · Mẻ sợi <span className="font-mono text-blue-600">{maLoSoi}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* STEP 1: NHẬP KHO SỢI */}
          {step === "khosoi" && (
            <>
              <h3 className="font-bold text-blue-600">📦 Nhập kho sợi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <F label="NCC" v={form1.ncc} on={(v) => setForm1({ ...form1, ncc: v })} />
                <F label="Loại sợi" v={form1.loaiSoi} on={(v) => setForm1({ ...form1, loaiSoi: v })} />
                <F label="Tên sợi" v={form1.tenSoi} on={(v) => setForm1({ ...form1, tenSoi: v })} />
                <F label="Mã lô" v={form1.maLoSoi} on={(v) => setForm1({ ...form1, maLoSoi: v })} />
                <F label="Số kg" v={form1.soKg} on={(v) => setForm1({ ...form1, soKg: Number(v) })} type="number" />
                <F label="Đơn giá/kg" v={form1.donGia} on={(v) => setForm1({ ...form1, donGia: Number(v) })} type="number" />
              </div>
              <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-900/20 text-sm">
                Thành tiền: <strong>{(form1.soKg * form1.donGia).toLocaleString()}đ</strong>
              </div>
            </>
          )}

          {/* STEP 2: LỆNH DỆT */}
          {step === "lenhdet" && (
            <>
              <h3 className="font-bold text-violet-600">🧵 Tạo lệnh dệt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <F label="Xưởng dệt" v={form2.xuongDet} on={(v) => setForm2({ ...form2, xuongDet: v })} />
                <F label="Kg giao" v={form2.soKgGiao} on={(v) => setForm2({ ...form2, soKgGiao: Number(v) })} type="number" />
                <F label="Đơn giá dệt/kg" v={form2.donGiaDet} on={(v) => setForm2({ ...form2, donGiaDet: Number(v) })} type="number" />
                <F label="Ngày giao" v={form2.ngayGiao} on={(v) => setForm2({ ...form2, ngayGiao: v })} type="date" />
              </div>

              {/* Smart suggest */}
              {goiYTach && goiYTach.kgConLai > 0 && (
                <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> 💡 Gợi ý tách lệnh (còn {goiYTach.kgConLai}kg):
                  </div>
                  {goiYTach.goiY.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => { setForm2({ ...form2, soKgGiao: g.kgMoiLenh }); toast.success(`Đã điền ${g.kgMoiLenh}kg`); }}
                      className="block w-full text-left p-2 mb-1 rounded bg-white dark:bg-slate-800 hover:bg-amber-100 text-xs"
                    >
                      <div className="font-semibold">{g.soLenh} lệnh × {g.kgMoiLenh}kg</div>
                      <div className="opacity-70">{g.lyDo}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 rounded bg-violet-50 dark:bg-violet-900/20 text-sm">
                Phí dệt: <strong>{(form2.soKgGiao * form2.donGiaDet).toLocaleString()}đ</strong>
              </div>
            </>
          )}

          {/* STEP 3: NGHIỆM THU MỘC */}
          {step === "nghiemthumoc" && (
            <>
              <h3 className="font-bold text-purple-600">📦 Nghiệm thu vải mộc</h3>
              {me?.lenhDet.filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy").map((l) => (
                <div key={l.id} className="p-2 rounded bg-purple-50 dark:bg-purple-900/20 text-xs">
                  <strong>{l.id}</strong> - Đã giao {l.soKgGiao}kg sợi
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <F label="Kg vải mộc nhận" v={form3.soKgMocNhan} on={(v) => setForm3({ ...form3, soKgMocNhan: Number(v) })} type="number" />
                <F label="Số cây" v={form3.soCayMoc} on={(v) => setForm3({ ...form3, soCayMoc: Number(v) })} type="number" />
                <F label="Kg lỗi" v={form3.soKgLoi} on={(v) => setForm3({ ...form3, soKgLoi: Number(v) })} type="number" />
                <F label="Chi phí phát sinh" v={form3.chiPhiPhatSinh} on={(v) => setForm3({ ...form3, chiPhiPhatSinh: Number(v) })} type="number" />
              </div>
              {(() => {
                const lenhDangCho = me?.lenhDet.find((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy");
                if (!lenhDangCho) return null;
                const haoHutPt = ((lenhDangCho.soKgGiao - form3.soKgMocNhan) / lenhDangCho.soKgGiao) * 100;
                const canhBao = haoHutPt <= 4 ? "🟢 Tốt" : haoHutPt <= 10 ? "🟡 Cảnh báo" : "🔴 Vượt";
                return (
                  <div className={`p-3 rounded text-sm ${haoHutPt <= 4 ? "bg-emerald-50" : haoHutPt <= 10 ? "bg-amber-50" : "bg-rose-50"}`}>
                    Hao hụt: <strong>{haoHutPt.toFixed(1)}%</strong> · {canhBao}
                  </div>
                );
              })()}
            </>
          )}

          {/* STEP 4: MẺ NHUỘM */}
          {step === "menhuom" && (
            <>
              <h3 className="font-bold text-rose-600">🎨 Tạo mẻ nhuộm nhiều màu</h3>

              {goiYNhuom && goiYNhuom.tongKgMoc > 0 && (
                <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> 💡 Gợi ý gộp {goiYNhuom.tongKgMoc}kg mộc:
                  </div>
                  {goiYNhuom.goiY.map((g, i) => (
                    <div key={i} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
                      <div className="font-semibold">→ {g.soMauDeXuat} màu: {g.cacMauPhoBien.join(", ")}</div>
                      <div className="opacity-70">{g.lyDo}</div>
                      <button
                        onClick={() => {
                          const mauList = g.cacMauPhoBien.map((mau: string) => ({
                            mau, soKg: Math.floor(g.tongKg / g.cacMauPhoBien.length),
                            donGiaNhuom: 12000,
                          }));
                          setForm4({ ...form4, danhSachMau: mauList, tongKgXuat: g.tongKg });
                          toast.success("Đã áp dụng gợi ý");
                        }}
                        className="text-[10px] mt-1 px-2 py-0.5 rounded bg-rose-500 text-white"
                      >
                        Áp dụng
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <F label="Xưởng nhuộm" v={form4.xuongNhuom} on={(v) => setForm4({ ...form4, xuongNhuom: v })} />
              <div className="p-2 rounded bg-white dark:bg-slate-800">
                <div className="font-semibold text-sm mb-1">🎨 Danh sách màu:</div>
                {form4.danhSachMau.map((m, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 mb-1 text-xs">
                    <input value={m.mau} onChange={(e) => {
                      const newM = [...form4.danhSachMau];
                      newM[i] = { ...m, mau: e.target.value };
                      setForm4({ ...form4, danhSachMau: newM });
                    }} className="px-2 py-1 rounded border" />
                    <input type="number" value={m.soKg} onChange={(e) => {
                      const newM = [...form4.danhSachMau];
                      newM[i] = { ...m, soKg: Number(e.target.value) };
                      setForm4({ ...form4, danhSachMau: newM });
                    }} className="px-2 py-1 rounded border text-right" />
                    <input type="number" value={m.donGiaNhuom} onChange={(e) => {
                      const newM = [...form4.danhSachMau];
                      newM[i] = { ...m, donGiaNhuom: Number(e.target.value) };
                      setForm4({ ...form4, danhSachMau: newM });
                    }} className="px-2 py-1 rounded border text-right" />
                    <div className="text-xs flex items-center opacity-70">= {(m.soKg * m.donGiaNhuom).toLocaleString()}đ</div>
                  </div>
                ))}
                <button onClick={() => setForm4({ ...form4, danhSachMau: [...form4.danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 10000 }] })} className="text-xs text-blue-600">+ Thêm màu</button>
              </div>
            </>
          )}

          {/* STEP 5: NGHIỆM THU MÀU */}
          {step === "nghiemthumau" && (
            <>
              <h3 className="font-bold text-pink-600">🎨 Nghiệm thu từng màu riêng</h3>
              {form5.map((m, i) => (
                <div key={i} className="p-2 rounded bg-pink-50 dark:bg-pink-900/20 text-xs">
                  <div className="font-bold mb-1">{m.mau}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <F label="Kg mộc giao" v={m.soKgMocGiao} on={(v) => {
                      const newM = [...form5];
                      newM[i] = { ...m, soKgMocGiao: Number(v) };
                      setForm5(newM);
                    }} type="number" />
                    <F label="Kg màu nhận" v={m.soKgMauNhan} on={(v) => {
                      const newM = [...form5];
                      newM[i] = { ...m, soKgMauNhan: Number(v) };
                      setForm5(newM);
                    }} type="number" />
                    <F label="Cây" v={m.soCayNhan} on={(v) => {
                      const newM = [...form5];
                      newM[i] = { ...m, soCayNhan: Number(v) };
                      setForm5(newM);
                    }} type="number" />
                    <F label="Đơn giá" v={m.donGiaNhuom} on={(v) => {
                      const newM = [...form5];
                      newM[i] = { ...m, donGiaNhuom: Number(v) };
                      setForm5(newM);
                    }} type="number" />
                    <F label="Hóa chất" v={m.chiPhiHoaChat} on={(v) => {
                      const newM = [...form5];
                      newM[i] = { ...m, chiPhiHoaChat: Number(v) };
                      setForm5(newM);
                    }} type="number" />
                    <F label="Hoàn thiện" v={m.chiPhiHoanThien} on={(v) => {
                      const newM = [...form5];
                      newM[i] = { ...m, chiPhiHoanThien: Number(v) };
                      setForm5(newM);
                    }} type="number" />
                  </div>
                  {(() => {
                    const haoHutPt = m.soKgMocGiao > 0 ? ((m.soKgMocGiao - m.soKgMauNhan) / m.soKgMocGiao) * 100 : 0;
                    return (
                      <div className={`mt-1 text-xs ${haoHutPt <= 3 ? "text-emerald-600" : haoHutPt <= 5 ? "text-amber-600" : "text-rose-600"}`}>
                        Hao hụt: {haoHutPt.toFixed(1)}%
                      </div>
                    );
                  })()}
                </div>
              ))}
            </>
          )}

          {/* STEP 6: KHO VẢI TP */}
          {step === "khotp" && (
            <>
              <h3 className="font-bold text-emerald-600">📦 Nhập kho vải TP (từng cây)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <F label="Mã lô" v={form6.maLo} on={(v) => setForm6({ ...form6, maLo: v })} />
                <F label="Màu" v={form6.mau} on={(v) => setForm6({ ...form6, mau: v })} />
                <F label="Loại vải" v={form6.loaiVai} on={(v) => setForm6({ ...form6, loaiVai: v })} />
                <F label="Giá vốn/kg" v={form6.giaVonPerKg} on={(v) => setForm6({ ...form6, giaVonPerKg: Number(v) })} type="number" />
                <F label="Khu" v={form6.khu} on={(v) => setForm6({ ...form6, khu: v })} />
                <F label="Kệ" v={form6.ke} on={(v) => setForm6({ ...form6, ke: v })} />
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-800">
                <div className="font-semibold text-sm mb-1">📦 Từng cây:</div>
                {form6.danhSachCay.map((c, i) => (
                  <div key={i} className="grid grid-cols-3 gap-1 mb-1 text-xs">
                    <div className="flex items-center">Cây {String(c.stt).padStart(2, "0")}</div>
                    <input type="number" step="0.1" value={c.kg} onChange={(e) => {
                      const newC = [...form6.danhSachCay];
                      newC[i] = { ...c, kg: parseFloat(e.target.value) };
                      setForm6({ ...form6, danhSachCay: newC });
                    }} className="px-2 py-1 rounded border text-right" />
                    <div className="opacity-70">kg</div>
                  </div>
                ))}
                <div className="text-sm mt-2">
                  Tổng: <strong>{form6.danhSachCay.reduce((s, c) => s + c.kg, 0).toFixed(1)}kg</strong> ·
                  Giá trị: <strong className="text-emerald-600">{(form6.danhSachCay.reduce((s, c) => s + c.kg, 0) * form6.giaVonPerKg).toLocaleString()}đ</strong>
                </div>
              </div>
            </>
          )}

          {/* STEP 7: QC */}
          {step === "qc" && me && (
            <>
              <h3 className="font-bold text-amber-600">✅ QC tổng hợp chất lượng mẻ sợi</h3>
              <div className={`card p-4 bg-gradient-to-br ${
                me.chatLuong.diem >= 80 ? "from-emerald-500/10 to-green-500/10" :
                me.chatLuong.diem >= 60 ? "from-amber-500/10 to-yellow-500/10" :
                "from-rose-500/10 to-red-500/10"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-70">Điểm chất lượng</div>
                    <div className="text-5xl font-bold">{me.chatLuong.diem}/100</div>
                  </div>
                  <div className="text-3xl font-bold">{me.chatLuong.xepLoai}</div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div>• Sợi: <strong>{me.phieuNhap?.soKg}kg</strong> → Dệt: <strong>{me.tongKgMocNhan}kg</strong> ({me.haoHutDetPt.toFixed(1)}% hao hụt)</div>
                <div>• Nhuộm: <strong>{me.tongKgMauThanhPham.toFixed(1)}kg</strong> ({me.haoHutNhuomPt.toFixed(1)}% hao hụt)</div>
                <div>• Vải TP: <strong>{me.tongKgTP.toFixed(1)}kg</strong> · Tổng hao hụt sợi→TP: <strong className={me.chatLuong.tongHaoHutPt > 15 ? "text-rose-600" : ""}>{me.chatLuong.tongHaoHutPt.toFixed(1)}%</strong></div>
              </div>

              <textarea
                placeholder="Ghi chú QC..."
                value={form7.ghiChuQC}
                onChange={(e) => setForm7({ ghiChuQC: e.target.value })}
                className="w-full px-3 py-2 rounded border text-sm"
                rows={3}
              />
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 sticky bottom-0 bg-white dark:bg-slate-900">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 bg-blue-500">
            {loading ? "Đang xử lý..." : "✅ Lưu & Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper import for me in modal
import {
  getAllPhieuNhapSoi as getAllPNS_Global,
  getAllLenhDet as getAllLD_Global,
} from "@/lib/yarn-production-chain";
const tongQuansAll: Record<string, MeSoiTongQuan> = {};

// ============ NEW MẺ SỢI MODAL ============
function NewMeSoiModal({ user, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    ncc: "Cty Sợi Việt Nam", loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s",
    maLoSoi: `LSOI-${Date.now().toString().slice(-3)}`,
    soKg: 1000, donGia: 145000, daThanhToan: 0,
    khoNhap: "Kho Sợi", nguoiPhuTrach: user?.name || "Kho sợi", ghiChu: "",
  });

  const handleSave = () => {
    const r = nhapKhoSoi_V2({
      ...form, nccId: form.ncc, tenNCC: form.ncc, khoa: false,
    } as any, user);
    if (r.ok) { toast.success(r.message); onSuccess(); }
    else toast.error(r.message);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full shadow-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> Tạo mẻ sợi mới</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <F label="Mã lô" v={form.maLoSoi} on={(v) => setForm({ ...form, maLoSoi: v })} />
            <F label="NCC" v={form.ncc} on={(v) => setForm({ ...form, ncc: v })} />
            <F label="Loại sợi" v={form.loaiSoi} on={(v) => setForm({ ...form, loaiSoi: v })} />
            <F label="Tên sợi" v={form.tenSoi} on={(v) => setForm({ ...form, tenSoi: v })} />
            <F label="Số kg" v={form.soKg} on={(v) => setForm({ ...form, soKg: Number(v) })} type="number" />
            <F label="Đơn giá/kg" v={form.donGia} on={(v) => setForm({ ...form, donGia: Number(v) })} type="number" />
          </div>
          <div className="p-2 rounded bg-blue-50 text-sm">
            Thành tiền: <strong>{(form.soKg * form.donGia).toLocaleString()}đ</strong>
          </div>
        </div>
        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button onClick={handleSave} className="btn-primary flex-1 bg-blue-500">✅ Tạo mẻ sợi</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, v, on, type = "text" }: { label: string; v: any; on: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e) => on(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
      />
    </div>
  );
}
