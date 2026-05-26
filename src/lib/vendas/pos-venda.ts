import type { ChecklistAtivacao } from "@/lib/types/domain";

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
