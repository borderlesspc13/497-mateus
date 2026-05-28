"use server";

import { revalidatePath } from "next/cache";
import {
  createVenda as createVendaDoc,
  deleteVenda as deleteVendaDoc,
  getAdministradora,
  getConsorciado,
  getEquipe,
  getPlano,
  getVenda as getVendaDoc,
  getVendedor,
  listVendas as listVendasDocs,
  updateVenda as updateVendaDoc,
} from "@/lib/firestore/repository";
import type { StatusInconsistencia, VendaRow, VendaStatus } from "@/lib/types/domain";

export type VendaInput = {
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string;
  equipeId: string;
  vendedorId: string;
  status: VendaStatus;
  contrato: string;
  grupo: string;
  cota: string;
  dataVencimento: number;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: Date | null;
  observacoes: string | null;
  statusInconsistencia?: StatusInconsistencia;
};

function assertVendaMatrizFields(data: {
  contrato: string;
  grupo: string;
  cota: string;
  dataVencimento: number;
}): void {
  if (!data.contrato.trim()) throw new Error("Informe o contrato.");
  if (!data.grupo.trim()) throw new Error("Informe o grupo.");
  if (!data.cota.trim()) throw new Error("Informe a cota.");
  if (!Number.isInteger(data.dataVencimento) || data.dataVencimento < 1 || data.dataVencimento > 31) {
    throw new Error("Informe o dia de vencimento entre 1 e 31.");
  }
}

function revalidateVendas() {
  revalidatePath("/");
  revalidatePath("/vendas");
  revalidatePath("/controle/inadimplencia");
  revalidatePath("/controle/inconsistencia");
}

async function assertAdministradoraExists(administradoraId: string): Promise<void> {
  const adm = await getAdministradora(administradoraId);
  if (!adm) throw new Error("Administradora não encontrada.");
}

async function assertPlanoBelongs(
  planoId: string | null,
  administradoraId: string,
): Promise<void> {
  if (!planoId) return;
  const plano = await getPlano(planoId);
  if (!plano) throw new Error("Plano não encontrado.");
  if (plano.administradoraId !== administradoraId) {
    throw new Error("O plano não pertence à administradora selecionada.");
  }
}

async function assertConsorciadoExists(consorciadoId: string): Promise<void> {
  const consorciado = await getConsorciado(consorciadoId);
  if (!consorciado) throw new Error("Consorciado não encontrado.");
}

