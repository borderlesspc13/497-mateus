import { Suspense } from "react";
import { listVendasPaginated } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import ControleCotasClient from "../ui/ControleCotasClient";

async function InconsistenciaData() {
  const page = await listVendasPaginated({ statusInconsistencia: "INCONSISTENTE" });
  return <ControleCotasClient modo="inconsistencia" initialPage={page} />;
}

export default function ControleInconsistenciaPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Inconsistência" },
        ]}
        title="Controle de inconsistência"
        description="Priorize cotas marcadas como inconsistentes. Registre tratativas na timeline e altere o status quando resolvido."
      />
      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <InconsistenciaData />
      </Suspense>
    </>
  );
}
