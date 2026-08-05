// ============ IMAGE PREVIEW MODAL ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { X } from "lucide-react";

export function ImagePreviewModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg">
          <X className="w-5 h-5" />
        </button>
        <img src={src} alt="Preview ảnh" className="max-h-[85vh] w-full rounded-3xl object-contain shadow-2xl" />
      </div>
    </div>
  );
}
