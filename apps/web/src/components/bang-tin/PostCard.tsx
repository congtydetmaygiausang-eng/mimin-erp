"use client";

import { Heart, MessageCircle, Send, Trash2, Pin, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";

export type AnhBaiDang = { id: string; dataUrl: string };

export type BaiDang = {
  id: string;
  noi_dung: string;
  hinh_anh: AnhBaiDang[];
  video_url?: string | null;
  ghim: boolean;
  created_by_name: string;
  created_at: string;
};

export type BinhLuan = {
  id: string;
  bai_dang_id: string;
  noi_dung: string;
  created_by_name: string;
  created_at: string;
};

export type LuotThich = {
  id: string;
  bai_dang_id: string;
  created_by_name: string;
};

export function thoiGianTuongDoi(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function PostCard({
  post,
  comments,
  likes,
  currentUserName,
  isCommentsOpen,
  onToggleComments,
  commentDraft,
  onCommentDraftChange,
  onToggleLike,
  onSendComment,
  onDeleteComment,
  onDeletePost,
  onPreviewImage,
}: {
  post: BaiDang;
  comments: BinhLuan[];
  likes: LuotThich[];
  currentUserName: string;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
  commentDraft: string;
  onCommentDraftChange: (v: string) => void;
  onToggleLike: () => void;
  onSendComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onDeletePost?: () => void;
  onPreviewImage?: (dataUrl: string) => void;
}) {
  const daThich = likes.some((l) => l.created_by_name === currentUserName);
  const laChuBai = post.created_by_name === currentUserName;

  return (
    <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar name={post.created_by_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{post.created_by_name}</span>
            {post.ghim && <Pin className="w-3.5 h-3.5 text-brand-500" />}
          </div>
          <div className="text-xs opacity-60">{thoiGianTuongDoi(post.created_at)}</div>
        </div>
        {laChuBai && onDeletePost && (
          <button onClick={onDeletePost} className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition" title="Xoá bài">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {post.noi_dung && <p className="text-sm whitespace-pre-wrap">{post.noi_dung}</p>}

      {post.video_url && (
        <video src={post.video_url} controls className="w-full rounded-lg bg-black max-h-[420px]" />
      )}

      {!post.video_url && post.hinh_anh?.length > 0 && (
        <div className={`grid gap-1.5 rounded-lg overflow-hidden ${post.hinh_anh.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.hinh_anh.map((img) => (
            <div key={img.id} className="aspect-video bg-slate-100 cursor-pointer" onClick={() => onPreviewImage?.(img.dataUrl)}>
              <img src={img.dataUrl} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-black/5 dark:border-white/10">
        <button
          onClick={onToggleLike}
          className={`flex items-center gap-1.5 text-sm font-medium pt-2 transition ${daThich ? "text-rose-500" : "opacity-60 hover:opacity-100"}`}
        >
          <Heart className={`w-4 h-4 ${daThich ? "fill-current" : ""}`} /> Thích {likes.length > 0 && `(${likes.length})`}
        </button>
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 text-sm font-medium pt-2 opacity-60 hover:opacity-100 transition"
        >
          <MessageCircle className="w-4 h-4" /> Bình luận {comments.length > 0 && `(${comments.length})`}
        </button>
      </div>

      {isCommentsOpen && (
        <div className="space-y-2 pt-1">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 group">
              <Avatar name={c.created_by_name} size="xs" />
              <div className="flex-1 min-w-0 bg-black/5 dark:bg-white/10 rounded-2xl px-3 py-1.5">
                <div className="text-xs font-semibold">{c.created_by_name}</div>
                <div className="text-sm whitespace-pre-wrap">{c.noi_dung}</div>
              </div>
              {c.created_by_name === currentUserName && (
                <button onClick={() => onDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Avatar name={currentUserName} size="xs" />
            <input
              value={commentDraft}
              onChange={(e) => onCommentDraftChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSendComment(); }}
              placeholder="Viết bình luận..."
              className="flex-1 bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 transition"
            />
            <button onClick={onSendComment} className="p-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
