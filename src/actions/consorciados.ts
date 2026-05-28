"use server";

import {
  getConsorciado as getConsorciadoDoc,
  listConsorciadosMini as listConsorciadosMiniDocs,
  listVendasByConsorciado as listVendasByConsorciadoDocs,
} from "@/lib/firestore/repository";
import type { ConsorciadoMini, ConsorciadoRow, VendaRow } from "@/lib/types/domain";

export async function listConsorciadosMini(): Promise<ConsorciadoMini[]> {
  return listConsorciadosMiniDocs();
}

export async function getConsorciado(id: string): Promise<ConsorciadoRow | null> {
  return getConsorciadoDoc(id);
}

export async function listVendasByConsorciado(consorciadoId: string): Promise<VendaRow[]> {
  return listVendasByConsorciadoDocs(consorciadoId);
}
