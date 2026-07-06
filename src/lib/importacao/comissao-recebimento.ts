import { normalizeNumeroContrato } from "@/lib/firestore/contrato-matriz";
import { getAdminFirestore } from "@/lib/firebase/admin";
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

  for (const item of items) {
    const numeroContrato = normalizeNumeroContrato(item.numeroContrato);
    const linhaLabel = item.linha ? `Linha ${item.linha}: ` : "";

    if (!numeroContrato) {
      erros.push(`${linhaLabel}contrato inválido.`);
      continue;
    }
    if (!Number.isInteger(item.parcelaNumero) || item.parcelaNumero < 1) {
      erros.push(`${linhaLabel}parcela inválida para contrato ${numeroContrato}.`);
      continue;
    }

    const vendaId = await resolveVendaIdByNumeroContrato(numeroContrato);
    if (!vendaId) {
      erros.push(`${linhaLabel}venda não encontrada para contrato ${numeroContrato}.`);
      continue;
    }

    const extratoId = extratoDocId(vendaId, item.parcelaNumero);
    const extratoSnap = await db.collection(COLLECTIONS.extratos).doc(extratoId).get();
    if (!extratoSnap.exists) {
      erros.push(
        `${linhaLabel}extrato ${numeroContrato} P${item.parcelaNumero} não encontrado.`,
      );
      continue;
    }

    const extrato = extratoSnap.data() as ExtratoDoc;
    if (extrato.status === "RECEBIDO" || extrato.status === "PAGO" || extrato.status === "LIBERADO") {
      ignorados += 1;
      continue;
    }

    try {
      await marcarExtratoRecebido(extratoId);
      atualizados += 1;
    } catch (e) {
      erros.push(
        `${linhaLabel}${e instanceof Error ? e.message : "Erro ao marcar recebido."}`,
      );
    }
  }

  return { atualizados, ignorados, erros };
}
