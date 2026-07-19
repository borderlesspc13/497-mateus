import { getAdminFirestore } from "@/lib/firebase/admin";
import { COLLECTIONS, nowIso, type VendaDoc } from "@/lib/firestore/types";
import {
  avaliarConquistas,
  buildRealizacaoId,
  calcularPercentuais,
  calcularRealizados,
  CONQUISTAS_SEED_WITH_IDS,
  filtrarVendasPeriodo,
} from "@/lib/metas/conquistas";
import { parsePeriodo, isPeriodoValido } from "@/lib/periodo";
import type {
  Conquista,
  Meta,
  MetaTipo,
  RankingPeriodoItem,
  Realizacao,
} from "@/types/metas";

function db() {
  return getAdminFirestore();
}

export type MetaDoc = Omit<Meta, "id">;
export type RealizacaoDoc = Omit<Realizacao, "id">;
type ConquistaDoc = Conquista;
type MetasWidgetGlobalSnapshotDoc = {
  periodo: string;
  rankingTop: RankingPeriodoItem[];
  conquistas: Conquista[];
  updatedAt: string;
  version: 1;
};
type MetasWidgetVendedorSnapshotDoc = {
  periodo: string;
  vendedorId: string;
  meta: Meta | null;
  realizacao: Realizacao | null;
  updatedAt: string;
  version: 1;
};

function toMeta(id: string, doc: MetaDoc): Meta {
  return { id, ...doc };
}

function toRealizacao(id: string, doc: RealizacaoDoc): Realizacao {
  return { id, ...doc };
}

function toConquista(id: string, doc: ConquistaDoc): Conquista {
  return { ...doc, id };
}

export async function resolveReferenciaNome(
  tipo: MetaTipo,
  referenciaId: string,
): Promise<string | null> {
  const collection = tipo === "VENDEDOR" ? COLLECTIONS.vendedores : COLLECTIONS.equipes;
  const snap = await db().collection(collection).doc(referenciaId).get();
  if (!snap.exists) return null;
  const data = snap.data() as { nome: string };
  return data.nome;
}

export async function findMetaDuplicada(
  periodo: string,
  tipo: MetaTipo,
  referenciaId: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await db()
    .collection(COLLECTIONS.metas)
    .where("periodo", "==", periodo)
    .where("tipo", "==", tipo)
    .where("referenciaId", "==", referenciaId)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return false;
  if (excludeId && doc.id === excludeId) return false;
  return true;
}

export async function listConquistasAtivas(): Promise<Conquista[]> {
  const snap = await db().collection(COLLECTIONS.conquistas).where("ativo", "==", true).get();
  if (snap.empty) return CONQUISTAS_SEED_WITH_IDS.filter((c) => c.ativo);
  return snap.docs.map((doc) => toConquista(doc.id, doc.data() as ConquistaDoc));
}

async function fetchVendasForReferencia(
  tipo: MetaTipo,
  referenciaId: string,
  inicioIso: string,
  fimIso: string,
): Promise<VendaDoc[]> {
  const field = tipo === "VENDEDOR" ? "vendedorId" : "equipeId";
  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where(field, "==", referenciaId)
    .where("createdAt", ">=", inicioIso)
    .where("createdAt", "<=", fimIso)
    .get();
  return snap.docs.map((doc) => doc.data() as VendaDoc);
}

export async function resolveVendedorIdForUser(
  uid: string,
  email: string | null,
): Promise<string | null> {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const exactMatch = await db()
    .collection(COLLECTIONS.vendedores)
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();
  const exactDoc = exactMatch.docs[0];
  if (exactDoc) return exactDoc.id;

  const snap = await db().collection(COLLECTIONS.vendedores).get();
  for (const vendedorDoc of snap.docs) {
    const data = vendedorDoc.data() as { email?: string };
    if (data.email?.trim().toLowerCase() === normalizedEmail) return vendedorDoc.id;
  }
  return null;
}

