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
        <div className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-black/85 p-3 animate-fade-in md:p-6" onClick={() => setPreviewIdx(null)}>
          <div className="relative flex h-full w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <img src={files[previewIdx].dataUrl} alt={files[previewIdx].name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
            <div className="absolute left-3 top-3 max-w-[70%] truncate rounded bg-black/70 px-3 py-1.5 text-xs text-white">
              {files[previewIdx].name}
            </div>
            <button type="button" onClick={() => setPreviewIdx(null)} className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white transition hover:bg-black" aria-label="Đóng ảnh phóng to">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
