"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Palette, Plus, Clock, Search, MoreVertical } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/data/so-do-chien-luoc-data";
import { supabase } from "@/lib/supabase/client";

export default function SoDoChienLuocPage() {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('so_do_chien_luoc')
          .select('*')
          .order('updated_at', { ascending: false });

        let merged = [...MOCK_PROJECTS];

        if (data && data.length > 0) {
          data.forEach((dbProj: any) => {
            const index = merged.findIndex(p => p.id === dbProj.id);
            if (index >= 0) {
              merged[index] = { ...merged[index], name: dbProj.name, nodes: dbProj.nodes, edges: dbProj.edges, updatedAt: dbProj.updated_at };
            } else {
              merged.push({
                id: dbProj.id,
                name: dbProj.name,
                nodes: dbProj.nodes || [],
                edges: dbProj.edges || [],
                updatedAt: dbProj.updated_at
              });
            }
          });
        }
        
        // Migrate từ localStorage nếu có bản ghi chưa đẩy lên
        const raw = localStorage.getItem("mimin_so_do_chien_luoc_v1");
        if (raw) {
          try {
            const savedData = JSON.parse(raw);
            Object.keys(savedData).forEach(id => {
              const savedProj = savedData[id];
              const index = merged.findIndex(p => p.id === id);
              if (index < 0) {
                merged.push({
                  id,
                  name: savedProj.name,
                  nodes: savedProj.nodes || [],
                  edges: savedProj.edges || [],
                  updatedAt: new Date().toISOString()
                });
                // Tự động đẩy lên Supabase (migration)
                supabase.from('so_do_chien_luoc').upsert({
                  id, name: savedProj.name, nodes: savedProj.nodes || [], edges: savedProj.edges || []
                }).then(() => console.log("Migrated", id));
              }
            });
          } catch(e) {}
        }
        
        setProjects(merged);
      } catch (err) {
        console.error("Lỗi tải sơ đồ:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xoá sơ đồ này? Thao tác này không thể hoàn tác.")) {
      const raw = localStorage.getItem("mimin_so_do_chien_luoc_v1");
      if (raw) {
        try {
          const savedData = JSON.parse(raw);
          delete savedData[id];
          localStorage.setItem("mimin_so_do_chien_luoc_v1", JSON.stringify(savedData));
        } catch(e) {}
      }
      if (supabase) {
        await supabase.from('so_do_chien_luoc').delete().eq('id', id);
      }
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6 text-brand-500" />
            Sơ đồ chiến lược / Mind Map
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Thiết kế lưu đồ công việc, phân bổ nhân sự và vẽ kế hoạch sản xuất kéo thả.
          </p>
        </div>
        <Link 
          href={`/so-do-chien-luoc/new-${Date.now()}`}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Tạo sơ đồ mới
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
        <input 
          type="text" 
          placeholder="Tìm kiếm dự án sơ đồ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(proj => (
          <Link href={`/so-do-chien-luoc/${proj.id}`} key={proj.id}>
            <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 p-5 rounded-xl hover:border-brand-500/50 hover:shadow-lg transition cursor-pointer group flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                  <Link href={`/so-do-chien-luoc/${proj.id}`} className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-100 transition text-sm font-medium">
                    Xem
                  </Link>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(proj.id); }}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm font-medium"
                  >
                    Xoá
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-lg mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                {proj.name}
              </h3>
              
              <div className="mt-auto pt-4 flex items-center gap-4 text-xs opacity-60">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {new Date(proj.updatedAt).toLocaleDateString("vi-VN")}
                </span>
                <span>{proj.nodes.length} nodes</span>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center opacity-50">
            Không tìm thấy sơ đồ nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
