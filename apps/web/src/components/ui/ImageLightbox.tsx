"use client";

// ============================================
// ImageLightbox - phong to / thu nho anh
// Phase 1: danh-muc-sp redesign
// 2026-08-06
// ============================================
//
// Usage:
//   const [zoom, setZoom] = useState<string | null>(null);
//   <img onClick={() => setZoom(url)} />
//   <ImageLightbox src={zoom} onClose={() => setZoom(null)} />
//
// Features:
//   - Click anh de mo
//   - Click overlay / ESC / X de dong
//   - Zoom in (+) / Zoom out (-) / Reset (0) bang phim hoac nut
//   - Drag anh khi zoom > 1
//   - Hien thi ten anh (alt)

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  /** URL anh dang zoom. null = dong. */
  src: string | null;
  /** Alt text hien thi duoi anh */
  alt?: string;
  /** Callback dong */
  onClose: () => void;
  /** List anh de xem lan luot (optional - neu co se hien thi prev/next) */
  gallery?: string[];
  /** Callback khi user chon prev/next */
  onChange?: (newSrc: string, newIndex: number) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

export default function ImageLightbox({ src, alt, onClose, gallery, onChange }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset khi src thay doi
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // ESC de dong
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") reset();
      else if (e.key === "ArrowLeft" && gallery && onChange) prev();
      else if (e.key === "ArrowRight" && gallery && onChange) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, gallery]);

  // Lock body scroll khi mo
  useEffect(() => {
    if (src) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [src]);

  if (!src) return null;

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const currentIndex = gallery ? gallery.indexOf(src) : -1;
  const prev = () => {
    if (!gallery || !onChange) return;
    const i = (currentIndex - 1 + gallery.length) % gallery.length;
    onChange(gallery[i], i);
  };
  const next = () => {
    if (!gallery || !onChange) return;
    const i = (currentIndex + 1) % gallery.length;
    onChange(gallery[i], i);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: dragStart.current.px + dx,
      y: dragStart.current.py + dy,
    });
  };
  const onMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  // Wheel zoom (Ctrl + scroll)
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Top toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur text-white text-xs z-10">
        <span>{(scale * 100).toFixed(0)}%</span>
        <span className="opacity-50">·</span>
        <span className="max-w-[200px] truncate">{alt || "Ảnh"}</span>
        {gallery && gallery.length > 1 && (
          <>
            <span className="opacity-50">·</span>
            <span>
              {currentIndex + 1}/{gallery.length}
            </span>
          </>
        )}
      </div>

      {/* Control buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-30 text-white flex items-center justify-center transition"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-30 text-white flex items-center justify-center transition"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={reset}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
          title="Reset (0)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-rose-600/80 hover:bg-rose-700 text-white flex items-center justify-center transition mt-2"
          title="Đóng (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prev/Next buttons (gallery) */}
      {gallery && gallery.length > 1 && onChange && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition z-10"
            title="Ảnh trước (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition z-10"
            title="Ảnh sau (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        ref={containerRef}
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onMouseDown={onMouseDown}
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || "image"}
          draggable={false}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: dragging ? "none" : "transform 0.2s ease",
          }}
        />
      </div>

      {/* Hint footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-[11px] text-center">
        <div>Click overlay hoặc ESC để đóng · Scroll + Ctrl để zoom · Kéo ảnh khi phóng to</div>
        {gallery && gallery.length > 1 && <div>← → để chuyển ảnh</div>}
      </div>
    </div>
  );
}
