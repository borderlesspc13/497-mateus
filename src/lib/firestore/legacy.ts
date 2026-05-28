import type { ConsorciadoDoc, VendaDoc } from "@/lib/firestore/types";
import type { StatusInconsistencia, VendaStatus } from "@/lib/types/domain";

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
};

function normalizeStatusInconsistencia(value: string | undefined): StatusInconsistencia {
  if (value === "INCONSISTENTE") return "INCONSISTENTE";
  return "CONSISTENTE";
}

export function normalizeVendaFields(raw: LegacyVendaDoc): Pick<
  VendaDoc,
  | "status"
  | "statusInconsistencia"
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
