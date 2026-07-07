import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function PlanosLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="planos">{children}</ModuleGuard>;
}
