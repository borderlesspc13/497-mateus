import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function VendasLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="vendas">{children}</ModuleGuard>;
}
