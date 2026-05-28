import Link from "next/link";
import { listConsorciadosMini } from "@/actions/consorciados";
import { listAdministradoras } from "@/actions/administradoras";
import { listEquipesMini } from "@/actions/equipes";
import { listPlanosMiniByAdministradora } from "@/actions/planos";
import { listVendedoresMini } from "@/actions/vendedores";
import { getVenda } from "@/actions/vendas";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import EditarVendaForm from "../ui/EditarVendaForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarVendaPage({ params }: PageProps) {
  const { id } = await params;
  const venda = await getVenda(id);

  if (!venda) {
    return (
      <>
        <PageFlowHeader
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Vendas", href: "/vendas" },
            { label: "Erro" },
          ]}
          title="Venda não encontrada"
          description="Não foi possível carregar este registro."
          actions={
            <Link href="/vendas" className={backLinkClass()}>
              Voltar à lista
            </Link>
          }
        />
      </>
    );
  }

  const [administradoras, initialPlanos, consorciados, equipes, vendedores] = await Promise.all([
    listAdministradoras(),
    listPlanosMiniByAdministradora(venda.administradoraId),
    listConsorciadosMini(),
    listEquipesMini(),
    listVendedoresMini(),
  ]);

  return (
    <EditarVendaForm
      item={venda}
      administradoras={administradoras.map((a) => ({
        id: a.id,
        nome: a.nome,
        cnpj: a.cnpj,
      }))}
      initialPlanos={initialPlanos}
      consorciados={consorciados}
      equipes={equipes}
      vendedores={vendedores}
    />
  );
}
