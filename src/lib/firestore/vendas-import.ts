import { getAdminFirestore } from "@/lib/firebase/admin";
import type { VendaContratoLookup } from "@/lib/firestore/contrato-matriz";
import {
  buildContratoLookupFromVendas,
  normalizeNumeroContrato,
} from "@/lib/firestore/contrato-matriz";
import { aplicarEstornoCancelamentoVenda } from "@/lib/firestore/estorno-cancelamento";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import {
  resolveVendaIdByNumeroContrato,
  listVendaDocsByStatusOperacional,
  syncExtratosComissaoForVenda,
} from "@/lib/firestore/repository";
import { COLLECTIONS, nowIso, type ConsorciadoDoc, type VendaDoc } from "@/lib/firestore/types";
import type {
  ImportConfirmItem,
  ImportConfirmResult,
  ImportReconciliationItem,
  ImportReconciliationSummary,
} from "@/lib/importacao/types";
import type { ImportRowInput } from "@/lib/importacao/types";
import { buildSpreadsheetContractSet } from "@/lib/importacao/reconciliation";
import { buildInadimplenciaReconciliationSummary } from "@/lib/importacao/inadimplencia-reconciliation";

export type { VendaContratoLookup };

const FIRESTORE_BATCH_LIMIT = 400;

export async function buildVendaContratoLookupMap(): Promise<Map<string, VendaContratoLookup>> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.vendas).get();
  const entries: VendaContratoLookup[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as VendaDoc;
    const normalized = normalizeVendaFields(data);
    const numeroContrato = normalized.numeroContrato;
    if (!numeroContrato) continue;
    entries.push({
      id: doc.id,
      numeroContrato,
      statusOperacional: normalized.statusOperacional,
    });
  }

  return buildContratoLookupFromVendas(entries);
}

export async function listInadimplentesMissingFromSpreadsheet(
  spreadsheetContractNumbers: string[],
): Promise<{
  missingFromSpreadsheet: ImportReconciliationItem[];
  totalInadimplentesNoSistema: number;
}> {
  const spreadsheetSet = new Set(
    spreadsheetContractNumbers.map((item) => normalizeNumeroContrato(item)).filter(Boolean),
  );

  const db = getAdminFirestore();
  const vendas = await listVendaDocsByStatusOperacional("INADIMPLENTE");

  const inadimplentes: Array<{
    numeroContrato: string;
    grupo: string;
    cota: string;
    consorciadoId: string | null;
  }> = [];

  let totalInadimplentesNoSistema = 0;

  for (const data of vendas) {
    const normalized = normalizeVendaFields(data);
    if (normalized.statusOperacional !== "INADIMPLENTE") continue;

    totalInadimplentesNoSistema += 1;

    const numeroContrato = normalized.numeroContrato;
    if (!numeroContrato || spreadsheetSet.has(numeroContrato)) continue;

    inadimplentes.push({
      numeroContrato,
      grupo: normalized.grupo,
      cota: normalized.cota,
      consorciadoId: data.consorciadoId ?? null,
    });
  }

  const consorciadoIds = [
    ...new Set(inadimplentes.map((item) => item.consorciadoId).filter((id): id is string => Boolean(id))),
  ];

  const consorciadoNomeMap = new Map<string, string>();
  const CHUNK = 100;
  for (let i = 0; i < consorciadoIds.length; i += CHUNK) {
    const chunk = consorciadoIds.slice(i, i + CHUNK);
    const refs = chunk.map((id) => db.collection(COLLECTIONS.consorciados).doc(id));
    const snaps = await db.getAll(...refs);
    for (const consorciadoSnap of snaps) {
      if (!consorciadoSnap.exists) continue;
      const consorciado = consorciadoSnap.data() as ConsorciadoDoc;
      consorciadoNomeMap.set(consorciadoSnap.id, consorciado.nome);
    }
  }

  const missingFromSpreadsheet = inadimplentes
    .map((item) => ({
      numeroContrato: item.numeroContrato,
      grupo: item.grupo,
      cota: item.cota,
      consorciadoNome: item.consorciadoId
        ? (consorciadoNomeMap.get(item.consorciadoId) ?? null)
        : null,
    }))
    .sort((a, b) => a.numeroContrato.localeCompare(b.numeroContrato));

  return {
    missingFromSpreadsheet,
    totalInadimplentesNoSistema,
  };
}

