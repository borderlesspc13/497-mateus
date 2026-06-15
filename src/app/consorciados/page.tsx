import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import ConsorciadosClient from "./ui/ConsorciadosClient";

export default function ConsorciadosPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados" },
        ]}
        title="Consorciados"
        description="Central de consulta de consorciados — pesquise por nome, documento, contrato, grupo ou cota e acesse a ficha completa."
      />

      <ConsorciadosClient />
    </>
  );
}
