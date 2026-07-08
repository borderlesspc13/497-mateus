import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { listEquipesMini } from "@/actions/equipes";
import { listVendasPosVendaControle } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import ControleCotasClient from "../ui/ControleCotasClient";

async function PosVendaData() {
  const [items, administradoras, equipes] = await Promise.all([
    listVendasPosVendaControle(),
    listAdministradoras(),
    listEquipesMini(),
  ]);

  return (
    <ControleCotasClient
      modo="pos-venda"
      initialItems={items}
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

export default function ControlePosVendaPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Pós-venda" },
        ]}
        title="Controle de pós-venda"
        description="Boas-vindas e ativação de vendas recentes ou com pós-venda pendente. Clique em uma linha para abrir a timeline de atendimento."
      />
      <Suspense fallback={<PageLoading rows={8} columns={6} withHeader={false} />}>
        <PosVendaData />
      </Suspense>
    </>
  );
}
