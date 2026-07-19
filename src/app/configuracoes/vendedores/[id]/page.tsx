import Link from "next/link";
import { listEquipesMini } from "@/actions/equipes";
import { getVendedor } from "@/actions/vendedores";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import VendedorForm from "../ui/VendedorForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarVendedorPage({ params }: PageProps) {
  const { id } = await params;
  const [item, equipes] = await Promise.all([getVendedor(id), listEquipesMini()]);

  if (!item) {
    return (
      <PageFlowHeader
        crumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Vendedores", href: "/configuracoes/vendedores" },
          { label: "Erro" },
        ]}
        title="Vendedor não encontrado"
        actions={
          <Link href="/configuracoes/vendedores" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />
    );
  }

  return <VendedorForm mode="edit" item={item} equipes={equipes} />;
}
