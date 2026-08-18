"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MessageCircle, ArrowLeft, Send, Search, Check, CheckCheck, Phone, Users } from "lucide-react";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";
import { useSession } from "@/components/session-provider";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/lib/supabase/client";
import { USERS } from "@/lib/users";

type TinNhan = {
  id: string;
  nguoi_gui_name: string;
  nguoi_nhan_name: string;
  noi_dung: string;
  da_doc: boolean;
  created_at: string;
};

type HoiThoai = {
  ten: string;
  tinNhanCuoi: TinNhan;
  soChuaDoc: number;
};

const REFRESH_MS = 8000;

function thoiGianNgan(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ngày`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function TinNhanPage() {
  const { user } = useSession();
  const tenNguoiDung = user?.name || "Khuyết danh";

  const [tinNhans, setTinNhans] = useState<TinNhan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dangChonVoi, setDangChonVoi] = useState<string | null>(null);
  const [duThao, setDuThao] = useState("");
  const [dangGui, setDangGui] = useState(false);

  const [tabTrai, setTabTrai] = useState<"chat" | "danhba">("chat");
  const [timHoiThoai, setTimHoiThoai] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!supabase) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bang_tin_tin_nhan_rieng")
        .select("*")
        .or(`nguoi_gui_name.eq.${tenNguoiDung},nguoi_nhan_name.eq.${tenNguoiDung}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTinNhans((data || []) as TinNhan[]);
    } catch (err) {
      if (!silent) console.error("Lỗi tải tin nhắn:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tenNguoiDung]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Gom tin nhắn thành danh sách hội thoại theo người còn lại, mới nhất lên đầu
  const hoiThoais = useMemo<HoiThoai[]>(() => {
    const theo: Record<string, TinNhan[]> = {};
    tinNhans.forEach((tn) => {
      const doiPhuong = tn.nguoi_gui_name === tenNguoiDung ? tn.nguoi_nhan_name : tn.nguoi_gui_name;
      (theo[doiPhuong] ||= []).push(tn);
    });
    return Object.entries(theo)
      .map(([ten, ds]) => ({
        ten,
        tinNhanCuoi: ds[ds.length - 1],
        soChuaDoc: ds.filter((tn) => tn.nguoi_nhan_name === tenNguoiDung && !tn.da_doc).length,
      }))
      .sort((a, b) => new Date(b.tinNhanCuoi.created_at).getTime() - new Date(a.tinNhanCuoi.created_at).getTime());
  }, [tinNhans, tenNguoiDung]);

  const tinNhanDoan = useMemo(
    () => (dangChonVoi ? tinNhans.filter((tn) => tn.nguoi_gui_name === dangChonVoi || tn.nguoi_nhan_name === dangChonVoi) : []),
    [tinNhans, dangChonVoi]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [tinNhanDoan.length]);

  // Đánh dấu đã đọc khi mở 1 đoạn hội thoại
  useEffect(() => {
    if (!dangChonVoi || !supabase) return;
    const chuaDoc = tinNhans.filter((tn) => tn.nguoi_gui_name === dangChonVoi && tn.nguoi_nhan_name === tenNguoiDung && !tn.da_doc);
    if (chuaDoc.length === 0) return;
    setTinNhans((prev) => prev.map((tn) => (chuaDoc.some((c) => c.id === tn.id) ? { ...tn, da_doc: true } : tn)));
    supabase.from("bang_tin_tin_nhan_rieng").update({ da_doc: true }).in("id", chuaDoc.map((c) => c.id)).then();
  }, [dangChonVoi, tinNhans, tenNguoiDung]);

  const guiTinNhan = async () => {
    const noiDung = duThao.trim();
    if (!noiDung || !dangChonVoi || !supabase) return;
    setDangGui(true);
    const tn: TinNhan = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nguoi_gui_name: tenNguoiDung,
      nguoi_nhan_name: dangChonVoi,
      noi_dung: noiDung,
      da_doc: false,
      created_at: new Date().toISOString(),
    };
    setTinNhans((prev) => [...prev, tn]);
    setDuThao("");
    const { error } = await supabase.from("bang_tin_tin_nhan_rieng").insert(tn);
    setDangGui(false);
    if (error) load();
  };

  const dsLienHe = USERS.filter(
    (u) => u.name !== tenNguoiDung && u.name.toLowerCase().includes(timHoiThoai.toLowerCase())
  );

  const hoiThoaisLoc = hoiThoais.filter((ht) => ht.ten.toLowerCase().includes(timHoiThoai.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-20">
      <div className="p-4 md:p-6 pb-0">
        <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-brand-500" /> Tin nhắn
          </h1>
          <p className="text-sm opacity-70 mt-1">Nhắn tin trực tiếp với đồng nghiệp — giống Zalo.</p>
        </div>
        <div className="mt-4">
          <MiminGroupTabs />
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="md:flex md:h-[70vh] bg-white/60 dark:bg-white/5 md:border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
          {/* CỘT TRÁI: danh sách bạn / hội thoại */}
          <div className={`${dangChonVoi ? "hidden md:flex" : "flex"} flex-col md:w-80 shrink-0 md:border-r border-black/5 dark:border-white/10`}>
            <div className="p-3 border-b border-black/5 dark:border-white/10 shrink-0 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  value={timHoiThoai}
                  onChange={(e) => setTimHoiThoai(e.target.value)}
                  placeholder={tabTrai === "chat" ? "Tìm cuộc trò chuyện..." : "Tìm bạn..."}
                  className="w-full bg-black/5 dark:bg-white/5 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTabTrai("chat")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                    tabTrai === "chat" ? "bg-brand-500 text-white" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Trò chuyện
                </button>
                <button
                  onClick={() => setTabTrai("danhba")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                    tabTrai === "danhba" ? "bg-brand-500 text-white" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Danh bạ
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {tabTrai === "chat" ? (
                loading ? (
                  <div className="py-12 text-center opacity-50 text-sm">Đang tải...</div>
                ) : hoiThoaisLoc.length === 0 ? (
                  <div className="py-12 text-center opacity-50 text-sm px-4">
                    {hoiThoais.length === 0 ? "Chưa có cuộc trò chuyện nào. Sang tab Danh bạ để bắt đầu." : "Không tìm thấy."}
                  </div>
                ) : (
                  hoiThoaisLoc.map((ht) => (
                    <button
                      key={ht.ten}
                      onClick={() => setDangChonVoi(ht.ten)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${
                        dangChonVoi === ht.ten ? "bg-brand-500/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Avatar name={ht.ten} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${ht.soChuaDoc > 0 ? "font-bold" : "font-medium"}`}>{ht.ten}</span>
                          <span className="text-xs opacity-50 shrink-0">{thoiGianNgan(ht.tinNhanCuoi.created_at)}</span>
                        </div>
                        <div className={`text-xs truncate ${ht.soChuaDoc > 0 ? "font-semibold" : "opacity-60"}`}>
                          {ht.tinNhanCuoi.nguoi_gui_name === tenNguoiDung ? "Bạn: " : ""}
                          {ht.tinNhanCuoi.noi_dung}
                        </div>
                      </div>
                      {ht.soChuaDoc > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {ht.soChuaDoc}
                        </span>
                      )}
                    </button>
                  ))
                )
              ) : dsLienHe.length === 0 ? (
                <div className="py-12 text-center opacity-50 text-sm px-4">Không tìm thấy.</div>
              ) : (
                dsLienHe.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setDangChonVoi(u.name); setTabTrai("chat"); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition text-left"
                  >
                    <Avatar name={u.name} size="lg" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      {u.sdt && (
                        <div className="text-xs opacity-60 truncate flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {u.sdt}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CỘT PHẢI: khung chat */}
          <div className={`${dangChonVoi ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
            {!dangChonVoi ? (
              <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-2 text-center opacity-50 p-8">
                <MessageCircle className="w-12 h-12" />
                <div className="text-sm">Chọn một hội thoại bên trái để bắt đầu nhắn tin</div>
              </div>
            ) : (
              <>
                {/* Header đoạn chat */}
                <div className="flex items-center gap-3 p-3 border-b border-black/10 dark:border-white/10 shrink-0">
                  <button onClick={() => setDangChonVoi(null)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition md:hidden">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar name={dangChonVoi} size="sm" />
                  <span className="font-semibold text-sm">{dangChonVoi}</span>
                </div>

                {/* Khung tin nhắn */}
                <div ref={scrollRef} className="flex-1 h-[60vh] md:h-auto overflow-y-auto p-3 md:p-4 space-y-2 bg-slate-50 dark:bg-white/5">
                  {tinNhanDoan.map((tn) => {
                    const laMinh = tn.nguoi_gui_name === tenNguoiDung;
                    return (
                      <div key={tn.id} className={`flex ${laMinh ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                          laMinh ? "bg-brand-500 text-white rounded-br-sm" : "bg-white dark:bg-slate-800 rounded-bl-sm shadow-sm"
                        }`}>
                          {tn.noi_dung}
                          <div className={`flex items-center gap-1 mt-0.5 ${laMinh ? "justify-end text-white/70" : "opacity-50"}`}>
                            <span className="text-[10px]">{thoiGianNgan(tn.created_at)}</span>
                            {laMinh && (tn.da_doc ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ô nhập */}
                <div className="flex items-center gap-2 p-3 border-t border-black/10 dark:border-white/10 shrink-0">
                  <input
                    value={duThao}
                    onChange={(e) => setDuThao(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") guiTinNhan(); }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                  />
                  <button
                    onClick={guiTinNhan}
                    disabled={dangGui || !duThao.trim()}
                    className="p-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white transition shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
