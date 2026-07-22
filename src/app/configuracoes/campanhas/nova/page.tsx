import Link from "next/link";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import CampanhaForm from "../ui/CampanhaForm";

export default function NovaCampanhaPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Campanhas", href: "/configuracoes/campanhas" },
          { label: "Nova" },
        ]}
        title="Nova campanha"
        description="Defina título, período e se a campanha aparece em destaque no dashboard."
        actions={
          <Link href="/configuracoes/campanhas" className={backLinkClass()}>
            Voltar
          </Link>
        }
      />
      <CampanhaForm mode="create" />
    </>
  );
}
