import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function InconsistenciaLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="inconsistencia">{children}</ModuleGuard>;
}
