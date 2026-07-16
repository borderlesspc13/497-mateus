"use server";

import { readNumeroContrato } from "@/lib/firestore/contrato-matriz";
import { requireServerSessionUser } from "@/lib/auth/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { COLLECTIONS, type VendaDoc } from "@/lib/firestore/types";
import {
  createConsorciado as createConsorciadoDoc,
  deleteConsorciado as deleteConsorciadoDoc,
  findConsorciadoMiniByCpfCnpj,
  getConsorciado as getConsorciadoDoc,
  listConsorciados as listConsorciadosDocs,
  listConsorciadosMini as listConsorciadosMiniDocs,
  listVendasByConsorciado as listVendasByConsorciadoDocs,
  searchConsorciadosMini as searchConsorciadosMiniDocs,
  updateConsorciado as updateConsorciadoDoc,
  type ConsorciadoWriteInput,
} from "@/lib/firestore/repository";
import type { ConsorciadoMini, ConsorciadoRow, VendaRow } from "@/lib/types/domain";

export type ConsorciadoInput = ConsorciadoWriteInput;

export type ConsorciadoVendaSearchIndexRow = {
  id: string;
  consorciadoId: string | null;
  numeroContrato: string;
  grupo: string;
  cota: string;
  statusOperacional: VendaRow["statusOperacional"];
  statusInconsistencia: VendaRow["statusInconsistencia"];
};

export async function listConsorciadosMini(): Promise<ConsorciadoMini[]> {
  return listConsorciadosMiniDocs();
}

export async function searchConsorciadosMini(query: string): Promise<ConsorciadoMini[]> {
  return searchConsorciadosMiniDocs(query);
}

export async function findConsorciadoByCpfCnpj(
  cpfCnpj: string,
): Promise<ConsorciadoMini | null> {
  return findConsorciadoMiniByCpfCnpj(cpfCnpj);
}

export async function getConsorciado(id: string): Promise<ConsorciadoRow | null> {
  return getConsorciadoDoc(id);
}

export async function createConsorciado(data: ConsorciadoInput): Promise<ConsorciadoRow> {
  await requireServerSessionUser();
  return createConsorciadoDoc(data);
}

export async function updateConsorciado(
  id: string,
  data: ConsorciadoInput,
): Promise<ConsorciadoRow> {
  await requireServerSessionUser();
  return updateConsorciadoDoc(id, data);
}

export async function deleteConsorciado(id: string): Promise<void> {
  await requireServerSessionUser();
  return deleteConsorciadoDoc(id);
}

export async function getConsorciadosPageData(): Promise<{
  items: ConsorciadoRow[];
  vendasIndex: ConsorciadoVendaSearchIndexRow[];
}> {
  await requireServerSessionUser();
  const [items, vendasSnap] = await Promise.all([
    listConsorciadosDocs(),
    getAdminFirestore()
      .collection(COLLECTIONS.vendas)
      .select(
        "consorciadoId",
        "numeroContrato",
        "contrato",
        "titulo",
        "grupo",
        "cota",
        "statusOperacional",
        "status",
        "statusInconsistencia",
      )
      .get(),
  ]);

  return {
    items,
    vendasIndex: vendasSnap.docs.map((item) => {
      const data = item.data() as VendaDoc;
      const normalized = normalizeVendaFields(data);
      return {
        id: item.id,
        consorciadoId: data.consorciadoId ?? null,
        numeroContrato: readNumeroContrato(normalized),
        grupo: normalized.grupo,
        cota: normalized.cota,
        statusOperacional: normalized.statusOperacional,
        statusInconsistencia: normalized.statusInconsistencia,
      };
    }),
  };
}

export async function listVendasByConsorciado(consorciadoId: string): Promise<VendaRow[]> {
  return listVendasByConsorciadoDocs(consorciadoId);
}
