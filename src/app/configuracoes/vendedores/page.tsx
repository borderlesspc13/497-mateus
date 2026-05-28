import { listVendedores } from "@/actions/vendedores";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import VendedoresClient from "./ui/VendedoresClient";

export default async function VendedoresPage() {
  const items = await listVendedores();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Vendedores" },
        ]}
        title="Vendedores"
        description="Cadastre vendedores e vincule cada um a uma equipe."
      />
      <VendedoresClient initialItems={items} />
    </>
  );
}
