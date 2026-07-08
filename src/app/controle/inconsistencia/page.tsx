import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { listEquipesMini } from "@/actions/equipes";
import { listVendasPaginated } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import ControleCotasClient from "../ui/ControleCotasClient";

async function InconsistenciaData() {
  const [page, administradoras, equipes] = await Promise.all([
    listVendasPaginated({ statusInconsistencia: "INCONSISTENTE" }),
    listAdministradoras(),
    listEquipesMini(),
  ]);

  return (
    <ControleCotasClient
      modo="inconsistencia"
      initialPage={page}
      filterOptions={{
        administradoras: administradoras.map((item) => ({
          id: item.id,
          nome: item.nome,
          cnpj: item.cnpj,
        })),
        equipes,
      }}
    />
  );
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
      <Suspense fallback={<PageLoading rows={8} columns={6} withHeader={false} />}>
        <InconsistenciaData />
      </Suspense>
    </>
  );
}
