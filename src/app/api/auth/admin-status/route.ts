import { NextResponse } from "next/server";
import { getAdminConfigStatus } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnóstico de credenciais Admin — não expõe segredos. */
export async function GET() {
  const status = getAdminConfigStatus();

  if (!status.ready) {
    return NextResponse.json(status, { status: 503 });
  }

  return NextResponse.json(status);
}
