import Link from "next/link";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import NovaEquipeForm from "../ui/NovaEquipeForm";

export default function NovaEquipePage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Equipes", href: "/configuracoes/equipes" },
          { label: "Nova equipe" },
        ]}
        title="Nova equipe"
        description="Informe o nome da equipe comercial."
        actions={
          <Link href="/configuracoes/equipes" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />
      <NovaEquipeForm />
    </>
  );
}
