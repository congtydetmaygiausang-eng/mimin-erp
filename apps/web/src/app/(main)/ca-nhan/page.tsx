"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Briefcase, Building2, Bell, Heart } from "lucide-react";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";
import { useSession } from "@/components/session-provider";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/lib/supabase/client";
import { PostCard, thoiGianTuongDoi, type BaiDang, type BinhLuan, type LuotThich } from "@/components/bang-tin/PostCard";
import { toast } from "sonner";

type ThongBao = {
  id: string;
  nguoi_gui_name: string;
  loai: string;
  bai_dang_id: string;
  noi_dung: string;
  da_doc: boolean;
  created_at: string;
};

export default function CaNhanPage() {
  const { user } = useSession();
  const tenNguoiDung = user?.name || "Khuyết danh";

  const [posts, setPosts] = useState<BaiDang[]>([]);
  const [comments, setComments] = useState<Record<string, BinhLuan[]>>({});
  const [likes, setLikes] = useState<Record<string, LuotThich[]>>({});
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const [thongBaos, setThongBaos] = useState<ThongBao[]>([]);
  const [hienThongBao, setHienThongBao] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data: postData } = await supabase
        .from("bang_tin_bai_dang")
        .select("*")
        .eq("created_by_name", tenNguoiDung)
        .order("created_at", { ascending: false });
      const list = (postData || []) as BaiDang[];
      setPosts(list);

      if (list.length > 0) {
        const ids = list.map((p) => p.id);
        const [{ data: cmtData }, { data: likeData }] = await Promise.all([
          supabase.from("bang_tin_binh_luan").select("*").in("bai_dang_id", ids).order("created_at", { ascending: true }),
          supabase.from("bang_tin_luot_thich").select("*").in("bai_dang_id", ids),
        ]);
        const cmtGrouped: Record<string, BinhLuan[]> = {};
        (cmtData || []).forEach((c: BinhLuan) => { (cmtGrouped[c.bai_dang_id] ||= []).push(c); });
        setComments(cmtGrouped);

        const likeGrouped: Record<string, LuotThich[]> = {};
        (likeData || []).forEach((l: LuotThich) => { (likeGrouped[l.bai_dang_id] ||= []).push(l); });
        setLikes(likeGrouped);
      }

      const { data: thongBaoData } = await supabase
        .from("bang_tin_thong_bao")
        .select("*")
        .eq("nguoi_nhan_name", tenNguoiDung)
        .order("created_at", { ascending: false })
        .limit(30);
      setThongBaos((thongBaoData || []) as ThongBao[]);
    } catch (err) {
      console.error("Lỗi tải trang cá nhân:", err);
    } finally {
      setLoading(false);
    }
  }, [tenNguoiDung]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleThich = async (post: BaiDang) => {
    if (!supabase) return;
    const postId = post.id;
    const existing = (likes[postId] || []).find((l) => l.created_by_name === tenNguoiDung);
    if (existing) {
      setLikes((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((l) => l.id !== existing.id) }));
      const { error } = await supabase.from("bang_tin_luot_thich").delete().eq("id", existing.id);
      if (error) load();
      return;
    }
    const newLike: LuotThich = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, bai_dang_id: postId, created_by_name: tenNguoiDung };
    setLikes((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), newLike] }));
    const { error } = await supabase.from("bang_tin_luot_thich").insert(newLike);
    if (error) {
      load();
      return;
    }
    if (post.created_by_name !== tenNguoiDung) {
      await supabase.from("bang_tin_thong_bao").insert({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nguoi_nhan_name: post.created_by_name,
        nguoi_gui_name: tenNguoiDung,
        loai: "thich",
        bai_dang_id: postId,
        noi_dung: `${tenNguoiDung} đã thích bài viết của bạn`,
        da_doc: false,
        created_at: new Date().toISOString(),
      });
    }
  };

  const guiBinhLuan = async (postId: string) => {
    const noiDung = (commentDraft[postId] || "").trim();
    if (!noiDung || !supabase) return;
    const cmt: BinhLuan = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      bai_dang_id: postId,
      noi_dung: noiDung,
      created_by_name: tenNguoiDung,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), cmt] }));
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    const { error } = await supabase.from("bang_tin_binh_luan").insert(cmt);
    if (error) {
      toast.error("Gửi bình luận thất bại: " + error.message);
      load();
    }
  };

  const xoaBinhLuan = async (postId: string, cmtId: string) => {
    if (!supabase) return;
    setComments((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((c) => c.id !== cmtId) }));
    await supabase.from("bang_tin_binh_luan").delete().eq("id", cmtId);
  };

  const handleXoaBai = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Xoá bài đăng này? Bình luận và lượt thích cũng sẽ bị xoá.")) return;
    const { error } = await supabase.from("bang_tin_bai_dang").delete().eq("id", id);
    if (error) {
      toast.error("Xoá thất bại: " + error.message);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const moThongBao = async () => {
    const dangMo = !hienThongBao;
    setHienThongBao(dangMo);
    const chuaDoc = thongBaos.filter((t) => !t.da_doc);
    if (dangMo && chuaDoc.length > 0 && supabase) {
      setThongBaos((prev) => prev.map((t) => ({ ...t, da_doc: true })));
      await supabase.from("bang_tin_thong_bao").update({ da_doc: true }).in("id", chuaDoc.map((t) => t.id));
    }
  };

  const soChuaDoc = thongBaos.filter((t) => !t.da_doc).length;
  const tongLuotThich = Object.values(likes).reduce((sum, ds) => sum + ds.length, 0);
  const tongBinhLuan = Object.values(comments).reduce((sum, ds) => sum + ds.length, 0);

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-20">
      {/* Trang cá nhân kiểu Zalo: ảnh bìa + avatar tròn đè lên, thông tin căn giữa */}
      <div className="rounded-b-xl md:rounded-xl overflow-hidden bg-white/60 dark:bg-white/5 border-b md:border border-black/5 dark:border-white/5">
        <div className="h-28 md:h-36 bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 relative">
          <button
            onClick={moThongBao}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {soChuaDoc > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {soChuaDoc}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center px-4 pb-5 -mt-12">
          <Avatar name={tenNguoiDung} size="2xl" className="ring-4 ring-white dark:ring-slate-900 shadow-lg" />
          <div className="text-lg font-bold mt-2 text-center">{tenNguoiDung}</div>
          {user?.title && (
            <div className="text-sm opacity-70 flex items-center gap-1.5 mt-1">
              <Briefcase className="w-3.5 h-3.5" /> {user.title}
            </div>
          )}
          {user?.phongBan && (
            <div className="text-sm opacity-70 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5" /> {user.phongBan}
            </div>
          )}
          {user?.email && (
            <div className="text-sm opacity-70 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </div>
          )}

          <div className="flex items-center gap-8 mt-4 pt-4 border-t border-black/5 dark:border-white/10 w-full max-w-xs justify-center">
            <div className="text-center">
              <div className="font-bold text-lg">{posts.length}</div>
              <div className="text-xs opacity-60">Bài đăng</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{tongLuotThich}</div>
              <div className="text-xs opacity-60">Lượt thích</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{tongBinhLuan}</div>
              <div className="text-xs opacity-60">Bình luận</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-0 md:mt-4 space-y-4">
      <MiminGroupTabs />

      {hienThongBao && (
        <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-4 space-y-2">
          <div className="font-semibold text-sm mb-1">Thông báo</div>
          {thongBaos.length === 0 ? (
            <div className="text-sm opacity-60 py-4 text-center">Chưa có thông báo nào.</div>
          ) : (
            thongBaos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                <Avatar name={t.nguoi_gui_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {t.noi_dung}</div>
                  <div className="text-xs opacity-60">{thoiGianTuongDoi(t.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div>
        <div className="font-semibold text-sm mb-2">Bài đăng của tôi</div>
        {loading ? (
          <div className="py-8 text-center opacity-50 text-sm">Đang tải...</div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center opacity-50 text-sm">Anh chưa đăng bài nào trên Bảng tin.</div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                comments={comments[post.id] || []}
                likes={likes[post.id] || []}
                currentUserName={tenNguoiDung}
                isCommentsOpen={!!openComments[post.id]}
                onToggleComments={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                commentDraft={commentDraft[post.id] || ""}
                onCommentDraftChange={(v) => setCommentDraft((prev) => ({ ...prev, [post.id]: v }))}
                onToggleLike={() => toggleThich(post)}
                onSendComment={() => guiBinhLuan(post.id)}
                onDeleteComment={(cmtId) => xoaBinhLuan(post.id, cmtId)}
                onDeletePost={() => handleXoaBai(post.id)}
                onPreviewImage={setPreviewImg}
              />
            ))}
          </div>
        )}
      </div>
      </div>

      {previewImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <img src={previewImg} className="relative max-w-full max-h-[90vh] rounded-lg" />
        </div>
      )}
    </div>
  );
}
