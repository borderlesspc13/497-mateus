"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import {
  createUsuarioWithAuth,
  listUsuarios,
  updateUsuarioRole,
} from "@/lib/firestore/usuarios";
import type { UsuarioRow } from "@/lib/types/domain";

function revalidateUsuarios() {
  revalidatePath("/configuracoes/usuarios");
  revalidatePath("/configuracoes");
}

export type CreateUsuarioInput = {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
};

export async function listUsuariosAdmin(): Promise<UsuarioRow[]> {
  await requireAdmin();
  return listUsuarios();
}

export async function createUsuario(data: CreateUsuarioInput): Promise<UsuarioRow> {
  await requireAdmin();

  if (!isUserRole(data.role)) {
    throw new Error("Perfil inválido.");
  }

  const row = await createUsuarioWithAuth({
    email: data.email,
    password: data.password,
    displayName: data.nome,
    role: data.role,
  });

  revalidateUsuarios();
  return row;
}

export async function changeUsuarioRole(uid: string, role: UserRole): Promise<UsuarioRow> {
  const actor = await requireAdmin();

  if (!isUserRole(role)) {
    throw new Error("Perfil inválido.");
  }

  const row = await updateUsuarioRole(uid, role, actor.uid);
  revalidateUsuarios();
  return row;
}
