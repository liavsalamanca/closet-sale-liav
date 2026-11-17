/**
 * Proxy (antes "middleware"): protege el panel.
 * Sin sesión válida → /panel/entrar (o 401 para la API del panel).
 */
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_PANEL, tokenValido } from "@/lib/auth";

const LIBRES = ["/panel/entrar", "/api/panel/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LIBRES.some((r) => pathname === r)) return NextResponse.next();

  const ok = await tokenValido(req.cookies.get(COOKIE_PANEL)?.value);
  if (ok) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/panel/entrar";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/panel", "/panel/:path*", "/api/panel/:path*"],
};
