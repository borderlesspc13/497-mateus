import type { PropsWithChildren } from "react";
import { ModuleGuard } from "@/lib/auth/module-guard";

export default function ConsorciadosLayout({ children }: PropsWithChildren) {
  return <ModuleGuard module="consorciados">{children}</ModuleGuard>;
}
