import { cache } from "react";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  PERMISSIONS_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from "@/lib/auth/constants";
import {
  canAccessModule,
  isAppModule,
  resolveEffectivePermissions,
  serializePermissionsCookie,
  type AppModule,
} from "@/lib/auth/modules";
import { canManageComissoes, canManageUsuarios, type UserRole } from "@/lib/auth/roles";
import { COLLECTIONS, type UsuarioDoc } from "@/lib/firestore/types";

export type SessionUser = {
  uid: string;
  email: string | null;
  role: UserRole;
  permissions: AppModule[];
};

type UsuarioAuthData = {
  role: UserRole;
  permissions: AppModule[];
};

function normalizeStoredPermissions(raw: string[] | undefined): AppModule[] | undefined {
  if (!raw?.length) return undefined;
  const modules = raw.filter(isAppModule);
  return modules.length > 0 ? modules : undefined;
}

async function getUsuarioAuthData(uid: string): Promise<UsuarioAuthData | null> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.usuarios).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as UsuarioDoc;
  const explicit = normalizeStoredPermissions(data.permissions);
  return {
    role: data.role,
    permissions: resolveEffectivePermissions({ role: data.role, permissions: explicit }),
  };
}

export async function writePermissionsCookie(permissions: readonly AppModule[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: PERMISSIONS_COOKIE_NAME,
    value: serializePermissionsCookie(permissions),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
}

export async function clearPermissionsCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: PERMISSIONS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export const getServerSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const authData = await getUsuarioAuthData(decoded.uid);
    if (!authData) return null;

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: authData.role,
      permissions: authData.permissions,
    };
  } catch {
    return null;
  }
});

export async function requireServerSessionUser(): Promise<SessionUser> {
  const user = await getServerSessionUser();
  if (!user) {
    throw new Error("Sessão inválida ou expirada. Faça login novamente.");
  }
  return user;
}

export async function requireModule(module: AppModule): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  if (!canAccessModule(user.permissions, module)) {
    throw new Error("Sem permissão para acessar este módulo.");
  }
  return user;
}

export async function requireComissoesManager(): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  if (!canAccessModule(user.permissions, "comissoes") && !canManageComissoes(user.role)) {
    throw new Error("Sem permissão para gerenciar comissões.");
  }
  return user;
}

export async function requireGerenteOrAdmin(): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  const hasConfigAccess =
    canAccessModule(user.permissions, "configuracoes") ||
    canAccessModule(user.permissions, "importacao") ||
    canAccessModule(user.permissions, "administradoras") ||
    canAccessModule(user.permissions, "planos") ||
    canAccessModule(user.permissions, "metas");
  if (!hasConfigAccess && user.role !== "admin" && user.role !== "gerente") {
    throw new Error("Sem permissão para esta operação.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireServerSessionUser();
  if (!canManageUsuarios(user.role) && !canAccessModule(user.permissions, "usuarios")) {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
  return user;
}
