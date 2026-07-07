import { getAdminAuth } from "@/lib/firebase/admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  isAppModule,
  resolveEffectivePermissions,
  type AppModule,
} from "@/lib/auth/modules";
import { COLLECTIONS, nowIso, type UserRole, type UsuarioDoc } from "@/lib/firestore/types";
import type { UsuarioRow } from "@/lib/types/domain";

function normalizeStoredPermissions(raw: string[] | undefined): AppModule[] | undefined {
  if (!raw?.length) return undefined;
  const modules = raw.filter(isAppModule);
  return modules.length > 0 ? modules : undefined;
}

function toUsuarioRow(id: string, doc: UsuarioDoc): UsuarioRow {
  const explicit = normalizeStoredPermissions(doc.permissions);
  return {
    id,
    email: doc.email,
    displayName: doc.displayName,
    role: doc.role,
    permissions: resolveEffectivePermissions({ role: doc.role, permissions: explicit }),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getUsuario(uid: string): Promise<UsuarioRow | null> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.usuarios).doc(uid).get();
  if (!snap.exists) return null;
  return toUsuarioRow(snap.id, snap.data() as UsuarioDoc);
}

export async function listUsuarios(): Promise<UsuarioRow[]> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.usuarios).get();
  return snap.docs
    .map((doc) => toUsuarioRow(doc.id, doc.data() as UsuarioDoc))
    .sort((a, b) => a.email.localeCompare(b.email, "pt-BR"));
}

export async function countUsuarios(): Promise<number> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.usuarios).count().get();
  return snap.data().count;
}

async function countAdmins(): Promise<number> {
  const snap = await getAdminFirestore()
    .collection(COLLECTIONS.usuarios)
    .where("role", "==", "admin")
    .count()
    .get();
  return snap.data().count;
}

function sanitizePermissions(permissions: AppModule[]): AppModule[] {
  const unique = [...new Set(permissions.filter(isAppModule))];
  if (unique.length === 0) {
    throw new Error("Selecione ao menos um módulo de acesso.");
  }
  return unique;
}

export async function createUsuarioProfile(input: {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  permissions?: AppModule[];
}): Promise<UsuarioRow> {
  const ts = nowIso();
  const explicitPermissions = input.permissions ? sanitizePermissions(input.permissions) : undefined;
  const doc: UsuarioDoc = {
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName?.trim() || null,
    role: input.role,
    ...(explicitPermissions ? { permissions: explicitPermissions } : {}),
    createdAt: ts,
    updatedAt: ts,
  };

  await getAdminFirestore().collection(COLLECTIONS.usuarios).doc(input.uid).set(doc);
  return toUsuarioRow(input.uid, doc);
}

export async function ensureUsuarioProfile(input: {
  uid: string;
  email: string;
  displayName: string | null;
}): Promise<UsuarioRow> {
  const existing = await getUsuario(input.uid);
  if (existing) return existing;

  const total = await countUsuarios();
  const role: UserRole = total === 0 ? "admin" : "vendedor";

  return createUsuarioProfile({
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    role,
  });
}

export async function createUsuarioWithAuth(input: {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  permissions?: AppModule[];
}): Promise<UsuarioRow> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (!email) throw new Error("Informe o e-mail.");
  if (!displayName) throw new Error("Informe o nome.");
  if (input.password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  let authUser;
  try {
    authUser = await getAdminAuth().createUser({
      email,
      password: input.password,
      displayName,
    });
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "auth/email-already-exists") {
      throw new Error("Este e-mail já está cadastrado.");
    }
    if (code === "auth/invalid-email") {
      throw new Error("E-mail inválido.");
    }
    if (code === "auth/weak-password") {
      throw new Error("A senha deve ter pelo menos 6 caracteres.");
    }
    throw new Error("Não foi possível criar o usuário no Firebase Auth.");
  }

  try {
    return await createUsuarioProfile({
      uid: authUser.uid,
      email,
      displayName,
      role: input.role,
      permissions: input.permissions,
    });
  } catch (error) {
    await getAdminAuth().deleteUser(authUser.uid).catch(() => undefined);
    throw error;
  }
}

export async function updateUsuarioRole(
  uid: string,
  role: UserRole,
  actorUid: string,
): Promise<UsuarioRow> {
  const current = await getUsuario(uid);
  if (!current) throw new Error("Usuário não encontrado.");

  if (current.role === role) return current;

  if (current.role === "admin" && role !== "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      throw new Error("Não é possível remover o único administrador do sistema.");
    }
  }

  if (uid === actorUid && role !== "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      throw new Error("Você não pode alterar seu próprio perfil de único administrador.");
    }
  }

  const updatedAt = nowIso();
  await getAdminFirestore().collection(COLLECTIONS.usuarios).doc(uid).update({
    role,
    updatedAt,
  });

  return { ...(await getUsuario(uid))!, updatedAt };
}

export async function updateUsuarioPermissions(
  uid: string,
  permissions: AppModule[],
  actorUid: string,
): Promise<UsuarioRow> {
  const current = await getUsuario(uid);
  if (!current) throw new Error("Usuário não encontrado.");

  const sanitized = sanitizePermissions(permissions);

  if (uid === actorUid && current.role === "admin") {
    const admins = await countAdmins();
    if (admins <= 1 && !sanitized.includes("usuarios")) {
      throw new Error("O único administrador não pode remover o acesso ao módulo de usuários.");
    }
  }

  const updatedAt = nowIso();
  await getAdminFirestore().collection(COLLECTIONS.usuarios).doc(uid).update({
    permissions: sanitized,
    updatedAt,
  });

  return (await getUsuario(uid))!;
}
