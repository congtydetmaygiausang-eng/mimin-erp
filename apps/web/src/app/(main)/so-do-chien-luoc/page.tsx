"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Palette, Plus, Clock, Search, MoreVertical } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/data/so-do-chien-luoc-data";

export default function SoDoChienLuocPage() {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Merge mock projects with local storage
    const raw = localStorage.getItem("mimin_so_do_chien_luoc_v1");
    if (raw) {
      try {
        const savedData = JSON.parse(raw);
        let merged = [...MOCK_PROJECTS];
        
        // Cập nhật hoặc thêm mới từ localStorage
        Object.keys(savedData).forEach(id => {
          const index = merged.findIndex(p => p.id === id);
          const savedProj = savedData[id];
          if (index >= 0) {
            merged[index] = { ...merged[index], name: savedProj.name, nodes: savedProj.nodes, edges: savedProj.edges };
          } else {
            merged.push({
              id,
              name: savedProj.name,
              nodes: savedProj.nodes || [],
              edges: savedProj.edges || [],
              updatedAt: new Date().toISOString()
            });
          }
        });
        setProjects(merged);
      } catch(e) {}
    }
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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
                <button className="p-1 opacity-40 hover:opacity-100 transition rounded-md hover:bg-black/5 dark:hover:bg-white/10" onClick={(e) => e.preventDefault()}>
                  <MoreVertical className="w-5 h-5" />
                </button>
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
