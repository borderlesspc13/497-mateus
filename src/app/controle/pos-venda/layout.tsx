import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function PosVendaLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="pos-venda">{children}</ModuleGuard>;
}
