"use server";

import { revalidatePath } from "next/cache";
import { requireGerenteOrAdmin, requireServerSessionUser } from "@/lib/auth/server";
import {
  countVendasByPlano,
  createPlano as createPlanoDoc,
  deletePlano as deletePlanoDoc,
  getAdministradora,
  getPlano as getPlanoDoc,
  listPlanos as listPlanosDocs,
  listPlanosMiniByAdministradora as listPlanosMiniByAdministradoraDocs,
  updatePlano as updatePlanoDoc,
} from "@/lib/firestore/repository";
import type { PlanoMini, PlanoRow } from "@/lib/types/domain";

export type PlanoInput = {
  administradoraId: string;
  nome: string;
  tipoBem: string;
  valorCreditoCentavos: number | null;
  percentualComissao: number | null;
  parcelasRecebimento: number | null;
  diasParaEstorno: number | null;
  regrasRepasseJson: string | null;
};

function assertRegrasFinanceiras(data: PlanoInput): void {
  if (data.percentualComissao === null) {
    throw new Error("Informe o percentual de comissão.");
  }
  if (data.percentualComissao <= 0 || data.percentualComissao > 100) {
    throw new Error("Percentual de comissão deve estar entre 0 e 100.");
  }
  if (data.parcelasRecebimento === null) {
    throw new Error("Informe o número de parcelas de recebimento.");
  }
  if (data.parcelasRecebimento < 1 || data.parcelasRecebimento > 24) {
    throw new Error("Parcelas de recebimento deve ser entre 1 e 24.");
  }
  if (data.diasParaEstorno === null) {
    throw new Error("Informe os dias para estorno.");
  }
  if (data.diasParaEstorno < 1) {
    throw new Error("Dias para estorno deve ser maior que zero.");
  }
}

function revalidatePlanos() {
  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/planos");
  revalidatePath("/vendas");
  revalidatePath("/comissoes");
}

async function assertAdministradoraExists(administradoraId: string): Promise<void> {
  const adm = await getAdministradora(administradoraId);
  if (!adm) throw new Error("Administradora não encontrada.");
}

export async function listPlanos(): Promise<PlanoRow[]> {
  await requireServerSessionUser();
  return listPlanosDocs();
}

export async function listPlanosMiniByAdministradora(
  administradoraId: string,
): Promise<PlanoMini[]> {
  return listPlanosMiniByAdministradoraDocs(administradoraId);
}

export async function getPlano(id: string): Promise<PlanoRow | null> {
  return getPlanoDoc(id);
}

export async function createPlano(data: PlanoInput): Promise<PlanoRow> {
  await requireGerenteOrAdmin();
  const nome = data.nome.trim();
  const tipoBem = data.tipoBem.trim();
  if (!nome) throw new Error("Informe o nome do plano.");
  if (!tipoBem) throw new Error("Informe o tipo de bem.");
  await assertAdministradoraExists(data.administradoraId);
  assertRegrasFinanceiras(data);

  const row = await createPlanoDoc({
    ...data,
    nome,
    tipoBem,
    regrasRepasseJson: data.regrasRepasseJson ?? null,
  });
  revalidatePlanos();
  return row;
}

export async function updatePlano(id: string, patch: Partial<PlanoInput>): Promise<PlanoRow> {
  await requireGerenteOrAdmin();
  const current = await getPlanoDoc(id);
  if (!current) throw new Error("Plano não encontrado.");

  const data: Partial<PlanoInput> = { ...patch };
  if (patch.nome !== undefined) {
    const nome = patch.nome.trim();
    if (!nome) throw new Error("Informe o nome do plano.");
    data.nome = nome;
  }
  if (patch.tipoBem !== undefined) {
    const tipoBem = patch.tipoBem.trim();
    if (!tipoBem) throw new Error("Informe o tipo de bem.");
    data.tipoBem = tipoBem;
  }
  if (patch.administradoraId) {
    await assertAdministradoraExists(patch.administradoraId);
  }

  const merged: PlanoInput = {
    administradoraId: data.administradoraId ?? current.administradoraId,
    nome: data.nome ?? current.nome,
    tipoBem: data.tipoBem ?? current.tipoBem,
    valorCreditoCentavos:
      data.valorCreditoCentavos !== undefined
        ? data.valorCreditoCentavos
        : current.valorCreditoCentavos,
    percentualComissao:
      data.percentualComissao !== undefined
        ? data.percentualComissao
        : current.percentualComissao,
    parcelasRecebimento:
      data.parcelasRecebimento !== undefined
        ? data.parcelasRecebimento
        : current.parcelasRecebimento,
    diasParaEstorno:
      data.diasParaEstorno !== undefined ? data.diasParaEstorno : current.diasParaEstorno,
    regrasRepasseJson:
      data.regrasRepasseJson !== undefined
        ? data.regrasRepasseJson
        : current.regrasRepasseJson,
  };
  assertRegrasFinanceiras(merged);

  const row = await updatePlanoDoc(id, data);
  revalidatePlanos();
  return row;
}

export async function deletePlano(id: string): Promise<void> {
  await requireGerenteOrAdmin();
  const vendas = await countVendasByPlano(id);
  if (vendas > 0) throw new Error("Existem vendas vinculadas a este plano.");

  await deletePlanoDoc(id);
  revalidatePlanos();
}
