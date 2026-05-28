import Link from "next/link";
import { listConsorciadosMini } from "@/actions/consorciados";
import { listAdministradoras } from "@/actions/administradoras";
import { listEquipesMini } from "@/actions/equipes";
import { listVendedoresMini } from "@/actions/vendedores";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import NovaVendaForm from "../ui/NovaVendaForm";

export default async function NovaVendaPage() {
  const [administradoras, consorciados, equipes, vendedores] = await Promise.all([
    listAdministradoras(),
    listConsorciadosMini(),
    listEquipesMini(),
    listVendedoresMini(),
  ]);

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vendas", href: "/vendas" },
          { label: "Nova venda" },
        ]}
        title="Nova venda"
        description="Cadastre uma venda vinculada a um consorciado, administradora e, opcionalmente, a um plano."
        actions={
          <Link href="/vendas" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <NovaVendaForm
        administradoras={administradoras.map((a) => ({
          id: a.id,
          nome: a.nome,
          cnpj: a.cnpj,
        }))}
        consorciados={consorciados}
        equipes={equipes}
        vendedores={vendedores}
      />
    </>
  );
}
