import type { PropsWithChildren } from "react";
import { AnyModuleGuard } from "@/lib/auth/module-guard";
import { CONTROLE_MODULES } from "@/lib/auth/modules";
import { ControleHubTabs } from "./ui/ControleHubTabs";

export default function ControleLayout({ children }: PropsWithChildren) {
  return (
    <AnyModuleGuard modules={CONTROLE_MODULES}>
      <ControleHubTabs />
      {children}
    </AnyModuleGuard>
  );
}
