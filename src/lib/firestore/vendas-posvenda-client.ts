"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import {
  COLLECTIONS,
  VENDA_SUBCOLLECTIONS,
  nowIso,
  type HistoricoAtendimentoDoc,
} from "@/lib/firestore/types";
import type {
  ChecklistAtivacao,
  HistoricoAtendimentoRow,
  HistoricoAtendimentoTipo,
} from "@/lib/types/domain";
import { DEFAULT_CHECKLIST_ATIVACAO } from "@/lib/vendas/pos-venda";

export type VendaPosVendaState = {
  checklistAtivacao: ChecklistAtivacao;
  dataPendencia: string | null;
  alertaAtivo: boolean;
};

async function getDb() {
  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) throw new Error("Firestore indisponível.");
  return db;
}

function normalizeChecklist(raw: Partial<ChecklistAtivacao> | undefined): ChecklistAtivacao {
  return {
    documentacaoRecebida: raw?.documentacaoRecebida ?? false,
    taxaPaga: raw?.taxaPaga ?? false,
    contratoAssinado: raw?.contratoAssinado ?? false,
  };
}

export function subscribeVendaPosVenda(
  vendaId: string,
  onChange: (state: VendaPosVendaState) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  let unsubscribe: Unsubscribe = () => {};

  void ensureFirebaseAuth()
    .then(() => {
      const db = getClientFirestore();
      if (!db) throw new Error("Firestore indisponível.");
      unsubscribe = onSnapshot(
        doc(db, COLLECTIONS.vendas, vendaId),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as {
            checklistAtivacao?: ChecklistAtivacao;
            dataPendencia?: string | null;
            alertaAtivo?: boolean;
          };
          onChange({
            checklistAtivacao: normalizeChecklist(data.checklistAtivacao),
            dataPendencia: data.dataPendencia ?? null,
            alertaAtivo: data.alertaAtivo ?? false,
          });
        },
        (error) => onError?.(error),
      );
    })
    .catch((error: unknown) => {
      onError?.(error instanceof Error ? error : new Error("Falha ao sincronizar venda."));
    });

  return () => unsubscribe();
}

export function subscribeHistoricoAtendimento(
  vendaId: string,
  onChange: (items: HistoricoAtendimentoRow[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  let unsubscribe: Unsubscribe = () => {};

  void ensureFirebaseAuth()
    .then(() => {
      const db = getClientFirestore();
      if (!db) throw new Error("Firestore indisponível.");
      const q = query(
        collection(db, COLLECTIONS.vendas, vendaId, VENDA_SUBCOLLECTIONS.historico),
        orderBy("data", "desc"),
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((item) => {
            const data = item.data() as HistoricoAtendimentoDoc;
            return {
              id: item.id,
              data: data.data,
              tipo: data.tipo,
              descricao: data.descricao,
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

export async function updateChecklistItem(
  vendaId: string,
  field: keyof ChecklistAtivacao,
  value: boolean,
): Promise<void> {
  const db = await getDb();
  const ref = doc(db, COLLECTIONS.vendas, vendaId);
  await updateDoc(ref, {
    [`checklistAtivacao.${field}`]: value,
    updatedAt: nowIso(),
  });
}

export async function updateVendaPendencia(
  vendaId: string,
  dataPendencia: string | null,
  alertaAtivo: boolean,
): Promise<void> {
  const db = await getDb();
  const ref = doc(db, COLLECTIONS.vendas, vendaId);
  await updateDoc(ref, {
    dataPendencia,
    alertaAtivo,
    updatedAt: nowIso(),
  });
}

export async function addHistoricoAtendimento(
  vendaId: string,
  tipo: HistoricoAtendimentoTipo,
  descricao: string,
): Promise<void> {
  const trimmed = descricao.trim();
  if (!trimmed) throw new Error("Informe a descrição do atendimento.");

  const db = await getDb();
  const docData: HistoricoAtendimentoDoc = {
    data: nowIso(),
    tipo,
    descricao: trimmed,
  };
  await addDoc(
    collection(db, COLLECTIONS.vendas, vendaId, VENDA_SUBCOLLECTIONS.historico),
    docData,
  );
}
