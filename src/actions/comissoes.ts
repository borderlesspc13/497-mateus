"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireComissoesManager } from "@/lib/auth/server";
import {
  listExtratosComissao,
  listMapaPagamento,
  marcarExtratoRecebido,
  marcarRepassePago,
  syncExtratosComissao,
  updateExtratoStatus,
} from "@/lib/firestore/repository";
import { scheduleDashboardAndMetasRefresh } from "@/lib/firestore/schedule-read-model-refresh";
import type { MapaPagamentoFilters } from "@/lib/firestore/repository";
import { batchMarcarExtratosRecebidos } from "@/lib/importacao/comissao-recebimento";
import type { ComissaoRecebimentoInput } from "@/lib/importacao/comissao-recebimento";
import type { ExtratoRow, RepasseRow } from "@/lib/types/domain";

function revalidateComissoes() {
  revalidatePath("/comissoes");
}

export async function listExtratos(): Promise<ExtratoRow[]> {
  await requireComissoesManager();
  return listExtratosComissao();
}

export async function listRepassesMapaPagamento(
  filters: MapaPagamentoFilters = {},
): Promise<RepasseRow[]> {
  await requireComissoesManager();
  return listMapaPagamento(filters);
}

export async function sincronizarExtratos(): Promise<{ gerados: number }> {
  await requireComissoesManager();
  const gerados = await syncExtratosComissao();
  scheduleDashboardAndMetasRefresh();
  revalidateComissoes();
  return { gerados };
}

/** @deprecated Use marcarExtratoRecebidoAction. Mantido para compatibilidade da UI legada. */
export async function liberarExtrato(id: string): Promise<void> {
  await marcarExtratoRecebidoAction(id);
}

export async function marcarExtratoRecebidoAction(
  id: string,
): Promise<{ repassesGerados: number }> {
  const user = await requireComissoesManager();
  const result = await marcarExtratoRecebido(id);
  await writeAuditLog({
    userId: user.uid,
    acao: "comissao.recebida",
    documentoId: id,
  });
  scheduleDashboardAndMetasRefresh();
  revalidateComissoes();
  return result;
}

export async function importarComissoesRecebidas(
  items: ComissaoRecebimentoInput[],
): Promise<{ atualizados: number; ignorados: number; erros: string[] }> {
  const user = await requireComissoesManager();
  const result = await batchMarcarExtratosRecebidos(items);
  if (result.atualizados > 0) {
    await writeAuditLog({
      userId: user.uid,
      acao: `comissao.importacao_recebida.${result.atualizados}`,
      documentoId: "batch",
    });
  }
  scheduleDashboardAndMetasRefresh();
  revalidateComissoes();
  return result;
}

export async function marcarExtratoPago(id: string): Promise<void> {
  const user = await requireComissoesManager();
  await updateExtratoStatus(id, "PAGO");
  await writeAuditLog({
    userId: user.uid,
    acao: "comissao.paga",
    documentoId: id,
  });
  scheduleDashboardAndMetasRefresh();
  revalidateComissoes();
}

export async function marcarRepassePagoAction(id: string): Promise<void> {
  const user = await requireComissoesManager();
  await marcarRepassePago(id);
  await writeAuditLog({
    userId: user.uid,
    acao: "repasse.pago",
    documentoId: id,
  });
  revalidateComissoes();
}
