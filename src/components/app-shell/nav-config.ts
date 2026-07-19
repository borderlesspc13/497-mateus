import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Settings,
  Target,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import {
  canAccessAnyControle,
  canAccessModule,
  findFirstControleRoute,
  NAV_MODULE_BY_HREF,
  type AppModule,
} from "@/lib/auth/modules";

export type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module: AppModule | "controle";
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

const OPERATION_NAV: NavLinkItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/consorciados", label: "Consorciados", icon: Users, module: "consorciados" },
  { href: "/vendas", label: "Vendas", icon: Wallet, module: "vendas" },
];

const METAS_NAV: NavLinkItem[] = [
  { href: "/metas", label: "Metas", icon: Target, module: "metas" },
  { href: "/metas/minhas", label: "Minhas Metas", icon: Target, module: "metas-minhas" },
];

const FINANCEIRO_NAV: NavLinkItem[] = [
  { href: "/comissoes", label: "Comissões", icon: DollarSign, module: "comissoes" },
];

const DADOS_NAV: NavLinkItem[] = [
  { href: "/importacao", label: "Importação", icon: Upload, module: "importacao" },
];

const BASE_CONFIG_NAV: NavLinkItem[] = [
  { href: "/configuracoes", label: "Visão geral", icon: LayoutDashboard, module: "configuracoes" },
  { href: "/administradoras", label: "Administradoras", icon: Building2, module: "administradoras" },
  { href: "/planos", label: "Planos", icon: Wallet, module: "planos" },
  { href: "/configuracoes/equipes", label: "Equipes", icon: Users, module: "configuracoes" },
  { href: "/configuracoes/vendedores", label: "Vendedores", icon: Users, module: "configuracoes" },
];

function filterNavByPermissions(
  items: NavLinkItem[],
  permissions: readonly AppModule[],
): NavLinkItem[] {
  return items.filter((item) => {
    if (item.module === "controle") {
      return canAccessAnyControle(permissions);
    }
    return canAccessModule(permissions, item.module);
  });
}

function resolveMetasNav(permissions: readonly AppModule[]): NavLinkItem[] {
  const hasGestao = canAccessModule(permissions, "metas");
  const hasMinhas = canAccessModule(permissions, "metas-minhas");
  if (hasGestao) {
    return METAS_NAV.filter((item) => item.module === "metas");
  }
  if (hasMinhas) {
    return METAS_NAV.filter((item) => item.module === "metas-minhas");
  }
  return [];
}

/** Navegação principal agrupada por tarefa (Operação / Filas / Financeiro / Dados). */
export function buildNavGroups(permissions: readonly AppModule[]): NavGroup[] {
  const controleHref = findFirstControleRoute(permissions) ?? "/controle";
  const filasItems: NavLinkItem[] = filterNavByPermissions(
    [{ href: controleHref, label: "Controle", icon: ClipboardList, module: "controle" }],
    permissions,
  );

  const groups: NavGroup[] = [
    {
      id: "operacao",
      label: "Operação",
      items: [
        ...filterNavByPermissions(OPERATION_NAV, permissions),
        ...resolveMetasNav(permissions),
      ],
    },
    {
      id: "filas",
      label: "Filas",
      items: filasItems,
    },
    {
      id: "financeiro",
      label: "Financeiro",
      items: filterNavByPermissions(FINANCEIRO_NAV, permissions),
    },
    {
      id: "dados",
      label: "Dados",
      items: filterNavByPermissions(DADOS_NAV, permissions),
    },
  ];

  return groups.filter((group) => group.items.length > 0);
}

/** @deprecated Prefer buildNavGroups. Mantido para compatibilidade pontual. */
export function buildMainNav(permissions: readonly AppModule[]): NavLinkItem[] {
  return buildNavGroups(permissions).flatMap((group) => group.items);
}

export function buildConfigNav(permissions: readonly AppModule[]): NavLinkItem[] {
  const items = [...BASE_CONFIG_NAV];
  if (canAccessModule(permissions, "usuarios")) {
    items.push({
      href: "/configuracoes/usuarios",
      label: "Usuários",
      icon: Users,
      module: "usuarios",
    });
  }
  return filterNavByPermissions(items, permissions);
}

export function hasAnyAdminNavModule(permissions: readonly AppModule[]): boolean {
  return (
    canAccessModule(permissions, "configuracoes") ||
    canAccessModule(permissions, "administradoras") ||
    canAccessModule(permissions, "planos") ||
    canAccessModule(permissions, "usuarios")
  );
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  // Hub de controle: qualquer sub-rota marca o item "Controle" como ativo.
  if (href === "/controle" || href.startsWith("/controle/")) {
    return pathname === "/controle" || pathname.startsWith("/controle/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isConfigSectionActive(pathname: string) {
  return (
    pathname.startsWith("/configuracoes") ||
    pathname.startsWith("/administradoras") ||
    pathname.startsWith("/planos")
  );
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  consorciados: "Consorciados",
  vendas: "Vendas",
  comissoes: "Comissões",
  metas: "Metas",
  minhas: "Minhas Metas",
  importacao: "Importação",
  controle: "Controle",
  inadimplencia: "Inadimplência",
  inconsistencia: "Inconsistência",
  "pos-venda": "Pós-venda",
  configuracoes: "Configurações",
  administradoras: "Administradoras",
  planos: "Planos",
  equipes: "Equipes",
  vendedores: "Vendedores",
  usuarios: "Usuários",
  nova: "Nova",
  editar: "Editar",
};

export type BreadcrumbItem = { label: string; href?: string };

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];

  let path = "";
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    path += `/${segment}`;
    const label = resolveBreadcrumbLabel(segment, segments, index);
    const isLast = index === segments.length - 1;
    items.push({
      label,
      href: isLast ? undefined : path,
    });
  }

  return items;
}

function resolveBreadcrumbLabel(
  segment: string,
  segments: string[],
  index: number,
): string {
  const known = ROUTE_LABELS[segment];
  if (known) return known;

  const parent = segments[index - 1];
  const isConsorciadoRecord =
    parent === "consorciados" &&
    segment !== "nova" &&
    (segments.length === index + 1 || segments[index + 1] === "editar");

  if (isConsorciadoRecord) return "Ficha";

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(segment)) {
    return "Detalhes";
  }

  return segment;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export { Settings, NAV_MODULE_BY_HREF };
