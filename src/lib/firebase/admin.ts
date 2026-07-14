import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type ServiceAccountPayload = ServiceAccount & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export type AdminCredentialSource = "file" | "env_json" | "base64" | "separate_env";

export type AdminConfigStatus = {
  ready: boolean;
  source: AdminCredentialSource | null;
  projectId: string | null;
  publicProjectId: string | null;
  projectMatch: boolean;
  clientEmail: string | null;
  error: string | null;
  hints: string[];
};

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n").trim();
}

function normalizeServiceAccount(raw: ServiceAccountPayload): ServiceAccount | null {
  const projectId = raw.projectId ?? raw.project_id;
  const clientEmail = raw.clientEmail ?? raw.client_email;
  const privateKeyRaw = raw.privateKey ?? raw.private_key;

  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  const privateKey = normalizePrivateKey(privateKeyRaw);
  if (!privateKey.includes("BEGIN PRIVATE KEY")) return null;

  return { projectId, clientEmail, privateKey };
}

function loadServiceAccountFromFile(): ServiceAccount | null {
  if (process.env.NETLIFY || process.env.VERCEL) return null;

  const relativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!relativePath) return null;

  try {
    const absolutePath = resolve(/*turbopackIgnore: true*/ process.cwd(), relativePath);
    const raw = readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    return normalizeServiceAccount(parsed);
  } catch {
    return null;
  }
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    return normalizeServiceAccount(parsed);
  } catch {
    return null;
  }
}

function parseServiceAccountFromBase64Env(): ServiceAccount | null {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.replace(/\s/g, "");
  if (!encoded) return null;
  try {
    const raw = Buffer.from(encoded, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    return normalizeServiceAccount(parsed);
  } catch {
    return null;
  }
}

function loadServiceAccountFromSeparateEnv(): ServiceAccount | null {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() ?? "";
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim() ?? "";

  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  return normalizeServiceAccount({
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKeyRaw,
  });
}

function resolveServiceAccount(): { account: ServiceAccount; source: AdminCredentialSource } | null {
  const fromFile = loadServiceAccountFromFile();
  if (fromFile) return { account: fromFile, source: "file" };

  const fromEnvJson = parseServiceAccountFromEnv();
  if (fromEnvJson) return { account: fromEnvJson, source: "env_json" };

  const fromBase64 = parseServiceAccountFromBase64Env();
  if (fromBase64) return { account: fromBase64, source: "base64" };

  const fromSeparateEnv = loadServiceAccountFromSeparateEnv();
  if (fromSeparateEnv) return { account: fromSeparateEnv, source: "separate_env" };

  return null;
}

function buildAdminConfigError(): string {
  const isServerless = Boolean(process.env.NETLIFY || process.env.VERCEL);
  const hints: string[] = [];

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && isServerless) {
    hints.push("Remova FIREBASE_SERVICE_ACCOUNT_PATH do Netlify (o arquivo JSON não existe no servidor).");
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    hints.push("FIREBASE_SERVICE_ACCOUNT_BASE64 está definida, mas não pôde ser decodificada. Gere o base64 novamente.");
  }
  if (process.env.FIREBASE_PRIVATE_KEY) {
    hints.push("Verifique FIREBASE_PRIVATE_KEY: use \\n nas quebras de linha ou cole a chave com aspas.");
  }

  return [
    "Firebase Admin não configurado no servidor.",
    isServerless
      ? "No Netlify, configure FIREBASE_SERVICE_ACCOUNT_BASE64 (recomendado) ou FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
      : "Localmente use FIREBASE_SERVICE_ACCOUNT_PATH ou FIREBASE_SERVICE_ACCOUNT no .env.",
    ...hints,
  ].join(" ");
}

export function getAdminConfigStatus(): AdminConfigStatus {
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || null;
  const resolved = resolveServiceAccount();

  if (!resolved) {
    return {
      ready: false,
      source: null,
      projectId: null,
      publicProjectId,
      projectMatch: false,
      clientEmail: null,
      error: buildAdminConfigError(),
      hints: [],
    };
  }

  const { account, source } = resolved;
  const projectMatch = publicProjectId ? account.projectId === publicProjectId : true;
  const hints: string[] = [];

  if (!projectMatch) {
    hints.push(
      `O projeto do Admin (${account.projectId}) difere do cliente (${publicProjectId}). Alinhe as variáveis NEXT_PUBLIC_FIREBASE_* com a service account.`,
    );
  }

  return {
    ready: true,
    source,
    projectId: account.projectId ?? null,
    publicProjectId,
    projectMatch,
    clientEmail: account.clientEmail ?? null,
    error: null,
    hints,
  };
}

function getServiceAccount(): ServiceAccount {
  const resolved = resolveServiceAccount();
  if (!resolved) {
    throw new Error(buildAdminConfigError());
  }
  return resolved.account;
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return String((error as { code: string }).code);
}

export function mapFirebaseAdminAuthError(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);

  switch (code) {
    case "auth/invalid-id-token":
    case "auth/argument-error":
      return "Token de autenticação inválido. Verifique se o Firebase Admin usa o mesmo projeto do app (NEXT_PUBLIC_FIREBASE_PROJECT_ID).";
    case "auth/id-token-expired":
      return "Token expirado. Tente fazer login novamente.";
    case "auth/insufficient-permission":
      return "A service account não tem permissão para validar tokens. Verifique as credenciais no Firebase Console.";
    default:
      break;
  }

  if (error instanceof Error) {
    if (error.message.includes("Firebase Admin não configurado")) {
      return error.message;
    }
    if (error.message.includes("DECODER routines") || error.message.includes("PEM")) {
      return "Chave privada inválida em FIREBASE_PRIVATE_KEY. Use \\n nas quebras de linha ou FIREBASE_SERVICE_ACCOUNT_BASE64.";
    }
    if (error.message.includes("aud") || error.message.includes("audience")) {
      return "O token foi emitido para outro projeto Firebase. Alinhe as variáveis NEXT_PUBLIC_FIREBASE_* com a service account.";
    }
    return error.message;
  }

  return "Não foi possível criar a sessão no servidor.";
}
