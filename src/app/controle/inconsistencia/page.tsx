import { listVendas } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import ControleCotasClient from "../ui/ControleCotasClient";

export default async function ControleInconsistenciaPage() {
  const items = await listVendas();

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
      <ControleCotasClient modo="inconsistencia" initialItems={items} />
    </>
  );
}
