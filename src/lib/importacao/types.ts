import type { VendaStatus } from "@/lib/types/domain";

export type ImportRowInput = {
  contrato: string;
  status: VendaStatus;
  linha: number;
  parcelasPagasCancelamento?: number;
};

export type ImportPreviewMatched = {
  kind: "matched";
  linha: number;
  contrato: string;
  statusAtual: VendaStatus;
  statusNovo: VendaStatus;
  vendaId: string;
  willUpdate: boolean;
  parcelasPagasCancelamento?: number;
};

export type ImportPreviewNotFound = {
  kind: "not_found";
  linha: number;
  contrato: string;
  statusNovo: VendaStatus;
};

export type ImportPreviewInvalid = {
  kind: "invalid";
  linha: number;
  contrato: string | null;
  error: string;
};

export type ImportPreviewResult = {
  matched: ImportPreviewMatched[];
  notFound: ImportPreviewNotFound[];
  invalid: ImportPreviewInvalid[];
  summary: {
    total: number;
    toUpdate: number;
    notFound: number;
    unchanged: number;
    invalid: number;
  };
};

export type ImportConfirmItem = {
  vendaId: string;
  status: VendaStatus;
  parcelasPagasCancelamento?: number;
};

export type ImportConfirmResult = {
  updated: number;
  skipped: number;
};
