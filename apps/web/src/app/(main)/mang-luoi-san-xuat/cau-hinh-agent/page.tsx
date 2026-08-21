"use client";

// @codex MIMIN GROUP - trang Cấu hình AI Agent: nạp hồ sơ công ty (sản phẩm, khu vực,
// MOQ, tiêu chuẩn, từ đồng nghĩa ngành) làm ngữ cảnh cố định cho AI Search Agent, thay vì
// phải gõ lại mỗi lần tìm kiếm. Đây là bản thủ công, do người dùng tự nhập và duyệt -
// không có pipeline tự động crawl/ghi vào đây.

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, FileCog, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { useSession } from "@/components/session-provider";
import { canEdit } from "@/lib/permissions";
import { loadAgentConfig, saveAgentConfig, type AgentConfig } from "@/lib/sourcing/agent-config";
import { listSearchProfiles, setSearchProfileStatus, type SearchProfile } from "@/lib/sourcing/search-profiles";

const CERTIFICATION_OPTIONS = ["ISO 9001", "ISO 14001", "OEKO-TEX", "BSCI", "WRAP", "GRS", "GOTS", "FSC"];

const PROFILE_STATUS_META: Record<SearchProfile["status"], { label: string; className: string }> = {
  DRAFT: { label: "Nháp - chưa áp dụng", className: "bg-slate-100 text-slate-600" },
  ACTIVE: { label: "Đang áp dụng", className: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "Đã lưu trữ", className: "bg-amber-100 text-amber-700" },
};

