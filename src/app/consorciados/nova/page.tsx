import Link from "next/link";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import ConsorciadoForm from "../ui/ConsorciadoForm";

export default function NovaConsorciadoPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados", href: "/consorciados" },
          { label: "Novo consorciado" },
        ]}
        title="Novo consorciado"
        description="Cadastre um consorciado com dados de contato e endereço."
        actions={
          <Link href="/consorciados" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <ConsorciadoForm mode="create" />
    </>
  );
}
