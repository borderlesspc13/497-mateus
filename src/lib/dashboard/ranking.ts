import type { DocWithId, PlanoDoc, VendaDoc } from "@/lib/firestore/types";
import type {
  DashboardEquipeRanking,
  DashboardRanking,
  DashboardVendedorRanking,
} from "@/lib/types/domain";
import { resolverCreditoCentavos } from "@/utils/financeiro";

const TOP_VENDEDORES_LIMITE = 5;

export function getCurrentMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Data de referência da venda: dataVenda ou cadastro (fallback quando dataVenda ausente). */
export function vendaRankingReferenceDate(venda: VendaDoc): string {
  return venda.dataVenda ?? venda.createdAt;
}

export function isIsoInRange(iso: string, start: string, end: string): boolean {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  return time >= new Date(start).getTime() && time < new Date(end).getTime();
}

type RankingMaps = {
  planoMap: Map<string, DocWithId<PlanoDoc>>;
  vendedorNomes: Map<string, { nome: string; equipeId: string }>;
  equipeNomes: Map<string, string>;
};

function resolveVendaCreditoCentavos(
  venda: DocWithId<VendaDoc>,
  planoMap: Map<string, DocWithId<PlanoDoc>>,
): number {
  const plano = venda.planoId ? planoMap.get(venda.planoId) : null;
  return (
    resolverCreditoCentavos(venda.valorCentavos, plano?.valorCreditoCentavos ?? null) ?? 0
  );
}

export function buildDashboardRanking(
  vendas: DocWithId<VendaDoc>[],
  maps: RankingMaps,
): DashboardRanking {
  const vendedorAgg = new Map<
    string,
    { creditoCentavos: number; quantidadeVendas: number; equipeId: string }
  >();
  const equipeAgg = new Map<string, { creditoCentavos: number; quantidadeVendas: number }>();

  for (const venda of vendas) {
    const creditoCentavos = resolveVendaCreditoCentavos(venda, maps.planoMap);
    if (creditoCentavos <= 0) continue;

    const vendedorId = venda.vendedorId;
    const equipeId = venda.equipeId;

    const vendedorCurrent = vendedorAgg.get(vendedorId) ?? {
      creditoCentavos: 0,
      quantidadeVendas: 0,
      equipeId,
    };
    vendedorCurrent.creditoCentavos += creditoCentavos;
    vendedorCurrent.quantidadeVendas += 1;
    vendedorAgg.set(vendedorId, vendedorCurrent);

    const equipeCurrent = equipeAgg.get(equipeId) ?? {
      creditoCentavos: 0,
      quantidadeVendas: 0,
    };
    equipeCurrent.creditoCentavos += creditoCentavos;
    equipeCurrent.quantidadeVendas += 1;
    equipeAgg.set(equipeId, equipeCurrent);
  }

  const topVendedores: DashboardVendedorRanking[] = [...vendedorAgg.entries()]
    .map(([id, agg]) => {
      const vendedor = maps.vendedorNomes.get(id);
      const equipeNome = maps.equipeNomes.get(agg.equipeId) ?? "—";
      return {
        id,
        nome: vendedor?.nome ?? "Vendedor não identificado",
        equipeId: agg.equipeId,
        equipeNome,
        creditoCentavos: agg.creditoCentavos,
        quantidadeVendas: agg.quantidadeVendas,
      };
    })
    .sort(
      (a, b) =>
        b.creditoCentavos - a.creditoCentavos ||
        b.quantidadeVendas - a.quantidadeVendas,
    )
    .slice(0, TOP_VENDEDORES_LIMITE);

  const topEquipes: DashboardEquipeRanking[] = [...equipeAgg.entries()]
    .map(([id, agg]) => ({
      id,
      nome: maps.equipeNomes.get(id) ?? "Equipe não identificada",
      creditoCentavos: agg.creditoCentavos,
      quantidadeVendas: agg.quantidadeVendas,
    }))
    .sort(
      (a, b) =>
        b.creditoCentavos - a.creditoCentavos ||
        b.quantidadeVendas - a.quantidadeVendas,
    );

  const now = new Date();

  return {
    mesLabel: getCurrentMonthLabel(),
    mesAno: { month: now.getMonth() + 1, year: now.getFullYear() },
    topVendedores,
    melhorEquipe: topEquipes[0] ?? null,
    topEquipes: topEquipes.slice(0, TOP_VENDEDORES_LIMITE),
  };
}
