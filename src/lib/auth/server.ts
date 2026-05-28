import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { canManageComissoes, canManageUsuarios, type UserRole } from "@/lib/auth/roles";
import { COLLECTIONS, type UsuarioDoc } from "@/lib/firestore/types";

export type SessionUser = {
  uid: string;
  email: string | null;
  role: UserRole;
};

async function getUsuarioRole(uid: string): Promise<UserRole | null> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.usuarios).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as UsuarioDoc;
  return data.role;
}

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const role = await getUsuarioRole(decoded.uid);
    if (!role) return null;

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role,
    };
  } catch {
    return null;
  }
}

export async function requireServerSessionUser(): Promise<SessionUser> {
  const user = await getServerSessionUser();
  if (!user) {
    throw new Error("Sessão inválida ou expirada. Faça login novamente.");
  }
  return user;
}

export async function requireComissoesManager(): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  if (!canManageComissoes(user.role)) {
    throw new Error("Sem permissão para gerenciar comissões.");
  }
  return user;
}

export async function requireGerenteOrAdmin(): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  if (user.role !== "admin" && user.role !== "gerente") {
    throw new Error("Sem permissão para esta operação.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  if (!canManageUsuarios(user.role)) {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
  return user;
}
