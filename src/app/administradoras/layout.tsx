import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function AdministradorasLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="administradoras">{children}</ModuleGuard>;
}
