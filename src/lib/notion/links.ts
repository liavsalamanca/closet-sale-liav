import "server-only";
import { consultarTodo, crearPagina, actualizarPagina, leerPagina, linkNotion } from "./client";
import { DS } from "./ids";
import {
  escribir,
  leerFecha,
  leerNumero,
  leerRelacion,
  leerSelect,
  leerTexto,
  leerTitulo,
  leerUrl,
  type PaginaNotion,
} from "./props";
import { obtenerCatalogo } from "./catalogo";
import { crearLinea, crearPedido, refrescarPanel } from "./pedidos";
import { PESO_POR_CATEGORIA, CATEGORIAS, type Categoria } from "@/config/negocio";
import { slug, tiendaDesdeLink } from "@/lib/util";

export type LinkGuardado = {
  id: string;
  url: string;
  producto: string;
  enlace: string;
  tienda: string;
  foto: string;
  precioUSD: number | null;
  precioCOP: number | null;
  categoria: Categoria;
  variante: string;
  cantidad: number;
  para: string;
  estado: string;
  notas: string;
  guardado: string | null;
  clientaId: string | null;
  pedidoId: string | null;
};

export function aLink(p: PaginaNotion): LinkGuardado {
  const cat = leerSelect(p, "Categoría") as Categoria;
  return {
    id: p.id,
    url: linkNotion(p.id),
    producto: leerTitulo(p, "Producto"),
    enlace: leerUrl(p, "Enlace"),
    tienda: leerSelect(p, "Tienda"),
    foto: leerUrl(p, "Foto"),
    precioUSD: leerNumero(p, "Precio USD"),
    precioCOP: leerNumero(p, "Precio estimado (COP)"),
    categoria: CATEGORIAS.includes(cat) ? cat : "Otros",
    variante: leerTexto(p, "Variante"),
    cantidad: leerNumero(p, "Cantidad") ?? 1,
    para: leerSelect(p, "Para"),
    estado: leerSelect(p, "Estado") || "Nuevo",
    notas: leerTexto(p, "Notas"),
    guardado: leerFecha(p, "Guardado el") ?? p.created_time,
    clientaId: leerRelacion(p, "Clienta")[0] ?? null,
    pedidoId: leerRelacion(p, "Pedido")[0] ?? null,
  };
}

export async function listarLinks(): Promise<LinkGuardado[]> {
  const filas = await consultarTodo(DS.links);
  return filas.map(aLink).sort((a, b) => (b.guardado ?? "").localeCompare(a.guardado ?? ""));
}

export type DatosLink = {
  producto: string;
  enlace: string;
  foto?: string;
  precioUSD?: number | null;
  precioCOP?: number | null;
  categoria: Categoria;
  variante?: string;
  cantidad?: number;
  pesoLb?: number;
  notas?: string;
};

/** Crea un registro en "Links guardados". */
export async function guardarLink(
  d: DatosLink & { para: "Idea" | "Catálogo" | "Clienta"; estado?: string; clientaId?: string; pedidoId?: string },
): Promise<{ id: string; url: string }> {
  const ahora = new Date().toISOString();
  const p = await crearPagina(DS.links, {
    Producto: escribir.titulo(d.producto || "Producto sin nombre"),
    Enlace: escribir.url(d.enlace || null),
    Tienda: escribir.select(d.enlace ? tiendaDesdeLink(d.enlace) : null),
    Foto: escribir.url(d.foto || null),
    "Precio USD": escribir.numero(d.precioUSD ?? null),
    "Precio estimado (COP)": escribir.numero(d.precioCOP ?? null),
    Categoría: escribir.select(d.categoria),
    Variante: escribir.texto(d.variante ?? ""),
    Cantidad: escribir.numero(d.cantidad ?? 1),
    Para: escribir.select(d.para),
    Estado: escribir.status(d.estado ?? "Nuevo"),
    Notas: escribir.texto(d.notas ?? ""),
    "Guardado el": escribir.fecha(ahora),
    ...(d.clientaId ? { Clienta: escribir.relacion([d.clientaId]) } : {}),
    ...(d.pedidoId ? { Pedido: escribir.relacion([d.pedidoId]) } : {}),
  });
  refrescarPanel();
  return { id: p.id, url: linkNotion(p.id) };
}

