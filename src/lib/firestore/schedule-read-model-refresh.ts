import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { refreshDashboardReadModels } from "@/lib/firestore/repository";
import { refreshMetasWidgetReadModels } from "@/lib/firestore/metas-repository";
import { periodoAtual } from "@/lib/periodo";

/**
 * Atualiza snapshots do dashboard/metas em background após a response.
 * Evita bloquear mutações com full-scan síncrono; a home pode ficar 1 request atrasada
 * até o after() concluir e revalidar `/`.
 */
export function scheduleDashboardAndMetasRefresh(periodo = periodoAtual()): void {
  after(async () => {
    await Promise.all([
      refreshDashboardReadModels(),
      refreshMetasWidgetReadModels(periodo),
    ]);
    revalidatePath("/");
  });
}

export function scheduleDashboardRefresh(): void {
  after(async () => {
    await refreshDashboardReadModels();
    revalidatePath("/");
  });
}

export function scheduleMetasWidgetRefresh(periodo = periodoAtual()): void {
  after(async () => {
    await refreshMetasWidgetReadModels(periodo);
    revalidatePath("/");
  });
}
