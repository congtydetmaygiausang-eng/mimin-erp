"use client";

import { useWizard } from "../WizardContext";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";

export function Step1GeneralInfo() {
  const { state, updateState } = useWizard();
  const { dsSanPham } = useDanhMucSP();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Thông tin chung & Kế hoạch
        </h2>
        <p className="text-sm text-slate-500">Khởi tạo các thông tin cơ bản cho lệnh cắt</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* Loại Lệnh */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">Loại Lệnh</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={state.loaiLenh} 
            onChange={(e: any) => updateState({ loaiLenh: e.target.value })}
          >
            <option value="HangNha">Hàng Nhà (Tự Bán)</option>
            <option value="GiaCong">Gia Công (B2B)</option>
          </select>
        </div>

        {/* Khách hàng (If GiaCong) */}
        {state.loaiLenh === "GiaCong" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase block">Khách Hàng</label>
            <input 
              value={state.khachHang}
              onChange={(e) => updateState({ khachHang: e.target.value })}
              placeholder="Tên khách hàng/Đối tác"
              className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        )}

        {/* Mã SP */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">Sản phẩm (Mã SP)</label>
          <input 
            value={state.maSP}
            onChange={(e) => updateState({ maSP: e.target.value })}
            placeholder="Nhập mã sản phẩm"
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Loại SP */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">Loại Sản Phẩm</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={state.loaiSP} 
            onChange={(e: any) => updateState({ loaiSP: e.target.value })}
          >
            {Object.entries(LOAI_SP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Tên SP */}
        <div className="space-y-2 lg:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">Tên Sản Phẩm</label>
          <input 
            value={state.tenSP}
            onChange={(e) => updateState({ tenSP: e.target.value })}
            placeholder="Ví dụ: Áo Polo Nữ Basic"
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Số Lượng Dự Kiến */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">SL Dự Kiến</label>
          <div className="relative">
            <input 
              type="number"
              value={state.tongSL}
              onChange={(e) => updateState({ tongSL: e.target.value ? Number(e.target.value) : "" })}
              placeholder="0"
              className="w-full px-3 py-2 pl-4 pr-12 bg-slate-50/50 border border-slate-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">cái</span>
          </div>
        </div>

        {/* Tỉ lệ size */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">Tỉ lệ Size (S:M:L:XL)</label>
          <input 
            value={state.tiLeSize}
            onChange={(e) => updateState({ tiLeSize: e.target.value })}
            placeholder="1:2:2:1"
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Hạn Hoàn Thành */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase block">Hạn Hoàn Thành</label>
          <input 
            type="date"
            value={state.hanHoanThanh}
            onChange={(e) => updateState({ hanHoanThanh: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>
     {/* Hình ảnh sản phẩm */}
     <div className="mt-8 border-t border-slate-200 pt-8">
       <div className="mb-4">
         <h3 className="text-lg font-semibold text-slate-800">Hình Ảnh Sản Phẩm</h3>
         <p className="text-sm text-slate-500">Tải lên hình ảnh để xem trước sản phẩm</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-stretch">
         {/* Upload Section */}
         <div className="h-full">
           <div className="h-full min-h-[360px] flex items-center bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 lg:p-8 border-2 border-dashed border-violet-200">
             <ImageUploader
               files={state.hinhAnhFiles}
               onChange={(files: UploadedFile[]) => updateState({
                 hinhAnhFiles: files,
                 hinhAnh: files.find((file) => file.type.startsWith("image/"))?.dataUrl || "",
               })}
               category="Ảnh sản phẩm"
               accept="image/*"
               label="Tải Hình Ảnh Sản Phẩm"
               hint="PNG, JPG hoặc GIF (tối đa 5MB)"
             />
           </div>
         </div>

         {/* Preview Section */}
         <div className="h-full space-y-4">
             <div className="min-h-[360px] h-full flex items-center justify-center bg-slate-100 rounded-2xl p-4 lg:p-6 border border-slate-200 overflow-hidden">
               {state.hinhAnh ? (
               <img
                 src={state.hinhAnh}
                 alt="Sản phẩm"
                 className="w-full h-full max-h-[420px] rounded-xl object-contain"
               />
               ) : (
                 <div className="text-center text-sm text-slate-400">
                   Chưa có hình ảnh sản phẩm
                 </div>
               )}
             </div>
             {state.hinhAnh && <div className="flex gap-2">
               <button
                 onClick={() => updateState({ hinhAnh: "", hinhAnhFiles: [] })}
                 className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition"
               >
                 Xóa Hình
               </button>
             </div>}
         </div>
       </div>
     </div>
    </div>
  );
}
