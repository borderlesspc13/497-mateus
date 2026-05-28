import { listUsuariosAdmin } from "@/actions/usuarios";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { getServerSessionUser } from "@/lib/auth/server";
import UsuariosClient from "./ui/UsuariosClient";

export default async function UsuariosPage() {
  const [items, session] = await Promise.all([listUsuariosAdmin(), getServerSessionUser()]);

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Usuários" },
        ]}
        title="Usuários do sistema"
        description="Crie contas de acesso e defina perfis (admin, gerente, vendedor)."
      />
      <UsuariosClient initialItems={items} currentUserId={session?.uid ?? ""} />
    </>
  );
}
