/**
 * Sesión del panel: una cookie firmada (HMAC-SHA256) con fecha de vencimiento.
 * Usa Web Crypto, así funciona tanto en el proxy como en las rutas del servidor.
 * La firma se deriva de ADMIN_PASSWORD: si cambias la contraseña, se cierran todas las sesiones.
 */
export const COOKIE_PANEL = "cs_panel";
export const DURACION_SESION_S = 60 * 60 * 24 * 7; // 7 días

const codificador = new TextEncoder();

async function clave(): Promise<CryptoKey | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.subtle.importKey("raw", codificador.encode(`closetsale-panel:${pw}`), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

const aHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const deHex = (hex: string) => new Uint8Array((hex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));

export async function crearToken(): Promise<string | null> {
  const k = await clave();
  if (!k) return null;
  const vence = Math.floor(Date.now() / 1000) + DURACION_SESION_S;
  const firma = await crypto.subtle.sign("HMAC", k, codificador.encode(String(vence)));
  return `${vence}.${aHex(firma)}`;
}

export async function tokenValido(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [vence, firma] = token.split(".");
  if (!vence || !firma || !/^\d+$/.test(vence) || !/^[0-9a-f]{64}$/.test(firma)) return false;
  if (Number(vence) < Date.now() / 1000) return false;
  const k = await clave();
  if (!k) return false;
  // verify() compara en tiempo constante
  return crypto.subtle.verify("HMAC", k, deHex(firma), codificador.encode(vence));
}

/** Compara la contraseña escrita con ADMIN_PASSWORD sin filtrar información por el tiempo de respuesta. */
export async function contrasenaCorrecta(intento: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || !intento) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", codificador.encode(intento)),
    crypto.subtle.digest("SHA-256", codificador.encode(real)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

/** Lee la cookie de una Request y valida la sesión (para las rutas /api/panel). */
export async function sesionDeRequest(req: Request): Promise<boolean> {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_PANEL}=([^;]+)`));
  return tokenValido(m ? decodeURIComponent(m[1]) : null);
}
