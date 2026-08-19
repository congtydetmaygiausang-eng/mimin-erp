"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Newspaper, Image as ImageIcon, Video, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/components/session-provider";
import { Avatar } from "@/components/Avatar";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";
import { PostCard, type AnhBaiDang, type BaiDang, type BinhLuan, type LuotThich } from "@/components/bang-tin/PostCard";

const REFRESH_MS = 20000;
const MAX_ANH = 4;
const MAX_VIDEO_GIAY = 180; // 3 phút

/** Nén ảnh trước khi lưu (base64 trong JSONB) để bài đăng không quá nặng */
async function nenAnh(dataUrl: string, maxDim = 1000, quality = 0.75): Promise<string> {
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

/** Đọc thời lượng video (giây) mà không cần upload lên server */
function layThoiLuongVideo(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Không đọc được video"));
    video.src = URL.createObjectURL(file);
  });
}

export default function BangTinPage() {
  const { user } = useSession();
  const tenNguoiDung = user?.name || "Khuyết danh";

  const [posts, setPosts] = useState<BaiDang[]>([]);
  const [comments, setComments] = useState<Record<string, BinhLuan[]>>({});
  const [likes, setLikes] = useState<Record<string, LuotThich[]>>({});
  const [loading, setLoading] = useState(true);

  const [newText, setNewText] = useState("");
  const [newImages, setNewImages] = useState<AnhBaiDang[]>([]);
  const [newVideo, setNewVideo] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const loadFeed = useCallback(async (silent = false) => {
    if (!supabase) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const [{ data: postData, error: postErr }, { data: cmtData }, { data: likeData }] = await Promise.all([
        supabase.from("bang_tin_bai_dang").select("*").order("ghim", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("bang_tin_binh_luan").select("*").order("created_at", { ascending: true }),
        supabase.from("bang_tin_luot_thich").select("*"),
      ]);
      if (postErr) throw postErr;

      setPosts((postData || []) as BaiDang[]);

      const cmtGrouped: Record<string, BinhLuan[]> = {};
      (cmtData || []).forEach((c: BinhLuan) => {
        (cmtGrouped[c.bai_dang_id] ||= []).push(c);
      });
      setComments(cmtGrouped);

      const likeGrouped: Record<string, LuotThich[]> = {};
      (likeData || []).forEach((l: LuotThich) => {
        (likeGrouped[l.bai_dang_id] ||= []).push(l);
      });
      setLikes(likeGrouped);
    } catch (err) {
      if (!silent) console.error("Lỗi tải bảng tin:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
    const timer = setInterval(() => loadFeed(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadFeed]);

  const handleChonAnh = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (newVideo) {
      toast.error("Mỗi bài chỉ đăng ảnh hoặc video, không đăng cùng lúc.");
      return;
    }
    const conLai = MAX_ANH - newImages.length;
    if (conLai <= 0) {
      toast.error(`Mỗi bài đăng tối đa ${MAX_ANH} ảnh.`);
      return;
    }
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/")).slice(0, conLai);
    if (fileList.length > files.length) {
      toast.error(`Chỉ thêm được ${files.length} ảnh (tối đa ${MAX_ANH} ảnh/bài).`);
    }
    const anhMoi: AnhBaiDang[] = [];
    for (const f of files) {
      const goc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(f);
      });
      anhMoi.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, dataUrl: await nenAnh(goc) });
    }
    setNewImages((prev) => [...prev, ...anhMoi]);
  };

  const handleChonVideo = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    if (newImages.length > 0) {
      toast.error("Mỗi bài chỉ đăng ảnh hoặc video, không đăng cùng lúc.");
      return;
    }
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video.");
      return;
    }

    let thoiLuong: number;
    try {
      thoiLuong = await layThoiLuongVideo(file);
    } catch {
      toast.error("Không đọc được thời lượng video.");
      return;
    }
    if (thoiLuong > MAX_VIDEO_GIAY) {
      toast.error(`Video tối đa ${MAX_VIDEO_GIAY / 60} phút (video này dài khoảng ${Math.ceil(thoiLuong / 60)} phút).`);
      return;
    }

    if (!supabase) {
      toast.error("Chưa kết nối được cơ sở dữ liệu.");
      return;
    }

    setUploadingVideo(true);
    try {
      const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      // Chỉ xin "link upload có chữ ký" qua server (request nhỏ, không kèm file) -
      // rồi trình duyệt tự đẩy file thẳng lên Supabase Storage, không qua Vercel
      // nữa vì Vercel giới hạn body request ~4.5MB, video vài chục giây là treo.
      const res = await fetch("/api/bang-tin-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được link upload");

      const { error: uploadErr } = await supabase.storage.from("bang-tin-video").uploadToSignedUrl(data.path, data.token, file);
      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage.from("bang-tin-video").getPublicUrl(data.path);
      setNewVideo(publicData.publicUrl);
    } catch (err: any) {
      toast.error("Upload video thất bại: " + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDang = async () => {
    if (!supabase) {
      toast.error("Chưa kết nối được cơ sở dữ liệu.");
      return;
    }
    if (!newText.trim() && newImages.length === 0 && !newVideo) {
      toast.error("Nhập nội dung, chọn ảnh hoặc video trước khi đăng.");
      return;
    }
    setPosting(true);
    const newPost: BaiDang = {
      id: Date.now().toString(),
      noi_dung: newText.trim(),
      hinh_anh: newImages,
      video_url: newVideo,
      ghim: false,
      created_by_name: tenNguoiDung,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("bang_tin_bai_dang").insert(newPost);
    setPosting(false);
    if (error) {
      console.error(error);
      toast.error("Đăng bài thất bại: " + error.message);
      return;
    }
    setNewText("");
    setNewImages([]);
    setNewVideo(null);
    toast.success("Đã đăng bảng tin!");
    loadFeed();
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
    toast.success("Đã xoá bài đăng");
  };

  const toggleThich = async (post: BaiDang) => {
    if (!supabase) return;
    const postId = post.id;
    const existing = (likes[postId] || []).find((l) => l.created_by_name === tenNguoiDung);
    if (existing) {
      setLikes((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((l) => l.id !== existing.id) }));
      const { error } = await supabase.from("bang_tin_luot_thich").delete().eq("id", existing.id);
      if (error) loadFeed(true);
      return;
    }
    const newLike: LuotThich = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, bai_dang_id: postId, created_by_name: tenNguoiDung };
    setLikes((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), newLike] }));
    const { error } = await supabase.from("bang_tin_luot_thich").insert(newLike);
    if (error) {
      loadFeed(true);
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
      loadFeed(true);
    }
  };

  const xoaBinhLuan = async (postId: string, cmtId: string) => {
    if (!supabase) return;
    setComments((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((c) => c.id !== cmtId) }));
    await supabase.from("bang_tin_binh_luan").delete().eq("id", cmtId);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-brand-500" /> Bảng tin
        </h1>
        <p className="text-sm opacity-70 mt-1">Chia sẻ thông báo, hình ảnh với cả nhóm — giống bảng tin Zalo.</p>
      </div>

      <MiminGroupTabs />

      {/* Composer */}
      <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar name={tenNguoiDung} size="md" />
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={`${tenNguoiDung} ơi, có gì mới không?`}
            rows={3}
            className="flex-1 bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {newImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 pl-[52px]">
            {newImages.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img src={img.dataUrl} className="w-full h-full object-cover" />
                <button
                  onClick={() => setNewImages((prev) => prev.filter((i) => i.id !== img.id))}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {newVideo && (
          <div className="relative pl-[52px]">
            <video src={newVideo} controls className="w-full max-h-56 rounded-lg bg-black" />
            <button
              onClick={() => setNewVideo(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pl-[52px]">
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleChonAnh(e.target.files); e.target.value = ""; }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={newImages.length >= MAX_ANH || !!newVideo}
              title={newVideo ? "Xoá video để đổi sang ảnh" : newImages.length >= MAX_ANH ? `Tối đa ${MAX_ANH} ảnh/bài` : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              <ImageIcon className="w-4 h-4" /> Ảnh {newImages.length > 0 && `(${newImages.length}/${MAX_ANH})`}
            </button>
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { handleChonVideo(e.target.files); e.target.value = ""; }} />
            <button
              onClick={() => videoRef.current?.click()}
              disabled={uploadingVideo || !!newVideo || newImages.length > 0}
              title={newImages.length > 0 ? "Xoá ảnh để đổi sang video" : "Video tối đa 3 phút"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} Video
            </button>
          </div>
          <button
            onClick={handleDang}
            disabled={posting || uploadingVideo}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Đăng
          </button>
        </div>
        {newImages.length > 0 && (
          <div className="pl-[52px] text-xs opacity-50">Đã chọn ảnh — xoá hết ảnh nếu muốn đổi sang đăng video.</div>
        )}
        {newVideo && (
          <div className="pl-[52px] text-xs opacity-50">Đã chọn video — xoá video nếu muốn đổi sang đăng ảnh.</div>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="py-12 text-center opacity-50 text-sm">Đang tải bảng tin...</div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center opacity-50 text-sm">Chưa có bài đăng nào. Hãy là người đầu tiên chia sẻ!</div>
      ) : (
        posts.map((post) => (
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
        ))
      )}

      {previewImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <img src={previewImg} className="relative max-w-full max-h-[90vh] rounded-lg" />
        </div>
      )}
    </div>
  );
}
