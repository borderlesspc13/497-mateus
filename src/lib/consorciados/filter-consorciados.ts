import type { ConsorciadoVendaSearchIndexRow } from "@/actions/consorciados";
import type { ConsorciadoRow } from "@/lib/types/domain";

export type ConsorciadoSearchFilters = {
  nome: string;
  grupo: string;
  cota: string;
  contrato: string;
  cpf: string;
};

export const EMPTY_CONSORCIADO_SEARCH_FILTERS: ConsorciadoSearchFilters = {
  nome: "",
  grupo: "",
  cota: "",
  contrato: "",
  cpf: "",
};

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function includesIgnoreCase(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

function resolveConsorciadoIdsFromVendas(
  vendasIndex: ConsorciadoVendaSearchIndexRow[],
  filters: ConsorciadoSearchFilters,
): Set<string> | null {
  const hasVendaFilter = Boolean(
    filters.contrato.trim() || filters.grupo.trim() || filters.cota.trim(),
  );
  if (!hasVendaFilter) return null;

  const ids = new Set<string>();
  for (const venda of vendasIndex) {
    if (!venda.consorciadoId) continue;
    if (filters.contrato.trim() && !includesIgnoreCase(venda.numeroContrato, filters.contrato)) {
      continue;
    }
    if (filters.grupo.trim() && !includesIgnoreCase(venda.grupo, filters.grupo)) {
      continue;
    }
    if (filters.cota.trim() && !includesIgnoreCase(venda.cota, filters.cota)) {
      continue;
    }
    ids.add(venda.consorciadoId);
  }
  return ids;
}

export function hasActiveConsorciadoSearchFilters(filters: ConsorciadoSearchFilters) {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

export function filterConsorciados(
  consorciados: ConsorciadoRow[],
  vendasIndex: ConsorciadoVendaSearchIndexRow[],
  filters: ConsorciadoSearchFilters,
): ConsorciadoRow[] {
  const idsFromVendas = resolveConsorciadoIdsFromVendas(vendasIndex, filters);
  const cpfQuery = normalizeDigits(filters.cpf);

  return consorciados.filter((item) => {
    if (filters.nome.trim() && !includesIgnoreCase(item.nome, filters.nome)) {
      return false;
    }
    if (cpfQuery) {
      const docDigits = normalizeDigits(item.cpf_cnpj);
      if (!docDigits.includes(cpfQuery)) return false;
    }
    if (idsFromVendas !== null && !idsFromVendas.has(item.id)) {
      return false;
    }
    return true;
  });
}
