import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { listVendas } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import VendasClient from "./ui/VendasClient";

async function VendasData() {
  const [items, administradoras] = await Promise.all([listVendas(), listAdministradoras()]);

  return (
    <VendasClient
      initialItems={items}
      initialAdministradoras={administradoras.map((a) => ({
        id: a.id,
        nome: a.nome,
        cnpj: a.cnpj,
      }))}
    />
  );
}

export default function VendasPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vendas" },
        ]}
        title="Vendas"
        description="Cadastre e acompanhe vendas por administradora e plano. Use os filtros para localizar registros."
      />

      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <VendasData />
      </Suspense>
    </>
  );
}
