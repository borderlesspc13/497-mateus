export const SESSION_COOKIE_NAME = "__session";
export const PERMISSIONS_COOKIE_NAME = "__perms";

export const AUTH_PUBLIC_ROUTES = ["/login", "/cadastro"] as const;

export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 14 * 1000;
