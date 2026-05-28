import Link from "next/link";
import { listEquipesMini } from "@/actions/equipes";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import NovaVendedorForm from "../ui/NovaVendedorForm";

export default async function NovaVendedorPage() {
  const equipes = await listEquipesMini();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Vendedores", href: "/configuracoes/vendedores" },
          { label: "Novo vendedor" },
        ]}
        title="Novo vendedor"
        description="Informe os dados e selecione a equipe do vendedor."
        actions={
          <Link href="/configuracoes/vendedores" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />
      <NovaVendedorForm equipes={equipes} />
    </>
  );
}
