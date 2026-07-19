"use server";

import { revalidatePath } from "next/cache";
import {
  requireAdmin,
  requireGerenteOrAdmin,
  requireServerSessionUser,
} from "@/lib/auth/server";
import {
  createMetaDoc,
  deleteMetaAndRealizacao,
  findMetaDuplicada,
  generateMetaId,
  getMetaById,
  getMetasWidgetGlobalSnapshot,
  getMetasWidgetVendedorSnapshot,
  getRealizacaoById,
  getRealizacoesByIds,
  listAllConquistas,
  listMetaIdsByPeriodo,
  queryMetas,
  refreshMetasWidgetReadModels as refreshMetasWidgetReadModelsRepo,
  resolveReferenciaNome,
  resolveVendedorIdForUser,
  seedConquistasDocs,
  sincronizarRealizacaoMeta,
  updateMetaDoc,
  buildRankingPeriodoData,
  type MetaDoc,
} from "@/lib/firestore/metas-repository";
import { scheduleMetasWidgetRefresh } from "@/lib/firestore/schedule-read-model-refresh";
import { nowIso } from "@/lib/firestore/types";
import { buildRealizacaoId } from "@/lib/metas/conquistas";
import { criarMetaSchema, editarMetaSchema, criarMetasEmLoteSchema } from "@/lib/metas/schemas";
import { periodoAtual, isPeriodoValido } from "@/lib/periodo";
import type {
  ActionResult,
  Conquista,
  CriarMetaInput,
  CriarMetasEmLoteInput,
  EditarMetaInput,
  Meta,
  MetaComRealizacao,
  MetaTipo,
  RankingPeriodoItem,
  Realizacao,
} from "@/types/metas";

function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

function fail<T>(error: string): ActionResult<T> {
  return { success: false, error };
}

function revalidateMetas() {
  revalidatePath("/metas");
  revalidatePath("/metas/minhas");
}

export async function refreshMetasWidgetReadModels(periodo = periodoAtual()): Promise<void> {
  await refreshMetasWidgetReadModelsRepo(periodo);
}

export async function sincronizarRealizacao(metaId: string): Promise<ActionResult<Realizacao>> {
  try {
    await requireServerSessionUser();
    const realizacao = await sincronizarRealizacaoMeta(metaId);
    if (!realizacao) return fail("Meta não encontrada.");
    revalidateMetas();
    return ok(realizacao);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao sincronizar realização.");
  }
}

export async function criarMeta(input: CriarMetaInput): Promise<ActionResult<Meta>> {
  try {
    const user = await requireGerenteOrAdmin();
    const parsed = criarMetaSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const data = parsed.data;
    const referenciaNome = await resolveReferenciaNome(data.tipo, data.referenciaId);
    if (!referenciaNome) {
      return fail(data.tipo === "VENDEDOR" ? "Vendedor não encontrado." : "Equipe não encontrada.");
    }

    const duplicada = await findMetaDuplicada(data.periodo, data.tipo, data.referenciaId);
    if (duplicada) {
      return fail("Já existe meta para este período, tipo e referência.");
    }

    const ts = nowIso();
    const id = generateMetaId();
    const doc: MetaDoc = {
      periodo: data.periodo,
      tipo: data.tipo,
      referenciaId: data.referenciaId,
      referenciaNome,
      metaVendas: data.metaVendas,
      metaCreditoCentavos: data.metaCreditoCentavos,
      metaAtivacao: data.metaAtivacao,
      criadoPor: user.uid,
      criadoEm: ts,
      atualizadoEm: ts,
    };

    const meta = await createMetaDoc(id, doc);
    await sincronizarRealizacao(id);
    scheduleMetasWidgetRefresh(doc.periodo);
    revalidateMetas();
    return ok(meta);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar meta.");
  }
}

