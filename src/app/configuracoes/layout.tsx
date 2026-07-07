import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function ConfiguracoesLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="configuracoes">{children}</ModuleGuard>;
}
