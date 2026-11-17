import "server-only";
/**
 * Límite sencillo de envíos por IP (en memoria).
 * En Vercel cada copia del servidor tiene su propio contador: frena el spam normal,
 * aunque no es un muro perfecto. Suficiente para un formulario de pedidos.
 */
const registros = new Map<string, number[]>();

export function permitido(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const lista = (registros.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (lista.length >= maximo) {
    registros.set(clave, lista);
    return false;
  }
  lista.push(ahora);
  registros.set(clave, lista);
  // Limpieza ocasional para que el mapa no crezca sin fin
  if (registros.size > 5000) {
    for (const [k, v] of registros) if (v.every((t) => ahora - t > ventanaMs)) registros.delete(k);
  }
  return true;
}

export function ipDe(req: Request): string {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
}
