import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { listPlanos } from "@/actions/planos";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import PlanosClient from "./ui/PlanosClient";

async function PlanosData() {
  const [items, administradoras] = await Promise.all([listPlanos(), listAdministradoras()]);

  return (
    <PlanosClient
      initialItems={items}
      initialAdministradoras={administradoras.map((a) => ({
        id: a.id,
        nome: a.nome,
        cnpj: a.cnpj,
      }))}
    />
  );
}

export default function PlanosPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Planos" },
        ]}
        title="Planos"
        description="Cadastre planos por administradora com crédito, percentual de comissão, parcelas de recebimento e prazo de estorno."
      />

      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <PlanosData />
      </Suspense>
    </>
  );
}