function metasWidgetGlobalSnapshotId(periodo: string): string {
  return `global:${periodo}`;
}

function metasWidgetVendedorSnapshotId(periodo: string, vendedorId: string): string {
  return `vendedor:${periodo}:${vendedorId}`;
}

export async function buildRankingPeriodoData(
  periodo: string,
  tipo: MetaTipo,
): Promise<RankingPeriodoItem[]> {
  if (!isPeriodoValido(periodo)) throw new Error("Período inválido.");

  const [realizacoesSnap, metasSnap, agregados] = await Promise.all([
    db()
      .collection(COLLECTIONS.realizacoes)
      .where("periodo", "==", periodo)
      .where("tipo", "==", tipo)
      .get(),
    db()
      .collection(COLLECTIONS.metas)
      .where("periodo", "==", periodo)
      .where("tipo", "==", tipo)
      .get(),
    aggregateVendasPeriodo(periodo, tipo),
  ]);

  const metaMap = new Map(
    metasSnap.docs.map((doc) => {
      const meta = toMeta(doc.id, doc.data() as MetaDoc);
      return [meta.referenciaId, meta] as const;
    }),
  );

  const realizacaoMap = new Map(
    realizacoesSnap.docs.map((doc) => {
      const r = toRealizacao(doc.id, doc.data() as RealizacaoDoc);
      return [r.referenciaId, r] as const;
    }),
  );

  const referenciaIds = new Set<string>([...metaMap.keys(), ...agregados.keys()]);
  const items: RankingPeriodoItem[] = [];

  for (const referenciaId of referenciaIds) {
    const meta = metaMap.get(referenciaId);
    const realizacao = realizacaoMap.get(referenciaId);
    const agregado = agregados.get(referenciaId);

    if (realizacao) {
      items.push({
        posicao: 0,
        referenciaId,
        referenciaNome: realizacao.referenciaNome,
        realizadoVendas: realizacao.realizadoVendas,
        realizadoCreditoCentavos: realizacao.realizadoCreditoCentavos,
        percentualVendas: realizacao.percentualVendas,
        percentualCredito: realizacao.percentualCredito,
        percentualAtivacao: realizacao.percentualAtivacao,
        metaVendas: meta?.metaVendas ?? null,
        metaCreditoCentavos: meta?.metaCreditoCentavos ?? null,
        metaAtivacao: meta?.metaAtivacao ?? null,
        conquistasDesbloqueadas: realizacao.conquistasDesbloqueadas,
        temMeta: Boolean(meta),
      });
      continue;
    }

    const vendas = agregado?.vendas ?? [];
    const { realizadoVendas, realizadoCreditoCentavos, realizadoAtivacao } =
      calcularRealizados(vendas);
    const percentuais = meta
      ? calcularPercentuais({
          realizadoVendas,
          realizadoCreditoCentavos,
          realizadoAtivacao,
          metaVendas: meta.metaVendas,
          metaCreditoCentavos: meta.metaCreditoCentavos,
          metaAtivacao: meta.metaAtivacao,
        })
      : { percentualVendas: 0, percentualCredito: 0, percentualAtivacao: 0 };

    items.push({
      posicao: 0,
      referenciaId,
      referenciaNome: agregado?.nome ?? meta?.referenciaNome ?? referenciaId,
      realizadoVendas,
      realizadoCreditoCentavos,
      percentualVendas: percentuais.percentualVendas,
      percentualCredito: percentuais.percentualCredito,
      percentualAtivacao: realizadoAtivacao,
      metaVendas: meta?.metaVendas ?? null,
      metaCreditoCentavos: meta?.metaCreditoCentavos ?? null,
      metaAtivacao: meta?.metaAtivacao ?? null,
      conquistasDesbloqueadas: [],
      temMeta: Boolean(meta),
    });
  }

  items.sort((a, b) => {
    const byPercent = b.percentualVendas - a.percentualVendas;
    if (byPercent !== 0) return byPercent;
    return b.realizadoCreditoCentavos - a.realizadoCreditoCentavos;
  });

  return items.map((item, index) => ({
    ...item,
    posicao: index + 1,
  }));
}

