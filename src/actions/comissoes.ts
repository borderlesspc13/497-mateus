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

/** PENDENTE → LIBERADO (sem gerar repasses). */
export async function liberarExtratoAction(id: string): Promise<void> {
  const user = await requireComissoesManager();
  await updateExtratoStatus(id, "LIBERADO");
  await writeAuditLog({
    userId: user.uid,
    acao: "comissao.liberada",
    documentoId: id,
  });
  scheduleDashboardAndMetasRefresh();
  revalidateComissoes();
}

/** @deprecated Use marcarExtratoRecebidoAction. */
export async function liberarExtrato(id: string): Promise<void> {
  await marcarExtratoRecebidoAction(id);
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

/** LIBERADO → PAGO. */
export async function marcarExtratoPagoAction(id: string): Promise<void> {
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

/** @deprecated Use marcarExtratoPagoAction. */
export async function marcarExtratoPago(id: string): Promise<void> {
  await marcarExtratoPagoAction(id);
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

export async function marcarRepassesPagosEmLoteAction(
  ids: string[],
): Promise<{ updated: number; errors: string[] }> {
  const user = await requireComissoesManager();
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Nenhum repasse selecionado.");
  }
  if (ids.length > 500) {
    throw new Error("Limite de 500 repasses por lote.");
  }

  let updated = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      await marcarRepassePago(id);
      updated += 1;
    } catch (e) {
      errors.push(
        `${id}: ${e instanceof Error ? e.message : "Erro ao marcar como pago."}`,
      );
    }
  }

  if (updated > 0) {
    await writeAuditLog({
      userId: user.uid,
      acao: `repasse.pago_lote_${updated}`,
      documentoId: "batch",
    });
  }

  revalidateComissoes();
  return { updated, errors };
}
