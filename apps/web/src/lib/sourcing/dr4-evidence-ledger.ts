/** DR4 evidence-ledger audit. Observation-only; candidates are never mutated. */
export const DR4_SCHEMA_VERSION = "DR4-1" as const;

export interface Dr4EvidenceLike {
  fieldName?: string | null;
  fieldValue?: string | null;
  sourceUrl?: string | null;
  sourceExcerpt?: string | null;
  confidence?: number | null;
}

export interface Dr4CandidateLike {
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxCode?: string | null;
  capabilities?: readonly string[] | null;
  fieldEvidence?: readonly Dr4EvidenceLike[] | null;
  fieldConfidence?: ReadonlyArray<{ status?: string | null }> | null;
  entityResolution?: { conflicts?: readonly string[] | null } | null;
}

export interface Dr4EvidenceLedgerAudit {
  schemaVersion: typeof DR4_SCHEMA_VERSION;
  kind: "SHADOW_EVIDENCE_LEDGER";
  capturedAt: string;
  candidateCount: number;
  evidenceEntryCount: number;
  citedCandidatePercent: number;
  multiSourceCandidatePercent: number;
  primaryFieldCitationPercent: number;
  conflictCandidateCount: number;
  orphanEvidenceCount: number;
  distinctSourceDomains: number;
  grade: "STRONG" | "REVIEW" | "WEAK";
  warnings: string[];
  note: "DR4 chỉ kiểm toán chứng cứ; không chấm lại hoặc sắp xếp lại hồ sơ production.";
}

export interface Dr4ToolCall {
  type: "DR4_EVIDENCE_LEDGER";
  audit: Dr4EvidenceLedgerAudit;
}

const ADDRESS_FIELDS = new Set(["REGISTERED_ADDRESS", "FACTORY_ADDRESS", "OFFICE_ADDRESS"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function validEvidence(evidence: Dr4EvidenceLike): boolean {
  return Boolean(text(evidence.fieldName) && text(evidence.fieldValue) && sourceDomain(text(evidence.sourceUrl)) && text(evidence.sourceExcerpt));
}

function fieldHasEvidence(candidate: Dr4CandidateLike, field: "LEGAL_NAME" | "ADDRESS" | "PHONE" | "EMAIL" | "WEBSITE" | "TAX_CODE" | "CAPABILITY"): boolean {
  return (candidate.fieldEvidence ?? []).some((evidence) => {
    if (!validEvidence(evidence)) return false;
    const name = text(evidence.fieldName).toUpperCase();
    return field === "ADDRESS" ? ADDRESS_FIELDS.has(name) : name === field;
  });
}

export function buildDr4EvidenceLedgerAudit(candidates: readonly Dr4CandidateLike[]): Dr4EvidenceLedgerAudit {
  const allEvidence = candidates.flatMap((candidate) => [...(candidate.fieldEvidence ?? [])]);
  const validEntries = allEvidence.filter(validEvidence);
  const orphanEvidenceCount = allEvidence.length - validEntries.length;
  const candidatesWithCitation = candidates.filter((candidate) => (candidate.fieldEvidence ?? []).some(validEvidence)).length;
  const candidatesWithMultipleSources = candidates.filter((candidate) => {
    const urls = (candidate.fieldEvidence ?? []).filter(validEvidence).map((evidence) => text(evidence.sourceUrl));
    return new Set(urls).size >= 2;
  }).length;
  const primaryChecks: Array<{ present: boolean; cited: boolean }> = [];
  for (const candidate of candidates) {
    const fields: Array<["LEGAL_NAME" | "ADDRESS" | "PHONE" | "EMAIL" | "WEBSITE" | "TAX_CODE" | "CAPABILITY", boolean]> = [
      ["LEGAL_NAME", Boolean(text(candidate.legalName))],
      ["ADDRESS", Boolean(text(candidate.address))],
      ["PHONE", Boolean(text(candidate.phone))],
      ["EMAIL", Boolean(text(candidate.email))],
      ["WEBSITE", Boolean(text(candidate.website))],
      ["TAX_CODE", Boolean(text(candidate.taxCode))],
      ["CAPABILITY", Boolean(candidate.capabilities?.some((value) => text(value)))],
    ];
    for (const [field, present] of fields) if (present) primaryChecks.push({ present, cited: fieldHasEvidence(candidate, field) });
  }
  const conflictCandidateCount = candidates.filter((candidate) =>
    (candidate.fieldConfidence ?? []).some((field) => field.status === "CONFLICT") || Boolean(candidate.entityResolution?.conflicts?.length),
  ).length;
  const domains = new Set(validEntries.map((evidence) => sourceDomain(text(evidence.sourceUrl))).filter(Boolean));
  const citedCandidatePercent = percent(candidatesWithCitation, candidates.length);
  const multiSourceCandidatePercent = percent(candidatesWithMultipleSources, candidates.length);
  const primaryFieldCitationPercent = percent(primaryChecks.filter((item) => item.cited).length, primaryChecks.length);
  const warnings = [
    citedCandidatePercent < 80 ? `Chỉ ${citedCandidatePercent}% hồ sơ có trích dẫn hợp lệ` : "",
    primaryFieldCitationPercent < 70 ? `Chỉ ${primaryFieldCitationPercent}% trường chính có chứng cứ` : "",
    multiSourceCandidatePercent < 50 ? `Chỉ ${multiSourceCandidatePercent}% hồ sơ có từ hai nguồn độc lập` : "",
    conflictCandidateCount > 0 ? `${conflictCandidateCount} hồ sơ có dữ liệu mâu thuẫn` : "",
    orphanEvidenceCount > 0 ? `${orphanEvidenceCount} chứng cứ thiếu URL hoặc đoạn trích` : "",
  ].filter(Boolean);
  const grade: Dr4EvidenceLedgerAudit["grade"] = citedCandidatePercent >= 90 && primaryFieldCitationPercent >= 80 && multiSourceCandidatePercent >= 60 && conflictCandidateCount === 0
    ? "STRONG"
    : citedCandidatePercent >= 60 && primaryFieldCitationPercent >= 50
      ? "REVIEW"
      : "WEAK";

  return {
    schemaVersion: DR4_SCHEMA_VERSION,
    kind: "SHADOW_EVIDENCE_LEDGER",
    capturedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    evidenceEntryCount: validEntries.length,
    citedCandidatePercent,
    multiSourceCandidatePercent,
    primaryFieldCitationPercent,
    conflictCandidateCount,
    orphanEvidenceCount,
    distinctSourceDomains: domains.size,
    grade,
    warnings,
    note: "DR4 chỉ kiểm toán chứng cứ; không chấm lại hoặc sắp xếp lại hồ sơ production.",
  };
}

export function dr4ToolCall(audit: Dr4EvidenceLedgerAudit): Dr4ToolCall {
  return { type: "DR4_EVIDENCE_LEDGER", audit };
}

export function readDr4Audit(toolCalls: unknown): Dr4EvidenceLedgerAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR4_EVIDENCE_LEDGER") as Partial<Dr4ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR4_SCHEMA_VERSION && audit.kind === "SHADOW_EVIDENCE_LEDGER" ? audit : null;
}
