import type { LenhCat } from "./data/lenh-cat-store";

export interface StageColorEntry {
  pcId: string;
  data: {
    mau: string;
    soLuongNhan: number;
    soLuongDat: number;
    soLuongLoi: number;
    sizes?: { size: string; sl: number }[];
  };
}

// Replace the saved color, then total each stage independently.
export function applyStageColorEntries(lc: LenhCat, entries: StageColorEntry[]): { lc: LenhCat; totals: Record<string, { dat: number; loi: number }> } {
  const phanCong = (lc.phanCong || []).map(pc => {
    let chiTietMau = [...(pc.chiTietMau || [])];
    for (const entry of entries.filter(entry => entry.pcId === pc.id)) {
      chiTietMau = chiTietMau.filter(color => color.mau !== entry.data.mau);
      chiTietMau.push(entry.data);
    }
    return entries.some(entry => entry.pcId === pc.id) ? { ...pc, chiTietMau } : pc;
  });
  const dsMau = (lc.dsMau || []).map(mau => {
    const matching = entries.filter(entry => entry.data.mau === mau.ten && entry.data.sizes);
    if (!matching.length) return mau;
    return {
      ...mau,
      tyLeSizeChiTiet: {
        ...mau.tyLeSizeChiTiet,
        ...Object.fromEntries(matching.map(entry => [entry.pcId, entry.data.sizes!])),
      },
    };
  });
  const totals = Object.fromEntries(phanCong
    .filter(pc => entries.some(entry => entry.pcId === pc.id))
    .map(pc => [pc.id, (pc.chiTietMau || []).reduce((total, color) => ({
      dat: total.dat + color.soLuongDat,
      loi: total.loi + color.soLuongLoi,
    }), { dat: 0, loi: 0 })]));
  return { lc: { ...lc, dsMau, phanCong }, totals };
}
