import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  newId,
  nowIso,
  sortByCreatedAtDesc,
  type CampanhaDoc,
  type DocWithId,
} from "@/lib/firestore/types";
import type { CampanhaRow } from "@/lib/types/domain";

function toCampanhaRow(doc: DocWithId<CampanhaDoc>): CampanhaRow {
  return {
    id: doc.id,
    titulo: doc.titulo,
    descricao: doc.descricao,
    dataInicio: doc.dataInicio,
    dataFim: doc.dataFim,
    ativa: doc.ativa,
    destaque: doc.destaque,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function isCampanhaVigente(campanha: CampanhaDoc, now = new Date()): boolean {
  if (!campanha.ativa) return false;
  const inicio = new Date(campanha.dataInicio);
  if (Number.isNaN(inicio.getTime()) || inicio > now) return false;
  if (!campanha.dataFim) return true;
  const fim = new Date(campanha.dataFim);
  if (Number.isNaN(fim.getTime())) return true;
  return fim >= now;
}

export async function listCampanhas(): Promise<CampanhaRow[]> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.campanhas).get();
  const rows = snap.docs.map((doc) =>
    toCampanhaRow({ id: doc.id, ...(doc.data() as CampanhaDoc) }),
  );
  return sortByCreatedAtDesc(rows);
}

export async function listCampanhasAtivasDashboard(): Promise<CampanhaRow[]> {
  const all = await listCampanhas();
  const now = new Date();
  return all
    .filter((item) =>
      isCampanhaVigente({
        titulo: item.titulo,
        descricao: item.descricao,
        dataInicio: item.dataInicio,
        dataFim: item.dataFim,
        ativa: item.ativa,
        destaque: item.destaque,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }, now),
    )
    .sort((a, b) => {
      if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
      return b.dataInicio.localeCompare(a.dataInicio);
    });
}

export async function getCampanha(id: string): Promise<CampanhaRow | null> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.campanhas).doc(id).get();
  if (!snap.exists) return null;
  return toCampanhaRow({ id: snap.id, ...(snap.data() as CampanhaDoc) });
}

export type CampanhaInput = {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string | null;
  ativa: boolean;
  destaque: boolean;
};

export async function createCampanha(data: CampanhaInput): Promise<CampanhaRow> {
  const ts = nowIso();
  const id = newId();
  const doc: CampanhaDoc = {
    ...data,
    createdAt: ts,
    updatedAt: ts,
  };
  await getAdminFirestore().collection(COLLECTIONS.campanhas).doc(id).set(doc);
  return toCampanhaRow({ id, ...doc });
}

export async function updateCampanha(
  id: string,
  patch: Partial<CampanhaInput>,
): Promise<CampanhaRow> {
  const current = await getCampanha(id);
  if (!current) throw new Error("Campanha não encontrada.");

  const next: CampanhaDoc = {
    titulo: patch.titulo ?? current.titulo,
    descricao: patch.descricao ?? current.descricao,
    dataInicio: patch.dataInicio ?? current.dataInicio,
    dataFim: patch.dataFim !== undefined ? patch.dataFim : current.dataFim,
    ativa: patch.ativa ?? current.ativa,
    destaque: patch.destaque ?? current.destaque,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };

  await getAdminFirestore().collection(COLLECTIONS.campanhas).doc(id).set(next);
  return toCampanhaRow({ id, ...next });
}

export async function deleteCampanha(id: string): Promise<void> {
  await getAdminFirestore().collection(COLLECTIONS.campanhas).doc(id).delete();
}
