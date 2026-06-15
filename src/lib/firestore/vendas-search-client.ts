"use client";

import { collection, getDocs } from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import { COLLECTIONS, type VendaDoc } from "@/lib/firestore/types";

export type VendaSearchIndexRow = {
  id: string;
  consorciadoId: string | null;
  numeroContrato: string;
  grupo: string;
  cota: string;
};

async function getDb() {
  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) {
    throw new Error("Firestore indisponível. Verifique a configuração do Firebase.");
  }
  return db;
}

export async function listVendasSearchIndex(): Promise<VendaSearchIndexRow[]> {
  const db = await getDb();
  const snap = await getDocs(collection(db, COLLECTIONS.vendas));
  return snap.docs.map((item) => {
    const data = item.data() as VendaDoc;
    return {
      id: item.id,
      consorciadoId: data.consorciadoId ?? null,
      numeroContrato: data.numeroContrato ?? "",
      grupo: data.grupo ?? "",
      cota: data.cota ?? "",
    };
  });
}
