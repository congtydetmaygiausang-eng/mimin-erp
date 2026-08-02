"use client";

import { AutoActionFlow } from "@/components/AutoActionFlow";
import { Sparkles, Bot, Workflow } from "lucide-react";

export default function AutoActionFlowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bot className="w-6 h-6 text-violet-600" />
              MIN AI - Auto Action Flow
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-violet-500" />
              Trực quan hóa chế độ <strong>Nhân viên Tự động</strong> của MIN AI Sản xuất
            </p>
          </div>
        </div>

        {/* Flowchart */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/40">
          <AutoActionFlow />
        </div>

        {/* Spec chi tiết */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/40">
            <h3 className="font-bold text-violet-700 mb-2 flex items-center gap-1.5">
              <span>🎯</span> Vai trò vận hành
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>• Hiểu mục tiêu từ mô tả ngôn ngữ tự nhiên</li>
              <li>• Tự xác định quy trình cần thực hiện</li>
              <li>• Tự lấy dữ liệu (KHÔNG hỏi lại user)</li>
              <li>• Trình kế hoạch + xin xác nhận 1 lần</li>
              <li>• Tự thao tác 10 màn hình tuần tự</li>
              <li>• Tự kiểm tra sau mỗi bước</li>
              <li>• Báo cáo + theo dõi chủ động 24/7</li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/40">
            <h3 className="font-bold text-emerald-700 mb-2 flex items-center gap-1.5">
              <span>🛡️</span> Giới hạn quyền tự động
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>• Tiền, đơn giá, định mức → HỎI LẠI</li>
              <li>• Số lượng sản xuất thay đổi → HỎI LẠI</li>
              <li>• Nhân sự chính, ngày giao hàng → HỎI LẠI</li>
              <li>• Xóa, hủy dữ liệu → HỎI LẠI</li>
              <li>• Cho phép tồn kho âm → HỎI LẠI</li>
              <li>• Vượt ngoài kế hoạch đã xác nhận → HỎI LẠI</li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/40">
            <h3 className="font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <span>⛔</span> Khi nào dừng & hỏi lại
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>• Thiếu nguyên liệu nghiêm trọng</li>
              <li>• Tồn kho có nguy cơ âm</li>
              <li>• SL chia size không khớp</li>
              <li>• Định mức chưa được duyệt</li>
              <li>• Đơn giá khác bảng giá duyệt</li>
              <li>• Không xác định được người phụ trách</li>
              <li>• Vượt năng lực sản xuất</li>
              <li>• Hệ thống báo lỗi / không lưu được</li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/40">
            <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-1.5">
              <span>🛠️</span> 9 tool cần thiết (Phase 2)
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed font-mono">
              <li>✅ createLenhCat (có)</li>
              <li>✅ capNhatTrangThaiLenhCat (có)</li>
              <li>✅ updateTonKho (có)</li>
              <li>⏳ phanCongNhanVien (chưa)</li>
              <li>⏳ guiThongBao (chưa)</li>
              <li>⏳ layLenhCatGanDay (chưa)</li>
              <li>⏳ kiemTraDinhMuc (chưa)</li>
              <li>⏳ layBangGiaDaDuyet (chưa)</li>
              <li>⏳ kiemTraTrungLenh (chưa)</li>
            </ul>
          </div>
        </div>

        {/* Test thử */}
        <div className="mt-6 p-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl text-white shadow-xl">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <span>🧪</span> Test thử ngay
          </h3>
          <p className="text-sm opacity-90 mb-3">
            Vào trang bất kỳ → bấm nút AI chat (góc phải dưới) → thử yêu cầu:
          </p>
          <div className="bg-black/20 rounded-lg p-3 font-mono text-xs leading-relaxed">
            "Ngày mai cắt mã M873 khoảng 546 áo, chia bốn màu như lần trước. Giao Giang phụ trách, kiểm tra vải rồi làm lệnh cho anh."
          </div>
          <p className="text-xs opacity-75 mt-3">
            → MIN AI Sản xuất sẽ tự lấy dữ liệu, kiểm tra, trình kế hoạch, chờ xác nhận, rồi thao tác 10 màn hình.
          </p>
        </div>
      </div>
    </div>
  );
}
