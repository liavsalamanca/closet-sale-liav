/**
 * Fórmula de precio de closet sale (la misma para catálogo, cotizador y extensión).
 *
 *   TRM efectiva  = TRM × (1 + colchón)
 *   costo (COP)   = [ precio_USD × (1 + impuesto) + peso_lb × tarifa_lb ] × TRM efectiva
 *
 *   Si en Notion hay Margen objetivo y/o Comisiones (%):
 *     precio = costo ÷ (1 − margen − comisión)
 *     (el margen y la comisión se calculan sobre el precio de venta, como en Notion)
 *   Si no hay margen ni comisión:
 *     precio = costo + ganancia fija por unidad
 *
 *   Al final se redondea hacia arriba a un precio terminado en 4.900 o 9.900.
 *
 * Este archivo no habla con Notion: recibe los parámetros ya leídos,
 * así funciona igual en el servidor y en el navegador.
 */

import { PRECIO_POR_DEFECTO } from "@/config/negocio";

export type ParametrosPrecio = {
  /** COP por USD (sin colchón) */
  trm: number;
  /** Colchón cambiario en fracción (0.02 = 2%) */
  colchon: number;
  /** Impuesto de venta USA en fracción (0.07 = 7%) */
  impuesto: number;
  /** USD por libra */
  tarifaLb: number;
  /** Margen objetivo en fracción, o null si no está definido */
  margen: number | null;
  /** Comisiones (% del precio) en fracción, o null si no está definido */
  comision: number | null;
  /** Ganancia fija por unidad (COP), se usa solo si no hay margen ni comisión */
  gananciaFija: number;
};

export const PARAMETROS_POR_DEFECTO: ParametrosPrecio = {
  trm: PRECIO_POR_DEFECTO.trm,
  colchon: PRECIO_POR_DEFECTO.colchon,
  impuesto: PRECIO_POR_DEFECTO.impuesto,
  tarifaLb: PRECIO_POR_DEFECTO.tarifaLb,
  margen: null,
  comision: null,
  gananciaFija: PRECIO_POR_DEFECTO.gananciaFija,
};

/** Redondea hacia arriba al siguiente precio terminado en 4.900 o 9.900. */
export function redondearPrecio(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  // Los precios válidos son 4.900, 9.900, 14.900, ... (múltiplos de 5.000 menos 100)
  const n = Math.ceil((Math.round(valor) - 4900) / 5000);
  return Math.max(0, n) * 5000 + 4900;
}

export type DesglosePrecio = {
  trmEfectiva: number;
  costoProductoCOP: number;
  costoEnvioCOP: number;
  costoCOP: number;
  sinRedondear: number;
  /** Precio final por unidad (COP) */
  final: number;
};

/** Calcula el precio final por UNIDAD en COP. */
export function calcularPrecio(
  entrada: { precioUSD: number; pesoLb: number; impuesto?: number | null },
  p: ParametrosPrecio = PARAMETROS_POR_DEFECTO,
): DesglosePrecio {
  const precioUSD = Math.max(0, Number(entrada.precioUSD) || 0);
  const pesoLb = Math.max(0, Number(entrada.pesoLb) || 0);
  const impuesto = entrada.impuesto ?? p.impuesto;

  const trmEfectiva = p.trm * (1 + (p.colchon || 0));
  const costoProductoCOP = precioUSD * (1 + impuesto) * trmEfectiva;
  const costoEnvioCOP = pesoLb * p.tarifaLb * trmEfectiva;
  const costoCOP = costoProductoCOP + costoEnvioCOP;

  const margen = p.margen ?? 0;
  const comision = p.comision ?? 0;
  const usaPorcentajes = margen > 0 || comision > 0;

  let sinRedondear: number;
  if (precioUSD === 0) {
    sinRedondear = 0;
  } else if (usaPorcentajes && margen + comision < 0.95) {
    sinRedondear = costoCOP / (1 - margen - comision);
  } else {
    sinRedondear = costoCOP + p.gananciaFija;
  }

  return {
    trmEfectiva,
    costoProductoCOP,
    costoEnvioCOP,
    costoCOP,
    sinRedondear,
    final: redondearPrecio(sinRedondear),
  };
}

/** Atajo: solo el precio final por unidad. */
export function precioFinal(
  precioUSD: number,
  pesoLb: number,
  p: ParametrosPrecio = PARAMETROS_POR_DEFECTO,
): number {
  return calcularPrecio({ precioUSD, pesoLb }, p).final;
}

/** % de descuento entre precio antes y precio ahora. */
export function porcentajeDescuento(ahora?: number | null, antes?: number | null): number | null {
  if (!ahora || !antes || antes <= ahora) return null;
  return Math.round((1 - ahora / antes) * 100);
}

/** Formatea pesos colombianos: 134900 → "$134.900" */
export function formatoCOP(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return "$" + Math.round(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

/** Formatea dólares: 26.6 → "US$26,60" */
export function formatoUSD(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return "US$" + valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