async function buildMetasWidgetGlobalSnapshot(
  periodo: string,
): Promise<MetasWidgetGlobalSnapshotDoc> {
  const [rankingTop, conquistas] = await Promise.all([
    buildRankingPeriodoData(periodo, "VENDEDOR").then((items) => items.slice(0, 3)),
    listConquistasAtivas(),
  ]);

  return {
    periodo,
    rankingTop,
    conquistas,
    updatedAt: nowIso(),
    version: 1,
  };
}

async function buildMetasWidgetVendedorSnapshot(
  periodo: string,
  vendedorId: string,
): Promise<MetasWidgetVendedorSnapshotDoc> {
  const [metaSnap, realizacaoSnap] = await Promise.all([
    db()
      .collection(COLLECTIONS.metas)
      .where("periodo", "==", periodo)
      .where("tipo", "==", "VENDEDOR")
      .where("referenciaId", "==", vendedorId)
      .limit(1)
      .get(),
    db().collection(COLLECTIONS.realizacoes).doc(buildRealizacaoId("VENDEDOR", vendedorId, periodo)).get(),
  ]);

  const metaDoc = metaSnap.docs[0];
  return {
    periodo,
    vendedorId,
    meta: metaDoc ? toMeta(metaDoc.id, metaDoc.data() as MetaDoc) : null,
    realizacao: realizacaoSnap.exists
      ? toRealizacao(realizacaoSnap.id, realizacaoSnap.data() as RealizacaoDoc)
      : null,
    updatedAt: nowIso(),
    version: 1,
  };
}

export async function getMetasWidgetGlobalSnapshot(
  periodo: string,
): Promise<MetasWidgetGlobalSnapshotDoc> {
  const ref = db().collection(COLLECTIONS.metasWidgetSnapshots).doc(metasWidgetGlobalSnapshotId(periodo));
  const snap = await ref.get();
  if (snap.exists) return snap.data() as MetasWidgetGlobalSnapshotDoc;
  const built = await buildMetasWidgetGlobalSnapshot(periodo);
  await ref.set(built);
  return built;
}

export async function getMetasWidgetVendedorSnapshot(
  periodo: string,
  vendedorId: string,
): Promise<MetasWidgetVendedorSnapshotDoc> {
  const ref = db()
    .collection(COLLECTIONS.metasWidgetSnapshots)
    .doc(metasWidgetVendedorSnapshotId(periodo, vendedorId));
  const snap = await ref.get();
  if (snap.exists) return snap.data() as MetasWidgetVendedorSnapshotDoc;
  const built = await buildMetasWidgetVendedorSnapshot(periodo, vendedorId);
  await ref.set(built);
  return built;
}

export async function refreshMetasWidgetReadModels(periodo: string): Promise<void> {
  const globalSnapshot = await buildMetasWidgetGlobalSnapshot(periodo);
  const metasVendedorSnap = await db()
    .collection(COLLECTIONS.metas)
    .where("periodo", "==", periodo)
    .where("tipo", "==", "VENDEDOR")
    .get();

  const vendedorIds = [...new Set(metasVendedorSnap.docs.map((doc) => (doc.data() as MetaDoc).referenciaId))];
  const vendedorSnapshots = await Promise.all(
    vendedorIds.map(async (vendedorId) => ({
      id: metasWidgetVendedorSnapshotId(periodo, vendedorId),
      payload: await buildMetasWidgetVendedorSnapshot(periodo, vendedorId),
    })),
  );

  const batch = db().batch();
  batch.set(
    db().collection(COLLECTIONS.metasWidgetSnapshots).doc(metasWidgetGlobalSnapshotId(periodo)),
    globalSnapshot,
  );
  for (const snapshot of vendedorSnapshots) {
    batch.set(db().collection(COLLECTIONS.metasWidgetSnapshots).doc(snapshot.id), snapshot.payload);
  }
  await batch.commit();
}

