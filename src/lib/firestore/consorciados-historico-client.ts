"use client";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import {
  COLLECTIONS,
  CONSORCIADO_SUBCOLLECTIONS,
  nowIso,
  type ConsorciadoHistoricoAtendimentoDoc,
} from "@/lib/firestore/types";
import type { ConsorciadoHistoricoAtendimentoRow } from "@/lib/types/domain";

export type ConsorciadoHistoricoAutorInput = {
  usuarioId: string;
  usuarioNome: string;
};

export function subscribeConsorciadoHistoricoAtendimento(
  consorciadoId: string,
  onChange: (items: ConsorciadoHistoricoAtendimentoRow[]) => void,
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
          COLLECTIONS.consorciados,
          consorciadoId,
          CONSORCIADO_SUBCOLLECTIONS.historico_atendimento,
        ),
        orderBy("dataRegistro", "desc"),
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((item) => {
            const data = item.data() as ConsorciadoHistoricoAtendimentoDoc;
            return {
              id: item.id,
              dataRegistro: data.dataRegistro,
              observacao: data.observacao,
              usuarioId: data.usuarioId,
              usuarioNome: data.usuarioNome,
            };
          });
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

export async function addConsorciadoHistoricoAtendimento(
  consorciadoId: string,
  observacao: string,
  autor: ConsorciadoHistoricoAutorInput,
): Promise<void> {
  const trimmed = observacao.trim();
  if (!trimmed) throw new Error("Informe a observação do atendimento.");
  if (!autor.usuarioId.trim()) throw new Error("Usuário não identificado.");

  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) throw new Error("Firestore indisponível.");

  const docData: ConsorciadoHistoricoAtendimentoDoc = {
    dataRegistro: nowIso(),
    observacao: trimmed,
    usuarioId: autor.usuarioId,
    usuarioNome: autor.usuarioNome.trim() || "Usuário",
  };

  await addDoc(
    collection(
      db,
      COLLECTIONS.consorciados,
      consorciadoId,
      CONSORCIADO_SUBCOLLECTIONS.historico_atendimento,
    ),
    docData,
  );
}
