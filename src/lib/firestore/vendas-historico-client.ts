"use client";

import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import {
  COLLECTIONS,
  VENDA_SUBCOLLECTIONS,
  nowIso,
  type HistoricoAtendimentoUniversalDoc,
} from "@/lib/firestore/types";
import type {
  HistoricoAtendimentoUniversalRow,
  TipoRegistroAtendimento,
} from "@/lib/types/domain";

async function getDb() {
  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) throw new Error("Firestore indisponível.");
  return db;
}

function mapHistoricoDoc(
  id: string,
  data: HistoricoAtendimentoUniversalDoc,
): HistoricoAtendimentoUniversalRow {
  return {
    id,
    dataRegistro: data.dataRegistro,
    tipoRegistro: data.tipoRegistro,
    observacao: data.observacao,
    usuarioId: data.usuarioId ?? null,
    usuarioNome: data.usuarioNome ?? null,
  };
}

export function subscribeHistoricoAtendimentoUniversal(
  vendaId: string,
  onChange: (items: HistoricoAtendimentoUniversalRow[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  let unsubscribe: Unsubscribe = () => {};

  void ensureFirebaseAuth()
    .then(() => {
      const db = getClientFirestore();
      if (!db) throw new Error("Firestore indisponível.");
      const q = query(
        collection(
          db,
          COLLECTIONS.vendas,
          vendaId,
          VENDA_SUBCOLLECTIONS.historico_atendimento,
        ),
        orderBy("dataRegistro", "desc"),
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((item) =>
            mapHistoricoDoc(item.id, item.data() as HistoricoAtendimentoUniversalDoc),
          );
          onChange(items);
        },
        (error) => onError?.(error),
      );
    })
    .catch((error: unknown) => {
      onError?.(error instanceof Error ? error : new Error("Falha ao carregar histórico."));
    });

  return () => unsubscribe();
}

export type HistoricoAtendimentoWithVenda = HistoricoAtendimentoUniversalRow & {
  vendaId: string;
  numeroContrato: string;
  grupo: string;
  cota: string;
};

export type VendaHistoricoRef = {
  id: string;
  numeroContrato: string;
  grupo: string;
  cota: string;
};

export type HistoricoAutorInput = {
  usuarioId: string;
  usuarioNome: string;
};

export async function fetchHistoricoAtendimentoForVendas(
  vendas: VendaHistoricoRef[],
): Promise<HistoricoAtendimentoWithVenda[]> {
  if (vendas.length === 0) return [];

  const db = await getDb();
  const batches = await Promise.all(
    vendas.map(async (venda) => {
      const snap = await getDocs(
        query(
          collection(
            db,
            COLLECTIONS.vendas,
            venda.id,
            VENDA_SUBCOLLECTIONS.historico_atendimento,
          ),
          orderBy("dataRegistro", "desc"),
        ),
      );
      return snap.docs.map((item) => {
        const mapped = mapHistoricoDoc(item.id, item.data() as HistoricoAtendimentoUniversalDoc);
        return {
          ...mapped,
          vendaId: venda.id,
          numeroContrato: venda.numeroContrato,
          grupo: venda.grupo,
          cota: venda.cota,
        };
      });
    }),
  );

  return batches
    .flat()
    .sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro));
}

export async function addHistoricoAtendimentoUniversal(
  vendaId: string,
  numeroContrato: string,
  tipoRegistro: TipoRegistroAtendimento,
  observacao: string,
  autor?: HistoricoAutorInput | null,
): Promise<void> {
  const trimmed = observacao.trim();
  if (!trimmed) throw new Error("Informe a observação do registro.");
  const contrato = numeroContrato.trim();
  if (!contrato) throw new Error("Informe o número do contrato.");

  const db = await getDb();
  const docData: HistoricoAtendimentoUniversalDoc = {
    numeroContrato: contrato,
    dataRegistro: nowIso(),
    tipoRegistro,
    observacao: trimmed,
    usuarioId: autor?.usuarioId ?? null,
    usuarioNome: autor?.usuarioNome ?? null,
  };
  await addDoc(
    collection(
      db,
      COLLECTIONS.vendas,
      vendaId,
      VENDA_SUBCOLLECTIONS.historico_atendimento,
    ),
    docData,
  );
}
