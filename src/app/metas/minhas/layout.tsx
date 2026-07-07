import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function MinhasMetasLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="metas-minhas">{children}</ModuleGuard>;
}
