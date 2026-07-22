import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampanha } from "@/actions/campanhas";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import CampanhaForm from "../ui/CampanhaForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCampanhaPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getCampanha(id);
  if (!item) notFound();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Campanhas", href: "/configuracoes/campanhas" },
          { label: "Editar" },
        ]}
        title="Editar campanha"
        description={item.titulo}
        actions={
          <Link href="/configuracoes/campanhas" className={backLinkClass()}>
            Voltar
          </Link>
        }
      />
      <CampanhaForm mode="edit" item={item} />
    </>
  );
}
