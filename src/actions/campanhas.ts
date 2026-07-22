"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireGerenteOrAdmin, requireServerSessionUser } from "@/lib/auth/server";
import {
  createCampanha as createCampanhaDoc,
  deleteCampanha as deleteCampanhaDoc,
  getCampanha as getCampanhaDoc,
  listCampanhas as listCampanhasDocs,
  listCampanhasAtivasDashboard,
  updateCampanha as updateCampanhaDoc,
  type CampanhaInput,
} from "@/lib/firestore/campanhas-repository";
import type { CampanhaRow } from "@/lib/types/domain";

const campanhaSchema = z.object({
  titulo: z.string().trim().min(2, "Informe o título da campanha."),
  descricao: z.string().trim().min(2, "Informe a descrição."),
  dataInicio: z.string().trim().min(1, "Informe a data de início."),
  dataFim: z.string().trim().nullable(),
  ativa: z.boolean(),
  destaque: z.boolean(),
});

function revalidateCampanhas() {
  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/configuracoes/campanhas");
}

export async function listCampanhas(): Promise<CampanhaRow[]> {
  await requireServerSessionUser();
  return listCampanhasDocs();
}

export async function listCampanhasAtivas(): Promise<CampanhaRow[]> {
  await requireServerSessionUser();
  return listCampanhasAtivasDashboard();
}

export async function getCampanha(id: string): Promise<CampanhaRow | null> {
  await requireServerSessionUser();
  return getCampanhaDoc(id);
}

export async function createCampanha(input: CampanhaInput): Promise<CampanhaRow> {
  await requireGerenteOrAdmin();
  const parsed = campanhaSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const row = await createCampanhaDoc({
    ...parsed.data,
    dataFim: parsed.data.dataFim?.trim() ? parsed.data.dataFim : null,
  });
  revalidateCampanhas();
  return row;
}

export async function updateCampanha(
  id: string,
  input: Partial<CampanhaInput>,
): Promise<CampanhaRow> {
  await requireGerenteOrAdmin();
  const parsed = campanhaSchema.partial().safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const data = { ...parsed.data };
  if (data.dataFim !== undefined) {
    data.dataFim = data.dataFim?.trim() ? data.dataFim : null;
  }
  const row = await updateCampanhaDoc(id, data);
  revalidateCampanhas();
  return row;
}

export async function deleteCampanha(id: string): Promise<void> {
  await requireGerenteOrAdmin();
  await deleteCampanhaDoc(id);
  revalidateCampanhas();
}
