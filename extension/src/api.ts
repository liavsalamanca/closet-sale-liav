/** Comunicación con la web de closet sale (nunca con Notion directo). */
import type { ParametrosPrecio } from "@/lib/precio";

export type Ajustes = { sitio: string; clave: string };
export type Clienta = { id: string; nombre: string; whatsapp: string; instagram: string };
export type PedidoAbierto = { id: string; numero: number | null; titulo: string; etapa: string; url: string };
export type DatosParametros = {
  parametros: ParametrosPrecio;
  version: string;
  categorias: string[];
  pesos: { etiqueta: string; categoria: string; lb: number }[];
};
export type Guardado = {
  destino: "idea" | "catalogo" | "clienta";
  producto: string;
  enlace: string;
  foto?: string;
  precioUSD: number | null;
  categoria: string;
  variante?: string;
  cantidad: number;
  pesoLb: number;
  notas?: string;
  clientaId?: string;
  pedidoId?: string;
};

export async function leerAjustes(): Promise<Ajustes | null> {
  const { ajustes } = (await chrome.storage.local.get("ajustes")) as { ajustes?: Partial<Ajustes> };
  return ajustes?.sitio && ajustes?.clave ? (ajustes as Ajustes) : null;
}

export async function guardarAjustes(a: Ajustes) {
  await chrome.storage.local.set({ ajustes: a });
}

/** Normaliza la URL de la web: "closetsaleliav.vercel.app" → "https://closetsaleliav.vercel.app" */
export function normalizarSitio(s: string): string {
  let x = s.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(x)) x = (x.startsWith("localhost") ? "http://" : "https://") + x;
  return new URL(x).origin;
}

async function llamar<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const a = await leerAjustes();
  if (!a) throw new Error("Configura la extensión primero (ícono de ajustes).");
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), 20000);
  try {
    const r = await fetch(a.sitio + ruta, {
      ...init,
      signal: control.signal,
      headers: { "Content-Type": "application/json", "x-closet-key": a.clave, ...(init.headers ?? {}) },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || `Error ${r.status}`);
    return j as T;
  } finally {
    clearTimeout(t);
  }
}

/** Parámetros de precio (con copia local por si no hay internet). */
export async function obtenerParametros(): Promise<DatosParametros | null> {
  try {
    const d = await llamar<DatosParametros>("/api/extension/parametros");
    await chrome.storage.local.set({ parametrosCache: d });
    return d;
  } catch {
    const { parametrosCache } = await chrome.storage.local.get("parametrosCache");
    return (parametrosCache as DatosParametros) ?? null;
  }
}

export const buscarClientas = (q: string) =>
  llamar<{ clientas: Clienta[] }>(`/api/extension/clientas?q=${encodeURIComponent(q)}`).then((r) => r.clientas);

export const pedidosDe = (id: string) =>
  llamar<{ pedidos: PedidoAbierto[] }>(`/api/extension/pedidos?clienta=${encodeURIComponent(id)}`).then((r) => r.pedidos);

export const guardar = (g: Guardado) =>
  llamar<{ url: string; precioCOP: number | null; numero?: number }>("/api/extension/guardar", {
    method: "POST",
    body: JSON.stringify(g),
  });

// ---------- Cola de reintentos ----------
type Pendiente = { g: Guardado; intentos: number; fecha: string };

export async function encolar(g: Guardado) {
  const { pendientes = [] } = await chrome.storage.local.get("pendientes");
  (pendientes as Pendiente[]).push({ g, intentos: 0, fecha: new Date().toISOString() });
  await chrome.storage.local.set({ pendientes });
}

export async function contarPendientes(): Promise<number> {
  const { pendientes = [] } = await chrome.storage.local.get("pendientes");
  return (pendientes as Pendiente[]).length;
}

/** Reintenta los guardados que fallaron. Devuelve cuántos se lograron guardar. */
export async function reintentarPendientes(): Promise<number> {
  const { pendientes = [] } = await chrome.storage.local.get("pendientes");
  const lista = pendientes as Pendiente[];
  if (!lista.length) return 0;
  const quedan: Pendiente[] = [];
  let ok = 0;
  for (const p of lista) {
    try {
      await guardar(p.g);
      ok++;
    } catch {
      if (p.intentos < 20) quedan.push({ ...p, intentos: p.intentos + 1 });
    }
  }
  await chrome.storage.local.set({ pendientes: quedan });
  return ok;
}
