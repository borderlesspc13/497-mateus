import { redirect } from "next/navigation";
import { listExtratos } from "@/actions/comissoes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { canViewComissoes } from "@/lib/auth/roles";
import { getServerSessionUser } from "@/lib/auth/server";
import ComissoesClient from "./ui/ComissoesClient";

export default async function ComissoesPage() {
  const session = await getServerSessionUser();
  if (!session || !canViewComissoes(session.role)) {
    redirect("/");
  }

  const items = await listExtratos();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Comissões" },
        ]}
        title="Extratos de comissão"
        description="Parcelas geradas automaticamente a partir de vendas ativas e regras dos planos. Aprove liberações e registre pagamentos."
      />

      <ComissoesClient initialItems={items} />
    </>
  );
}
