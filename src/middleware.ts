import { NextResponse, type NextRequest } from "next/server";
import { AUTH_PUBLIC_ROUTES, SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const PUBLIC_PATHS = new Set<string>(AUTH_PUBLIC_ROUTES);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/session")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isPublicPath(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
