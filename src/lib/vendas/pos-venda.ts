import type { ChecklistAtivacao, StatusPosVenda } from "@/lib/types/domain";

export const DEFAULT_STATUS_POS_VENDA: StatusPosVenda = "PENDENTE";

export const STATUS_POS_VENDA_LABELS: Record<StatusPosVenda, string> = {
  PENDENTE: "Pendente",
  FEITO: "Feito",
};

export const DEFAULT_CHECKLIST_ATIVACAO: ChecklistAtivacao = {
  documentacaoRecebida: false,
  taxaPaga: false,
  contratoAssinado: false,
};

export const CHECKLIST_ATIVACAO_ITEMS: {
  key: keyof ChecklistAtivacao;
  label: string;
}[] = [
  { key: "documentacaoRecebida", label: "Documentação recebida" },
  { key: "taxaPaga", label: "Taxa paga" },
  { key: "contratoAssinado", label: "Contrato assinado" },
];

export const HISTORICO_TIPO_LABELS = {
  chamada: "Chamada",
  email: "E-mail",
  nota: "Nota",
  atualizacao: "Atualização",
} as const;
