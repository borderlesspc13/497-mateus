import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function ComissoesLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="comissoes">{children}</ModuleGuard>;
}
