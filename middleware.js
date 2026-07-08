import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "confeitaria_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "dev-secret-troque-em-producao";
  return new TextEncoder().encode(secret);
}

const PUBLIC_PATHS = ["/login", "/setup"];

// Módulos com acesso restrito por permissão (ver coluna `permissoes` em usuarios).
const MODULO_POR_ROTA = [
  { prefixo: "/pedidos", modulo: "pedidos" },
  { prefixo: "/produtos", modulo: "produtos" },
  { prefixo: "/clientes", modulo: "clientes" },
  { prefixo: "/financeiro", modulo: "financeiro" },
  { prefixo: "/mensageria", modulo: "mensageria" },
];
// Rotas restritas a administradoras (reforça no servidor o que já era só client-side no Shell).
const ROTAS_ADMIN = ["/usuarios", "/configuracoes"];

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
  let payload = null;

  if (token) {
    try {
      const verificado = await jwtVerify(token, getSecretKey());
      payload = verificado.payload;
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const ehAdmin = payload.papel === "admin";

  if (ROTAS_ADMIN.some((p) => pathname.startsWith(p)) && !ehAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const rotaModulo = MODULO_POR_ROTA.find((r) => pathname.startsWith(r.prefixo));
  if (rotaModulo && !ehAdmin) {
    const permissoes = Array.isArray(payload.permissoes) ? payload.permissoes : [];
    if (!permissoes.includes(rotaModulo.modulo)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
