"use client";

// ============================================
// AI MOCKUP MODAL - MiniMax image-01
// Component riêng để tránh conflict với LenhCatModal (Antigravity đang redesign)
// Click nút "Tạo mockup AI" từ LenhCatModal → mở modal này
// Hỗ trợ upload ảnh tham chiếu (reference image) để tạo ảnh tương tự
// ============================================

import { useRef, useState } from "react";
import { X, Wand2, Loader2, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AIMockupModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (url: string) => void;
  colorIndex: number;
  colorName: string;
  defaultPrompt: string;
  productName?: string;
}

type AspectRatio = "1:1" | "4:5" | "3:4" | "9:16" | "16:9";

const ASPECT_OPTIONS: AspectRatio[] = ["1:1", "4:5", "3:4", "9:16", "16:9"];

export function AIMockupModal({
  open,
  onClose,
  onApply,
  colorIndex,
  colorName,
  defaultPrompt,
  productName,
}: AIMockupModalProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [aspect, setAspect] = useState<AspectRatio>("4:5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<{ hint?: string; key_prefix?: string } | null>(null);

  // Reference image (ảnh mẫu tương tự) - dùng để MiniMax giữ phong cách/người mẫu
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize ảnh tham chiếu về max 1024px + JPEG 0.8 để giảm size gửi API
  const resizeImage = (file: File, maxSize = 1024, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // JPEG 0.8 - balance quality + size
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Cannot load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Cannot read file"));
      reader.readAsDataURL(file);
    });
  };

  if (!open) return null;

  const handlePickReference = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File quá lớn (max 20MB)");
      return;
    }
    try {
      // Resize ảnh về max 1024px JPEG 0.8 để giảm payload
      const originalSizeKB = Math.round(file.size / 1024);
      const resized = await resizeImage(file, 1024, 0.8);
      const resizedSizeKB = Math.round((resized.length * 3) / 4 / 1024); // base64 → bytes
      console.log(`[AIMockup] Resized: ${originalSizeKB}KB → ${resizedSizeKB}KB`);
      setReferenceImage(resized);
      toast.success(`Đã chọn ảnh (${originalSizeKB}KB → ${resizedSizeKB}KB)`);
    } catch (err: any) {
      toast.error("Lỗi xử lý ảnh: " + err.message);
    }
    // Reset input để chọn lại cùng file vẫn trigger
    e.target.value = "";
  };

  const handleRemoveReference = () => {
    setReferenceImage(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Vui lòng nhập mô tả sản phẩm");
      return;
    }
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    setResult(null);
    try {
      console.log(`[AIMockup] Generate | prompt: ${prompt.length} chars | aspect: ${aspect} | ref: ${referenceImage ? "yes" : "no"}`);
      const res = await fetch("/api/v1/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect_ratio: aspect,
          reference_image: referenceImage || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error(`[AIMockup] API error ${res.status}:`, err);
        setErrorDetail({ hint: err.hint, key_prefix: err.key_prefix });
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log("[AIMockup] Success:", data);
      setResult(data.url);
      toast.success("✨ MiniMax đã tạo ảnh thành công!");
    } catch (err: any) {
      const msg = err.message || "Lỗi không xác định";
      setError(msg);
      toast.error("AI tạo ảnh thất bại: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    toast.success(`Đã áp dụng ảnh mockup cho màu ${colorIndex + 1}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => !loading && onClose()}
      data-testid="ai-mockup-modal"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
          <div className="flex items-center gap-2 flex-wrap">
            <Wand2 className="w-5 h-5" />
            <h3 className="font-bold text-lg">Tạo mockup sản phẩm bằng AI</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Màu {colorIndex + 1}
              {colorName ? ` · ${colorName}` : ""}
              {productName ? ` · ${productName}` : ""}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Reference image (ảnh mẫu tương tự) */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">
              Ảnh tham chiếu (tuỳ chọn)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              data-testid="ai-mockup-ref-input"
            />
            {referenceImage ? (
              <div className="relative w-32 h-32 rounded-lg border-2 border-violet-300 overflow-hidden bg-slate-50 group">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveReference}
                  disabled={loading}
                  className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:opacity-50"
                  title="Xóa ảnh tham chiếu"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handlePickReference}
                disabled={loading}
                data-testid="btn-upload-reference"
                className="w-full px-3 py-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-violet-400 hover:bg-violet-50/30 transition-colors flex flex-col items-center gap-1 text-slate-500 hover:text-violet-600 disabled:opacity-50"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">Upload ảnh mẫu tương tự (style/người mẫu)</span>
                <span className="text-[10px] text-slate-400">PNG, JPG · tối đa 10MB</span>
              </button>
            )}
            <div className="text-xs text-slate-500 mt-1 italic">
              💡 Upload ảnh polo mẫu có sẵn → MiniMax sẽ giữ phong cách tương tự nhưng đổi màu/kiểu theo mô tả
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">
              Mô tả sản phẩm (prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={1500}
              disabled={loading}
              placeholder="VD: Áo polo nam màu xanh navy cổ bẻ, có 2 nút cổ, logo POLOMIMIN thêu ngực trái, chất liệu cotton piqué, nền trắng, studio lighting"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
              data-testid="ai-mockup-prompt"
            />
            <div className="text-xs text-slate-500 mt-1">
              {prompt.length}/1500 ký tự · Gợi ý: nêu rõ màu sắc, kiểu dáng, chất liệu, bối cảnh
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">
              Tỉ lệ ảnh
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_OPTIONS.map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspect(ar)}
                  disabled={loading}
                  className={`px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                    aspect === ar
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Result preview */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">
                MiniMax image-01 đang tạo ảnh
                {referenceImage ? " (giữ phong cách từ ảnh tham chiếu)..." : "..."}
              </p>
              <p className="text-xs text-slate-500 mt-1">Mất khoảng 10-20 giây</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 space-y-2">
              <div>
                <strong>❌ Lỗi:</strong> {error}
              </div>
              {errorDetail?.hint && (
                <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                  <strong>💡 Gợi ý:</strong> {errorDetail.hint}
                </div>
              )}
              {errorDetail?.key_prefix && (
                <div className="text-slate-600 text-xs">
                  <strong>Key hiện tại:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded">{errorDetail.key_prefix}...</code>
                </div>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700">🔍 Debug chi tiết (DevTools)</summary>
                <div className="mt-2 p-2 bg-slate-50 rounded text-slate-600 font-mono text-[10px] overflow-auto">
                  Mở DevTools (F12) → tab <strong>Network</strong> → click request <code>generate-image</code> → xem Response body
                </div>
              </details>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-slate-700">Kết quả:</div>
              <div className="border-2 border-violet-200 rounded-lg overflow-hidden bg-slate-50">
                <img
                  src={result}
                  alt="AI mockup"
                  className="w-full h-auto max-h-[400px] object-contain"
                  data-testid="ai-mockup-result"
                />
              </div>
              <p className="text-xs text-slate-500 italic">
                ⚠️ Ảnh URL có hạn 24h. Nên upload lên Drive/Supabase Storage để lưu lâu dài.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-slate-50">
          <div className="text-xs text-slate-500">
            💰 $0.0035/ảnh · ⚡ 10 ảnh/phút
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg disabled:opacity-50"
            >
              Đóng
            </button>
            {result ? (
              <button
                onClick={handleApply}
                data-testid="btn-apply-ai-mockup"
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm rounded-lg hover:from-violet-700 hover:to-fuchsia-700 flex items-center gap-1.5"
              >
                <ImageIcon className="w-4 h-4" />
                Dùng ảnh này
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                data-testid="btn-generate-ai-mockup"
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm rounded-lg hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Tạo ảnh
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
