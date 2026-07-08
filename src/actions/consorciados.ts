"use server";

import { readNumeroContrato } from "@/lib/firestore/contrato-matriz";
import { requireServerSessionUser } from "@/lib/auth/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { COLLECTIONS, type VendaDoc } from "@/lib/firestore/types";
import {
  findConsorciadoMiniByCpfCnpj,
  getConsorciado as getConsorciadoDoc,
  listConsorciados as listConsorciadosDocs,
  listConsorciadosMini as listConsorciadosMiniDocs,
  listVendasByConsorciado as listVendasByConsorciadoDocs,
  searchConsorciadosMini as searchConsorciadosMiniDocs,
} from "@/lib/firestore/repository";
import type { ConsorciadoMini, ConsorciadoRow, VendaRow } from "@/lib/types/domain";

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

export async function getConsorciadosPageData(): Promise<{
  items: ConsorciadoRow[];
  vendasIndex: ConsorciadoVendaSearchIndexRow[];
}> {
  await requireServerSessionUser();
  const [items, vendasSnap] = await Promise.all([
    listConsorciadosDocs(),
    getAdminFirestore().collection(COLLECTIONS.vendas).get(),
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
