"use client";

import { useWizard } from "../WizardContext";
import { Calculator } from "lucide-react";

export function Step5COGS() {
  const { state } = useWizard();
  
  const tongSL = Number(state.tongSL) || 0;
  
  // 1. Fabric cost
  const tongTienVai = state.dsMau.reduce((acc, m) => {
    const sl = m.slDuKien || 0;
    const dinhMuc = m.dinhMuc || 0;
    const donGia = m.donGia || 0;
    const haoHut = m.haoHut || 5;
    const kg = (sl * dinhMuc) * (1 + haoHut / 100);
    return acc + (kg * donGia);
  }, 0);
  
  const chiPhiVaiBQ = tongSL > 0 ? tongTienVai / tongSL : 0;

  // 2. Accessories cost
  const tongTienPL = state.dsPhuLieu.reduce((acc, p) => acc + ((p.soLuong || 0) * (p.donGia || 0)), 0);
  const chiPhiPLBQ = tongSL > 0 ? tongTienPL / tongSL : 0;

  // 3. Subcontracting cost
  const phanCong = state.phanCong;
  const chiPhiGiaCong1SP = phanCong.reduce((acc, p) => acc + (p.donGia || 0), 0);
  const tongTienGiaCong = chiPhiGiaCong1SP * tongSL;

  // 4. Fixed cost
  const chiPhiCoDinh = state.chiPhiCoDinh;
  const chiPhiCoDinh1SP = (chiPhiCoDinh.baoBi || 0) + (chiPhiCoDinh.temNhan || 0) + (chiPhiCoDinh.khauHao || 0);
  const tongTienCoDinh = chiPhiCoDinh1SP * tongSL;

  // Total
  const giaVon1SP = chiPhiVaiBQ + chiPhiPLBQ + chiPhiGiaCong1SP + chiPhiCoDinh1SP;
  const tongGiaVon = tongTienVai + tongTienPL + tongTienGiaCong + tongTienCoDinh;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Bảng Tính Giá Vốn (COGS)
        </h2>
        <p className="text-sm text-slate-500">Tổng hợp chi phí và tính toán giá vốn dự kiến trên 1 sản phẩm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Chi phí sản xuất</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chi phí vải (Bình quân)</span>
                <span className="font-medium">{formatCurrency(chiPhiVaiBQ)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chi phí phụ liệu (Bình quân)</span>
                <span className="font-medium">{formatCurrency(chiPhiPLBQ)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chi phí gia công</span>
                <span className="font-medium">{formatCurrency(chiPhiGiaCong1SP)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chi phí cố định (Bao bì, khấu hao...)</span>
                <span className="font-medium">{formatCurrency(chiPhiCoDinh1SP)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-8 rounded-2xl shadow-xl shadow-violet-500/20 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calculator className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div>
              <div className="text-violet-200 text-sm font-medium uppercase tracking-wider mb-1">Giá vốn dự kiến / 1 SP</div>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight">
                {formatCurrency(giaVon1SP)}
              </div>
            </div>

            <div className="pt-6 border-t border-white/20">
              <div className="text-violet-200 text-sm mb-1">Tổng giá vốn lô hàng ({tongSL} sp)</div>
              <div className="text-2xl font-bold">
                {formatCurrency(tongGiaVon)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
