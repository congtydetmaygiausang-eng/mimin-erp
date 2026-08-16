"use client";

import { Handle, Position } from "@xyflow/react";
import { MAU_KHOI, type MauKhoi } from "@/lib/data/so-do-chien-luoc-data";

export function MiminNode({
  data,
  selected,
}: {
  data: { label: string; type?: "title" | "normal" | "sub"; color?: MauKhoi };
  selected?: boolean;
}) {
  const isTitle = data.type === "title";
  const isSub = data.type === "sub";

  // Có chọn màu -> dùng bảng màu; chưa chọn -> giữ nguyên kiểu cũ theo type
  // (để các sơ đồ đã tạo trước đây không bị đổi giao diện).
  const mauClass = data.color
    ? MAU_KHOI[data.color].khoi
    : isTitle
      ? "bg-brand-500 text-white border-brand-600 shadow-brand-500/30"
      : isSub
        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 text-sm"
        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-brand-300 dark:border-brand-700";

  return (
    <div
      className={`px-4 py-2 rounded-xl border-2 shadow-sm font-semibold text-center min-w-[120px] transition
      ${mauClass} ${isSub && data.color ? "text-sm" : ""}
      ${selected ? "ring-2 ring-offset-2 ring-sky-500" : ""}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
    </div>
  );
}

export function MiminImageNode({
  data,
  selected,
}: {
  data: { label: string; imageSrc: string };
  selected?: boolean;
}) {
  return (
    <div className={`rounded-xl border-2 border-brand-400 bg-white dark:bg-slate-900 shadow-md p-1 min-w-[150px] max-w-[200px] transition ${selected ? "ring-2 ring-offset-2 ring-sky-500" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-brand-500 !w-3 !h-3" />
      
      <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden mb-2 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
        {data.imageSrc ? (
          <img src={data.imageSrc} alt={data.label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs opacity-50">Chưa có ảnh</span>
        )}
      </div>
      <div className="text-center font-medium text-sm px-2 pb-1 truncate">
        {data.label}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-brand-500 !w-3 !h-3" />
    </div>
  );
}
