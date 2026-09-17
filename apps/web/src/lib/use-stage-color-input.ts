"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useLenhCat, type LenhCat, type MauVai } from "./data/lenh-cat-store";
import { applyStageColorEntries, type StageColorEntry } from "./stage-color-input";
import { productionStageRank } from "./production-stage-order";

export function useStageColorInput() {
  const [selection, setSelectedMau] = useState<{ lc: LenhCat; mau: MauVai } | null>(null);
  const { dsLenhCat, suaLenhCat } = useLenhCat();
  const { user } = useSession();
  const liveLC = selection && (dsLenhCat.find(lc => lc.id === selection.lc.id) || selection.lc);
  const selectedMau = selection && liveLC ? {
    lc: liveLC, mau: liveLC.dsMau?.find(mau => mau.ten === selection.mau.ten) || selection.mau,
  } : null;

  const handleSaveColorBatch = async (entries: StageColorEntry[]): Promise<boolean> => {
    if (!selectedMau || !user) return false;
    const { lc } = applyStageColorEntries(selectedMau.lc, entries);
    const cutting = lc.phanCong?.filter(pc => productionStageRank(pc) === 0) || [];
    const updatesCutting = entries.some(entry => cutting.some(pc => pc.id === entry.pcId));
    const tongSLThucTe = (lc.dsMau || []).reduce((sum, mau) => sum + cutting.reduce((total, pc) =>
      total + (mau.tyLeSizeChiTiet?.[pc.id] || []).reduce((n, size) => n + size.sl, 0), 0), 0);
    try {
      // The existing store updates local state immediately and persists the same payload.
      await suaLenhCat(lc.id, {
        dsMau: lc.dsMau, phanCong: lc.phanCong,
        ...(updatesCutting ? { tongSLThucTe } : {}),
      }, user);
      setSelectedMau(prev => prev ? { lc, mau: lc.dsMau?.find(mau => mau.ten === prev.mau.ten) || prev.mau } : null);
      toast.success(`Đã lưu thông tin màu ${selectedMau.mau.ten}`);
      return true;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu số lượng công đoạn");
      return false;
    }
  };

  return { selectedMau, setSelectedMau, handleSaveColorBatch };
}
