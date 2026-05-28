export const USER_ROLES = ["admin", "gerente", "vendedor"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrador",
    gerente: "Gerente",
    vendedor: "Vendedor",
  };
  return labels[role];
}

export function canAccessConfiguracoes(role: UserRole): boolean {
  return role === "admin" || role === "gerente";
}

export function canManageComissoes(role: UserRole): boolean {
  return role === "admin" || role === "gerente";
}

export function canViewComissoes(role: UserRole): boolean {
  return canManageComissoes(role);
}

export function canManageUsuarios(role: UserRole): boolean {
  return role === "admin";
}
