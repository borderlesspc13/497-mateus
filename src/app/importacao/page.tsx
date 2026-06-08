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
        description="Atualize o status de inadimplência e cancelamento das vendas em lote a partir de planilhas das administradoras."
      />
      <Suspense fallback={<PageLoading rows={6} columns={4} withHeader={false} />}>
        <ImportacaoClient />
      </Suspense>
    </>
  );
}
