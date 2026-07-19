import { normalizeNumeroContrato } from "@/lib/firestore/contrato-matriz";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { buildVendaContratoLookupMap } from "@/lib/firestore/vendas-import";
import { marcarExtratoRecebido, resolveVendaIdByNumeroContrato } from "@/lib/firestore/repository";
import { COLLECTIONS, type ExtratoDoc } from "@/lib/firestore/types";
import { extratoDocId } from "@/utils/financeiro";

export type ComissaoRecebimentoInput = {
  numeroContrato: string;
  parcelaNumero: number;
  linha?: number;
};

export type ComissaoRecebimentoResult = {
  atualizados: number;
  ignorados: number;
  erros: string[];
};

const CONCURRENCY = 8;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

/**
 * Marca extratos como RECEBIDO via importação (remessa da administradora).
 * Chave: número do contrato + parcela.
 */
export async function batchMarcarExtratosRecebidos(
  items: ComissaoRecebimentoInput[],
): Promise<ComissaoRecebimentoResult> {
  let atualizados = 0;
  let ignorados = 0;
  const erros: string[] = [];
  const db = getAdminFirestore();
  const lookup = await buildVendaContratoLookupMap();

  const outcomes = await mapPool(items, CONCURRENCY, async (item) => {
    const numeroContrato = normalizeNumeroContrato(item.numeroContrato);
    const linhaLabel = item.linha ? `Linha ${item.linha}: ` : "";

    if (!numeroContrato) {
      return { type: "error" as const, message: `${linhaLabel}contrato inválido.` };
    }
    if (!Number.isInteger(item.parcelaNumero) || item.parcelaNumero < 1) {
      return {
        type: "error" as const,
        message: `${linhaLabel}parcela inválida para contrato ${numeroContrato}.`,
      };
    }

    const fromLookup = lookup.get(numeroContrato);
    const vendaId = fromLookup?.id ?? (await resolveVendaIdByNumeroContrato(numeroContrato));
    if (!vendaId) {
      return {
        type: "error" as const,
        message: `${linhaLabel}venda não encontrada para contrato ${numeroContrato}.`,
      };
    }

    const extratoId = extratoDocId(vendaId, item.parcelaNumero);
    const extratoSnap = await db.collection(COLLECTIONS.extratos).doc(extratoId).get();
    if (!extratoSnap.exists) {
      return {
        type: "error" as const,
        message: `${linhaLabel}extrato ${numeroContrato} P${item.parcelaNumero} não encontrado.`,
      };
    }

    const extrato = extratoSnap.data() as ExtratoDoc;
    if (extrato.status === "RECEBIDO" || extrato.status === "PAGO" || extrato.status === "LIBERADO") {
      return { type: "skip" as const };
    }

    try {
      await marcarExtratoRecebido(extratoId);
      return { type: "ok" as const };
    } catch (e) {
      return {
        type: "error" as const,
        message: `${linhaLabel}${e instanceof Error ? e.message : "Erro ao marcar recebido."}`,
      };
    }
  });

  for (const outcome of outcomes) {
    if (outcome.type === "ok") atualizados += 1;
    else if (outcome.type === "skip") ignorados += 1;
    else erros.push(outcome.message);
  }

  return { atualizados, ignorados, erros };
}
