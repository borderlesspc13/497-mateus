import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/auth/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ensureUsuarioProfile } from "@/lib/firestore/usuarios";

export const runtime = "nodejs";

type SessionBody = {
  idToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SessionBody;
    const idToken = body.idToken?.trim();
    if (!idToken) {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    await ensureUsuarioProfile({
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: (decoded.name as string | undefined) ?? null,
    });

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível criar a sessão." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
