import type { ExtratoStatus, StatusOperacionalCota } from "@/lib/types/domain";

/** Linha normalizada da remessa unificada (status e/ou comissão). */
export type ImportRowInput = {
  numeroContrato: string;
  /** Ausente quando a linha só marca comissão recebida. */
  statusOperacional?: StatusOperacionalCota;
  linha: number;
  parcelasPagasCancelamento?: number;
  /** Parcela de comissão a marcar como RECEBIDO. */
  parcelaComissao?: number;
};

export type ImportPreviewMatched = {
  kind: "matched";
  linha: number;
  numeroContrato: string;
  statusAtual: StatusOperacionalCota;
  statusNovo: StatusOperacionalCota;
  vendaId: string;
  willUpdate: boolean;
  parcelasPagasCancelamento?: number;
};

export type ImportPreviewNotFound = {
  kind: "not_found";
  linha: number;
  numeroContrato: string;
  statusNovo: StatusOperacionalCota;
};

export type ImportPreviewInvalid = {
  kind: "invalid";
  linha: number;
  numeroContrato: string | null;
  error: string;
};

export type ImportPreviewComissao = {
  linha: number;
  numeroContrato: string;
  parcelaNumero: number;
  vendaId: string | null;
  extratoId: string | null;
  statusAtual: ExtratoStatus | null;
  willUpdate: boolean;
  error?: string;
};

export type ImportPreviewResult = {
  matched: ImportPreviewMatched[];
  notFound: ImportPreviewNotFound[];
  invalid: ImportPreviewInvalid[];
  comissoes: ImportPreviewComissao[];
  summary: {
    total: number;
    toUpdate: number;
    notFound: number;
    unchanged: number;
    invalid: number;
    comissoesToReceive: number;
    comissoesSkipped: number;
    comissoesInvalid: number;
  };
  reconciliation: ImportReconciliationSummary;
};

/** Atualização de status na remessa — chaveada pelo número do contrato (matriz universal). */
export type ImportConfirmItem = {
  numeroContrato: string;
  statusOperacional: StatusOperacionalCota;
  parcelasPagasCancelamento?: number;
};

export type ImportConfirmComissaoItem = {
  numeroContrato: string;
  parcelaNumero: number;
  linha?: number;
};

export type ImportConfirmResult = {
  updated: number;
  skipped: number;
  comissoesAtualizadas: number;
  comissoesIgnoradas: number;
  comissoesErros: string[];
};

export type ImportReconciliationItem = {
  numeroContrato: string;
  grupo: string;
  cota: string;
  consorciadoNome: string | null;
};

export type ImportReconciliationResolution = {
  numeroContrato: string;
  statusOperacional: "ATIVO" | "CANCELADO";
  parcelasPagasCancelamento?: number;
};

export type ImportReconciliationSummary = {
  missingFromSpreadsheet: ImportReconciliationItem[];
  /** Total de contratos INADIMPLENTE registrados no Firestore. */
  totalInadimplentesNoSistema: number;
  /** Inadimplentes do banco cujo número consta na planilha (cobertos pela remessa). */
  totalInadimplentesCobertosNaPlanilha: number;
  /** Contratos únicos presentes na planilha (qualquer status). */
  totalContratosUnicosNaPlanilha: number;
  /** Inadimplentes no banco ausentes na planilha — exigem conciliação manual. */
  totalDivergentes: number;
  /** Bloqueia confirmação até o usuário definir status de cada órfão. */
  requiresManualReconciliation: boolean;
};

export type ImportConfirmPayload = {
  updates: ImportConfirmItem[];
  spreadsheetContractNumbers: string[];
  comissoesRecebidas: ImportConfirmComissaoItem[];
};
