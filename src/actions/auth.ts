"use server";

import { getServerSessionUser } from "@/lib/auth/server";
import { getUsuario } from "@/lib/firestore/usuarios";
import type { UsuarioRow } from "@/lib/types/domain";

export async function getMyProfile(): Promise<UsuarioRow | null> {
  const session = await getServerSessionUser();
  if (!session) return null;
  return getUsuario(session.uid);
}
