import type { CongDoanItem, MauVai } from "./data/lenh-cat-store";

type StageIdentity = Pick<CongDoanItem, "id" | "tenCongDoan">;
const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

export function productionStageRank(stage: StageIdentity): number {
  // Names also identify assignments whose IDs are generated rather than stage codes.
  const name = normalize(stage.tenCongDoan || "");
  const id = normalize(stage.id || "").replace(/[_\s-]/g, "");
  if (name.includes("cat") || id.startsWith("cat")) return 0;
  if (/\bin\b|theu/.test(name) || /^(in|theu)/.test(id)) return 1;
  if (name.includes("may") || id.startsWith("may")) return 2;
  if (/\bqc\b|kiem tra|kiem hang/.test(name) || id === "qc") return 3;
  if (/khuy|nut/.test(name) || id.startsWith("khuy")) return 4;
  if (/\bui\b/.test(name) || id === "ui") return 5;
  if (/dong goi|gap|bao bi/.test(name) || id === "donggoi") return 6;
  if (name.includes("nhap kho") || id === "nhapkho") return 7;
  return 99;
}

export function previousProductionStages(stages: CongDoanItem[], current: StageIdentity[], mau: MauVai) {
  const boundary = Math.min(...current.map(productionStageRank));
  if (!current.length || boundary === 99) return [];
  return stages.filter(stage => {
    const sizes = mau.tyLeSizeChiTiet?.[stage.id];
    const saved = stage.chiTietMau?.some(color => color.mau === mau.ten);
    return productionStageRank(stage) < boundary && !current.some(pc => pc.id === stage.id)
      && (saved || sizes?.some(size => size.sl > 0));
  }).sort((a, b) => productionStageRank(a) - productionStageRank(b));
}
