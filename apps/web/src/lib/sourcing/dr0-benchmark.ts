/**
 * DR0 is an observation-only baseline. Nothing in this module may filter,
 * rank, enrich or otherwise mutate sourcing candidates.
 */
export const DR0_SCHEMA_VERSION = "DR0-1" as const;

export interface Dr0CandidateLike {
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxCode?: string | null;
  entityResolution?: { canonicalKey?: string | null } | null;
}

export interface Dr0OperationalBaseline {
  schemaVersion: typeof DR0_SCHEMA_VERSION;
  kind: "OPERATIONAL_BASELINE";
  capturedAt: string;
  durationMs: number;
  sourceCount: number;
  candidateCount: number;
  exactCount: number;
  relatedCount: number;
  rejectedNoiseCount: number;
  coordinateCoveragePercent: number;
  duplicateRatePercent: number;
  completenessPercent: {
    legalName: number;
    address: number;
    phone: number;
    email: number;
    website: number;
    taxCode: number;
  };
  note: "Không phải precision/recall; cần bộ dữ liệu vàng đã duyệt để chấm độ chính xác.";
}

export interface Dr0ToolCall {
  type: "DR0_BASELINE";
  snapshot: Dr0OperationalBaseline;
}

function asFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function candidateKey(candidate: Dr0CandidateLike): string {
  const canonical = text(candidate.entityResolution?.canonicalKey);
  if (canonical) return `canonical:${canonical.toLocaleLowerCase("vi")}`;
  const taxCode = text(candidate.taxCode).replace(/\D/g, "");
  if (taxCode) return `tax:${taxCode}`;
  const website = text(candidate.website).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
  if (website) return `web:${website.toLowerCase()}`;
  return `name-address:${text(candidate.legalName).toLocaleLowerCase("vi")}|${text(candidate.address).toLocaleLowerCase("vi")}`;
}

export function buildDr0OperationalBaseline(input: {
  startedAtMs: number;
  completedAtMs?: number;
  diagnostics: Record<string, unknown>;
  candidates: readonly Dr0CandidateLike[];
}): Dr0OperationalBaseline {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const total = input.candidates.length;
  const keys = input.candidates.map(candidateKey).filter((key) => !key.endsWith("name-address:|"));
  const duplicateCount = Math.max(0, keys.length - new Set(keys).size);
  const present = (field: keyof Pick<Dr0CandidateLike, "legalName" | "address" | "phone" | "email" | "website" | "taxCode">) =>
    input.candidates.filter((candidate) => text(candidate[field])).length;

  return {
    schemaVersion: DR0_SCHEMA_VERSION,
    kind: "OPERATIONAL_BASELINE",
    capturedAt: new Date(completedAtMs).toISOString(),
    durationMs: Math.max(0, completedAtMs - input.startedAtMs),
    sourceCount: asFiniteNumber(input.diagnostics.collectedSources),
    candidateCount: total,
    exactCount: asFiniteNumber(input.diagnostics.exactCandidates),
    relatedCount: asFiniteNumber(input.diagnostics.relatedCandidates),
    rejectedNoiseCount: asFiniteNumber(input.diagnostics.rejectedNoiseCandidates),
    coordinateCoveragePercent: asFiniteNumber(
      (input.diagnostics.locationQuality as { coordinateCoveragePercent?: unknown } | undefined)?.coordinateCoveragePercent,
    ),
    duplicateRatePercent: percent(duplicateCount, total),
    completenessPercent: {
      legalName: percent(present("legalName"), total),
      address: percent(present("address"), total),
      phone: percent(present("phone"), total),
      email: percent(present("email"), total),
      website: percent(present("website"), total),
      taxCode: percent(present("taxCode"), total),
    },
    note: "Không phải precision/recall; cần bộ dữ liệu vàng đã duyệt để chấm độ chính xác.",
  };
}

export function dr0ToolCall(snapshot: Dr0OperationalBaseline): Dr0ToolCall {
  return { type: "DR0_BASELINE", snapshot };
}

export function readDr0Baseline(toolCalls: unknown): Dr0OperationalBaseline | null {
  if (!Array.isArray(toolCalls)) return null;
  const call = toolCalls.find((item): item is Partial<Dr0ToolCall> =>
    typeof item === "object" && item !== null && (item as { type?: unknown }).type === "DR0_BASELINE",
  );
  const snapshot = call?.snapshot;
  if (!snapshot || snapshot.schemaVersion !== DR0_SCHEMA_VERSION || snapshot.kind !== "OPERATIONAL_BASELINE") return null;
  return snapshot;
}
