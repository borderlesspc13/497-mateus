import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_PUBLIC_ROUTES,
  PERMISSIONS_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  canAccessModule,
  findFirstAccessibleRoute,
  parsePermissionsCookie,
  resolveModuleFromPath,
} from "@/lib/auth/modules";

const PUBLIC_PATHS = new Set<string>(AUTH_PUBLIC_ROUTES);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/session") ||
    pathname.startsWith("/api/auth/registration-allowed")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredModule = resolveModuleFromPath(pathname);
  if (!requiredModule) {
    return NextResponse.next();
  }

  const permissions = parsePermissionsCookie(
    request.cookies.get(PERMISSIONS_COOKIE_NAME)?.value,
  );

  if (permissions.length === 0) {
    return NextResponse.next();
  }

  if (!canAccessModule(permissions, requiredModule)) {
    const fallback = findFirstAccessibleRoute(permissions);
    const target = new URL(fallback, request.url);
    if (target.pathname === pathname) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
