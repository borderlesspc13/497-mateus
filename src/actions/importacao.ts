"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { scheduleDashboardAndMetasRefresh } from "@/lib/firestore/schedule-read-model-refresh";
import { requireGerenteOrAdmin } from "@/lib/auth/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  batchUpdateVendaStatus,
  buildVendaContratoLookupMap,
  listInadimplentesMissingFromSpreadsheet,
  preprocessInadimplenciaReconciliation,
} from "@/lib/firestore/vendas-import";
import { COLLECTIONS, newId, type ExtratoDoc } from "@/lib/firestore/types";
import { batchMarcarExtratosRecebidos } from "@/lib/importacao/comissao-recebimento";
import { buildInadimplenciaReconciliationSummary } from "@/lib/importacao/inadimplencia-reconciliation";
import type {
  ImportConfirmPayload,
  ImportConfirmResult,
  ImportPreviewComissao,
  ImportPreviewInvalid,
  ImportPreviewMatched,
  ImportPreviewNotFound,
  ImportPreviewResult,
  ImportRowInput,
} from "@/lib/importacao/types";
import { normalizeContrato, parseImportStatus } from "@/lib/importacao/status";
import type { ExtratoStatus, StatusOperacionalCota } from "@/lib/types/domain";
import { extratoDocId } from "@/utils/financeiro";

const MAX_IMPORT_ROWS = 10_000;

function emptyReconciliation() {
  return buildInadimplenciaReconciliationSummary({
    missingFromSpreadsheet: [],
    totalInadimplentesNoSistema: 0,
    spreadsheetUniqueContractCount: 0,
  });
}

function revalidateImportacaoPaths() {
  revalidatePath("/vendas");
  revalidatePath("/controle");
  revalidatePath("/controle/inadimplencia");
  revalidatePath("/controle/inconsistencia");
  revalidatePath("/controle/pos-venda");
  revalidatePath("/importacao");
  revalidatePath("/comissoes");
}

function assertValidStatus(status: string): asserts status is StatusOperacionalCota {
  if (!parseImportStatus(status)) {
    throw new Error(`Status inválido: ${status}`);
  }
}

function assertValidReconciliationStatus(
  status: string,
): asserts status is Extract<StatusOperacionalCota, "ATIVO" | "CANCELADO"> {
  if (status !== "ATIVO" && status !== "CANCELADO") {
    throw new Error(`Status de conciliação inválido: ${status}`);
  }
}

async function previewComissoesRecebidas(
  rows: ImportRowInput[],
  lookup: Awaited<ReturnType<typeof buildVendaContratoLookupMap>>,
): Promise<ImportPreviewComissao[]> {
  const comissaoRows = rows.filter(
    (row): row is ImportRowInput & { parcelaComissao: number } =>
      typeof row.parcelaComissao === "number",
  );
  if (comissaoRows.length === 0) return [];

  const db = getAdminFirestore();
  const results: ImportPreviewComissao[] = [];

  for (const row of comissaoRows) {
    const numeroContrato = normalizeContrato(row.numeroContrato);
    if (!numeroContrato) {
      results.push({
        linha: row.linha,
        numeroContrato: row.numeroContrato,
        parcelaNumero: row.parcelaComissao,
        vendaId: null,
        extratoId: null,
        statusAtual: null,
        willUpdate: false,
        error: "Número do contrato inválido.",
      });
      continue;
    }

    const venda = lookup.get(numeroContrato);
    if (!venda) {
      results.push({
        linha: row.linha,
        numeroContrato,
        parcelaNumero: row.parcelaComissao,
        vendaId: null,
        extratoId: null,
        statusAtual: null,
        willUpdate: false,
        error: "Venda não encontrada.",
      });
      continue;
    }

    const extratoId = extratoDocId(venda.id, row.parcelaComissao);
    const extratoSnap = await db.collection(COLLECTIONS.extratos).doc(extratoId).get();
    if (!extratoSnap.exists) {
      results.push({
        linha: row.linha,
        numeroContrato,
        parcelaNumero: row.parcelaComissao,
        vendaId: venda.id,
        extratoId,
        statusAtual: null,
        willUpdate: false,
        error: `Extrato P${row.parcelaComissao} não encontrado.`,
      });
      continue;
    }

    const extrato = extratoSnap.data() as ExtratoDoc;
    const statusAtual = extrato.status as ExtratoStatus;
    const alreadyDone =
      statusAtual === "RECEBIDO" || statusAtual === "LIBERADO" || statusAtual === "PAGO";

    results.push({
      linha: row.linha,
      numeroContrato,
      parcelaNumero: row.parcelaComissao,
      vendaId: venda.id,
      extratoId,
      statusAtual,
      willUpdate: !alreadyDone && statusAtual === "PENDENTE",
      error:
        !alreadyDone && statusAtual !== "PENDENTE"
          ? `Status atual ${statusAtual} não permite marcar como recebido.`
          : undefined,
    });
  }

  return results;
}

