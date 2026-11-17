import "server-only";
import { unstable_cache } from "next/cache";
import { consultarTodo, notionConfigurado } from "./client";
import { DS } from "./ids";
import { leerCheck, leerFecha, leerNumero, leerTitulo } from "./props";
import { PARAMETROS_POR_DEFECTO, type ParametrosPrecio } from "@/lib/precio";
import { hoyColombia } from "@/lib/util";

export type ParametrosActivos = ParametrosPrecio & {
  /** ID de la versión de parámetros en Notion (para relacionar pedidos nuevos) */
  versionId: string | null;
  versionNombre: string;
  /** "notion" si se leyeron de Notion, "defecto" si se usaron los valores de respaldo */
  origen: "notion" | "defecto";
};

const RESPALDO: ParametrosActivos = {
  ...PARAMETROS_POR_DEFECTO,
  versionId: null,
  versionNombre: "Valores por defecto",
  origen: "defecto",
};

async function leerDeNotion(): Promise<ParametrosActivos> {
  const filas = (await consultarTodo(DS.parametros)).filter((p) => !leerCheck(p, "Es ejemplo"));
  if (filas.length === 0) return RESPALDO;

  // Versión vigente: la de "Vigente desde" más reciente que no esté en el futuro.
  // Si ninguna tiene fecha, la creada más recientemente.
  const hoy = hoyColombia();
  const ordenadas = [...filas].sort((a, b) => {
    const fa = leerFecha(a, "Vigente desde") ?? "";
    const fb = leerFecha(b, "Vigente desde") ?? "";
    if (fa !== fb) return fb.localeCompare(fa);
    return b.created_time.localeCompare(a.created_time);
  });
  const vigente =
    ordenadas.find((p) => {
      const f = leerFecha(p, "Vigente desde");
      return !f || f.slice(0, 10) <= hoy;
    }) ?? ordenadas[0];

  const trm = leerNumero(vigente, "TRM referencia (COP por USD)");
  const colchon = leerNumero(vigente, "Colchón cambiario");
  const impuesto = leerNumero(vigente, "Impuesto venta USA por defecto");
  const tarifa = leerNumero(vigente, "Tarifa casillero (USD por lb)");
  const margen = leerNumero(vigente, "Margen objetivo");
  const comision = leerNumero(vigente, "Comisiones (% del precio)");

  return {
    // Si no hay TRM en Notion, usamos la TRM de respaldo (que ya trae su colchón)
    trm: trm && trm > 0 ? trm : PARAMETROS_POR_DEFECTO.trm,
    colchon: trm && trm > 0 ? (colchon ?? 0) : PARAMETROS_POR_DEFECTO.colchon,
    impuesto: impuesto ?? PARAMETROS_POR_DEFECTO.impuesto,
    tarifaLb: tarifa && tarifa > 0 ? tarifa : PARAMETROS_POR_DEFECTO.tarifaLb,
    margen: margen && margen > 0 ? margen : null,
    comision: comision && comision > 0 ? comision : null,
    gananciaFija: PARAMETROS_POR_DEFECTO.gananciaFija,
    versionId: vigente.id,
    versionNombre: leerTitulo(vigente, "Versión") || "Sin nombre",
    origen: "notion",
  };
}

const enCache = unstable_cache(leerDeNotion, ["parametros-v1"], { revalidate: 300, tags: ["parametros"] });

/** Parámetros de precio vigentes (caché de 5 minutos). Nunca falla: si Notion no responde, usa los de respaldo. */
export async function obtenerParametros(): Promise<ParametrosActivos> {
  if (!notionConfigurado()) return RESPALDO;
  try {
    return await enCache();
  } catch (e) {
    console.error("[notion] No se pudieron leer los Parámetros, uso valores por defecto:", e);
    return RESPALDO;
  }
}

/** Solo lo que necesita el navegador para calcular precios (sin IDs internos). */
export function parametrosPublicos(p: ParametrosActivos): ParametrosPrecio {
  return {
    trm: p.trm,
    colchon: p.colchon,
    impuesto: p.impuesto,
    tarifaLb: p.tarifaLb,
    margen: p.margen,
    comision: p.comision,
    gananciaFija: p.gananciaFija,
  };
}
