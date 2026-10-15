import { useEffect, useState } from "react";
import { Eye, Printer, Trash2, LayoutList } from "lucide-react";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { Modal } from "./ui-blocks";

function lamTronTheo100Dong(so: number) {
  return Math.round(so / 100) * 100;
}

export function DanhSachLenhTong({ onXemChiTiet }: { onXemChiTiet?: (lenh: any) => void }) {
  const [danhSach, setDanhSach] = useState<any[]>([]);
  const [hienPhieu, setHienPhieu] = useState<any>(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem("mimin_lenh_tong_list");
      if (data) setDanhSach(JSON.parse(data));
    } catch {}
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa lệnh này khỏi danh sách hiển thị? (Không xóa dữ liệu gốc trong hệ thống)")) {
      const newList = danhSach.filter(x => x.id !== id);
      setDanhSach(newList);
      localStorage.setItem("mimin_lenh_tong_list", JSON.stringify(newList));
    }
  };

  if (danhSach.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 italic bg-white/50 rounded-xl border border-white/20 mt-4">
        Chưa có lệnh sản xuất nào được tạo và lưu trong danh sách này.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {danhSach.map((lenh) => (
        <div key={lenh.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-bold text-sky-700 flex items-center gap-1.5">
                <LayoutList className="w-4 h-4" /> {lenh.id}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium"><DateDisplay value={lenh.ngayTao} format="dd/MM/yyyy HH:mm" /></div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="font-bold text-amber-600">{lenh.tongCong?.toLocaleString()}đ</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setHienPhieu(lenh)} className="text-sky-600 bg-sky-50 px-2 py-1 hover:bg-sky-100 rounded transition-colors text-[10px] font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Chi tiết
                </button>
                <button onClick={() => handleDelete(lenh.id)} className="text-rose-500 bg-rose-50 p-1 hover:bg-rose-100 rounded transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-3">
            <div className="bg-blue-50 text-blue-800 p-2.5 rounded-lg border border-blue-100">
              <div className="font-bold mb-1 border-b border-blue-200/60 pb-1.5 text-[10px] tracking-widest uppercase">Sợi ({lenh.vatSoi || 0}% VAT)</div>
              <div className="truncate font-semibold">{lenh.tenNccSoi}</div>
              <div className="font-bold text-blue-600 mt-0.5">{lenh.tongKgSoi?.toLocaleString()} kg</div>
            </div>
            <div className="bg-violet-50 text-violet-800 p-2.5 rounded-lg border border-violet-100">
              <div className="font-bold mb-1 border-b border-violet-200/60 pb-1.5 text-[10px] tracking-widest uppercase">Dệt ({lenh.vatDet || 0}% VAT)</div>
              <div className="truncate font-semibold">{lenh.tenXuongDet}</div>
              <div className="font-bold text-violet-600 mt-0.5">Lệnh: {lenh.maLenhDet}</div>
            </div>
            <div className="bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-100">
              <div className="font-bold mb-1 border-b border-rose-200/60 pb-1.5 text-[10px] tracking-widest uppercase">Nhuộm ({lenh.vatNhuom || 0}% VAT)</div>
              <div className="truncate font-semibold">{lenh.tenXuongNhuom}</div>
              <div className="font-bold text-rose-600 mt-0.5">Mẻ: {lenh.maMeNhuom}</div>
            </div>
          </div>
        </div>
      ))}

      {hienPhieu && (
        <Modal onClose={() => setHienPhieu(null)}>
          <style>{`@media print {
            body * { visibility: hidden !important; }
            #phieu-san-xuat-vai, #phieu-san-xuat-vai * { visibility: visible !important; }
            #phieu-san-xuat-vai { position: absolute; inset: 0; width: 100%; background: white; }
            .khong-in { display: none !important; }
          }`}</style>
          <div id="phieu-san-xuat-vai" className="bg-white p-4 text-slate-900">
            <div className="border-b-2 border-[#307082] pb-3 text-center">
              <div className="text-sm font-bold text-[#307082]">MIMIN ERP</div>
              <h2 className="text-2xl font-black">PHIẾU SẢN XUẤT VẢI</h2>
              <div className="mt-1 text-xs text-slate-500">Ngày tạo: {hienPhieu.ngayTao}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">Lệnh dệt:</span> <b>{hienPhieu.maLenhDet}</b></div>
              <div><span className="text-slate-500">Mẻ nhuộm:</span> <b>{hienPhieu.maMeNhuom}</b></div>
              <div><span className="text-slate-500">NCC sợi:</span> <b>{hienPhieu.tenNccSoi}</b></div>
              <div><span className="text-slate-500">Xưởng dệt:</span> <b>{hienPhieu.tenXuongDet}</b></div>
              <div><span className="text-slate-500">Xưởng nhuộm:</span> <b>{hienPhieu.tenXuongNhuom}</b></div>
              <div><span className="text-slate-500">Kho dự kiến:</span> <b>Khu {hienPhieu.khu} · Kệ {hienPhieu.ke}</b></div>
            </div>

            <h3 className="mt-4 rounded bg-[#307082] px-3 py-2 font-bold text-white">1. DANH SÁCH SỢI – TỔNG {hienPhieu.tongKgSoi?.toLocaleString("vi-VN")} KG</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Loại sợi</th><th className="border p-2">Mã lô</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá</th><th className="border p-2 text-right">Thành tiền</th></tr></thead>
                <tbody>{hienPhieu.danhSachSoi?.map((item: any) => (
                  <tr key={item.id}><td className="border p-2">{item.loaiSoi}</td><td className="border p-2 text-center">{item.maLoSoi}</td><td className="border p-2 text-right">{item.soKg.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGia.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold">{(item.soKg * item.donGia).toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <h3 className="mt-4 rounded bg-[#EA990C] px-3 py-2 font-bold text-white">2. DANH SÁCH MÀU NHUỘM</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Mã vải</th><th className="border p-2">Màu</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá nhuộm</th></tr></thead>
                <tbody>{hienPhieu.danhSachMau?.map((item: any, index: number) => (
                  <tr key={`${item.maVai}-${index}`}><td className="border p-2">{item.maVai}</td><td className="border p-2 text-center">{item.mau}</td><td className="border p-2 text-right">{item.soKg.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGiaNhuom.toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between rounded-xl border-2 border-[#EA990C] bg-[#ECE7DC] p-3 text-lg font-black">
              <span>TỔNG CHI PHÍ</span><span>{hienPhieu.tongCong?.toLocaleString("vi-VN")}đ</span>
            </div>

            <h3 className="mt-4 rounded bg-[#307082] px-3 py-2 font-bold text-white">3. TỔNG HỢP GIÁ VỐN & HAO HỤT</h3>
            <div className="mt-2 overflow-x-auto">
              <div className="mb-2 font-semibold text-rose-700">
                {(() => {
                  const tongKgMau = hienPhieu.danhSachMau?.reduce((sum: number, m: any) => sum + m.soKg, 0) || 0;
                  const haoHutKg = (hienPhieu.tongKgSoi || 0) - tongKgMau;
                  const tyLeHaoHut = hienPhieu.tongKgSoi ? (haoHutKg / hienPhieu.tongKgSoi) * 100 : 0;
                  return `Hao hụt dự kiến: ${haoHutKg.toLocaleString("vi-VN")} kg (${tyLeHaoHut.toFixed(1)}%)`;
                })()}
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#ECE7DC]">
                    <th className="border p-2 text-left">Mã màu</th>
                    <th className="border p-2 text-right">Số kg</th>
                    <th className="border p-2 text-right">Giá vốn tổng</th>
                    <th className="border p-2 text-right font-black text-[#EA990C]">Giá vốn/kg</th>
                  </tr>
                </thead>
                <tbody>
                  {hienPhieu.danhSachMau?.map((item: any, index: number) => (
                    <tr key={`gv-${index}`}>
                      <td className="border p-2 font-semibold">{item.maVai} - {item.mau}</td>
                      <td className="border p-2 text-right">{item.soKg.toLocaleString("vi-VN")} kg</td>
                      <td className="border p-2 text-right">{lamTronTheo100Dong(item.giaVonDuKien ? item.giaVonDuKien * item.soKg : 0).toLocaleString("vi-VN")}đ</td>
                      <td className="border p-2 text-right font-black text-[#EA990C]">{lamTronTheo100Dong(item.giaVonDuKien || 0).toLocaleString("vi-VN")}đ/kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-8 text-center text-sm font-bold">
              <div>Người lập phiếu<br /><span className="font-normal text-slate-400">(Ký, ghi rõ họ tên)</span></div>
              <div>Xưởng dệt<br /><span className="font-normal text-slate-400">(Ký nhận)</span></div>
              <div>Quản lý<br /><span className="font-normal text-slate-400">(Ký duyệt)</span></div>
            </div>
          </div>
          <div className="khong-in mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setHienPhieu(null)} className="btn-secondary">Đóng</button>
            <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 bg-[#EA990C]">
              <Printer className="h-4 w-4" /> In phiếu này
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
