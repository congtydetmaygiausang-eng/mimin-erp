"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, Connection, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MiminNode, MiminImageNode } from "@/components/mindmap/CustomNodes";
import { MOCK_PROJECTS } from "@/lib/data/so-do-chien-luoc-data";
import { ArrowLeft, Save, Image as ImageIcon, Type, Download, Settings2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

  // Khởi tạo data
  useEffect(() => {
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

  // Thêm khối Ảnh
  const addImageNode = () => {
    const url = prompt("Nhập link hình ảnh (URL) để chèn vào sơ đồ:");
    if (!url) return;

    const newNode = {
      id: `img_${Date.now()}`,
      position: { x: Math.random() * 200 + 200, y: Math.random() * 200 + 200 },
      data: { label: "Ảnh tham khảo", imageSrc: url },
      type: "miminImageNode",
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success("Đã thêm khối hình ảnh");
  };

  const handleSave = () => {
    // Trong thực tế sẽ call API lưu vào database
    toast.success("Đã lưu trữ sơ đồ thành công!");
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
          <button 
            onClick={addImageNode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium transition"
          >
            <ImageIcon className="w-4 h-4" /> Thêm Ảnh
          </button>
          
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
