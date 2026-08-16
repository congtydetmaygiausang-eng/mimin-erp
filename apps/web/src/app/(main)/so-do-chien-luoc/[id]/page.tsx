"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, Connection, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MiminNode, MiminImageNode } from "@/components/mindmap/CustomNodes";
import { MOCK_PROJECTS, MAU_KHOI, DS_MAU_KHOI, type MauKhoi } from "@/lib/data/so-do-chien-luoc-data";
import { ArrowLeft, Save, Image as ImageIcon, Type, Link2, Palette } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Lưu sơ đồ vào localStorage riêng theo id dự án. Trước đây nút "Lưu lại" chỉ
// hiện thông báo chứ KHÔNG lưu gì -> tải ảnh lên xong reload là mất sạch.
const STORAGE_KEY = "mimin_so_do_chien_luoc_v1";

function docTatCa(): Record<string, { name: string; nodes: any[]; edges: any[] }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Nén ảnh trước khi đưa vào sơ đồ. Ảnh lưu dạng base64 trong localStorage nên
 * không nén thì chỉ vài tấm là vượt hạn mức và mất toàn bộ sơ đồ.
 */
async function nenAnh(dataUrl: string, maxDim = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function SoDoCanvasInner() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Cấu hình custom nodes
  const nodeTypes = useMemo(() => ({
    miminNode: MiminNode,
    miminImageNode: MiminImageNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [projName, setProjName] = useState("Sơ đồ không tên");
  const [isReady, setIsReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Khởi tạo data: ưu tiên bản đã lưu của người dùng, chưa có mới lấy mẫu sẵn
  useEffect(() => {
    const daLuu = docTatCa()[id];
    if (daLuu) {
      setProjName(daLuu.name);
      setNodes(daLuu.nodes || []);
      setEdges(daLuu.edges || []);
      setIsReady(true);
      return;
    }
    const existing = MOCK_PROJECTS.find(p => p.id === id);
    if (existing) {
      setProjName(existing.name);
      setNodes(existing.nodes);
      setEdges(existing.edges);
    } else {
      setProjName(id.startsWith("new-") ? "Dự án mới" : "Sơ đồ không tên");
      setNodes([
        { id: "1", position: { x: 400, y: 100 }, data: { label: "Tên Dự Án", type: "title" }, type: "miminNode" }
      ]);
    }
    setIsReady(true);
  }, [id, setNodes, setEdges]);

  // Xử lý nối dây
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Thêm khối Text
  const addTextNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: "Khối mới", type: "normal" },
      type: "miminNode",
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success("Đã thêm khối văn bản");
  };

  /** Tải ảnh TỪ MÁY lên sơ đồ (chọn được nhiều ảnh cùng lúc) */
  const handleChonFile = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Vui lòng chọn file ảnh (JPG, PNG...)");
      return;
    }

    const nodesMoi: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const goc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(f);
      });
      const src = await nenAnh(goc);
      nodesMoi.push({
        id: `img_${Date.now()}_${i}`,
        position: { x: 220 + (i % 4) * 190, y: 300 + Math.floor(i / 4) * 210 },
        data: { label: f.name.replace(/\.[^.]+$/, ""), imageSrc: src },
        type: "miminImageNode",
      });
    }
    setNodes((nds) => [...nds, ...nodesMoi]);
    toast.success(`Đã thêm ${nodesMoi.length} ảnh vào sơ đồ`);
  };

  /** Thêm ảnh bằng đường link (giữ lại cách cũ cho ai cần) */
  const addImageTuLink = () => {
    const url = prompt("Dán đường link ảnh (URL):");
    if (!url) return;
    setNodes((nds) => [
      ...nds,
      {
        id: `img_${Date.now()}`,
        position: { x: Math.random() * 200 + 200, y: Math.random() * 200 + 200 },
        data: { label: "Ảnh tham khảo", imageSrc: url },
        type: "miminImageNode",
      },
    ]);
    toast.success("Đã thêm ảnh từ link");
  };

  /** Đổi màu các khối đang được chọn */
  const doiMauKhoiDangChon = (mau: MauKhoi) => {
    const dangChon = nodes.filter((n: any) => n.selected && n.type === "miminNode");
    if (dangChon.length === 0) {
      toast.error("Hãy bấm chọn 1 khối chữ trên sơ đồ trước, rồi mới chọn màu.");
      return;
    }
    setNodes((nds: any[]) =>
      nds.map((n) => (n.selected && n.type === "miminNode" ? { ...n, data: { ...n.data, color: mau } } : n))
    );
    toast.success(`Đã đổi ${dangChon.length} khối sang màu ${MAU_KHOI[mau].ten}`);
  };

  const handleSave = () => {
    const all = docTatCa();
    all[id] = { name: projName, nodes, edges };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      toast.success("Đã lưu sơ đồ!");
    } catch {
      toast.error("Bộ nhớ trình duyệt đã đầy - hãy bớt ảnh trong sơ đồ rồi lưu lại.");
    }
  };

  if (!isReady) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/so-do-chien-luoc" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input 
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            className="font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1 w-[300px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={addTextNode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium transition"
          >
            <Type className="w-4 h-4" /> Thêm Text
          </button>
          {/* Tải ảnh TỪ MÁY - trước đây chỉ dán được link nên không dùng ảnh máy được */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleChonFile(e.target.files);
              e.target.value = ""; // cho phép chọn lại đúng file đó lần sau
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium transition"
            title="Chọn ảnh từ máy (chọn được nhiều ảnh)"
          >
            <ImageIcon className="w-4 h-4" /> Tải Ảnh Lên
          </button>
          <button
            onClick={addImageTuLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium transition"
            title="Thêm ảnh bằng đường link"
          >
            <Link2 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2"></div>

          {/* Đổi màu ô: chọn khối trên sơ đồ rồi bấm màu */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
            <span className="shrink-0" title="Chọn khối trên sơ đồ rồi bấm màu để đổi">
              <Palette className="w-4 h-4 text-slate-500" />
            </span>
            {DS_MAU_KHOI.map((m) => (
              <button
                key={m}
                onClick={() => doiMauKhoiDangChon(m)}
                title={`Đổi màu khối đang chọn sang ${MAU_KHOI[m].ten}`}
                className={`w-5 h-5 rounded-md ${MAU_KHOI[m].cham} hover:scale-110 hover:ring-2 hover:ring-sky-400 transition`}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2"></div>

          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition"
          >
            <Save className="w-4 h-4" /> Lưu lại
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full h-full bg-slate-50 dark:bg-slate-950/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="touch-none"
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap zoomable pannable className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800" />
        </ReactFlow>
      </div>
    </div>
  );
}

// Bọc ReactFlowProvider theo khuyến nghị chung (giúp store nội bộ ổn định hơn
// khi remount). LƯU Ý cho ai debug sau: trên `next dev` (React StrictMode chạy
// effect 2 lần), @xyflow/react đôi khi bị "kẹt" node ở visibility:hidden nên
// không vẽ được dây nối dù data đúng - đã kiểm chứng: build production
// (`next build && next start`) thì node/dây nối lên đầy đủ, đúng bình thường.
// Không phải lỗi thật trong code, chỉ là triệu chứng riêng của dev mode.
export default function SoDoCanvasPage() {
  return (
    <ReactFlowProvider>
      <SoDoCanvasInner />
    </ReactFlowProvider>
  );
}