export async function getMetaById(metaId: string): Promise<Meta | null> {
  const metaSnap = await db().collection(COLLECTIONS.metas).doc(metaId).get();
  if (!metaSnap.exists) return null;
  return toMeta(metaSnap.id, metaSnap.data() as MetaDoc);
}

export async function sincronizarRealizacaoMeta(metaId: string): Promise<Realizacao | null> {
  const metaSnap = await db().collection(COLLECTIONS.metas).doc(metaId).get();
  if (!metaSnap.exists) return null;

  const meta = toMeta(metaSnap.id, metaSnap.data() as MetaDoc);
  const { inicio, fim } = parsePeriodo(meta.periodo);
  const inicioIso = inicio.toISOString();
  const fimIso = fim.toISOString();

  const vendasRaw = await fetchVendasForReferencia(
    meta.tipo,
    meta.referenciaId,
    inicioIso,
    fimIso,
  );
  const vendas = filtrarVendasPeriodo(vendasRaw, inicio, fim);
  const { realizadoVendas, realizadoCreditoCentavos, realizadoAtivacao } =
    calcularRealizados(vendas);

  const percentuais = calcularPercentuais({
    realizadoVendas,
    realizadoCreditoCentavos,
    realizadoAtivacao,
    metaVendas: meta.metaVendas,
    metaCreditoCentavos: meta.metaCreditoCentavos,
    metaAtivacao: meta.metaAtivacao,
  });

  const conquistas = await listConquistasAtivas();
  const conquistasDesbloqueadas = avaliarConquistas(conquistas, {
    realizadoVendas,
    percentualVendas: percentuais.percentualVendas,
    percentualCredito: percentuais.percentualCredito,
    realizadoAtivacao,
    metaAtivacao: meta.metaAtivacao,
    vendas,
    periodo: meta.periodo,
  });

  const realizacaoId = buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo);
  const ts = nowIso();
  const doc: RealizacaoDoc = {
    metaId: meta.id,
    periodo: meta.periodo,
    tipo: meta.tipo,
    referenciaId: meta.referenciaId,
    referenciaNome: meta.referenciaNome,
    realizadoVendas,
    realizadoCreditoCentavos,
    realizadoAtivacao,
    ...percentuais,
    conquistasDesbloqueadas,
    atualizadoEm: ts,
  };

  await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).set(doc);
  await refreshMetasWidgetReadModels(meta.periodo);
  return toRealizacao(realizacaoId, doc);
}

export function generateMetaId(): string {
  return db().collection(COLLECTIONS.metas).doc().id;
}

export async function createMetaDoc(id: string, doc: MetaDoc): Promise<Meta> {
  await db().collection(COLLECTIONS.metas).doc(id).set(doc);
  return toMeta(id, doc);
}

export async function updateMetaDoc(metaId: string, doc: MetaDoc): Promise<Meta> {
  await db().collection(COLLECTIONS.metas).doc(metaId).set(doc);
  return toMeta(metaId, doc);
}

export async function deleteMetaAndRealizacao(meta: Meta): Promise<void> {
  const realizacaoId = buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo);
  await db().collection(COLLECTIONS.metas).doc(meta.id).delete();
  await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).delete().catch(() => undefined);
}

export async function queryMetas(filtros?: {
  periodo?: string;
  tipo?: MetaTipo;
  referenciaId?: string;
}): Promise<Meta[]> {
  let q: FirebaseFirestore.Query = db().collection(COLLECTIONS.metas);

  if (filtros?.periodo) {
    q = q.where("periodo", "==", filtros.periodo);
  }
  if (filtros?.tipo) {
    q = q.where("tipo", "==", filtros.tipo);
  }

  const snap = await q.get();
  let metas = snap.docs.map((doc) => toMeta(doc.id, doc.data() as MetaDoc));

  if (filtros?.referenciaId) {
    metas = metas.filter((m) => m.referenciaId === filtros.referenciaId);
  }

  metas.sort((a, b) => a.referenciaNome.localeCompare(b.referenciaNome, "pt-BR"));
  return metas;
}

