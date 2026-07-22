import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { listCampanhas } from "@/actions/campanhas";
import CampanhasClient from "./ui/CampanhasClient";

export default async function CampanhasPage() {
  const items = await listCampanhas();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Campanhas" },
        ]}
        title="Campanhas"
        description="Cadastre campanhas comerciais/operacionais que aparecem no dashboard."
      />
      <CampanhasClient initialItems={items} />
    </>
  );
}
