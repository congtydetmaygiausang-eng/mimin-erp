"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, FileText, Eye, Download } from "lucide-react";
import { toast } from "sonner";

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
};

const ACCEPT_DEFAULT = "image/*,.pdf,.ai,.psd,.svg";
const MAX_SIZE_DEFAULT = 5 * 1024 * 1024; // 5MB

export function ImageUploader({
  files,
  onChange,
  category,
  maxSize = MAX_SIZE_DEFAULT,
  accept = ACCEPT_DEFAULT,
  label,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const filesOfCategory = files.filter((f) => f.category === category);

  const handleFiles = async (fileList: FileList | null | undefined) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > maxSize) {
        toast.error(`${file.name} quá lớn (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name || 'image.png',
        type: file.type,
        size: file.size,
        dataUrl,
        category,
        uploadedAt: new Date().toISOString(),
      });
    }
    onChange([...files, ...newFiles]);
    toast.success(`Đã upload ${newFiles.length} file`);
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
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Files list */}
      {filesOfCategory.length > 0 && (
        <div className="space-y-1.5">
          {filesOfCategory.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/40 dark:bg-white/5 group">
              {isImage(f.type) ? (
                <div
                  className="w-12 h-12 rounded overflow-hidden cursor-pointer shrink-0 bg-slate-100"
                  onClick={() => setPreviewIdx(files.indexOf(f))}
                >
                  <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 opacity-50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{f.name}</div>
                <div className="text-[10px] opacity-60">
                  {(f.size / 1024).toFixed(1)} KB · {new Date(f.uploadedAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <button
                onClick={() => isImage(f.type) && setPreviewIdx(files.indexOf(f))}
                className="p-1.5 rounded hover:bg-white/40 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition"
                title="Xem"
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
                onClick={() => remove(f.id)}
                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition"
                title="Xóa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image preview modal */}
      {previewIdx !== null && files[previewIdx] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewIdx(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={files[previewIdx].dataUrl} alt={files[previewIdx].name} className="max-w-full max-h-[90vh] rounded-lg" />
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded bg-black/60 text-white text-xs">
              {files[previewIdx].name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
