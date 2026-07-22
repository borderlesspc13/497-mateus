import type { UserRole } from "@/lib/auth/roles";

/** Módulos de acesso granular — substituem perfis fechados para navegação e rotas. */
export const APP_MODULES = [
  "dashboard",
  "consorciados",
  "vendas",
  "importacao",
  "inadimplencia",
  "inconsistencia",
  "pos-venda",
  "comissoes",
  "metas",
  "metas-minhas",
  "configuracoes",
  "administradoras",
  "planos",
  "usuarios",
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const CONTROLE_MODULES = ["inadimplencia", "inconsistencia", "pos-venda"] as const;
export type ControleModule = (typeof CONTROLE_MODULES)[number];

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: "Dashboard",
  consorciados: "Consorciados",
  vendas: "Vendas",
  importacao: "Importação",
  inadimplencia: "Inadimplência",
  inconsistencia: "Inconsistência",
  "pos-venda": "Pós-venda",
  comissoes: "Comissões",
  metas: "Metas (gestão)",
  "metas-minhas": "Minhas Metas",
  configuracoes: "Configurações",
  administradoras: "Administradoras",
  planos: "Planos",
  usuarios: "Usuários",
};

/** Módulos atribuídos por padrão quando `permissions` não está definido no documento. */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserRole, readonly AppModule[]> = {
  admin: APP_MODULES,
  gerente: [
    "dashboard",
    "consorciados",
    "vendas",
    "importacao",
    "inadimplencia",
    "inconsistencia",
    "pos-venda",
    "comissoes",
    "metas",
    "configuracoes",
    "administradoras",
    "planos",
  ],
  vendedor: [
    "dashboard",
    "consorciados",
    "vendas",
    "inadimplencia",
    "inconsistencia",
    "pos-venda",
    "metas-minhas",
  ],
};

export function isAppModule(value: string): value is AppModule {
  return (APP_MODULES as readonly string[]).includes(value);
}

export function parsePermissionsCookie(raw: string | undefined): AppModule[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(isAppModule);
}

export function serializePermissionsCookie(permissions: readonly AppModule[]): string {
  return permissions.join(",");
}

export function resolveEffectivePermissions(input: {
  role: UserRole;
  permissions?: AppModule[] | null;
}): AppModule[] {
  if (input.permissions && input.permissions.length > 0) {
    return [...new Set(input.permissions)];
  }
  return [...DEFAULT_PERMISSIONS_BY_ROLE[input.role]];
}

export function canAccessModule(
  permissions: readonly AppModule[],
  module: AppModule,
): boolean {
  return permissions.includes(module);
}

export function canAccessAnyControle(permissions: readonly AppModule[]): boolean {
  return CONTROLE_MODULES.some((module) => canAccessModule(permissions, module));
}

const CONTROLE_ROUTE_BY_MODULE: Record<ControleModule, string> = {
  inadimplencia: "/controle/inadimplencia",
  inconsistencia: "/controle/inconsistencia",
  "pos-venda": "/controle/pos-venda",
};

export function findFirstControleRoute(permissions: readonly AppModule[]): string | null {
  for (const module of CONTROLE_MODULES) {
    if (canAccessModule(permissions, module)) {
      return CONTROLE_ROUTE_BY_MODULE[module];
    }
  }
  return null;
}

/** Prefixos de rota → módulo exigido (ordem: rotas mais específicas primeiro). */
const ROUTE_MODULE_RULES: Array<{ prefix: string; module: AppModule }> = [
  { prefix: "/metas/minhas", module: "metas-minhas" },
  { prefix: "/configuracoes/usuarios", module: "usuarios" },
  { prefix: "/configuracoes", module: "configuracoes" },
  { prefix: "/administradoras", module: "administradoras" },
  { prefix: "/planos", module: "planos" },
  { prefix: "/importacao", module: "importacao" },
  { prefix: "/controle/inadimplencia", module: "inadimplencia" },
  { prefix: "/controle/inconsistencia", module: "inconsistencia" },
  { prefix: "/controle/pos-venda", module: "pos-venda" },
  { prefix: "/comissoes", module: "comissoes" },
  { prefix: "/metas", module: "metas" },
  { prefix: "/consorciados", module: "consorciados" },
  { prefix: "/vendas", module: "vendas" },
  { prefix: "/", module: "dashboard" },
];

export function resolveModuleFromPath(pathname: string): AppModule | null {
  // Hub `/controle` é tratado no proxy (qualquer módulo de fila).
  if (pathname === "/controle" || pathname === "/controle/") {
    return null;
  }

  for (const rule of ROUTE_MODULE_RULES) {
    if (rule.prefix === "/") {
      if (pathname === "/") return rule.module;
      continue;
    }
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.module;
    }
  }
  return null;
}

export function findFirstAccessibleRoute(permissions: readonly AppModule[]): string {
  const routeByModule: Partial<Record<AppModule, string>> = {
    dashboard: "/",
    consorciados: "/consorciados",
    vendas: "/vendas",
    importacao: "/importacao",
    inadimplencia: "/controle/inadimplencia",
    inconsistencia: "/controle/inconsistencia",
    "pos-venda": "/controle/pos-venda",
    comissoes: "/comissoes",
    metas: "/metas",
    "metas-minhas": "/metas/minhas",
    configuracoes: "/configuracoes",
    administradoras: "/administradoras",
    planos: "/planos",
    usuarios: "/configuracoes/usuarios",
  };

  for (const module of APP_MODULES) {
    if (canAccessModule(permissions, module) && routeByModule[module]) {
      return routeByModule[module]!;
    }
  }
  return "/login";
}

export const NAV_MODULE_BY_HREF: Record<string, AppModule> = {
  "/": "dashboard",
  "/consorciados": "consorciados",
  "/vendas": "vendas",
  "/importacao": "importacao",
  "/controle/inadimplencia": "inadimplencia",
  "/controle/inconsistencia": "inconsistencia",
  "/controle/pos-venda": "pos-venda",
  "/comissoes": "comissoes",
  "/metas": "metas",
  "/metas/minhas": "metas-minhas",
  "/configuracoes": "configuracoes",
  "/administradoras": "administradoras",
  "/planos": "planos",
  "/configuracoes/equipes": "configuracoes",
  "/configuracoes/vendedores": "configuracoes",
  "/configuracoes/campanhas": "configuracoes",
  "/configuracoes/usuarios": "usuarios",
};

export const MODULE_GROUPS: Array<{ label: string; modules: AppModule[] }> = [
  {
    label: "Operação",
    modules: ["dashboard", "consorciados", "vendas", "importacao"],
  },
  {
    label: "Filas (Controle)",
    modules: ["inadimplencia", "inconsistencia", "pos-venda"],
  },
  {
    label: "Financeiro & Metas",
    modules: ["comissoes", "metas", "metas-minhas"],
  },
  {
    label: "Administração",
    modules: ["configuracoes", "administradoras", "planos", "usuarios"],
  },
];