export async function criarMetasEmLote(
  input: CriarMetasEmLoteInput,
): Promise<ActionResult<void>> {
  try {
    const user = await requireGerenteOrAdmin();
    const parsed = criarMetasEmLoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const data = parsed.data;
    const ts = nowIso();
    let metasCriadas = 0;

    for (const refId of data.referenciaIds) {
      const duplicada = await findMetaDuplicada(data.periodo, data.tipo, refId);
      if (duplicada) continue;

      const referenciaNome = await resolveReferenciaNome(data.tipo, refId);
      if (!referenciaNome) continue;

      const id = generateMetaId();
      const doc: MetaDoc = {
        periodo: data.periodo,
        tipo: data.tipo,
        referenciaId: refId,
        referenciaNome,
        metaVendas: data.metaVendas,
        metaCreditoCentavos: data.metaCreditoCentavos,
        metaAtivacao: data.metaAtivacao,
        criadoPor: user.uid,
        criadoEm: ts,
        atualizadoEm: ts,
      };

      await createMetaDoc(id, doc);
      await sincronizarRealizacao(id);
      metasCriadas++;
    }

    if (metasCriadas > 0) {
      scheduleMetasWidgetRefresh(data.periodo);
      revalidateMetas();
      return ok(undefined);
    } else {
      return fail("Nenhuma meta foi criada. Talvez todos já possuam meta neste período.");
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar metas em lote.");
  }
}

export async function editarMeta(
  metaId: string,
  input: EditarMetaInput,
): Promise<ActionResult<Meta>> {
  try {
    await requireGerenteOrAdmin();
    const parsed = editarMetaSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const current = await getMetaById(metaId);
    if (!current) return fail("Meta não encontrada.");

    const next: MetaDoc = {
      periodo: current.periodo,
      tipo: current.tipo,
      referenciaId: current.referenciaId,
      referenciaNome: current.referenciaNome,
      metaVendas: parsed.data.metaVendas ?? current.metaVendas,
      metaCreditoCentavos: parsed.data.metaCreditoCentavos ?? current.metaCreditoCentavos,
      metaAtivacao: parsed.data.metaAtivacao ?? current.metaAtivacao,
      criadoPor: current.criadoPor,
      criadoEm: current.criadoEm,
      atualizadoEm: nowIso(),
    };
    const meta = await updateMetaDoc(metaId, next);
    await sincronizarRealizacao(metaId);
    scheduleMetasWidgetRefresh(next.periodo);
    revalidateMetas();
    return ok(meta);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao editar meta.");
  }
}

export async function excluirMeta(metaId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const meta = await getMetaById(metaId);
    if (!meta) return fail("Meta não encontrada.");

    await deleteMetaAndRealizacao(meta);
    scheduleMetasWidgetRefresh(meta.periodo);
    revalidateMetas();
    return ok(undefined);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao excluir meta.");
  }
}

export async function listarMetas(filtros?: {
  periodo?: string;
  tipo?: MetaTipo;
  referenciaId?: string;
}): Promise<ActionResult<Meta[]>> {
  try {
    const user = await requireServerSessionUser();

    if (filtros?.periodo && !isPeriodoValido(filtros.periodo)) {
      return fail("Período inválido.");
    }

    let metas = await queryMetas(filtros);

    if (user.role === "vendedor") {
      const vendedorId = await resolveVendedorIdForUser(user.uid, user.email);
      if (!vendedorId) return ok([]);
      metas = metas.filter((m) => m.tipo === "VENDEDOR" && m.referenciaId === vendedorId);
    }

    return ok(metas);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao listar metas.");
  }
}

export async function listarMetasComRealizacao(filtros?: {
  periodo?: string;
  tipo?: MetaTipo;
}): Promise<ActionResult<MetaComRealizacao[]>> {
  const metasResult = await listarMetas(filtros);
  if (!metasResult.success) return metasResult;

  const realizacaoIds = metasResult.data.map((meta) =>
    buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo),
  );
  const realizacaoMap = await getRealizacoesByIds(realizacaoIds);

  return ok(
    metasResult.data.map((meta) => ({
      ...meta,
      realizacao: realizacaoMap.get(buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo)) ?? null,
    })),
  );
}

export async function sincronizarTodasRealizacoes(periodo: string): Promise<
  ActionResult<{ processadas: number; erros: number }>