/**
 * Pré-processamento: compara planilha × inadimplentes no Firestore e
 * retorna cotas órfãs que exigem conciliação manual antes do batch.
 */
export async function preprocessInadimplenciaReconciliation(
  rows: ImportRowInput[],
): Promise<ImportReconciliationSummary> {
  const spreadsheetContractNumbers = [...buildSpreadsheetContractSet(rows)];
  const { missingFromSpreadsheet, totalInadimplentesNoSistema } =
    await listInadimplentesMissingFromSpreadsheet(spreadsheetContractNumbers);

  return buildInadimplenciaReconciliationSummary({
    missingFromSpreadsheet,
    totalInadimplentesNoSistema,
    spreadsheetUniqueContractCount: spreadsheetContractNumbers.length,
  });
}

export async function batchUpdateVendaStatus(
  updates: ImportConfirmItem[],
): Promise<ImportConfirmResult> {
  if (updates.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  const db = getAdminFirestore();
  const lookup = await buildVendaContratoLookupMap();
  let updated = 0;
  let skipped = 0;
  const ts = nowIso();

  type PendingUpdate = {
    vendaId: string;
    statusOperacional: ImportConfirmItem["statusOperacional"];
    isNovoCancelamento: boolean;
    parcelasPagasCancelamento?: number | null;
  };

  const pending: PendingUpdate[] = [];
  const postSyncAtivo: string[] = [];
  const postEstorno: Array<{ vendaId: string; parcelas: number }> = [];

  for (const item of updates) {
    const numeroContrato = normalizeNumeroContrato(item.numeroContrato);
    if (!numeroContrato) {
      skipped += 1;
      continue;
    }

    const fromLookup = lookup.get(numeroContrato);
    const vendaId = fromLookup?.id ?? (await resolveVendaIdByNumeroContrato(numeroContrato));
    if (!vendaId) {
      skipped += 1;
      continue;
    }

    const ref = db.collection(COLLECTIONS.vendas).doc(vendaId);
    const snap = await ref.get();
    if (!snap.exists) {
      skipped += 1;
      continue;
    }

    const current = normalizeVendaFields(snap.data() as VendaDoc);
    if (current.statusOperacional === item.statusOperacional) {
      skipped += 1;
      continue;
    }

    const isNovoCancelamento =
      item.statusOperacional === "CANCELADO" && current.statusOperacional !== "CANCELADO";
    if (isNovoCancelamento) {
      if (
        item.parcelasPagasCancelamento === undefined ||
        item.parcelasPagasCancelamento === null
      ) {
        throw new Error(
          `Venda ${current.numeroContrato}: informe PARCELAS_PAGAS para cancelamentos importados.`,
        );
      }
      if (
        !Number.isInteger(item.parcelasPagasCancelamento) ||
        item.parcelasPagasCancelamento < 0
      ) {
        throw new Error(
          `Venda ${current.numeroContrato}: PARCELAS_PAGAS inválido.`,
        );
      }
    }

    pending.push({
      vendaId,
      statusOperacional: item.statusOperacional,
      isNovoCancelamento,
      parcelasPagasCancelamento: item.parcelasPagasCancelamento,
    });
  }

  for (let i = 0; i < pending.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = pending.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    for (const item of chunk) {
      const ref = db.collection(COLLECTIONS.vendas).doc(item.vendaId);
      batch.update(ref, {
        statusOperacional: item.statusOperacional,
        status: item.statusOperacional,
        updatedAt: ts,
        ...(item.isNovoCancelamento
          ? { parcelasPagasCancelamento: item.parcelasPagasCancelamento }
          : {}),
      });
    }
    await batch.commit();
    updated += chunk.length;

    for (const item of chunk) {
      if (item.statusOperacional === "ATIVO") {
        postSyncAtivo.push(item.vendaId);
      }
      if (
        item.isNovoCancelamento &&
        item.parcelasPagasCancelamento !== undefined &&
        item.parcelasPagasCancelamento !== null
      ) {
        postEstorno.push({
          vendaId: item.vendaId,
          parcelas: item.parcelasPagasCancelamento,
        });
      }
    }
  }

  await Promise.all(postSyncAtivo.map((vendaId) => syncExtratosComissaoForVenda(vendaId)));
  await Promise.all(
    postEstorno.map(({ vendaId, parcelas }) => aplicarEstornoCancelamentoVenda(vendaId, parcelas)),
  );

  return { updated, skipped };
}
