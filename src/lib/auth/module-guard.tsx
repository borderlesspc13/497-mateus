import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import {
  canAccessModule,
  findFirstAccessibleRoute,
  type AppModule,
} from "@/lib/auth/modules";
import { getServerSessionUser } from "@/lib/auth/server";

export async function ModuleGuard({
  module,
  children,
}: PropsWithChildren<{ module: AppModule }>) {
  const session = await getServerSessionUser();
  if (!session || !canAccessModule(session.permissions, module)) {
    redirect(findFirstAccessibleRoute(session?.permissions ?? []));
  }
  return children;
}

/** Permite acesso se o usuário tiver ao menos um dos módulos listados. */
export async function AnyModuleGuard({
  modules,
  children,
}: PropsWithChildren<{ modules: readonly AppModule[] }>) {
  const session = await getServerSessionUser();
  const permissions = session?.permissions ?? [];
  const allowed = modules.some((module) => canAccessModule(permissions, module));
  if (!session || !allowed) {
    redirect(findFirstAccessibleRoute(permissions));
  }
  return children;
}
