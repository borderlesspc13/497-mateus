import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function UsuariosLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="usuarios">{children}</ModuleGuard>;
}
