"use client";

import { Handle, Position, useReactFlow, NodeResizer } from "@xyflow/react";
import { MAU_KHOI, type MauKhoi } from "@/lib/data/so-do-chien-luoc-data";
import { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Maximize2, X } from "lucide-react";

export function MiminNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { label: string; type?: "title" | "normal" | "sub"; color?: MauKhoi; status?: "todo" | "doing" | "done"; bold?: boolean };
  selected?: boolean;
}) {
  const { updateNodeData } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);
  const isTitle = data.type === "title";
  const isSub = data.type === "sub";

  const mauClass = data.color
    ? MAU_KHOI[data.color].khoi
    : isTitle
      ? "bg-brand-500 text-white border-brand-600 shadow-brand-500/30"
      : isSub
        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 text-sm"
        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-brand-300 dark:border-brand-700";

  return (
    <>
      <NodeResizer color="#0ea5e9" isVisible={selected} minWidth={120} minHeight={40} />
      <div
        className={`px-4 py-2 rounded-xl border-2 shadow-sm text-center transition group relative cursor-text flex flex-col items-center justify-center w-full h-full
        ${data.bold ? "font-black" : "font-semibold"}
        ${mauClass} ${isSub && data.color ? "text-sm" : ""}
        ${selected ? "ring-2 ring-offset-2 ring-sky-500" : ""}
        ${data.status === "doing" ? "ring-2 ring-amber-400" : data.status === "done" ? "ring-2 ring-emerald-500" : ""}
        `}
        onDoubleClick={() => inputRef.current?.focus()}
      >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
      
      {/* Nút Trạng thái nhỏ (hiển thị khi hover hoặc đã set) */}
      <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition focus-within:opacity-100 bg-white dark:bg-slate-800 rounded-lg p-0.5 shadow-md border border-slate-200 dark:border-slate-700">
        <button 
          onClick={(e) => { e.stopPropagation(); updateNodeData(id, { status: "todo" }); }}
          className={`w-4 h-4 rounded-full border border-slate-300 bg-slate-100 hover:bg-slate-200 ${data.status === "todo" ? "ring-1 ring-slate-400" : ""}`}
          title="Chưa bắt đầu"
        />
        <button 
          onClick={(e) => { e.stopPropagation(); updateNodeData(id, { status: "doing" }); }}
          className={`w-4 h-4 rounded-full bg-amber-400 hover:bg-amber-500 ${data.status === "doing" ? "ring-1 ring-amber-600" : ""}`}
          title="Đang thực hiện"
        />
        <button 
          onClick={(e) => { e.stopPropagation(); updateNodeData(id, { status: "done" }); }}
          className={`w-4 h-4 rounded-full bg-emerald-500 hover:bg-emerald-600 ${data.status === "done" ? "ring-1 ring-emerald-700" : ""}`}
          title="Đã hoàn thành"
        />
      </div>

      <TextareaAutosize 
        ref={inputRef as any}
        value={data.label} 
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
        onDoubleClick={(e) => e.stopPropagation()}
        className="bg-transparent border-none focus:outline-none text-center w-full min-w-[80px] cursor-pointer resize-none nodrag nopan"
        style={{ color: 'inherit' }}
        placeholder="Nhập nội dung..."
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            updateNodeData(id, { bold: !data.bold });
          }
          e.stopPropagation();
        }}
        minRows={1}
      />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
      </div>
    </>
  );
}

export function MiminImageNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { label: string; imageSrc: string; bold?: boolean };
  selected?: boolean;
}) {
  const { updateNodeData } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <NodeResizer color="#0ea5e9" isVisible={selected} minWidth={150} minHeight={150} />
      <div className={`rounded-xl border-2 border-brand-400 bg-white dark:bg-slate-900 shadow-md p-1 transition cursor-text w-full h-full flex flex-col ${selected ? "ring-2 ring-offset-2 ring-sky-500" : ""}`}>
        <Handle type="target" position={Position.Top} className="!bg-brand-500 !w-3 !h-3" />
      
        <div className="w-full flex-1 rounded-lg bg-slate-100 overflow-hidden mb-2 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative group">
          {data.imageSrc ? (
            <img src={data.imageSrc} alt={data.label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs opacity-50">Chưa có ảnh</span>
          )}
          
          {data.imageSrc && (
            <button 
              onClick={() => setModalOpen(true)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm z-10 nodrag"
              title="Phóng to"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className={`text-center text-sm px-2 pb-1 ${data.bold ? "font-black" : "font-medium"}`}>
        <TextareaAutosize 
          ref={inputRef as any}
          value={data.label} 
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
          onDoubleClick={(e) => e.stopPropagation()}
          className="bg-transparent border-none focus:outline-none text-center w-full cursor-pointer resize-none nodrag nopan"
          placeholder="Nhập ghi chú..."
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                updateNodeData(id, { bold: !data.bold });
              }
              e.stopPropagation();
            }}
            minRows={1}
        />
      </div>
      
        {/* Gợi ý dán ảnh khi hover */}
        <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium pointer-events-none">
          Dán Ctrl+V
        </div>

        <Handle type="source" position={Position.Bottom} className="!bg-brand-500 !w-3 !h-3" />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setModalOpen(false); }}
              className="absolute -top-10 right-0 lg:-right-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={data.imageSrc} 
              alt={data.label} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
