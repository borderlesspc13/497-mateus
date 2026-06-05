import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import AdministradorasClient from "./ui/AdministradorasClient";

async function AdministradorasData() {
  const items = await listAdministradoras();
  return <AdministradorasClient initialItems={items} />;
}

export default function AdministradorasPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Administradoras" },
        ]}
        title="Administradoras"
        description="Cadastre administradoras parceiras com dados cadastrais e regras específicas por parceiro."
      />

      <Suspense fallback={<PageLoading rows={8} columns={4} withHeader={false} />}>
        <AdministradorasData />
      </Suspense>
    </>
  );
}
