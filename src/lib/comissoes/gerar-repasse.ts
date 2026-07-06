import { calcularRepassesParcela, repasseDocId } from "@/lib/comissoes/calcular-repasse";
import { resolvePlanoRegrasRepasse } from "@/lib/comissoes/regras-repasse";
import type { PapelRepasse } from "@/lib/comissoes/regras-repasse";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  nowIso,
  type EquipeDoc,
  type ExtratoDoc,
  type PlanoDoc,
  type RepasseDoc,
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
    db.collection(COLLECTIONS.vendedores).doc(venda.vendedorId).get(),
    db.collection(COLLECTIONS.equipes).doc(venda.equipeId).get(),
  ]);

  const vendedorNome = vendedorSnap.exists
    ? String((vendedorSnap.data() as { nome?: string }).nome ?? "Vendedor")
    : "Vendedor";

  const equipe = equipeSnap.exists ? (equipeSnap.data() as EquipeDoc) : null;
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

/**
 * Gera linhas de repasse interno quando um extrato administrador é marcado como RECEBIDO.
 * Idempotente: regrava os documentos com os mesmos IDs.
 */
export async function gerarRepassesParaExtratoRecebido(
  extratoId: string,
  extrato: ExtratoDoc,
): Promise<number> {
  if (extrato.tipo === "ESTORNO") return 0;
  if (extrato.status !== "RECEBIDO") {
    throw new Error("Só é possível gerar repasses de extratos marcados como recebidos.");
  }

  const db = getAdminFirestore();
  const vendaSnap = await db.collection(COLLECTIONS.vendas).doc(extrato.vendaId).get();
  if (!vendaSnap.exists) {
    throw new Error("Venda vinculada ao extrato não encontrada.");
  }

  const vendaRaw = vendaSnap.data() as VendaDoc;
  const venda = normalizeVendaFields(vendaRaw);

  const planoSnap = await db.collection(COLLECTIONS.planos).doc(extrato.planoId).get();
  if (!planoSnap.exists) {
    throw new Error("Plano vinculado ao extrato não encontrado.");
  }
  const plano = planoSnap.data() as PlanoDoc;

  const regrasRepasse = resolvePlanoRegrasRepasse(plano);
  if (!regrasRepasse) {
    throw new Error("O plano não possui regras de repasse interno configuradas.");
  }

  const regrasFinanceiras = resolvePlanoRegrasFinanceiras(plano);
  const creditoCentavos = resolverCreditoCentavos(
    vendaRaw.valorCentavos ?? null,
    plano.valorCreditoCentavos,
  );
  if (creditoCentavos === null) {
    throw new Error("Não foi possível resolver o crédito da venda para calcular repasses.");
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

  for (const item of repassesCalculados) {
    const beneficiario = resolveBeneficiario(item.papel, beneficiarios);
    if (!beneficiario) continue;

    const id = repasseDocId(extratoId, item.papel);
    const ref = db.collection(COLLECTIONS.repasses).doc(id);
    const existing = await ref.get();

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
      status: existing.exists ? (existing.data() as RepasseDoc).status : "PENDENTE",
      createdAt: existing.exists ? (existing.data() as RepasseDoc).createdAt : ts,
      updatedAt: ts,
    };

    await ref.set(doc);
    gerados += 1;
  }

  return gerados;
}