export async function previewImportacaoStatus(
  rows: ImportRowInput[],
): Promise<ImportPreviewResult> {
  await requireGerenteOrAdmin();

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Nenhum registro enviado para pré-visualização.");
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Limite de ${MAX_IMPORT_ROWS.toLocaleString("pt-BR")} linhas por importação.`);
  }

  const lookup = await buildVendaContratoLookupMap();
  const matched: ImportPreviewMatched[] = [];
  const notFound: ImportPreviewNotFound[] = [];
  const invalid: ImportPreviewInvalid[] = [];

  for (const row of rows) {
    if (!row.statusOperacional) continue;

    const numeroContrato = normalizeContrato(row.numeroContrato);
    const statusOperacional = parseImportStatus(row.statusOperacional);

    if (!numeroContrato) {
      invalid.push({
        kind: "invalid",
        linha: row.linha,
        numeroContrato: null,
        error: "Número do contrato vazio ou inválido.",
      });
      continue;
    }

    if (!statusOperacional) {
      invalid.push({
        kind: "invalid",
        linha: row.linha,
        numeroContrato,
        error: `Status inválido: ${String(row.statusOperacional)}`,
      });
      continue;
    }

    const venda = lookup.get(numeroContrato);
    if (!venda) {
      notFound.push({
        kind: "not_found",
        linha: row.linha,
        numeroContrato,
        statusNovo: statusOperacional,
      });
      continue;
    }

    if (
      statusOperacional === "CANCELADO" &&
      (row.parcelasPagasCancelamento === undefined || row.parcelasPagasCancelamento === null)
    ) {
      invalid.push({
        kind: "invalid",
        linha: row.linha,
        numeroContrato,
        error: "Informe PARCELAS_PAGAS para vendas canceladas.",
      });
      continue;
    }

    matched.push({
      kind: "matched",
      linha: row.linha,
      numeroContrato,
      statusAtual: venda.statusOperacional,
      statusNovo: statusOperacional,
      vendaId: venda.id,
      willUpdate: venda.statusOperacional !== statusOperacional,
      parcelasPagasCancelamento: row.parcelasPagasCancelamento,
    });
  }

  const hasStatusRows = rows.some((row) => Boolean(row.statusOperacional));
  const reconciliation = hasStatusRows
    ? await preprocessInadimplenciaReconciliation(rows)
    : emptyReconciliation();

  const comissoes = await previewComissoesRecebidas(rows, lookup);

  const toUpdate = matched.filter((item) => item.willUpdate).length;
  const unchanged = matched.length - toUpdate;
  const comissoesToReceive = comissoes.filter((item) => item.willUpdate).length;
  const comissoesSkipped = comissoes.filter(
    (item) => !item.willUpdate && !item.error,
  ).length;
  const comissoesInvalid = comissoes.filter((item) => Boolean(item.error)).length;

  return {
    matched,
    notFound,
    invalid,
    comissoes,
    summary: {
      total: rows.length,
      toUpdate,
      notFound: notFound.length,
      unchanged,
      invalid: invalid.length,
      comissoesToReceive,
      comissoesSkipped,
      comissoesInvalid,
    },
    reconciliation,
  };
}

export async function confirmImportacaoStatus(
  payload: ImportConfirmPayload,
): Promise<ImportConfirmResult> {
  const sessionUser = await requireGerenteOrAdmin();
  const { updates, spreadsheetContractNumbers, comissoesRecebidas = [] } = payload;

  if (!Array.isArray(updates) || !Array.isArray(comissoesRecebidas)) {
    throw new Error("Payload de importação inválido.");
  }
  if (updates.length === 0 && comissoesRecebidas.length === 0) {
    throw new Error("Nenhuma alteração selecionada para importação.");
  }
  if (updates.length + comissoesRecebidas.length > MAX_IMPORT_ROWS) {
    throw new Error(`Limite de ${MAX_IMPORT_ROWS.toLocaleString("pt-BR")} atualizações por importação.`);
  }
  if (!Array.isArray(spreadsheetContractNumbers)) {
    throw new Error("Contexto de conciliação inválido.");
  }

  if (updates.length > 0) {
    const normalizedContracts = spreadsheetContractNumbers
      .map((item) => normalizeContrato(item))
      .filter(Boolean);
    const reconciliationData = await listInadimplentesMissingFromSpreadsheet(normalizedContracts);
    const reconciliation = buildInadimplenciaReconciliationSummary({
      missingFromSpreadsheet: reconciliationData.missingFromSpreadsheet,
      totalInadimplentesNoSistema: reconciliationData.totalInadimplentesNoSistema,
      spreadsheetUniqueContractCount: normalizedContracts.length,
    });
    const missingContracts = new Set(
      reconciliation.missingFromSpreadsheet.map((item) => item.numeroContrato),
    );

    if (missingContracts.size > 0) {
      const resolvedContracts = new Set<string>();
      for (const item of updates) {
        const numeroContrato = normalizeContrato(item.numeroContrato);
        if (!numeroContrato || !missingContracts.has(numeroContrato)) continue;
        assertValidReconciliationStatus(item.statusOperacional);
        if (item.statusOperacional === "CANCELADO" && item.parcelasPagasCancelamento === undefined) {
          throw new Error(
            "Conciliação pendente: informe PARCELAS_PAGAS para contratos marcados como cancelados.",
          );
        }
        resolvedContracts.add(numeroContrato);
      }

      if (resolvedContracts.size !== missingContracts.size) {
        throw new Error(
          `Conciliação obrigatória: ${missingContracts.size - resolvedContracts.size} contrato(s) inadimplente(s) ausente(s) na planilha ainda precisam de definição (Ativo ou Cancelado).`,
        );
      }
    }

    for (const item of updates) {
      if (!normalizeContrato(item.numeroContrato)) {
        throw new Error("Número do contrato inválido na confirmação.");
      }
      assertValidStatus(item.statusOperacional);
      if (item.statusOperacional === "CANCELADO" && item.parcelasPagasCancelamento === undefined) {
        throw new Error("Cancelamentos importados exigem PARCELAS_PAGAS.");
      }
    }
  }

  const statusResult =
    updates.length > 0
      ? await batchUpdateVendaStatus(updates)
      : { updated: 0, skipped: 0 };

  const comissaoResult =
    comissoesRecebidas.length > 0
      ? await batchMarcarExtratosRecebidos(comissoesRecebidas)
      : { atualizados: 0, ignorados: 0, erros: [] as string[] };

  if (statusResult.updated > 0 || comissaoResult.atualizados > 0) {
    await writeAuditLog({
      userId: sessionUser.uid,
      acao: `importacao.remessa.status_${statusResult.updated}_comissao_${comissaoResult.atualizados}`,
      documentoId: newId(),
    });
  }

  scheduleDashboardAndMetasRefresh();
  revalidateImportacaoPaths();

  return {
    updated: statusResult.updated,
    skipped: statusResult.skipped,
    comissoesAtualizadas: comissaoResult.atualizados,
    comissoesIgnoradas: comissaoResult.ignorados,
    comissoesErros: comissaoResult.erros,
  };
}