> {
  try {
    await requireGerenteOrAdmin();
    if (!isPeriodoValido(periodo)) return fail("Período inválido.");

    const metaIds = await listMetaIdsByPeriodo(periodo);

    const results = await Promise.allSettled(
      metaIds.map((id) => sincronizarRealizacao(id)),
    );

    let erros = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        erros += 1;
        continue;
      }
      if (!result.value.success) erros += 1;
    }

    scheduleMetasWidgetRefresh(periodo);
    revalidateMetas();
    return ok({ processadas: metaIds.length - erros, erros });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao sincronizar metas.");
  }
}

export async function getRankingPeriodo(
  periodo: string,
  tipo: MetaTipo,
): Promise<ActionResult<RankingPeriodoItem[]>> {
  try {
    await requireServerSessionUser();
    return ok(await buildRankingPeriodoData(periodo, tipo));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar ranking.");
  }
}

export async function listarConquistas(): Promise<ActionResult<Conquista[]>> {
  try {
    await requireServerSessionUser();
    return ok(await listAllConquistas());
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao listar conquistas.");
  }
}

export async function getMinhaMetaPeriodo(
  periodo: string,
  vendedorIdOverride?: string,
): Promise<
  ActionResult<{
    meta: Meta | null;
    realizacao: Realizacao | null;
    ranking: RankingPeriodoItem[];
    conquistas: Conquista[];
  }>
> {
  try {
    const user = await requireServerSessionUser();
    if (!isPeriodoValido(periodo)) return fail("Período inválido.");

    let vendedorId = vendedorIdOverride;
    if (!vendedorId) {
      if (user.role === "vendedor") {
        vendedorId = (await resolveVendedorIdForUser(user.uid, user.email)) ?? undefined;
      }
    }

    if (!vendedorId) {
      return ok({ meta: null, realizacao: null, ranking: [], conquistas: [] });
    }

    const [metasResult, rankingResult, conquistasResult] = await Promise.all([
      listarMetas({ periodo, tipo: "VENDEDOR", referenciaId: vendedorId }),
      getRankingPeriodo(periodo, "VENDEDOR"),
      listarConquistas(),
    ]);

    if (!metasResult.success) return fail(metasResult.error);
    if (!rankingResult.success) return fail(rankingResult.error);
    if (!conquistasResult.success) return fail(conquistasResult.error);

    const meta = metasResult.data[0] ?? null;
    let realizacao: Realizacao | null = null;

    if (meta) {
      const realizacaoId = buildRealizacaoId("VENDEDOR", vendedorId, periodo);
      realizacao = await getRealizacaoById(realizacaoId);
    }

    return ok({
      meta,
      realizacao,
      ranking: rankingResult.data,
      conquistas: conquistasResult.data,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar metas.");
  }
}

export async function seedConquistas(): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await seedConquistasDocs();
    return ok(undefined);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar conquistas.");
  }
}

export async function getMetasDashboardWidgetData(): Promise<
  ActionResult<{
    periodo: string;
    role: "admin" | "gerente" | "vendedor";
    minhaMeta: Meta | null;
    minhaRealizacao: Realizacao | null;
    rankingTop: RankingPeriodoItem[];
    conquistas: Conquista[];
  }>
> {
  try {
    const user = await requireServerSessionUser();
    const periodo = periodoAtual();
    const globalSnapshot = await getMetasWidgetGlobalSnapshot(periodo);

    let minhaMeta: Meta | null = null;
    let minhaRealizacao: Realizacao | null = null;

    if (user.role === "vendedor") {
      const vendedorId = await resolveVendedorIdForUser(user.uid, user.email);
      if (vendedorId) {
        const minha = await getMetasWidgetVendedorSnapshot(periodo, vendedorId);
        minhaMeta = minha.meta;
        minhaRealizacao = minha.realizacao;
      }
    }

    return ok({
      periodo,
      role: user.role,
      minhaMeta,
      minhaRealizacao,
      rankingTop: globalSnapshot.rankingTop,
      conquistas: globalSnapshot.conquistas,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar widget.");
  }
}
