import { NextResponse, type NextRequest } from "next/server";

/**
 * Primeira barreira (rápida) das rotas privadas: sem cookie de sessão → /login.
 * NÃO valida a sessão — isso é feito no layout privado contra o backend
 * (app/(app)/layout.tsx), e o backend continua sendo a autoridade final em cada API.
 */
const SESSION_COOKIE_NAME = "ztech_session";
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname) || request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Exclui API (protegida pelo backend), arquivos internos do Next e arquivos estáticos.
  matcher: ["/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
