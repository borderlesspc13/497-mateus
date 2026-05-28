"use server";

import { revalidatePath } from "next/cache";
import {
  createVendedor as createVendedorDoc,
  deleteVendedor as deleteVendedorDoc,
  getEquipe,
  getVendedor as getVendedorDoc,
  listVendedores as listVendedoresDocs,
  listVendedoresMini as listVendedoresMiniDocs,
  listVendedoresMiniByEquipe as listVendedoresMiniByEquipeDocs,
  updateVendedor as updateVendedorDoc,
} from "@/lib/firestore/repository";
import type { VendedorMini, VendedorRow } from "@/lib/types/domain";

export type VendedorInput = {
  nome: string;
  email: string;
  telefone: string;
  equipeId: string;
};

function revalidateVendedores() {
  revalidatePath("/configuracoes");
  revalidatePath("/configuracoes/vendedores");
  revalidatePath("/vendas");
}

async function assertEquipeExists(equipeId: string): Promise<void> {
  const equipe = await getEquipe(equipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
}

export async function listVendedores(): Promise<VendedorRow[]> {
  return listVendedoresDocs();
}

export async function listVendedoresMini(): Promise<VendedorMini[]> {
  return listVendedoresMiniDocs();
}

export async function listVendedoresMiniByEquipe(equipeId: string): Promise<VendedorMini[]> {
  return listVendedoresMiniByEquipeDocs(equipeId);
}

export async function getVendedor(id: string): Promise<VendedorRow | null> {
  return getVendedorDoc(id);
}

export async function createVendedor(data: VendedorInput): Promise<VendedorRow> {
  const nome = data.nome.trim();
  const email = data.email.trim();
  const telefone = data.telefone.trim();
  if (!nome) throw new Error("Informe o nome do vendedor.");
  if (!email) throw new Error("Informe o e-mail.");
  if (!telefone) throw new Error("Informe o telefone.");
  if (!data.equipeId.trim()) throw new Error("Selecione uma equipe.");
  await assertEquipeExists(data.equipeId);

  const row = await createVendedorDoc({ nome, email, telefone, equipeId: data.equipeId });
  revalidateVendedores();
  return row;
}

export async function updateVendedor(id: string, data: VendedorInput): Promise<VendedorRow> {
  const nome = data.nome.trim();
  const email = data.email.trim();
  const telefone = data.telefone.trim();
  if (!nome) throw new Error("Informe o nome do vendedor.");
  if (!email) throw new Error("Informe o e-mail.");
  if (!telefone) throw new Error("Informe o telefone.");
  if (!data.equipeId.trim()) throw new Error("Selecione uma equipe.");
  await assertEquipeExists(data.equipeId);

  const row = await updateVendedorDoc(id, { nome, email, telefone, equipeId: data.equipeId });
  revalidateVendedores();
  return row;
}

export async function deleteVendedor(id: string): Promise<void> {
  await deleteVendedorDoc(id);
  revalidateVendedores();
}