export async function getRealizacaoById(realizacaoId: string): Promise<Realizacao | null> {
  const snap = await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).get();
  if (!snap.exists) return null;
  return toRealizacao(snap.id, snap.data() as RealizacaoDoc);
}

export async function getRealizacoesByIds(
  realizacaoIds: string[],
): Promise<Map<string, Realizacao>> {
  const realizacaoSnaps = await Promise.all(
    realizacaoIds.map((id) => db().collection(COLLECTIONS.realizacoes).doc(id).get()),
  );
  return new Map(
    realizacaoSnaps
      .filter((snap) => snap.exists)
      .map((snap) => [snap.id, toRealizacao(snap.id, snap.data() as RealizacaoDoc)] as const),
  );
}

export async function listMetaIdsByPeriodo(periodo: string): Promise<string[]> {
  const snap = await db()
    .collection(COLLECTIONS.metas)
    .where("periodo", "==", periodo)
    .get();
  return snap.docs.map((doc) => doc.id);
}

async function aggregateVendasPeriodo(
  periodo: string,
  tipo: MetaTipo,
): Promise<Map<string, { nome: string; vendas: VendaDoc[] }>> {
  const { inicio, fim } = parsePeriodo(periodo);
  const inicioIso = inicio.toISOString();
  const fimIso = fim.toISOString();

  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where("createdAt", ">=", inicioIso)
    .where("createdAt", "<=", fimIso)
    .get();

  const vendas = snap.docs
    .map((doc) => doc.data() as VendaDoc)
    .filter((v) => v.statusOperacional !== "CANCELADO");

  const map = new Map<string, { nome: string; vendas: VendaDoc[] }>();

  if (tipo === "VENDEDOR") {
    const vendedoresSnap = await db().collection(COLLECTIONS.vendedores).get();
    const nomeMap = new Map(
      vendedoresSnap.docs.map((d) => [d.id, (d.data() as { nome: string }).nome]),
    );
    for (const venda of vendas) {
      if (!venda.vendedorId) continue;
      const entry = map.get(venda.vendedorId) ?? {
        nome: nomeMap.get(venda.vendedorId) ?? "Vendedor",
        vendas: [],
      };
      entry.vendas.push(venda);
      map.set(venda.vendedorId, entry);
    }
  } else {
    const equipesSnap = await db().collection(COLLECTIONS.equipes).get();
    const nomeMap = new Map(
      equipesSnap.docs.map((d) => [d.id, (d.data() as { nome: string }).nome]),
    );
    for (const venda of vendas) {
      if (!venda.equipeId) continue;
      const entry = map.get(venda.equipeId) ?? {
        nome: nomeMap.get(venda.equipeId) ?? "Equipe",
        vendas: [],
      };
      entry.vendas.push(venda);
      map.set(venda.equipeId, entry);
    }
  }

  return map;
}

export async function listAllConquistas(): Promise<Conquista[]> {
  const snap = await db().collection(COLLECTIONS.conquistas).get();
  if (snap.empty) return CONQUISTAS_SEED_WITH_IDS;
  return snap.docs.map((doc) => toConquista(doc.id, doc.data() as ConquistaDoc));
}

export async function seedConquistasDocs(): Promise<void> {
  const batch = db().batch();
  for (const conquista of CONQUISTAS_SEED_WITH_IDS) {
    const ref = db().collection(COLLECTIONS.conquistas).doc(conquista.id);
    batch.set(ref, conquista, { merge: true });
  }
  await batch.commit();
}
