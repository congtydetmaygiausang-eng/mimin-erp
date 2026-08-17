"use client";

import { useState, useEffect } from "react";
import { Calculator, ArrowRight, Receipt, Ruler, Sparkles, Scissors, Save, List, Trash2, Layers, Image as ImageIcon, Edit, Check, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";

interface SavedConfig {
  id: string;
  name: string;
  loaiSP: string;
  soSize: number;
  giaVai: string;
  tongMet: string;
  giaMay: string;
  giaDongGoi: string;
  giaVatTu: string;
  phiDieuPhoi: string;
  vatPercent: number;
  soLuongCat: string;
  tongGiaVon: number;
  images?: UploadedFile[];
  createdAt: string;
}

export default function CongThucDinhMucPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState<string>("");
  const [loaiSP, setLoaiSP] = useState<string>("Áo");
  const [giaVai, setGiaVai] = useState<string>("");
  const [tongMet, setTongMet] = useState<string>("");
  const [soSize, setSoSize] = useState<number>(6);

  // Thêm các loại giá
  const [giaMay, setGiaMay] = useState<string>("");
  const [giaDongGoi, setGiaDongGoi] = useState<string>("");
  const [giaVatTu, setGiaVatTu] = useState<string>("");
  const [phiDieuPhoi, setPhiDieuPhoi] = useState<string>("");
  const [vatPercent, setVatPercent] = useState<number>(0);

  // Thêm dự tính số lượng cắt
  const [soLuongCat, setSoLuongCat] = useState<string>("");
  
  // Hình ảnh sản phẩm
  const [images, setImages] = useState<UploadedFile[]>([]);

  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [viewingConfig, setViewingConfig] = useState<SavedConfig | null>(null);

  // Tự động điều chỉnh số size mặc định theo loại sản phẩm
  useEffect(() => {
    if (loaiSP === "Quần") setSoSize(5);
    else setSoSize(6); // Áo, Bộ
  }, [loaiSP]);

  // Load saved configs from local storage on mount
  useEffect(() => {
    try {
      const data = localStorage.getItem("mimin_cong_thuc_dinh_muc");
      if (data) {
        setSavedConfigs(JSON.parse(data));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Logic tính toán
  const numGiaVai = parseFloat(giaVai.replace(/,/g, "")) || 0;
  const numTongMet = parseFloat(tongMet.replace(/,/g, "")) || 0;
  const numGiaMay = parseFloat(giaMay.replace(/,/g, "")) || 0;
  const numDongGoi = parseFloat(giaDongGoi.replace(/,/g, "")) || 0;
  const numVatTu = parseFloat(giaVatTu.replace(/,/g, "")) || 0;
  const numPhiDieuPhoi = parseFloat(phiDieuPhoi.replace(/,/g, "")) || 0;
  const numSoLuongCat = parseFloat(soLuongCat.replace(/,/g, "")) || 0;

  const tongGiaTienVai = numGiaVai * numTongMet;
  const binhQuanTienVaiSP = soSize > 0 ? tongGiaTienVai / soSize : 0;
  const dinhMucMet1SP = soSize > 0 ? numTongMet / soSize : 0;
  const tongGiaVonChuaVat = binhQuanTienVaiSP + numGiaMay + numDongGoi + numVatTu + numPhiDieuPhoi;
  const tienVat = tongGiaVonChuaVat * (vatPercent / 100);
  const tongGiaVon = tongGiaVonChuaVat + tienVat;

  const tongMetCanMua = dinhMucMet1SP * numSoLuongCat;
  const tongChiPhiDonHang = tongGiaVon * numSoLuongCat;

  // Format helper
  const formatMoney = (val: number) => {
    return val.toLocaleString("vi-VN");
  };

  const handleNumberChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    if (!rawValue) {
      setter("");
      return;
    }
    setter(parseInt(rawValue, 10).toLocaleString("en-US"));
  };

  const handleTongMetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, "");
    setTongMet(val);
  };

  const handleSoSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
    setSoSize(isNaN(val) ? 0 : val);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setImages([]);
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập Tên định mức để lưu!");
      return;
    }
    if (tongGiaVon === 0) {
      toast.error("Tổng giá vốn đang là 0. Vui lòng nhập số liệu hợp lệ.");
      return;
    }

    const newConfig: SavedConfig = {
      id: editingId ? editingId : Date.now().toString(),
      name: name.trim(),
      loaiSP,
      soSize,
      giaVai,
      tongMet,
      giaMay,
      giaDongGoi,
      giaVatTu,
      phiDieuPhoi,
      vatPercent,
      soLuongCat,
      tongGiaVon,
      images,
      createdAt: new Date().toLocaleString("vi-VN"),
    };

    let updated;
    if (editingId) {
      updated = savedConfigs.map(c => c.id === editingId ? newConfig : c);
    } else {
      updated = [newConfig, ...savedConfigs];
    }
    
    try {
      localStorage.setItem("mimin_cong_thuc_dinh_muc", JSON.stringify(updated));
      setSavedConfigs(updated);
      toast.success(editingId ? "Cập nhật thành công!" : "Đã lưu định mức mới thành công!");
      resetForm();
    } catch (e) {
      toast.error("Bộ nhớ trình duyệt đã đầy (do lưu quá nhiều ảnh). Hãy xoá bớt các định mức cũ.");
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá định mức này?")) return;
    const updated = savedConfigs.filter(c => c.id !== id);
    setSavedConfigs(updated);
    localStorage.setItem("mimin_cong_thuc_dinh_muc", JSON.stringify(updated));
    toast.success("Đã xoá bản lưu.");
    if (editingId === id) resetForm();
  };

  const handleLoad = (config: SavedConfig) => {
    setEditingId(config.id);
    setName(config.name);
    setLoaiSP(config.loaiSP);
    setSoSize(config.soSize);
    setGiaVai(config.giaVai);
    setTongMet(config.tongMet);
    setGiaMay(config.giaMay);
    setGiaDongGoi(config.giaDongGoi);
    setGiaVatTu(config.giaVatTu);
    setPhiDieuPhoi(config.phiDieuPhoi || "");
    setVatPercent(config.vatPercent || 0);
    setSoLuongCat(config.soLuongCat || "");
    setImages(config.images || []);
    toast.success("Đã tải dữ liệu. Bạn có thể chỉnh sửa và cập nhật lại.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 shadow-lg shadow-black/5 flex items-center justify-center text-white backdrop-blur-sm border border-white/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Công thức định mức & Giá vốn</h1>
            <p className="text-white/80 text-sm mt-1 font-medium">Bảng tính tổng hợp, quản lý danh sách các mẫu đã tính</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {editingId && (
            <button 
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-xl font-medium transition-all bg-white shadow-sm ring-1 ring-slate-200"
            >
              Huỷ sửa
            </button>
          )}
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg ${
              editingId 
                ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/30 hover:from-indigo-600 hover:to-blue-700" 
                : "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700"
            }`}
          >
            {editingId ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {editingId ? "Cập nhật định mức" : "Lưu thành định mức mới"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CỘT TRÁI: Form nhập liệu */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Receipt className="w-4 h-4" />
              </span>
              Thông tin \u0026 Loại sản phẩm
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 text-rose-500">Tên định mức *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Áo Polo Trắng M758..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại sản phẩm</label>
                  <select 
                    value={loaiSP}
                    onChange={(e) => setLoaiSP(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium bg-white"
                  >
                    <option value="Áo">Áo</option>
                    <option value="Quần">Quần</option>
                    <option value="Bộ">Bộ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số size (1 dây)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={soSize || ""}
                      onChange={handleSoSizeChange}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">size</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Thông số vải */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <Ruler className="w-4 h-4" />
                </span>
                1. Thông số vải
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá tiền vải 1 mét</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={giaVai}
                      onChange={handleNumberChange(setGiaVai)}
                      placeholder="VD: 150,000"
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tổng mét ({soSize} size)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tongMet}
                      onChange={handleTongMetChange}
                      placeholder="VD: 8.5"
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Chi phí gia công & phụ liệu */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  <Scissors className="w-4 h-4" />
                </span>
                2. Gia công \u0026 Phụ liệu
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá may / 1 SP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={giaMay}
                      onChange={handleNumberChange(setGiaMay)}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá đóng gói / 1 SP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={giaDongGoi}
                      onChange={handleNumberChange(setGiaDongGoi)}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                    Giá vật tư / 1 SP 
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={giaVatTu}
                      onChange={handleNumberChange(setGiaVatTu)}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phí dịch vụ điều phối</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phiDieuPhoi}
                      onChange={handleNumberChange(setPhiDieuPhoi)}
                      placeholder="Chi phí điều phối ĐTSX"
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-800 font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">đ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thuế VAT (%)</label>
                  <div className="flex gap-3">
                    {[0, 8, 10].map(val => (
                      <label key={val} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border cursor-pointer transition-colors ${vatPercent === val ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-medium'}`}>
                        <input 
                          type="radio" 
                          name="vatPercent" 
                          value={val} 
                          checked={vatPercent === val} 
                          onChange={(e) => setVatPercent(Number(e.target.value))} 
                          className="sr-only" 
                        />
                        {val}%
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 3: Dự tính vật tư cần xuất */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <Layers className="w-4 h-4" />
                </span>
                3. Kế hoạch mua/cắt
              </h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số lượng cần cắt (SP)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={soLuongCat}
                    onChange={handleNumberChange(setSoLuongCat)}
                    placeholder="VD: 1,000"
                    className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium bg-blue-50/30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">cái</span>
                </div>
              </div>
            </div>

            {/* Section 4: Hình ảnh */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
                  <ImageIcon className="w-4 h-4" />
                </span>
                4. Hình ảnh (tuỳ chọn)
              </h2>
              
              <ImageUploader 
                files={images} 
                onChange={setImages} 
                category="Ảnh sản phẩm" 
              />
            </div>
          </div>

        </div>

        {/* CỘT PHẢI: Kết quả */}
        <div className="space-y-6">
          <div className="bg-[#0B4D5D] rounded-2xl p-8 shadow-xl relative overflow-hidden h-fit sticky top-6">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-48 h-48 text-white" />
            </div>

            <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-400">
                <Receipt className="w-4 h-4" />
              </span>
              Kết quả tính toán
            </h2>

            <div className="space-y-6">
              
              {/* Phân rã chi phí */}
              <div className="bg-white/5 rounded-2xl p-5 ring-1 ring-white/10 backdrop-blur-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div className="text-slate-300 text-sm font-medium">1. Tiền vải (1 SP)</div>
                  <div className="text-white font-bold">{formatMoney(Math.round(binhQuanTienVaiSP))} đ</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div className="text-slate-300 text-sm font-medium">2. Tiền may (1 SP)</div>
                  <div className="text-white font-bold">{formatMoney(numGiaMay)} đ</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div className="text-slate-300 text-sm font-medium">3. Tiền đóng gói (1 SP)</div>
                  <div className="text-white font-bold">{formatMoney(numDongGoi)} đ</div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div className="text-slate-300 text-sm font-medium">4. Tiền vật tư (1 SP)</div>
                  <div className="text-white font-bold">{formatMoney(numVatTu)} đ</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-slate-300 text-sm font-medium">5. Phí điều phối (1 SP)</div>
                  <div className="text-white font-bold">{formatMoney(numPhiDieuPhoi)} đ</div>
                </div>
              </div>

              {/* Tổng cộng */}
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 shadow-lg shadow-teal-900/50 ring-1 ring-white/20 mt-8 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none transform -rotate-12">
                  <Calculator className="w-24 h-24 text-white" />
                </div>
                
                <div className="text-teal-50 text-sm font-medium mb-3 uppercase tracking-wider drop-shadow-sm">TỔNG GIÁ VỐN / SP</div>
                
                <div className="pt-2 border-t border-teal-400/30 mt-2 space-y-2 mb-4">
                  <div className="flex justify-between items-center text-teal-100 text-sm">
                    <div>Tổng giá vốn (trước VAT):</div>
                    <div>{formatMoney(Math.round(tongGiaVonChuaVat))} đ/SP</div>
                  </div>
                  {vatPercent > 0 && (
                    <div className="flex justify-between items-center text-teal-100 text-sm">
                      <div>Thuế VAT ({vatPercent}%):</div>
                      <div>{formatMoney(Math.round(tienVat))} đ/SP</div>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
                    {formatMoney(Math.round(tongGiaVon))}
                  </div>
                  <div className="text-teal-100 font-medium text-lg">VNĐ</div>
                </div>
              </div>

              {/* Box Kế hoạch cắt */}
              {numSoLuongCat > 0 && (
                <div className="bg-white/10 rounded-2xl p-6 ring-1 ring-white/20 backdrop-blur-sm border-l-4 border-l-blue-400 mt-6">
                  <div className="text-blue-200 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" /> KẾ HOẠCH CẮT {formatMoney(numSoLuongCat)} SP
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-slate-300 text-sm">Tổng mét vải cần:</div>
                      <div className="text-white font-bold text-xl">{tongMetCanMua.toLocaleString("en-US", { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">mét</span></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-slate-300 text-sm">Tổng chi phí Đơn hàng:</div>
                      <div className="text-white font-bold text-xl">{formatMoney(Math.round(tongChiPhiDonHang))} <span className="text-sm font-normal text-slate-400">VNĐ</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH BẢNG LƯU PHÍA DƯỚI */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <List className="w-4 h-4" />
              </span>
              Bảng lưu Lịch sử Định mức
            </h2>
            <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              Tổng cộng: <span className="font-bold text-slate-700">{savedConfigs.length}</span> mẫu đã lưu
            </div>
          </div>

          {savedConfigs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              Chưa có định mức nào được lưu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-sm text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pt-2 px-4 font-semibold">Hình ảnh</th>
                    <th className="pb-3 pt-2 px-4 font-semibold">Tên Mẫu \u0026 Loại SP</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-right">Chi phí Vải (1 SP)</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-right">Chi phí Gia công</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-right text-teal-600">Tổng Vốn/SP</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-right">SL Cắt \u0026 Tổng Mét</th>
                    <th className="pb-3 pt-2 px-4 font-semibold text-center w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {savedConfigs.map((config) => {
                    const tienVai1SP = parseFloat(config.giaVai.replace(/,/g, "")) * parseFloat(config.tongMet.replace(/,/g, "")) / config.soSize || 0;
                    const giaMay = parseFloat(config.giaMay.replace(/,/g, "")) || 0;
                    const dongGoi = parseFloat(config.giaDongGoi.replace(/,/g, "")) || 0;
                    const vatTu = parseFloat(config.giaVatTu.replace(/,/g, "")) || 0;
                    const slCat = parseFloat((config.soLuongCat || "").replace(/,/g, "")) || 0;
                    const tongMetMua = slCat > 0 ? (parseFloat(config.tongMet.replace(/,/g, "")) / config.soSize) * slCat : 0;

                    return (
                      <tr key={config.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4">
                          {config.images && config.images.length > 0 ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                              <img src={config.images[0].dataUrl} className="w-full h-full object-cover hover:scale-110 transition-transform" alt="sp" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-sm mb-1">{config.name}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{config.loaiSP}</span>
                            <span>{config.createdAt.split(" ")[0]}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-medium text-slate-700">{formatMoney(Math.round(tienVai1SP))} đ</div>
                          <div className="text-xs text-slate-400 mt-1">{config.giaVai}đ/m</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-sm text-slate-600">May: {formatMoney(giaMay)} đ</div>
                          <div className="text-sm text-slate-600">Đ.gói: {formatMoney(dongGoi)} đ</div>
                          <div className="text-sm text-slate-600">V.tư: {formatMoney(vatTu)} đ</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-bold text-teal-600 text-lg">{formatMoney(config.tongGiaVon)} đ</div>
                        </td>
                        <td className="p-4 text-right">
                          {slCat > 0 ? (
                            <>
                              <div className="font-bold text-blue-600">{formatMoney(slCat)} cái</div>
                              <div className="text-xs text-blue-500 mt-1">Cần: {tongMetMua.toLocaleString("en-US", {maximumFractionDigits: 2})} m</div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa nhập</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setViewingConfig(config)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Xem chi tiết tổng thể"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleLoad(config)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Sửa định mức"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(config.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xoá"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" /> Tổng Thể Định Mức: {viewingConfig.name}
              </h3>
              <button onClick={() => setViewingConfig(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex gap-6">
                <div className="w-32 h-32 shrink-0 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {viewingConfig.images && viewingConfig.images.length > 0 ? (
                    <img src={viewingConfig.images[0].dataUrl} className="w-full h-full object-cover" alt="sp" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Loại sản phẩm:</span>
                    <span className="font-semibold text-slate-800">{viewingConfig.loaiSP} ({viewingConfig.soSize} size)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Kế hoạch cắt:</span>
                    <span className="font-semibold text-slate-800">{viewingConfig.soLuongCat ? `${formatMoney(parseFloat(viewingConfig.soLuongCat.replace(/,/g, "")))} cái` : "Chưa nhập"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Ngày tạo:</span>
                    <span className="text-sm text-slate-800">{viewingConfig.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">Chi tiết giá vốn / 1 Sản phẩm</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Tiền vải ({viewingConfig.giaVai}đ/m x {(parseFloat(viewingConfig.tongMet.replace(/,/g, "")) / viewingConfig.soSize).toFixed(2)}m):</span>
                  <span className="font-medium text-slate-800">{formatMoney(Math.round(parseFloat(viewingConfig.giaVai.replace(/,/g, "")) * parseFloat(viewingConfig.tongMet.replace(/,/g, "")) / viewingConfig.soSize))} đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Tiền may gia công:</span>
                  <span className="font-medium text-slate-800">{formatMoney(parseFloat(viewingConfig.giaMay.replace(/,/g, "")) || 0)} đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Tiền đóng gói:</span>
                  <span className="font-medium text-slate-800">{formatMoney(parseFloat(viewingConfig.giaDongGoi.replace(/,/g, "")) || 0)} đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Tiền vật tư:</span>
                  <span className="font-medium text-slate-800">{formatMoney(parseFloat(viewingConfig.giaVatTu.replace(/,/g, "")) || 0)} đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Phí điều phối:</span>
                  <span className="font-medium text-slate-800">{formatMoney(parseFloat(viewingConfig.phiDieuPhoi?.replace(/,/g, "") || "0"))} đ</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-slate-200 border-dashed space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700">Tổng (trước VAT):</span>
                    <span className="font-semibold text-slate-800">
                      {formatMoney(
                        Math.round(parseFloat(viewingConfig.giaVai.replace(/,/g, "")) * parseFloat(viewingConfig.tongMet.replace(/,/g, "")) / viewingConfig.soSize) +
                        (parseFloat(viewingConfig.giaMay.replace(/,/g, "")) || 0) +
                        (parseFloat(viewingConfig.giaDongGoi.replace(/,/g, "")) || 0) +
                        (parseFloat(viewingConfig.giaVatTu.replace(/,/g, "")) || 0) +
                        (parseFloat(viewingConfig.phiDieuPhoi?.replace(/,/g, "") || "0"))
                      )} đ
                    </span>
                  </div>
                  {viewingConfig.vatPercent > 0 && (
                    <div className="flex justify-between items-center text-sm text-slate-500">
                      <span>Thuế VAT ({viewingConfig.vatPercent}%):</span>
                      <span>
                        {formatMoney(
                          Math.round((
                            Math.round(parseFloat(viewingConfig.giaVai.replace(/,/g, "")) * parseFloat(viewingConfig.tongMet.replace(/,/g, "")) / viewingConfig.soSize) +
                            (parseFloat(viewingConfig.giaMay.replace(/,/g, "")) || 0) +
                            (parseFloat(viewingConfig.giaDongGoi.replace(/,/g, "")) || 0) +
                            (parseFloat(viewingConfig.giaVatTu.replace(/,/g, "")) || 0) +
                            (parseFloat(viewingConfig.phiDieuPhoi?.replace(/,/g, "") || "0"))
                          ) * (viewingConfig.vatPercent / 100))
                        )} đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-slate-800">TỔNG GIÁ VỐN / SP:</span>
                    <span className="font-bold text-2xl text-teal-600">{formatMoney(Math.round(viewingConfig.tongGiaVon))} VNĐ</span>
                  </div>
                </div>
              </div>

              {viewingConfig.soLuongCat && parseFloat(viewingConfig.soLuongCat.replace(/,/g, "")) > 0 && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Layers className="w-4 h-4" /> Kế hoạch sản xuất</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-blue-50 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Tổng vải cần xuất</div>
                      <div className="font-bold text-blue-700">
                        {((parseFloat(viewingConfig.tongMet.replace(/,/g, "")) / viewingConfig.soSize) * parseFloat(viewingConfig.soLuongCat.replace(/,/g, ""))).toLocaleString("en-US", {maximumFractionDigits: 2})} mét
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-50 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">Tổng chi phí dự kiến</div>
                      <div className="font-bold text-blue-700">
                        {formatMoney(Math.round(viewingConfig.tongGiaVon * parseFloat(viewingConfig.soLuongCat.replace(/,/g, ""))))} VNĐ
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setViewingConfig(null)} className="btn-secondary px-6">Đóng</button>
              <button 
                onClick={() => {
                  handleLoad(viewingConfig);
                  setViewingConfig(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="btn-primary px-6 inline-flex gap-2 items-center"
              >
                <Edit className="w-4 h-4" />
                Sửa định mức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
