"use server";

import { revalidatePath } from "next/cache";
import { requireGerenteOrAdmin, requireServerSessionUser } from "@/lib/auth/server";
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
  supervisorId?: string | null;
  diretorId?: string | null;
};

function revalidateEquipes() {
  revalidatePath("/configuracoes");
  revalidatePath("/configuracoes/equipes");
  revalidatePath("/vendas");
}

export async function listEquipes(): Promise<EquipeRow[]> {
  await requireServerSessionUser();
  return listEquipesDocs();
}

export async function listEquipesMini(): Promise<EquipeMini[]> {
  return listEquipesMiniDocs();
}

export async function getEquipe(id: string): Promise<EquipeRow | null> {
  return getEquipeDoc(id);
}

export async function createEquipe(data: EquipeInput): Promise<EquipeRow> {
  await requireGerenteOrAdmin();
  const nome = data.nome.trim();
  if (!nome) throw new Error("Informe o nome da equipe.");
  const row = await createEquipeDoc({
    nome,
    supervisorId: data.supervisorId ?? null,
    diretorId: data.diretorId ?? null,
  });
  revalidateEquipes();
  return row;
}

export async function updateEquipe(id: string, data: EquipeInput): Promise<EquipeRow> {
  await requireGerenteOrAdmin();
  const nome = data.nome.trim();
  if (!nome) throw new Error("Informe o nome da equipe.");
  const row = await updateEquipeDoc(id, {
    nome,
    ...(data.supervisorId !== undefined ? { supervisorId: data.supervisorId } : {}),
    ...(data.diretorId !== undefined ? { diretorId: data.diretorId } : {}),
  });
  revalidateEquipes();
  return row;
}

export async function deleteEquipe(id: string): Promise<void> {
  await requireGerenteOrAdmin();
  await deleteEquipeDoc(id);
  revalidateEquipes();
}
