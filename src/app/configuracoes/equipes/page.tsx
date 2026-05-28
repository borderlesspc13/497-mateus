import { listEquipes } from "@/actions/equipes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import EquipesClient from "./ui/EquipesClient";

export default async function EquipesPage() {
  const items = await listEquipes();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Equipes" },
        ]}
        title="Equipes"
        description="Cadastre as equipes comerciais da operação."
      />
      <EquipesClient initialItems={items} />
    </>
  );
}
