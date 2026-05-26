import type { VendaRow } from "@/lib/types/domain";

export type PendenciaNivel = "atrasado" | "pendente" | null;

export function getPendenciaNivel(venda: Pick<VendaRow, "alertaAtivo" | "dataPendencia">): PendenciaNivel {
  if (!venda.alertaAtivo) return null;

  if (!venda.dataPendencia) return "pendente";

  const due = new Date(venda.dataPendencia);
  if (Number.isNaN(due.getTime())) return "pendente";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() < today.getTime()) return "atrasado";
  return "pendente";
}

export function isChecklistCompleto(
  checklist: VendaRow["checklistAtivacao"],
): boolean {
  return (
    checklist.documentacaoRecebida &&
    checklist.taxaPaga &&
    checklist.contratoAssinado
  );
}

export function countChecklistPendente(checklist: VendaRow["checklistAtivacao"]): number {
  let count = 0;
  if (!checklist.documentacaoRecebida) count += 1;
  if (!checklist.taxaPaga) count += 1;
  if (!checklist.contratoAssinado) count += 1;
  return count;
}
