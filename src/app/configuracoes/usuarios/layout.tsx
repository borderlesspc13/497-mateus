import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { canManageUsuarios } from "@/lib/auth/roles";
import { getServerSessionUser } from "@/lib/auth/server";

export default async function UsuariosLayout({ children }: PropsWithChildren) {
  const session = await getServerSessionUser();
  if (!session || !canManageUsuarios(session.role)) {
    redirect("/configuracoes");
  }
  return children;
}
