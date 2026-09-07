import React, { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { ImageUploader, UploadedFile } from "@/components/ui/ImageUploader";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (urls: string[]) => void;
  title?: string;
  subtitle?: string;
  existingUrls?: string[];
}

export function UploadBangChungModal({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Tải lên ảnh Bằng chứng", 
  subtitle = "Bắt buộc tải lên hình ảnh hoàn thành công đoạn",
  existingUrls = []
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleConfirm = async () => {
    if (files.length === 0 && existingUrls.length === 0) {
      toast.error("Bắt buộc phải tải lên ít nhất 1 ảnh bằng chứng!");
      return;
    }

    if (files.length === 0) {
      // Chỉ có ảnh cũ, không có ảnh mới -> confirm luôn
      onConfirm(existingUrls);
      return;
    }

    try {
      setIsUploading(true);
      const newUrls: string[] = [];
      
      // Nếu supabase là null (Demo mode)
      if (!supabase) {
        toast.error("Hệ thống đang chạy chế độ Demo, không thể lưu ảnh thật.");
        setIsUploading(false);
        return;
      }

      for (const file of files) {
        const res = await fetch(file.dataUrl);
        const blob = await res.blob();
        
        const ext = file.type.split('/')[1] || 'png';
        const path = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { data, error } = await supabase.storage.from("bang-chung").upload(path, blob, {
          contentType: file.type,
          upsert: false
        });

        if (error) {
          throw new Error(error.message);
        }

        const { data: publicData } = supabase.storage.from("bang-chung").getPublicUrl(path);
        newUrls.push(publicData.publicUrl);
      }

      const allUrls = [...existingUrls, ...newUrls];
      onConfirm(allUrls);
    } catch (e: any) {
      toast.error("Lỗi khi tải ảnh lên: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="lg"
    >
      <div className="p-4 md:p-6 space-y-4">
        {subtitle && (
          <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
        )}

        {existingUrls.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Ảnh đã tải lên:</h4>
            <div className="flex flex-wrap gap-2">
              {existingUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200">
                  <img src={url} alt="Bằng chứng" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <ImageUploader 
          files={files} 
          onChange={setFiles} 
          category="Bằng chứng" 
          label="Tải lên hình ảnh mới"
          hint="Chụp ảnh bằng điện thoại hoặc tải ảnh lên"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isUploading}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isUploading || (files.length === 0 && existingUrls.length === 0)}
            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Xác nhận Hoàn thành
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
