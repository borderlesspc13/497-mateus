import { listVendas } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import ControleCotasClient from "../ui/ControleCotasClient";

export default async function ControleInadimplenciaPage() {
  const items = await listVendas();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Inadimplência" },
        ]}
        title="Controle de inadimplência"
        description="Monitore cotas por status operacional. Clique em uma linha para abrir a timeline de atendimento."
      />
      <ControleCotasClient modo="inadimplencia" initialItems={items} />
    </>
  );
}
