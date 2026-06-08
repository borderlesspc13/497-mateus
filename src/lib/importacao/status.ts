import type { VendaStatus } from "@/lib/types/domain";

const VALID_STATUSES: VendaStatus[] = ["ATIVO", "INADIMPLENTE", "CANCELADO"];

export function parseImportStatus(raw: unknown): VendaStatus | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const normalized = String(raw).trim().toUpperCase();
  if (!normalized) return null;
  return VALID_STATUSES.includes(normalized as VendaStatus)
    ? (normalized as VendaStatus)
    : null;
}

export function normalizeContrato(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

export function findColumnKey(
  headers: string[],
  candidates: string[],
): string | null {
  const normalizedHeaders = headers.map((h) => h.trim().toUpperCase());
  for (const candidate of candidates) {
    const idx = normalizedHeaders.indexOf(candidate.toUpperCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

export const CONTRATO_COLUMN_CANDIDATES = ["CONTRATO"];
export const STATUS_COLUMN_CANDIDATES = ["STATUS"];
export const PARCELAS_PAGAS_COLUMN_CANDIDATES = ["PARCELAS_PAGAS", "PARCELAS PAGAS"];

export function parseParcelasPagas(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}
