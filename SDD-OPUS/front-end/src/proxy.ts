import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safeNext";

// Optimistic guard only (plan §2.5): it checks that a session cookie exists. Whether the
// session is actually valid is decided by the API, which answers 401 otherwise.
const SESSION_COOKIE = "sid";
const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!hasSession && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL(safeNext(searchParams.get("next")), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
