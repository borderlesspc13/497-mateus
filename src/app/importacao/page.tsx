import { Suspense } from "react";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import ImportacaoClient from "./ui/ImportacaoClient";

export default function ImportacaoPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Importação de remessa" },
        ]}
        title="Importação de remessa / retorno"
        description="Atualize status operacional e comissões recebidas no mesmo Excel. O sistema exige conciliação quando contratos inadimplentes do banco não constam na remessa de status."
      />
      <Suspense fallback={<PageLoading rows={6} columns={4} withHeader={false} />}>
        <ImportacaoClient />
      </Suspense>
    </>
  );
}
