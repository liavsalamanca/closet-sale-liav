import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ipDe, permitido } from "./limite";

/**
 * Seguridad de la API de la extensión de Chrome:
 * - Clave secreta EXTENSION_API_KEY en el header "x-closet-key".
 * - CORS: solo acepta orígenes chrome-extension:// (y, si configuras EXTENSION_ID, solo el tuyo).
 * El token de Notion NUNCA sale del servidor.
 */

function origenPermitido(origen: string | null): boolean {
  if (!origen) return true; // las extensiones con permiso de host a veces no mandan Origin
  const id = process.env.EXTENSION_ID?.trim();
  if (id) return origen === `chrome-extension://${id}`;
  return origen.startsWith("chrome-extension://");
}

export function cabecerasCors(req: Request): Record<string, string> {
  const origen = req.headers.get("origin");
  if (!origen || !origenPermitido(origen)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-closet-key",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function claveCorrecta(recibida: string | null): boolean {
  const real = process.env.EXTENSION_API_KEY;
  if (!real || real.length < 16 || !recibida) return false;
  const a = createHash("sha256").update(recibida).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
}

/** Devuelve una respuesta de error si la petición no está autorizada; si todo bien, null. */
export function rechazar(req: Request): NextResponse | null {
  const cors = cabecerasCors(req);
  if (!origenPermitido(req.headers.get("origin"))) {
    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403, headers: cors });
  }
  if (!permitido(`ext:${ipDe(req)}`, 120, 60_000)) {
    return NextResponse.json({ ok: false, error: "Demasiadas solicitudes" }, { status: 429, headers: cors });
  }
  if (!process.env.EXTENSION_API_KEY) {
    return NextResponse.json({ ok: false, error: "Falta EXTENSION_API_KEY en el servidor" }, { status: 500, headers: cors });
  }
  if (!claveCorrecta(req.headers.get("x-closet-key"))) {
    return NextResponse.json({ ok: false, error: "Clave incorrecta" }, { status: 401, headers: cors });
  }
  return null;
}

export function responder(req: Request, cuerpo: unknown, status = 200) {
  return NextResponse.json(cuerpo, { status, headers: { ...cabecerasCors(req), "Cache-Control": "no-store" } });
}

export function preflight(req: Request) {
  return new NextResponse(null, { status: origenPermitido(req.headers.get("origin")) ? 204 : 403, headers: cabecerasCors(req) });
}
