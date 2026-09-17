import React, { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { ImageUploader, UploadedFile } from "@/components/ui/ImageUploader";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PenTool } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (urls: string[], chuKyUrl?: string) => void;
  title?: string;
  subtitle?: string;
  existingUrls?: string[];
  existingChuKy?: string;
}

export function UploadBangChungModal({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Tải lên ảnh Bằng chứng", 
  subtitle = "Bắt buộc tải lên hình ảnh hoàn thành công đoạn",
  existingUrls = [],
  existingChuKy = ""
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [chuKy, setChuKy] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setChuKy(existingChuKy || "");
    }
  }, [open, existingChuKy]);

  const handleConfirm = async () => {
    if (files.length === 0 && existingUrls.length === 0) {
      toast.error("Bắt buộc phải tải lên ít nhất 1 ảnh bằng chứng!");
      return;
    }

    if (!chuKy && !existingChuKy) {
      toast.error("Bắt buộc phải có chữ ký xác nhận!");
      return;
    }

    // Nếu không có file mới và chữ ký không thay đổi (không phải chuỗi data base64 mới)
    if (files.length === 0 && (!chuKy.startsWith("data:") || chuKy === existingChuKy)) {
      onConfirm(existingUrls, chuKy || existingChuKy);
      return;
    }

    try {
      setIsUploading(true);
      const newUrls: string[] = [];
      let newChuKyUrl = existingChuKy;
      
      // Nếu supabase là null (Demo mode)
      if (!supabase) {
        toast.error("Hệ thống đang chạy chế độ Demo, không thể lưu ảnh thật.");
        setIsUploading(false);
        return;
      }

      // 1. Upload ảnh bằng chứng
      for (const file of files) {
        const res = await fetch(file.dataUrl);
        const blob = await res.blob();
        
        const ext = file.type.split('/')[1] || 'png';
        const path = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { data, error } = await supabase.storage.from("san-pham-media").upload(`bang-chung/${path}`, blob, {
          contentType: file.type,
          upsert: false
        });

        if (error) {
          throw new Error(error.message);
        }

        const { data: publicData } = supabase.storage.from("san-pham-media").getPublicUrl(`bang-chung/${path}`);
        newUrls.push(publicData.publicUrl);
      }

      // 2. Upload chữ ký (nếu có vẽ mới)
      if (chuKy && chuKy.startsWith("data:") && chuKy !== existingChuKy) {
        const res = await fetch(chuKy);
        const blob = await res.blob();
        
        const path = `chuky_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        
        const { error } = await supabase.storage.from("san-pham-media").upload(`bang-chung/${path}`, blob, {
          contentType: "image/png",
          upsert: false
        });

        if (error) {
          throw new Error("Lỗi tải chữ ký: " + error.message);
        }

        const { data: publicData } = supabase.storage.from("san-pham-media").getPublicUrl(`bang-chung/${path}`);
        newChuKyUrl = publicData.publicUrl;
      }

      const allUrls = [...existingUrls, ...newUrls];
      onConfirm(allUrls, newChuKyUrl);
    } catch (e: any) {
      toast.error("Lỗi khi tải ảnh/chữ ký lên: " + e.message);
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
      <div className="p-4 md:p-6 space-y-6">
        {subtitle && (
          <p className="text-sm text-slate-500">{subtitle}</p>
        )}

        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              1. Hình ảnh bằng chứng
            </h3>
          </div>
          
          {existingUrls.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ảnh đã lưu:</h4>
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
        </div>

        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              2. Chữ ký người hoàn thành
            </h3>
          </div>
          
          {existingChuKy && !chuKy.startsWith("data:") && (
            <div className="mb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chữ ký đã lưu:</h4>
              <div className="border rounded-lg bg-slate-50 p-2 inline-block">
                <img src={existingChuKy} alt="Chữ ký cũ" className="h-20 object-contain mix-blend-multiply" />
              </div>
              <p className="text-xs text-slate-500 mt-2 italic">Vẽ chữ ký mới bên dưới nếu muốn thay đổi.</p>
            </div>
          )}
          
          <div className="rounded-lg border bg-slate-50/50 p-3">
             <div className="flex items-center gap-2 mb-3">
               <PenTool className="w-4 h-4 text-slate-500" />
               <span className="text-sm font-medium text-slate-700">Ký tên xác nhận tại đây:</span>
             </div>
             <SignaturePad 
               onSave={setChuKy} 
               onClear={() => setChuKy("")} 
               value={chuKy.startsWith("data:") ? chuKy : ""} 
             />
          </div>
        </div>

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
            disabled={isUploading || (files.length === 0 && existingUrls.length === 0) || (!chuKy && !existingChuKy)}
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

