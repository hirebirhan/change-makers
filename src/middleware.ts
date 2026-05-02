import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuth = request.cookies.get("yt_auth")?.value === "true";

  if (isAuth && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuth && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.json).*)"],
};