/** Crea el producto en "Catálogo web" con Activo = false (tú lo revisas y lo publicas). */
export async function crearEnCatalogo(d: DatosLink): Promise<{ id: string; url: string }> {
  const tienda = d.enlace ? tiendaDesdeLink(d.enlace) : "";
  const { marcas } = await obtenerCatalogo();
  const marca = marcas.find((m) => slug(m.nombre) === slug(tienda));
  const p = await crearPagina(DS.catalogo, {
    Producto: escribir.titulo(d.producto || "Producto sin nombre"),
    ...(marca ? { Marca: escribir.relacion([marca.id]) } : {}),
    Categoría: escribir.select(d.categoria),
    "Precio USD": escribir.numero(d.precioUSD ?? null),
    "Peso estimado (lb)": escribir.numero(d.pesoLb ?? PESO_POR_CATEGORIA[d.categoria]),
    "Enlace tienda": escribir.url(d.enlace || null),
    Colores: escribir.texto(d.variante ?? ""),
    Activo: escribir.check(false),
    // Foto vacía a propósito: subes tus propias fotos (no copiamos imágenes de las tiendas)
  });
  return { id: p.id, url: linkNotion(p.id) };
}

/** Crea un pedido nuevo en "Cotizando" para una clienta con este producto. */
export async function crearPedidoConProducto(
  clientaId: string,
  nombreClienta: string,
  d: DatosLink,
): Promise<{ pedidoId: string; numero: number | null; url: string }> {
  const pedido = await crearPedido({
    titulo: `${nombreClienta || "Clienta"} · ${d.producto}`.slice(0, 120),
    clientaId,
    notas: d.notas ? `Desde links guardados: ${d.notas}` : "Creado desde links guardados / extensión.",
  });
  await agregarAPedido(pedido.id, d);
  return { pedidoId: pedido.id, numero: pedido.numero, url: pedido.url };
}

export async function agregarAPedido(pedidoId: string, d: DatosLink) {
  return crearLinea(pedidoId, {
    producto: d.producto,
    variante: d.variante,
    cantidad: d.cantidad ?? 1,
    enlace: d.enlace,
    precioUSD: d.precioUSD ?? 0,
    categoria: d.categoria,
    precioCOP: d.precioCOP ?? 0,
    pesoLb: d.pesoLb ?? PESO_POR_CATEGORIA[d.categoria],
  });
}

// ---- Acciones desde el panel ----

export async function accionLink(
  id: string,
  accion: "catalogo" | "pedido" | "descartar" | "revisado",
  clientaId?: string,
): Promise<{ url?: string }> {
  const p = await leerPagina(id);
  const l = aLink(p);
  const datos: DatosLink = {
    producto: l.producto,
    enlace: l.enlace,
    precioUSD: l.precioUSD,
    precioCOP: l.precioCOP,
    categoria: l.categoria,
    variante: l.variante,
    cantidad: l.cantidad,
    notas: l.notas,
  };

  if (accion === "descartar") {
    await actualizarPagina(id, { Estado: escribir.status("Descartado") });
  } else if (accion === "revisado") {
    await actualizarPagina(id, { Estado: escribir.status("Revisado") });
  } else if (accion === "catalogo") {
    const r = await crearEnCatalogo(datos);
    await actualizarPagina(id, { Estado: escribir.status("Revisado"), Para: escribir.select("Catálogo") });
    refrescarPanel();
    return { url: r.url };
  } else if (accion === "pedido") {
    const cid = clientaId || l.clientaId;
    if (!cid) throw new Error("Elige la clienta para crear el pedido.");
    const clienta = await leerPagina(cid);
    const r = await crearPedidoConProducto(cid, leerTitulo(clienta, "Cliente"), datos);
    await actualizarPagina(id, {
      Estado: escribir.status("Pasado a pedido"),
      Para: escribir.select("Clienta"),
      Clienta: escribir.relacion([cid]),
      Pedido: escribir.relacion([r.pedidoId]),
    });
    refrescarPanel();
    return { url: r.url };
  }
  refrescarPanel();
  return {};
}
