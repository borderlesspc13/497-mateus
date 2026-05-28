"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireComissoesManager } from "@/lib/auth/server";
import {
  listExtratosComissao,
  syncExtratosComissao,
  updateExtratoStatus,
} from "@/lib/firestore/repository";
import type { ExtratoRow, ExtratoStatus } from "@/lib/types/domain";

function revalidateComissoes() {
  revalidatePath("/comissoes");
  revalidatePath("/");
}

export async function listExtratos(): Promise<ExtratoRow[]> {
  await requireComissoesManager();
  return listExtratosComissao();
}

export async function sincronizarExtratos(): Promise<{ gerados: number }> {
  await requireComissoesManager();
  const gerados = await syncExtratosComissao();
  revalidateComissoes();
  return { gerados };
}

export async function liberarExtrato(id: string): Promise<void> {
  await requireComissoesManager();
  await updateExtratoStatus(id, "LIBERADO");
  revalidateComissoes();
}

export async function marcarExtratoPago(id: string): Promise<void> {
  const user = await requireComissoesManager();
  await updateExtratoStatus(id, "PAGO");
  await writeAuditLog({
    userId: user.uid,
    acao: "comissao.paga",
    documentoId: id,
  });
  revalidateComissoes();
}

export type { ExtratoStatus };
