import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function ImportacaoLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="importacao">{children}</ModuleGuard>;
}