async function assertEquipeAndVendedor(equipeId: string, vendedorId: string): Promise<void> {
  if (!equipeId.trim()) throw new Error("Selecione uma equipe.");
  if (!vendedorId.trim()) throw new Error("Selecione um vendedor.");
  const equipe = await getEquipe(equipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
  const vendedor = await getVendedor(vendedorId);
  if (!vendedor) throw new Error("Vendedor não encontrado.");
  if (vendedor.equipeId !== equipeId) {
    throw new Error("O vendedor não pertence à equipe selecionada.");
  }
}

export async function listVendas(): Promise<VendaRow[]> {
  return listVendasDocs();
}

export async function getVenda(id: string): Promise<VendaRow | null> {
  return getVendaDoc(id);
}

export async function createVenda(data: VendaInput): Promise<VendaRow> {
  const titulo = data.titulo.trim();
  if (!titulo) throw new Error("Informe o título da venda.");
  if (!data.consorciadoId.trim()) throw new Error("Selecione um consorciado.");
  assertVendaMatrizFields(data);

  await assertAdministradoraExists(data.administradoraId);
  await assertPlanoBelongs(data.planoId, data.administradoraId);
  await assertConsorciadoExists(data.consorciadoId);
  await assertEquipeAndVendedor(data.equipeId, data.vendedorId);

  const row = await createVendaDoc({
    administradoraId: data.administradoraId,
    planoId: data.planoId,
    consorciadoId: data.consorciadoId,
    equipeId: data.equipeId,
    vendedorId: data.vendedorId,
    status: data.status,
    contrato: data.contrato.trim(),
    grupo: data.grupo.trim(),
    cota: data.cota.trim(),
    dataVencimento: data.dataVencimento,
    titulo,
    descricao: data.descricao,
    valorCentavos: data.valorCentavos,
    dataVenda: data.dataVenda ? data.dataVenda.toISOString() : null,
    observacoes: data.observacoes,
    statusInconsistencia: data.statusInconsistencia ?? "CONSISTENTE",
  });

  revalidateVendas();
  return row;
}

export async function updateVendaStatusInconsistencia(
  id: string,
  statusInconsistencia: StatusInconsistencia,
): Promise<VendaRow> {
  return updateVenda(id, { statusInconsistencia });
}

export async function updateVenda(id: string, patch: Partial<VendaInput>): Promise<VendaRow> {
  const current = await getVendaDoc(id);
  if (!current) throw new Error("Venda não encontrada.");

  const nextAdm = patch.administradoraId ?? current.administradoraId;
  const nextPlano = patch.planoId !== undefined ? patch.planoId : current.planoId;
  const nextConsorciado =
    patch.consorciadoId !== undefined ? patch.consorciadoId : current.consorciadoId ?? "";

  if (patch.administradoraId) {
    await assertAdministradoraExists(patch.administradoraId);
  }
  await assertPlanoBelongs(nextPlano, nextAdm);
  if (patch.consorciadoId !== undefined) {
    if (!patch.consorciadoId.trim()) throw new Error("Selecione um consorciado.");
    await assertConsorciadoExists(patch.consorciadoId);
  } else if (!nextConsorciado.trim()) {
    throw new Error("Selecione um consorciado.");
  }

  const nextEquipe = patch.equipeId ?? current.equipeId;
  const nextVendedor = patch.vendedorId ?? current.vendedorId;
  if (patch.equipeId !== undefined || patch.vendedorId !== undefined) {
    await assertEquipeAndVendedor(nextEquipe, nextVendedor);
  } else if (!nextEquipe.trim() || !nextVendedor.trim()) {
    throw new Error("Selecione equipe e vendedor responsáveis.");
  }

  const data: Partial<VendaInput> = { ...patch };
  if (patch.titulo !== undefined) {
    const titulo = patch.titulo.trim();
    if (!titulo) throw new Error("Informe o título da venda.");
    data.titulo = titulo;
  }

  if (
    patch.contrato !== undefined ||
    patch.grupo !== undefined ||
    patch.cota !== undefined ||
    patch.dataVencimento !== undefined
  ) {
    assertVendaMatrizFields({
      contrato: patch.contrato ?? current.contrato,
      grupo: patch.grupo ?? current.grupo,
      cota: patch.cota ?? current.cota,
      dataVencimento: patch.dataVencimento ?? current.dataVencimento,
    });
  }

  const row = await updateVendaDoc(id, {
    administradoraId: data.administradoraId,
    planoId: data.planoId,
    consorciadoId: data.consorciadoId,
    equipeId: data.equipeId,
    vendedorId: data.vendedorId,
    status: data.status,
    contrato: patch.contrato?.trim(),
    grupo: patch.grupo?.trim(),
    cota: patch.cota?.trim(),
    dataVencimento: patch.dataVencimento,
    titulo: data.titulo,
    descricao: data.descricao,
    valorCentavos: data.valorCentavos,
    dataVenda:
      data.dataVenda !== undefined
        ? data.dataVenda
          ? data.dataVenda.toISOString()
          : null
        : undefined,
    observacoes: data.observacoes,
    statusInconsistencia: data.statusInconsistencia,
  });

  revalidateVendas();
  return row;
}

export async function deleteVenda(id: string): Promise<void> {
  await deleteVendaDoc(id);
  revalidateVendas();
}
