"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Plus, Trash2, Eye, Upload, Paperclip } from "lucide-react";
import { toast } from "sonner";
import ImageLightbox from "@/components/ui/ImageLightbox";
import type { UploadedFile } from "@/components/ui/ImageUploader";

import { uploadChungTuSanXuat } from "@/lib/yarn-chung-tu-upload";
import { Loader2, Cloud } from "lucide-react";

type Props = {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  title: string;
  subTitle?: string;
  themeColor?: "blue" | "violet" | "rose" | "emerald";
  compact?: boolean;
};

export function ChungTuUploaderCompact({
  files,
  onChange,
  title,
  subTitle,
  themeColor = "blue",
  compact = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const colorStyles = {
    blue: {
      border: "border-blue-300 hover:border-blue-500",
      bg: "bg-blue-50/60 hover:bg-blue-100/60",
      text: "text-blue-900",
      accent: "text-blue-600",
      badge: "bg-blue-600 text-white",
      ring: "focus:ring-blue-400",
    },
    violet: {
      border: "border-violet-300 hover:border-violet-500",
      bg: "bg-violet-50/60 hover:bg-violet-100/60",
      text: "text-violet-900",
      accent: "text-violet-600",
      badge: "bg-violet-600 text-white",
      ring: "focus:ring-violet-400",
    },
    rose: {
      border: "border-rose-300 hover:border-rose-500",
      bg: "bg-rose-50/60 hover:bg-rose-100/60",
      text: "text-rose-900",
      accent: "text-rose-600",
      badge: "bg-rose-600 text-white",
      ring: "focus:ring-rose-400",
    },
    emerald: {
      border: "border-emerald-300 hover:border-emerald-500",
      bg: "bg-emerald-50/60 hover:bg-emerald-100/60",
      text: "text-emerald-900",
      accent: "text-emerald-600",
      badge: "bg-emerald-600 text-white",
      ring: "focus:ring-emerald-400",
    },
  }[themeColor];

  const handleSelectFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading(`Đang tải ảnh ${title} lên đám mây...`);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(fileList)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`Ảnh ${file.name} vượt quá 20MB`);
          continue;
        }
        try {
          const uploaded = await uploadChungTuSanXuat(file, "chung-tu", title);
          if (uploaded && uploaded.dataUrl) {
            newFiles.push(uploaded);
          }
        } catch (err) {
          console.error("Lỗi upload ảnh chứng từ:", err);
        }
      }

      if (newFiles.length > 0) {
        onChange([...files, ...newFiles]);
        toast.success(`Đã lưu ${newFiles.length} ảnh chứng từ (${title})`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(files.filter((f) => f.id !== id));
    toast.info("Đã xóa ảnh chứng từ");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleSelectFiles(e.clipboardData.files);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className={`rounded-2xl border-2 border-dashed transition-all ${colorStyles.border} ${colorStyles.bg} p-2.5 shadow-xs`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => handleSelectFiles(e.target.files)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 cursor-pointer group"
          title="Click hoặc kéo thả để úp ảnh chứng từ"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
            <Camera className={`h-5 w-5 ${colorStyles.accent}`} />
          </div>
          <div>
            <div className="text-xs font-black flex items-center gap-1.5 text-slate-800">
              <span>{title}</span>
              {files.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${colorStyles.badge}`}>
                  {files.length} ảnh
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {subTitle || "Click để chọn, kéo thả hoặc dán ảnh (Ctrl+V)"}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>Úp ảnh</span>
            </>
          )}
        </button>
      </div>

      {/* Danh sách ảnh thumbnails */}
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
          {files.map((file, idx) => (
            <div
              key={file.id}
              className="group relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
            >
              <img
                src={file.dataUrl}
                alt={file.name}
                className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setZoomIndex(idx)}
              />
              {file.dataUrl.startsWith("http") && (
                <div className="absolute bottom-0.5 left-0.5 rounded bg-teal-700/90 text-[8px] font-black text-white px-1 py-0.2 flex items-center gap-0.5 shadow-xs pointer-events-none">
                  <Cloud className="h-2 w-2" /> Cloud
                </div>
              )}
              <button
                type="button"
                onClick={(e) => removeFile(file.id, e)}
                className="absolute top-0.5 right-0.5 rounded-full bg-rose-600/90 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-sm"
                title="Xóa ảnh này"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <div
                onClick={() => setZoomIndex(idx)}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Eye className="h-4 w-4 text-white drop-shadow-md" />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/70 hover:bg-white hover:border-slate-400 text-slate-400 hover:text-slate-600 transition-all"
            title="Thêm ảnh chứng từ khác"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[9px] font-bold">Thêm</span>
          </button>
        </div>
      )}

      {/* Lightbox phóng to ảnh */}
      {zoomIndex !== null && (
        <ImageLightbox
          src={files[zoomIndex]?.dataUrl || null}
          alt={files[zoomIndex]?.name || title}
          gallery={files.map((f) => f.dataUrl)}
          onChange={(_newSrc, newIdx) => setZoomIndex(newIdx)}
          onClose={() => setZoomIndex(null)}
        />
      )}
    </div>
  );
}
