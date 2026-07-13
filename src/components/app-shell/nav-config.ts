import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  HeadphonesIcon,
  LayoutDashboard,
  Settings,
  Target,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import {
  canAccessModule,
  NAV_MODULE_BY_HREF,
  type AppModule,
} from "@/lib/auth/modules";

export type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module: AppModule;
};

const BASE_MAIN_NAV: NavLinkItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/consorciados", label: "Consorciados", icon: Users, module: "consorciados" },
  { href: "/vendas", label: "Vendas", icon: Wallet, module: "vendas" },
  { href: "/importacao", label: "Importação", icon: Upload, module: "importacao" },
  {
    href: "/controle/inadimplencia",
    label: "Inadimplência",
    icon: AlertTriangle,
    module: "inadimplencia",
  },
  {
    href: "/controle/inconsistencia",
    label: "Inconsistência",
    icon: AlertCircle,
    module: "inconsistencia",
  },
  { href: "/controle/pos-venda", label: "Pós-venda", icon: HeadphonesIcon, module: "pos-venda" },
];

const OPTIONAL_MAIN_NAV: NavLinkItem[] = [
  { href: "/comissoes", label: "Comissões", icon: DollarSign, module: "comissoes" },
  { href: "/metas", label: "Metas", icon: Target, module: "metas" },
  { href: "/metas/minhas", label: "Minhas Metas", icon: Target, module: "metas-minhas" },
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
  return items.filter((item) => canAccessModule(permissions, item.module));
}

export function buildMainNav(permissions: readonly AppModule[]): NavLinkItem[] {
  const items = [...BASE_MAIN_NAV];

  for (const optional of OPTIONAL_MAIN_NAV) {
    if (!canAccessModule(permissions, optional.module)) continue;

    if (optional.module === "metas-minhas" && canAccessModule(permissions, "metas")) {
      continue;
    }

    if (optional.module === "comissoes") {
      items.splice(3, 0, optional);
    } else if (optional.module === "metas" || optional.module === "metas-minhas") {
      const insertAt = items.findIndex((item) => item.module === "comissoes");
      items.splice(insertAt >= 0 ? insertAt + 1 : 3, 0, optional);
    }
  }

  return filterNavByPermissions(items, permissions);
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
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
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

  // Se for um UUID (ID longo), não mostramos ele cru na tela
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
