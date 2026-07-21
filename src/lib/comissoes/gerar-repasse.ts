import { calcularRepassesParcela, repasseDocId } from "@/lib/comissoes/calcular-repasse";
import { resolvePlanoRegrasRepasse } from "@/lib/comissoes/regras-repasse";
import type { PapelRepasse } from "@/lib/comissoes/regras-repasse";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  nowIso,
  type EquipeDoc,
  type ExtratoDoc,
  type ExtratoStatus,
  type PlanoDoc,
  type RepasseDoc,
  type RepasseStatus,
  type VendaDoc,
} from "@/lib/firestore/types";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { resolvePlanoRegrasFinanceiras } from "@/lib/planos/regras-financeiras";
import { resolverCreditoCentavos } from "@/utils/financeiro";

type BeneficiarioContext = {
  vendedorId: string;
  vendedorNome: string;
  supervisorId: string | null;
  supervisorNome: string | null;
  diretorId: string | null;
  diretorNome: string | null;
};

function resolveBeneficiario(
  papel: PapelRepasse,
  ctx: BeneficiarioContext,
): { id: string; nome: string } | null {
  if (papel === "VENDEDOR" && ctx.vendedorId) {
    return { id: ctx.vendedorId, nome: ctx.vendedorNome };
  }
  if (papel === "SUPERVISOR" && ctx.supervisorId) {
    return { id: ctx.supervisorId, nome: ctx.supervisorNome ?? "Supervisor" };
  }
  if (papel === "DIRETOR" && ctx.diretorId) {
    return { id: ctx.diretorId, nome: ctx.diretorNome ?? "Diretor" };
  }
  return null;
}

async function loadBeneficiarioContext(
  venda: { vendedorId: string; equipeId: string },
): Promise<BeneficiarioContext> {
  const db = getAdminFirestore();
  const [vendedorSnap, equipeSnap] = await Promise.all([
    venda.vendedorId
      ? db.collection(COLLECTIONS.vendedores).doc(venda.vendedorId).get()
      : Promise.resolve(null),
    venda.equipeId
      ? db.collection(COLLECTIONS.equipes).doc(venda.equipeId).get()
      : Promise.resolve(null),
  ]);

  const vendedorNome = vendedorSnap?.exists
    ? String((vendedorSnap.data() as { nome?: string }).nome ?? "Vendedor")
    : "Vendedor";

  const equipe = equipeSnap?.exists ? (equipeSnap.data() as EquipeDoc) : null;
  const supervisorId = equipe?.supervisorId ?? null;
  const diretorId = equipe?.diretorId ?? null;

  const extraIds = [supervisorId, diretorId].filter((id): id is string => Boolean(id));
  const nomes = new Map<string, string>();

  await Promise.all(
    extraIds.map(async (id) => {
      const snap = await db.collection(COLLECTIONS.vendedores).doc(id).get();
      if (snap.exists) {
        nomes.set(id, String((snap.data() as { nome?: string }).nome ?? ""));
      }
    }),
  );

  return {
    vendedorId: venda.vendedorId,
    vendedorNome,
    supervisorId,
    supervisorNome: supervisorId ? (nomes.get(supervisorId) ?? null) : null,
    diretorId,
    diretorNome: diretorId ? (nomes.get(diretorId) ?? null) : null,
  };
}

function statusRepasseAlvo(extratoStatus: ExtratoStatus): RepasseStatus | null {
  if (extratoStatus === "PENDENTE") return "PREVISTO";
  if (extratoStatus === "RECEBIDO" || extratoStatus === "LIBERADO" || extratoStatus === "PAGO") {
    return "PENDENTE";
  }
  return null;
}

function resolveNextRepasseStatus(
  existing: RepasseStatus | undefined,
  alvo: RepasseStatus,
): RepasseStatus {
  if (existing === "PAGO") return "PAGO";
  if (existing === "PENDENTE" && alvo === "PREVISTO") return "PENDENTE";
  return alvo;
}

/**
 * Sincroniza linhas de repasse interno para um extrato.
 * - Extrato PENDENTE → repasses PREVISTO (já na venda)
 * - Extrato RECEBIDO+ → repasses PENDENTE (prontos para pagar), preservando PAGO
 * Idempotente: regrava com os mesmos IDs.
 */
