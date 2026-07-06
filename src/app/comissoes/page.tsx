import { Suspense } from "react";
import { redirect } from "next/navigation";
import { listExtratos, listRepassesMapaPagamento } from "@/actions/comissoes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import { canViewComissoes } from "@/lib/auth/roles";
import { getServerSessionUser } from "@/lib/auth/server";
import ComissoesClient from "./ui/ComissoesClient";

async function ComissoesData() {
  const [items, initialRepasses] = await Promise.all([
    listExtratos(),
    listRepassesMapaPagamento(),
  ]);
  return <ComissoesClient initialItems={items} initialRepasses={initialRepasses} />;
}

export default async function ComissoesPage() {
  const session = await getServerSessionUser();
  if (!session || !canViewComissoes(session.role)) {
    redirect("/");
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Comissões" },
        ]}
        title="Comissões e repasses"
        description="Extratos da administradora e mapa de pagamento interno (vendedor, supervisor e diretor) gerado ao confirmar recebimento."
      />

      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <ComissoesData />
      </Suspense>
    </>
  );
}
