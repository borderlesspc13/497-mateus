import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function InadimplenciaLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="inadimplencia">{children}</ModuleGuard>;
}