export async function syncRepassesParaExtrato(
  extratoId: string,
  extrato: ExtratoDoc,
  options: { throwOnMissingRules?: boolean } = {},
): Promise<number> {
  if (extrato.tipo === "ESTORNO") return 0;

  const alvo = statusRepasseAlvo(extrato.status);
  if (!alvo) return 0;

  const db = getAdminFirestore();
  const vendaSnap = await db.collection(COLLECTIONS.vendas).doc(extrato.vendaId).get();
  if (!vendaSnap.exists) {
    if (options.throwOnMissingRules) {
      throw new Error("Venda vinculada ao extrato não encontrada.");
    }
    return 0;
  }

  const vendaRaw = vendaSnap.data() as VendaDoc;
  const venda = normalizeVendaFields(vendaRaw);

  const planoSnap = await db.collection(COLLECTIONS.planos).doc(extrato.planoId).get();
  if (!planoSnap.exists) {
    if (options.throwOnMissingRules) {
      throw new Error("Plano vinculado ao extrato não encontrado.");
    }
    return 0;
  }
  const plano = planoSnap.data() as PlanoDoc;

  const regrasRepasse = resolvePlanoRegrasRepasse(plano);
  if (!regrasRepasse) {
    if (options.throwOnMissingRules) {
      throw new Error("O plano não possui regras de repasse interno configuradas.");
    }
    return 0;
  }

  const regrasFinanceiras = resolvePlanoRegrasFinanceiras(plano);
  const creditoCentavos = resolverCreditoCentavos(
    vendaRaw.valorCentavos ?? null,
    plano.valorCreditoCentavos,
  );
  if (creditoCentavos === null) {
    if (options.throwOnMissingRules) {
      throw new Error("Não foi possível resolver o crédito da venda para calcular repasses.");
    }
    return 0;
  }

  const repassesCalculados = calcularRepassesParcela(
    creditoCentavos,
    regrasRepasse,
    extrato.parcelaNumero,
  );
  if (repassesCalculados.length === 0) {
    return 0;
  }

  const beneficiarios = await loadBeneficiarioContext(venda);
  const ts = nowIso();
  let gerados = 0;
  const idsDesejados = new Set<string>();

  for (const item of repassesCalculados) {
    const beneficiario = resolveBeneficiario(item.papel, beneficiarios);
    if (!beneficiario) continue;

    const id = repasseDocId(extratoId, item.papel);
    idsDesejados.add(id);
    const ref = db.collection(COLLECTIONS.repasses).doc(id);
    const existing = await ref.get();
    const existingData = existing.exists ? (existing.data() as RepasseDoc) : null;

    // Não rebaixa nem recalcula valores de repasses já pagos.
    if (existingData?.status === "PAGO") {
      gerados += 1;
      continue;
    }

    const status = resolveNextRepasseStatus(existingData?.status, alvo);

    const doc: RepasseDoc = {
      extratoOrigemId: extratoId,
      vendaId: extrato.vendaId,
      numeroContrato: extrato.numeroContrato,
      planoId: extrato.planoId,
      parcelaNumero: item.parcelaNumero,
      parcelaLabel: item.parcelaLabel,
      parcelaTotal: regrasFinanceiras?.parcelasRecebimento ?? extrato.parcelaTotal,
      papel: item.papel,
      beneficiarioId: beneficiario.id,
      beneficiarioNome: beneficiario.nome,
      vendedorId: venda.vendedorId,
      equipeId: venda.equipeId,
      valorCentavos: item.valorCentavos,
      percentualPapel: item.percentualPapel,
      status,
      createdAt: existingData?.createdAt ?? ts,
      updatedAt: ts,
    };

    await ref.set(doc);
    gerados += 1;
  }

  // Remove PREVISTO órfãos do mesmo extrato (papel sem beneficiário ou regra zerada).
  if (alvo === "PREVISTO") {
    const orphans = await db
      .collection(COLLECTIONS.repasses)
      .where("extratoOrigemId", "==", extratoId)
      .get();
    for (const orphan of orphans.docs) {
      if (idsDesejados.has(orphan.id)) continue;
      const data = orphan.data() as RepasseDoc;
      if (data.status === "PREVISTO") {
        await orphan.ref.delete();
      }
    }
  }

  return gerados;
}

/**
 * Ativa/gera repasses quando o extrato administrador é marcado como RECEBIDO.
 * Idempotente: PREVISTO → PENDENTE; preserva PAGO.
 */
export async function gerarRepassesParaExtratoRecebido(
  extratoId: string,
  extrato: ExtratoDoc,
): Promise<number> {
  if (extrato.tipo === "ESTORNO") return 0;
  if (extrato.status !== "RECEBIDO") {
    throw new Error("Só é possível gerar repasses de extratos marcados como recebidos.");
  }

  return syncRepassesParaExtrato(extratoId, extrato, { throwOnMissingRules: true });
}

/** Remove repasses PREVISTO (e opcionalmente PENDENTE) vinculados a um extrato. */
export async function deleteRepassesByExtratoId(
  extratoId: string,
  options: { onlyPrevistos?: boolean } = { onlyPrevistos: true },
): Promise<number> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTIONS.repasses)
    .where("extratoOrigemId", "==", extratoId)
    .get();

  let deleted = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as RepasseDoc;
    if (options.onlyPrevistos && data.status !== "PREVISTO") continue;
    if (data.status === "PAGO") continue;
    await doc.ref.delete();
    deleted += 1;
  }
  return deleted;
}
