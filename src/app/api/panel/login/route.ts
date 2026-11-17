import { NextResponse } from "next/server";
import { COOKIE_PANEL, DURACION_SESION_S, contrasenaCorrecta, crearToken } from "@/lib/auth";
import { ipDe, permitido } from "@/lib/limite";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Falta configurar ADMIN_PASSWORD en Vercel." }, { status: 500 });
  }
  // Máximo 8 intentos cada 15 minutos por IP
  if (!permitido(`login:${ipDe(req)}`, 8, 15 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }
  const { contrasena } = await req.json().catch(() => ({ contrasena: "" }));
  if (!(await contrasenaCorrecta(String(contrasena ?? "")))) {
    return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 });
  }
  const token = await crearToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_PANEL, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
  return res;
}
