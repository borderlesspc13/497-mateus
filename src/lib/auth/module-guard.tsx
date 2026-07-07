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