export default function CauHinhAgentPage() {
  const { user } = useSession();
  const mayEdit = canEdit(user?.role, "nha-cung-cap");
  const mayApproveProfiles = user?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [updatingProfileId, setUpdatingProfileId] = useState("");

  useEffect(() => {
    let active = true;
    loadAgentConfig()
      .then((data) => { if (active) setConfig(data); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không tải được cấu hình"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const refreshProfiles = () => {
    setLoadingProfiles(true);
    listSearchProfiles()
      .then(setProfiles)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không tải được Search Profile"))
      .finally(() => setLoadingProfiles(false));
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const changeProfileStatus = async (profile: SearchProfile, status: SearchProfile["status"]) => {
    setUpdatingProfileId(profile.id);
    try {
      await setSearchProfileStatus(profile.id, status);
      toast.success(`Đã đổi "${profile.name}" sang ${PROFILE_STATUS_META[status].label.toLowerCase()}`);
      refreshProfiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không đổi được trạng thái profile");
    } finally {
      setUpdatingProfileId("");
    }
  };

  const toggleCertification = (value: string) => {
    setConfig((current) => {
      if (!current) return current;
      const has = current.preferredCertifications.includes(value);
      return {
        ...current,
        preferredCertifications: has
          ? current.preferredCertifications.filter((item) => item !== value)
          : [...current.preferredCertifications, value],
      };
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const saved = await saveAgentConfig({
        companyProducts: config.companyProducts,
        preferredRegions: config.preferredRegions,
        defaultMoq: config.defaultMoq,
        qualityRequirements: config.qualityRequirements,
        preferredCertifications: config.preferredCertifications,
        industrySynonyms: config.industrySynonyms,
        additionalNotes: config.additionalNotes,
      });
      setConfig(saved);
      toast.success("Đã lưu cấu hình - AI Search Agent sẽ dùng ngay từ lượt tìm kiếm tiếp theo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được cấu hình");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Cấu hình AI Agent"
        subtitle="Nạp hồ sơ công ty để AI Search Agent hiểu ngữ cảnh sẵn, không cần gõ lại mỗi lần tìm kiếm."
        icon={<Bot className="w-5 h-5" />}
      />

      {loading || !config ? (
        <div className="card p-10 text-center opacity-70">Đang tải cấu hình...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> Hồ sơ công ty</h2>
              <label className="block text-xs font-medium">
                Sản phẩm chính công ty sản xuất
                <textarea
                  className="input mt-1"
                  rows={2}
                  disabled={!mayEdit}
                  value={config.companyProducts}
                  onChange={(event) => setConfig({ ...config, companyProducts: event.target.value })}
                  placeholder="VD: Áo polo, áo thun, quần jean, đồng phục công sở"
                />
              </label>
              <label className="block text-xs font-medium">
                Khu vực ưu tiên tìm đối tác
                <input
                  className="input mt-1"
                  disabled={!mayEdit}
                  value={config.preferredRegions}
                  onChange={(event) => setConfig({ ...config, preferredRegions: event.target.value })}
                  placeholder="VD: TP.HCM, Bình Dương, Đồng Nai, Long An"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-medium">
                  MOQ thường đặt
                  <input
                    className="input mt-1"
                    type="number"
                    min={0}
                    disabled={!mayEdit}
                    value={config.defaultMoq ?? ""}
                    onChange={(event) => setConfig({ ...config, defaultMoq: event.target.value ? Number(event.target.value) : null })}
                    placeholder="VD: 500"
                  />
                </label>
              </div>
              <label className="block text-xs font-medium">
                Yêu cầu chất lượng
                <textarea
                  className="input mt-1"
                  rows={2}
                  disabled={!mayEdit}
                  value={config.qualityRequirements}
                  onChange={(event) => setConfig({ ...config, qualityRequirements: event.target.value })}
                  placeholder="VD: Ưu tiên xưởng có kinh nghiệm hàng xuất khẩu, tỷ lệ lỗi thấp"
                />
              </label>
              <div>
                <span className="block text-xs font-medium mb-1.5">Chứng nhận ưu tiên</span>
                <div className="flex flex-wrap gap-1.5">
                  {CERTIFICATION_OPTIONS.map((option) => {
                    const active = config.preferredCertifications.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={!mayEdit}
                        onClick={() => toggleCertification(option)}
                        className={`text-xs rounded-full border px-2.5 py-1 transition disabled:opacity-50 ${active ? "bg-brand-500 text-white border-brand-500" : "border-slate-200 text-slate-600 hover:border-brand-300 dark:text-slate-300"}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> Từ đồng nghĩa ngành</h2>
              <p className="text-xs opacity-60">
                Khai các cách gọi khác nhau của cùng một thứ, mỗi nhóm 1 dòng, cách nhau bằng dấu "=". AI sẽ hiểu đây là tương đương khi bạn gõ bất kỳ từ nào trong nhóm.
              </p>
              <textarea
                className="input font-mono text-xs"
                rows={6}
                disabled={!mayEdit}
                value={config.industrySynonyms}
                onChange={(event) => setConfig({ ...config, industrySynonyms: event.target.value })}
                placeholder={"bo cổ = bo áo = bo polo = dệt bo\nxưởng in = xưởng in ấn = in lụa = in pet\nMOQ = số lượng tối thiểu = đơn hàng tối thiểu"}
              />
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="font-bold">Ghi chú thêm</h2>
              <textarea
                className="input"
                rows={3}
                disabled={!mayEdit}
                value={config.additionalNotes}
                onChange={(event) => setConfig({ ...config, additionalNotes: event.target.value })}
                placeholder="Bất kỳ ngữ cảnh nào khác muốn AI ghi nhớ khi tìm kiếm"
              />
            </div>

            {mayEdit && (
              <button onClick={() => void handleSave()} disabled={saving} className="btn-primary inline-flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            )}
            {config.updatedAt && (
              <p className="text-xs opacity-50">Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString("vi-VN")}</p>
            )}
          </div>

          <div className="card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-sm">Xem trước ngữ cảnh gửi cho AI</h2>
            <p className="text-xs opacity-60">Đoạn này sẽ được thêm vào "bộ não" của AI Search Agent ở mỗi lượt tìm kiếm.</p>
            <pre className="text-[11px] whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-white/5 p-3 border" style={{ borderColor: "var(--border)" }}>
              {[
                config.companyProducts.trim() && `- Sản phẩm chính: ${config.companyProducts.trim()}`,
                config.preferredRegions.trim() && `- Khu vực ưu tiên: ${config.preferredRegions.trim()}`,
                config.defaultMoq !== null && `- MOQ thường đặt: ${config.defaultMoq.toLocaleString("vi-VN")}`,
                config.qualityRequirements.trim() && `- Yêu cầu chất lượng: ${config.qualityRequirements.trim()}`,
                config.preferredCertifications.length > 0 && `- Chứng nhận ưu tiên: ${config.preferredCertifications.join(", ")}`,
                config.additionalNotes.trim() && `- Ghi chú thêm: ${config.additionalNotes.trim()}`,
                config.industrySynonyms.trim() && `\nTừ đồng nghĩa ngành:\n${config.industrySynonyms.trim()}`,
              ].filter(Boolean).join("\n") || "Chưa có ngữ cảnh nào - AI sẽ dùng nguyên tắc mặc định."}
            </pre>
          </div>
        </div>
      )}

      <div className="card p-5 space-y-4">
        <div className="flex items-start gap-2">
          <FileCog className="w-4 h-4 text-brand-600 mt-0.5" />
          <div>
            <h2 className="font-bold">Search Profile</h2>
            <p className="text-xs opacity-60">
              Cấu hình chuyên sâu theo từng loại đối tác (từ đồng nghĩa, gợi ý câu tìm, quy tắc loại trừ). Chỉ profile <b>Đang áp dụng</b> mới ảnh hưởng kết quả tìm kiếm — Nháp không đổi gì so với hiện tại.
            </p>
          </div>
        </div>
        {loadingProfiles ? (
          <div className="text-sm opacity-60 py-4 text-center">Đang tải Search Profile...</div>
        ) : profiles.length === 0 ? (
          <div className="text-sm opacity-60 py-4 text-center">Chưa có Search Profile nào.</div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => {
              const meta = PROFILE_STATUS_META[profile.status];
              return (
                <div key={profile.id} className="rounded-xl border p-3 flex flex-wrap items-center gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-brand-700">{profile.code}</span>
                      <span className="font-semibold text-sm">{profile.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.className}`}>{meta.label}</span>
                    </div>
                    <p className="text-xs opacity-60 mt-0.5">Áp dụng cho: {profile.entityType} · v{profile.version} · cập nhật {new Date(profile.updatedAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                  {mayApproveProfiles && (
                    <div className="flex gap-2 shrink-0">
                      {profile.status !== "ACTIVE" && (
                        <button
                          type="button"
                          disabled={updatingProfileId === profile.id}
                          onClick={() => void changeProfileStatus(profile, "ACTIVE")}
                          className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt & áp dụng
                        </button>
                      )}
                      {profile.status === "ACTIVE" && (
                        <button
                          type="button"
                          disabled={updatingProfileId === profile.id}
                          onClick={() => void changeProfileStatus(profile, "ARCHIVED")}
                          className="btn-secondary text-xs"
                        >
                          Ngừng áp dụng
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!mayApproveProfiles && (
          <p className="text-[11px] opacity-50">Chỉ tài khoản Admin mới được duyệt/ngừng áp dụng Search Profile.</p>
        )}
      </div>
    </div>
  );
}
