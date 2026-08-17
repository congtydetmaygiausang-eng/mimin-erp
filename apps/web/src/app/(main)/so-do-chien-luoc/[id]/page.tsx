"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, Connection, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MiminNode, MiminImageNode } from "@/components/mindmap/CustomNodes";
import { MOCK_PROJECTS, MAU_KHOI, DS_MAU_KHOI, type MauKhoi } from "@/lib/data/so-do-chien-luoc-data";
import { ArrowLeft, Save, Image as ImageIcon, Type, Link2, Palette, Keyboard, Undo2, Copy, Trash2, Pencil, DownloadCloud } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase/client";

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
  const [hienPhimTat, setHienPhimTat] = useState(false);
  // Lịch sử để Hoàn tác (Ctrl+Z). Dùng ref chứ không dùng state: chỉ cần đọc/ghi
  // khi có thao tác, không cần render lại mỗi lần đẩy snapshot.
  const lichSuRef = useRef<{ nodes: any[]; edges: any[] }[]>([]);

  // Khởi tạo data: ưu tiên bản đã lưu của người dùng, chưa có mới lấy mẫu sẵn
  useEffect(() => {
    const loadData = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from('so_do_chien_luoc').select('*').eq('id', id).single();
          if (data) {
            setProjName(data.name);
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            setIsReady(true);
            return;
          }
        }
      } catch (err) {
        console.error("Lỗi fetch Supabase, fallback về localStorage", err);
      }
      
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
    };
    loadData();
  }, [id, setNodes, setEdges]);

  // Xử lý nối dây
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Thêm khối Text
  const addTextNode = () => {
    luuLichSu();
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

    luuLichSu();
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
    luuLichSu();
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
    luuLichSu();
    setNodes((nds: any[]) =>
      nds.map((n) => (n.selected && n.type === "miminNode" ? { ...n, data: { ...n.data, color: mau } } : n))
    );
    toast.success(`Đã đổi ${dangChon.length} khối sang màu ${MAU_KHOI[mau].ten}`);
  };

  const handleSave = async () => {
    const all = docTatCa();
    all[id] = { name: projName, nodes, edges };
    
    let savedToDB = false;
    try {
      if (supabase) {
        const { error } = await supabase.from('so_do_chien_luoc').upsert({
          id,
          name: projName,
          nodes,
          edges
        });
        if (!error) savedToDB = true;
      }
    } catch(err) {
      console.error(err);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      if (savedToDB) toast.success("Đã lưu và đồng bộ sơ đồ lên Cloud!");
      else toast.success("Đã lưu sơ đồ vào máy địa phương!");
    } catch {
      toast.error("Bộ nhớ trình duyệt đã đầy - hãy bớt ảnh trong sơ đồ rồi lưu lại.");
    }
  };

  const handleDownloadImage = () => {
    const el = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!el) return;
    toast.info("Đang xử lý ảnh, vui lòng đợi...");
    toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute("download", `SoDo_${projName.replace(/\s+/g, '_')}.png`);
        a.setAttribute("href", dataUrl);
        a.click();
        toast.success("Đã tải xong ảnh sơ đồ!");
      })
      .catch((err) => {
        toast.error("Lỗi khi tạo ảnh, hãy thử thu nhỏ sơ đồ lại.");
      });
  };

  // ============ THAO TÁC CHỈNH SỬA CƠ BẢN + PHÍM TẮT ============

  /** Chụp lại trạng thái hiện tại trước khi sửa, để Ctrl+Z quay lại được */
  const luuLichSu = () => {
    lichSuRef.current.push({ nodes: [...nodes], edges: [...edges] });
    if (lichSuRef.current.length > 30) lichSuRef.current.shift();
  };

  const hoanTac = () => {
    const truoc = lichSuRef.current.pop();
    if (!truoc) {
      toast.error("Không còn thao tác nào để hoàn tác");
      return;
    }
    setNodes(truoc.nodes);
    setEdges(truoc.edges);
    toast.success("Đã hoàn tác");
  };

  const xoaDangChon = () => {
    const nodeChon = nodes.filter((n: any) => n.selected);
    const edgeChon = edges.filter((e: any) => e.selected);
    if (nodeChon.length === 0 && edgeChon.length === 0) {
      toast.error("Chưa chọn khối hoặc dây nối nào để xoá");
      return;
    }
    luuLichSu();
    const idXoa = new Set(nodeChon.map((n: any) => n.id));
    setNodes((nds: any[]) => nds.filter((n) => !n.selected));
    // Xoá luôn dây nối dính tới khối vừa xoá, tránh để lại dây "mồ côi"
    setEdges((eds: any[]) => eds.filter((e) => !e.selected && !idXoa.has(e.source) && !idXoa.has(e.target)));
    toast.success(`Đã xoá ${nodeChon.length} khối, ${edgeChon.length} dây nối`);
  };

  const nhanDoiDangChon = () => {
    const chon = nodes.filter((n: any) => n.selected);
    if (chon.length === 0) {
      toast.error("Chưa chọn khối nào để nhân đôi");
      return;
    }
    luuLichSu();
    const ban = chon.map((n: any, i: number) => ({
      ...n,
      id: `${n.id}_copy_${Date.now()}_${i}`,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: false,
    }));
    setNodes((nds: any[]) => [...nds, ...ban]);
    toast.success(`Đã nhân đôi ${ban.length} khối`);
  };

  const doiTenDangChon = () => {
    const chon = nodes.filter((n: any) => n.selected);
    if (chon.length !== 1) {
      toast.error("Hãy chọn đúng 1 khối để đổi tên");
      return;
    }
    const ten = prompt("Nhập nội dung mới cho khối:", chon[0].data?.label || "");
    if (ten === null) return;
    luuLichSu();
    setNodes((nds: any[]) =>
      nds.map((n) => (n.selected ? { ...n, data: { ...n.data, label: ten } } : n))
    );
    toast.success("Đã đổi nội dung khối");
  };

  const boChon = () => {
    setNodes((nds: any[]) => nds.map((n) => ({ ...n, selected: false })));
    setEdges((eds: any[]) => eds.map((e) => ({ ...e, selected: false })));
  };

  // Bắt phím tắt và sự kiện Paste
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const dangGo = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === "s") { e.preventDefault(); handleSave(); return; }
      if (dangGo) return;

      if (ctrl && e.key.toLowerCase() === "z") { e.preventDefault(); hoanTac(); return; }
      if (ctrl && e.key.toLowerCase() === "d") { e.preventDefault(); nhanDoiDangChon(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); xoaDangChon(); return; }
      if (e.key === "F2") { e.preventDefault(); doiTenDangChon(); return; }
      if (e.key === "Escape") { boChon(); setHienPhimTat(false); return; }
    };

    const onPaste = async (e: ClipboardEvent) => {
      const el = e.target as HTMLElement | null;
      const dangGo = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (dangGo) return; // Nếu đang gõ text thì cho phép paste text bình thường

      // Xử lý dán link ảnh hoặc text thông thường
      const text = e.clipboardData?.getData("text");
      if (text) {
        luuLichSu();
        if (text.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
          // Paste URL hình ảnh
          setNodes((nds: any[]) => [...nds, {
            id: `img_${Date.now()}`,
            position: { x: Math.random() * 200 + 200, y: Math.random() * 200 + 200 },
            data: { label: "Ảnh dán", imageSrc: text },
            type: "miminImageNode",
          }]);
          toast.success("Đã dán ảnh từ link");
        } else {
          // Paste text thường -> tạo khối chữ
          setNodes((nds: any[]) => [...nds, {
            id: `node_${Date.now()}`,
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: { label: text, type: "normal" },
            type: "miminNode",
          }]);
          toast.success("Đã dán văn bản thành khối mới");
        }
        e.preventDefault();
        return;
      }

      // Xử lý dán file ảnh (copy từ màn hình/thư mục)
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        luuLichSu();
        
        // Kiểm tra có node ảnh được chọn không -> nếu có chỉ 1 ảnh thì paste vào node đó
        const selectedImageNode = nodes.find((n: any) => n.selected && n.type === "miminImageNode");
        
        if (selectedImageNode && files.length === 1) {
          // Paste ảnh vào node được chọn
          const f = files[0];
          const goc = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          });
          const src = await nenAnh(goc);
          setNodes((nds: any[]) =>
            nds.map((n) =>
              n.id === selectedImageNode.id
                ? { ...n, data: { ...n.data, imageSrc: src } }
                : n
            )
          );
          toast.success("Đã thay ảnh cho khối được chọn");
          return;
        }
        
        // Còn không thì tạo node mới cho mỗi ảnh
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
            data: { label: "Ảnh dán", imageSrc: src },
            type: "miminImageNode",
          });
        }
        setNodes((nds: any[]) => [...nds, ...nodesMoi]);
        toast.success(`Đã dán ${nodesMoi.length} ảnh`);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  });

  if (!isReady) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 px-4 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 z-10 overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/so-do-chien-luoc" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input 
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            className="font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1 w-[300px]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 xl:pb-0">
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

          {/* Thao tác chỉnh sửa cơ bản - đều có phím tắt tương ứng */}
          {([
            [Undo2, "Hoàn tác", hoanTac],
            [Copy, "Nhân đôi", nhanDoiDangChon],
            [Pencil, "Đổi tên", doiTenDangChon],
            [Trash2, "Xoá", xoaDangChon],
          ] as [any, string, () => void][]).map(([Icon, title, fn], i) => (
            <button
              key={i}
              onClick={fn}
              title={title}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition"
            >
              <Icon className="w-4 h-4" /> <span className="hidden 2xl:inline">{title}</span>
            </button>
          ))}

          {/* Bảng liệt kê phím tắt */}
          <div className="relative">
            <button
              onClick={() => setHienPhimTat((v) => !v)}
              title="Xem danh sách phím tắt"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition"
            >
              <Keyboard className="w-4 h-4" /> <span className="hidden 2xl:inline">Phím tắt</span>
            </button>
            {hienPhimTat && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl ring-1 ring-slate-200 dark:ring-white/10 shadow-xl p-3 z-50 text-left">
                <div className="font-bold text-sm mb-2 text-slate-700 dark:text-slate-200">Phím tắt chỉnh sửa</div>
                <div className="space-y-1.5">
                  {[
                    ["Ctrl + S", "Lưu sơ đồ"],
                    ["Ctrl + Z", "Hoàn tác thao tác vừa rồi"],
                    ["Ctrl + D", "Nhân đôi khối đang chọn"],
                    ["F2", "Đổi nội dung khối đang chọn"],
                    ["Delete", "Xoá khối / dây nối đang chọn"],
                    ["Esc", "Bỏ chọn tất cả"],
                  ].map(([phim, mo]) => (
                    <div key={phim} className="flex items-center justify-between gap-3 text-xs">
                      <kbd className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-white/10 font-mono font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                        {phim}
                      </kbd>
                      <span className="text-slate-500 text-right">{mo}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                  Bấm vào khối trên sơ đồ để chọn (giữ Shift để chọn nhiều khối).
                </p>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2"></div>

          <button
            onClick={handleDownloadImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition"
            title="Lưu thành file ảnh PNG"
          >
            <DownloadCloud className="w-4 h-4" /> Xuất Ảnh
          </button>

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
          // Tự xử lý phím Delete ở trên để còn lưu lịch sử cho Ctrl+Z và xoá
          // kèm dây nối mồ côi; tắt cơ chế xoá mặc định để không chạy 2 lần.
          deleteKeyCode={null}
          onNodeDragStart={luuLichSu}
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
