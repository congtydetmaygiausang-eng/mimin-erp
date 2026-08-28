"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, RefreshCw, Search, Shirt } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { supabase } from "@/lib/supabase/client";
import ProductLibraryCard from "@/components/danh-muc-sp/ProductLibraryCard";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";

interface FavoriteRow {
  id: string;
  user_id: string;
  ma_sp: string;
  created_at?: string;
}

export default function MauDaThichPage() {
  const { user } = useSession();
  const { dsSanPham, loading: productsLoading } = useDanhMucSP();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadFavorites = useCallback(async () => {
    if (!user?.id || !supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mau_da_thich")
      .select("id, user_id, ma_sp, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Không tải được mẫu đã thích: ${error.message}`);
    } else {
      setFavoriteIds(((data || []) as FavoriteRow[]).map((row) => row.ma_sp));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void loadFavorites(); }, [loadFavorites]);

  const favoriteProducts = useMemo(() => {
    const favorites = new Set(favoriteIds);
    const query = search.trim().toLowerCase();
    return dsSanPham.filter((product) => {
      const matchesFavorite = favorites.has(product.id);
      const matchesSearch = !query || product.id.toLowerCase().includes(query) || product.tenSP.toLowerCase().includes(query);
      return matchesFavorite && matchesSearch;
    });
  }, [dsSanPham, favoriteIds, search]);

  const removeFavorite = async (product: SanPham) => {
    if (!user?.id || !supabase) return;
    const previous = favoriteIds;
    setFavoriteIds((ids) => ids.filter((id) => id !== product.id));
    const { error } = await supabase.from("mau_da_thich").delete().eq("user_id", user.id).eq("ma_sp", product.id);
    if (error) {
      setFavoriteIds(previous);
      toast.error(`Không bỏ thích được: ${error.message}`);
      return;
    }
    toast.success(`Đã bỏ thích ${product.tenSP}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 pb-24 md:pb-20 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" /> Mẫu đã thích
          </h1>
          <p className="text-sm opacity-70 mt-1">Các mẫu anh đã lưu từ Danh mục sản phẩm.</p>
        </div>
        <button
          onClick={() => void loadFavorites()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      <MiminGroupTabs />

      <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 font-bold text-slate-700"><Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> {favoriteIds.length} mẫu đã thích</div>
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã hoặc tên mẫu..." className="input pl-9" /></div>
      </section>

      {loading || productsLoading ? <section className="card p-12 text-center text-slate-500">Đang tải mẫu đã thích...</section> : favoriteProducts.length === 0 ? <section className="card p-16 text-center text-slate-400"><Shirt className="mx-auto mb-3 h-12 w-12 opacity-25" /><p className="font-bold">Chưa có mẫu nào được thích</p><p className="mt-1 text-sm">Bấm biểu tượng trái tim trên sản phẩm để lưu mẫu tại đây.</p></section> : <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{favoriteProducts.map((product) => <div key={product.id} className="relative"><ProductLibraryCard sp={product} onFavorite={() => void removeFavorite(product)} /><button onClick={() => void removeFavorite(product)} className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-rose-500 shadow-md hover:bg-rose-50" title="Bỏ thích" aria-label={`Bỏ thích ${product.tenSP}`}><Heart className="h-5 w-5 fill-current" /></button></div>)}</section>}
    </div>
  );
}
