import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "confeitaria_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-troque-em-producao";
  return new TextEncoder().encode(secret);
}

const PUBLIC_PATHS = ["/login", "/setup"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let valid = false;

  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
