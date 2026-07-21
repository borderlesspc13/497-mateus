import { Suspense } from "react";
import { listExtratos, listRepassesMapaPagamento } from "@/actions/comissoes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import ComissoesClient from "./ui/ComissoesClient";

async function ComissoesData() {
  const [items, initialRepasses] = await Promise.all([
    listExtratos(),
    listRepassesMapaPagamento(),
  ]);
  return <ComissoesClient initialItems={items} initialRepasses={initialRepasses} />;
}

export default async function ComissoesPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Comissões" },
        ]}
        title="Comissões e repasses"
        description="Extratos da administradora e mapa de pagamento interno (vendedor, supervisor e diretor). Os repasses previstos nascem com a venda e liberam para pagamento ao confirmar o recebimento."
      />

      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <ComissoesData />
      </Suspense>
    </>
  );
}
