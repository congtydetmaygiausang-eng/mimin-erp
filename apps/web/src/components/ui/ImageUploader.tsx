"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, FileText, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import ImageLightbox from "@/components/ui/ImageLightbox";

export type UploadedFile = {
  id: string;
  name: string;
  type: string;       // "image/png", "application/pdf"...
  size: number;
  dataUrl: string;    // base64
  category: string;   // "Ảnh sản phẩm" | "Ảnh in/thêu" | "Tài liệu"
  uploadedAt: string;
};

type Props = {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  category: string;
  maxSize?: number;  // bytes
  accept?: string;
  label?: string;
  hint?: string;
  multiple?: boolean;
};

const ACCEPT_DEFAULT = "image/*,.pdf,.ai,.psd,.svg";
const MAX_SIZE_DEFAULT = 5 * 1024 * 1024; // 5MB

/** Nén ảnh client-side tự động trước khi lưu dataUrl (tiết kiệm 90% dung lượng, chống đầy localStorage) */
function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve) => {
    // Nếu không phải ảnh (PDF, AI, SVG...), giữ nguyên file
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, size: file.size });
      reader.onerror = () => resolve({ dataUrl: "", size: 0 });
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, size: file.size });
        reader.readAsDataURL(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      // Ước lượng dung lượng sau nén từ độ dài base64
      const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
      resolve({ dataUrl: compressedDataUrl, size: compressedSize });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, size: file.size });
      reader.onerror = () => resolve({ dataUrl: "", size: 0 });
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

export function ImageUploader({
  files,
  onChange,
  category,
  maxSize = MAX_SIZE_DEFAULT,
  accept = ACCEPT_DEFAULT,
  label,
  hint,
  multiple = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const filesOfCategory = files.filter((f) => f.category === category);

  const handleFiles = async (fileList: FileList | null | undefined) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = [];
    for (const file of (multiple ? Array.from(fileList) : Array.from(fileList).slice(0, 1))) {
      if (accept === "image/*" && !file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn tệp hình ảnh");
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} quá lớn (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
        continue;
      }

      try {
        const { dataUrl, size } = await compressImageFile(file);
        if (!dataUrl) {
          toast.error(`Không thể đọc tệp ${file.name}`);
          continue;
        }
        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name || "image.jpg",
          type: file.type.startsWith("image/") ? "image/jpeg" : file.type,
          size,
          dataUrl,
          category,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Lỗi xử lý tệp ${file.name}`);
        continue;
      }
    }
    if (!newFiles.length) return;
    onChange(multiple ? [...files, ...newFiles] : [...files.filter((file) => file.category !== category), ...newFiles]);
    if (inputRef.current) inputRef.current.value = "";
    toast.success(`Đã đính kèm ${newFiles.length} ảnh/tệp chứng từ`);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
    }
  };

  const remove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="space-y-2">
      {label && (
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint && <div className="text-xs opacity-60">{hint}</div>}
        </div>
      )}

      {/* Drop area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onPaste={handlePaste}
        tabIndex={0} // Để có thể focus và bắt sự kiện paste
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition focus:outline-none focus:border-brand-500 focus:bg-brand-500/5"
        style={{ borderColor: "var(--border)" }}
      >
        <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
        <div className="text-xs opacity-70">
          Kéo thả, dán (Ctrl+V) hoặc <span className="text-brand-500 font-medium">click để chọn file</span>
        </div>
        <div className="text-[10px] opacity-50 mt-0.5">
          {accept.replace(/\./g, "").split(",").slice(0, 5).join(", ")} · Max {(maxSize / 1024 / 1024).toFixed(0)}MB
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Files list */}
      {filesOfCategory.length > 0 && (
        <div className="space-y-1.5">
          {filesOfCategory.map((f, i) => (
            <div key={f.id} className="flex items-start gap-3 rounded-lg bg-white/40 p-2 dark:bg-white/5 group">
              {isImage(f.type) ? (
                <button
                  type="button"
                  className="group/preview relative h-28 w-40 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border bg-slate-100 shadow-sm"
                  onClick={() => setPreviewIdx(files.indexOf(f))}
                  title="Bấm để phóng to ảnh chứng từ"
                >
                  <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-center text-[10px] font-semibold text-white opacity-90 transition group-hover/preview:opacity-100">
                    Bấm để phóng to
                  </span>
                </button>
              ) : (
                <div className="flex h-28 w-40 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
              )}
              <div className="min-w-0 flex-1 pt-1">
                <div className="text-xs font-medium truncate">{f.name}</div>
                <div className="text-[10px] opacity-60">
                  {(f.size / 1024).toFixed(1)} KB · {new Date(f.uploadedAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => isImage(f.type) && setPreviewIdx(files.indexOf(f))}
                className="rounded p-1.5 transition hover:bg-white/40 dark:hover:bg-white/10"
                title="Phóng to"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <a
                href={f.dataUrl}
                download={f.name}
                className="p-1.5 rounded hover:bg-white/40 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition"
                title="Tải xuống"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(f.id);
                }}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-900/60 dark:text-red-400 transition opacity-90 hover:opacity-100"
                title="Xóa tệp chứng từ này"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image preview lightbox */}
      {previewIdx !== null && files[previewIdx] && (
        <ImageLightbox
          src={files[previewIdx].dataUrl}
          alt={files[previewIdx].name}
          gallery={files.filter((f) => f.type.startsWith("image/")).map((f) => f.dataUrl)}
          onChange={(newSrc) => {
            const idx = files.findIndex((f) => f.dataUrl === newSrc);
            if (idx !== -1) setPreviewIdx(idx);
          }}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>
  );
}
