import type { ConsorciadoDoc, VendaDoc } from "@/lib/firestore/types";
import type { StatusInconsistencia, StatusPosVenda, VendaStatus } from "@/lib/types/domain";
import { DEFAULT_STATUS_POS_VENDA } from "@/lib/vendas/pos-venda";

type LegacyConsorciadoDoc = ConsorciadoDoc & { documento?: string; endereco?: string };

const LEGACY_STATUS_MAP: Record<string, VendaStatus> = {
  RASCUNHO: "ATIVO",
  ENVIADA: "ATIVO",
  FECHADA: "ATIVO",
  CANCELADA: "CANCELADO",
  ATIVO: "ATIVO",
  INADIMPLENTE: "INADIMPLENTE",
  CANCELADO: "CANCELADO",
};

export function readConsorciadoCpfCnpj(raw: LegacyConsorciadoDoc): string {
  return raw.cpf_cnpj?.trim() || raw.documento?.trim() || "";
}

export function normalizeVendaStatus(status: string | undefined): VendaStatus {
  if (!status) return "ATIVO";
  return LEGACY_STATUS_MAP[status] ?? "ATIVO";
}

type LegacyVendaDoc = VendaDoc & {
  contrato?: string;
  grupo?: string;
  cota?: string;
  dataVencimento?: number;
  equipeId?: string;
  vendedorId?: string;
  statusInconsistencia?: string;
  statusPosVenda?: string;
  parcelasPagasCancelamento?: number | null;
};

function normalizeStatusInconsistencia(value: string | undefined): StatusInconsistencia {
  if (value === "INCONSISTENTE") return "INCONSISTENTE";
  return "CONSISTENTE";
}

function normalizeParcelasPagasCancelamento(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeStatusPosVenda(value: string | undefined): StatusPosVenda {
  if (value === "FEITO") return "FEITO";
  return DEFAULT_STATUS_POS_VENDA;
}

export function normalizeVendaFields(raw: LegacyVendaDoc): Pick<
  VendaDoc,
  | "status"
  | "statusInconsistencia"
  | "statusPosVenda"
  | "parcelasPagasCancelamento"
  | "contrato"
  | "grupo"
  | "cota"
  | "dataVencimento"
  | "equipeId"
  | "vendedorId"
> {
  return {
    status: normalizeVendaStatus(raw.status),
    statusInconsistencia: normalizeStatusInconsistencia(raw.statusInconsistencia),
    statusPosVenda: normalizeStatusPosVenda(raw.statusPosVenda),
    parcelasPagasCancelamento: normalizeParcelasPagasCancelamento(raw.parcelasPagasCancelamento),
    contrato: raw.contrato?.trim() || raw.titulo?.trim() || "",
    grupo: raw.grupo?.trim() || "",
    cota: raw.cota?.trim() || "",
    dataVencimento:
      typeof raw.dataVencimento === "number" && raw.dataVencimento >= 1 && raw.dataVencimento <= 31
        ? raw.dataVencimento
        : 10,
    equipeId: raw.equipeId?.trim() || "",
    vendedorId: raw.vendedorId?.trim() || "",
  };
}
