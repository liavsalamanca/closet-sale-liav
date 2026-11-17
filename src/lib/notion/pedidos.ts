import "server-only";
import { revalidateTag } from "next/cache";
import { consultarTodo, crearPagina, actualizarPagina, linkNotion } from "./client";
import { DS } from "./ids";
import { escribir, leerCheck, leerNumero, leerTexto, leerTitulo, type PaginaNotion } from "./props";
import { obtenerParametros } from "./parametros";
import { hoyColombia, mismoTelefono, normalizarWhatsApp, tiendaDesdeLink } from "@/lib/util";
import type { Categoria } from "@/config/negocio";

// ------------------ Clientes ------------------

export type Clienta = { id: string; nombre: string; whatsapp: string; instagram: string; ciudad: string; url: string };

export function aClienta(p: PaginaNotion): Clienta {
  return {
    id: p.id,
    nombre: leerTitulo(p, "Cliente"),
    whatsapp: leerTexto(p, "WhatsApp"),
    instagram: leerTexto(p, "Instagram"),
    ciudad: leerTexto(p, "Ciudad"),
    url: linkNotion(p.id),
  };
}

/** Todas las clientas reales (sin las de ejemplo). */
export async function listarClientas(): Promise<Clienta[]> {
  const filas = await consultarTodo(DS.clientes);
  return filas.filter((p) => !leerCheck(p, "Es ejemplo")).map(aClienta);
}

/** Busca la clienta por WhatsApp; si no existe, la crea. Si existe, completa datos vacíos. */
export async function buscarOCrearClienta(d: {
  nombre: string;
  whatsapp: string;
  instagram?: string;
  ciudad?: string;
  contacto?: "WhatsApp" | "Instagram";
  esEjemplo?: boolean;
}): Promise<{ id: string; nueva: boolean }> {
  const filas = await consultarTodo(DS.clientes);
  const existente = filas.find((p) => mismoTelefono(leerTexto(p, "WhatsApp"), d.whatsapp));
  if (existente) {
    const cambios: Record<string, unknown> = {};
    if (d.instagram && !leerTexto(existente, "Instagram")) cambios["Instagram"] = escribir.texto(d.instagram);
    if (d.ciudad && !leerTexto(existente, "Ciudad")) cambios["Ciudad"] = escribir.texto(d.ciudad);
    if (Object.keys(cambios).length) await actualizarPagina(existente.id, cambios);
    return { id: existente.id, nueva: false };
  }
  const wa = normalizarWhatsApp(d.whatsapp);
  const p = await crearPagina(DS.clientes, {
    Cliente: escribir.titulo(d.nombre),
    WhatsApp: escribir.telefono(wa ? `+${wa}` : d.whatsapp),
    Instagram: escribir.texto(d.instagram ?? ""),
    Ciudad: escribir.texto(d.ciudad ?? ""),
    ...(d.contacto ? { "Contacto preferido": escribir.select(d.contacto) } : {}),
    Origen: escribir.select("Web"),
    "Es ejemplo": escribir.check(Boolean(d.esEjemplo)),
  });
  return { id: p.id, nueva: true };
}

// ------------------ Pedidos y líneas ------------------

export type LineaNueva = {
  producto: string;
  variante?: string;
  cantidad: number;
  enlace?: string;
  precioUSD: number;
  categoria: Categoria;
  precioCOP: number;
  pesoLb?: number;
  tienda?: string;
};

/** Crea un pedido en "Cotizando" con su versión de parámetros vigente. */
export async function crearPedido(d: {
  titulo: string;
  clientaId: string;
  notas?: string;
  esEjemplo?: boolean;
}): Promise<{ id: string; numero: number | null; url: string }> {
  const parametros = await obtenerParametros();
  const p = await crearPagina(DS.pedidos, {
    Pedido: escribir.titulo(d.titulo),
    Cliente: escribir.relacion([d.clientaId]),
    Etapa: escribir.status("Cotizando"),
    "Fecha de cotización": escribir.fecha(hoyColombia()),
    Modalidad: escribir.select("Todo incluido"),
    "Notas y compromisos": escribir.texto(d.notas ?? ""),
    ...(parametros.versionId ? { "Versión de parámetros": escribir.relacion([parametros.versionId]) } : {}),
    "Es ejemplo": escribir.check(Boolean(d.esEjemplo)),
  });
  return { id: p.id, numero: leerNumero(p, "ID"), url: linkNotion(p.id) };
}

/** Agrega una línea de producto a un pedido. */
export async function crearLinea(pedidoId: string, l: LineaNueva, esEjemplo = false): Promise<{ id: string; url: string }> {
  const tienda = l.tienda || (l.enlace ? tiendaDesdeLink(l.enlace) : "");
  const p = await crearPagina(DS.productos, {
    Producto: escribir.titulo(l.producto),
    Pedido: escribir.relacion([pedidoId]),
    Variante: escribir.texto(l.variante ?? ""),
    Cantidad: escribir.numero(l.cantidad),
    Enlace: escribir.url(l.enlace || null),
    "Precio unitario (USD)": escribir.numero(l.precioUSD),
    Categoría: escribir.select(l.categoria),
    "Precio final (COP)": escribir.numero(l.precioCOP),
    ...(l.pesoLb ? { "Peso por unidad (lb)": escribir.numero(l.pesoLb), "Certeza del peso": escribir.select("Estimado") } : {}),
    ...(tienda ? { Tienda: escribir.select(tienda) } : {}),
    "Es ejemplo": escribir.check(esEjemplo),
  });
  return { id: p.id, url: linkNotion(p.id) };
}

/** Avisa a las páginas en caché que hay datos nuevos. */
export function refrescarPanel() {
  try {
    revalidateTag("panel", { expire: 0 });
  } catch {
    /* fuera de un contexto de Next (pruebas) */
  }
}
