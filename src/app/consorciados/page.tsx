import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { getConsorciadosPageData } from "@/actions/consorciados";
import ConsorciadosClient from "./ui/ConsorciadosClient";

export default async function ConsorciadosPage() {
  const data = await getConsorciadosPageData();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados" },
        ]}
        title="Central de consulta"
        description="Pesquise consorciados por nome, CPF, número do contrato, grupo ou cota e acesse a ficha completa com históricos."
      />

      <ConsorciadosClient initialItems={data.items} initialVendasIndex={data.vendasIndex} />
    </>
  );
}
