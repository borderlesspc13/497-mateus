import Link from "next/link";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { panelClass } from "@/components/ui/list-panel-classes";
import { canManageUsuarios } from "@/lib/auth/roles";
import { getServerSessionUser } from "@/lib/auth/server";

const baseCards = [
  {
    href: "/administradoras",
    title: "Administradoras",
    description: "Parceiros, CNPJ e regras operacionais por administradora.",
  },
  {
    href: "/planos",
    title: "Planos",
    description: "Produtos e tipos de bem vinculados às administradoras.",
  },
  {
    href: "/configuracoes/equipes",
    title: "Equipes",
    description: "Equipes comerciais (ex.: Prospera, Teste).",
  },
  {
    href: "/configuracoes/vendedores",
    title: "Vendedores",
    description: "Vendedores vinculados às equipes para atribuição de cotas.",
  },
];

export default async function ConfiguracoesPage() {
  const session = await getServerSessionUser();
  const cards = [...baseCards];

  if (session && canManageUsuarios(session.role)) {
    cards.push({
      href: "/configuracoes/usuarios",
      title: "Usuários",
      description: "Contas de acesso ao sistema, e-mails, senhas e perfis (RBAC).",
    });
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Configurações" }]}
        title="Configurações"
        description="Cadastros de apoio à operação: parceiros, planos, equipes, vendedores e usuários."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${panelClass()} group block p-6 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400`}
          >
            <h2 className="text-base font-semibold text-zinc-900 group-hover:underline">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{card.description}</p>
            <span className="mt-4 inline-block text-xs font-semibold text-zinc-800">
              Abrir →
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
