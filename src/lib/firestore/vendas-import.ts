import { getAdminFirestore } from "@/lib/firebase/admin";
import { aplicarEstornoCancelamentoVenda } from "@/lib/firestore/estorno-cancelamento";
import { COLLECTIONS, nowIso, type VendaDoc } from "@/lib/firestore/types";
import type { ImportConfirmItem, ImportConfirmResult } from "@/lib/importacao/types";

export type VendaContratoLookup = {
  id: string;
  contrato: string;
  status: import("@/lib/types/domain").VendaStatus;
};

export async function buildVendaContratoLookupMap(): Promise<Map<string, VendaContratoLookup>> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.vendas).get();
  const map = new Map<string, VendaContratoLookup>();

  for (const doc of snap.docs) {
    const data = doc.data() as VendaDoc;
    const contrato = data.contrato?.trim();
    if (!contrato) continue;
    map.set(contrato, {
      id: doc.id,
      contrato,
      status: data.status,
    });
  }

  return map;
}

export async function batchUpdateVendaStatus(
  updates: ImportConfirmItem[],
): Promise<ImportConfirmResult> {
  if (updates.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  const db = getAdminFirestore();
  let updated = 0;
  let skipped = 0;
  const ts = nowIso();

  for (const item of updates) {
    const ref = db.collection(COLLECTIONS.vendas).doc(item.vendaId);
    const snap = await ref.get();
    if (!snap.exists) {
      skipped += 1;
      continue;
    }

    const current = snap.data() as VendaDoc;
    if (current.status === item.status) {
      skipped += 1;
      continue;
    }

    const isNovoCancelamento = item.status === "CANCELADO" && current.status !== "CANCELADO";
    if (isNovoCancelamento) {
      if (
        item.parcelasPagasCancelamento === undefined ||
        item.parcelasPagasCancelamento === null
      ) {
        throw new Error(
          `Venda ${current.contrato}: informe PARCELAS_PAGAS para cancelamentos importados.`,
        );
      }
      if (
        !Number.isInteger(item.parcelasPagasCancelamento) ||
        item.parcelasPagasCancelamento < 0
      ) {
        throw new Error(
          `Venda ${current.contrato}: PARCELAS_PAGAS inválido.`,
        );
      }
    }

    await ref.update({
      status: item.status,
      updatedAt: ts,
      ...(isNovoCancelamento
        ? { parcelasPagasCancelamento: item.parcelasPagasCancelamento }
        : {}),
    });
    updated += 1;

    if (isNovoCancelamento && item.parcelasPagasCancelamento !== undefined) {
      await aplicarEstornoCancelamentoVenda(item.vendaId, item.parcelasPagasCancelamento);
    }
  }

  return { updated, skipped };
}
