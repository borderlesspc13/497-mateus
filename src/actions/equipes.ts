"use server";

import { revalidatePath } from "next/cache";
import {
  createEquipe as createEquipeDoc,
  deleteEquipe as deleteEquipeDoc,
  getEquipe as getEquipeDoc,
  listEquipes as listEquipesDocs,
  listEquipesMini as listEquipesMiniDocs,
  updateEquipe as updateEquipeDoc,
} from "@/lib/firestore/repository";
import type { EquipeMini, EquipeRow } from "@/lib/types/domain";

export type EquipeInput = {
  nome: string;
};

function revalidateEquipes() {
  revalidatePath("/configuracoes");
  revalidatePath("/configuracoes/equipes");
  revalidatePath("/vendas");
}

export async function listEquipes(): Promise<EquipeRow[]> {
  return listEquipesDocs();
}

export async function listEquipesMini(): Promise<EquipeMini[]> {
  return listEquipesMiniDocs();
}

export async function getEquipe(id: string): Promise<EquipeRow | null> {
  return getEquipeDoc(id);
}

export async function createEquipe(data: EquipeInput): Promise<EquipeRow> {
  const nome = data.nome.trim();
  if (!nome) throw new Error("Informe o nome da equipe.");
  const row = await createEquipeDoc({ nome });
  revalidateEquipes();
  return row;
}

export async function updateEquipe(id: string, data: EquipeInput): Promise<EquipeRow> {
  const nome = data.nome.trim();
  if (!nome) throw new Error("Informe o nome da equipe.");
  const row = await updateEquipeDoc(id, { nome });
  revalidateEquipes();
  return row;
}

export async function deleteEquipe(id: string): Promise<void> {
  await deleteEquipeDoc(id);
  revalidateEquipes();
}
