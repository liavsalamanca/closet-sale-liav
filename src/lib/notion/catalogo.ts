import "server-only";
import { unstable_cache } from "next/cache";
import { consultarTodo, notionConfigurado } from "./client";
import { DS } from "./ids";
import {
  leerArchivos,
  leerCheck,
  leerMulti,
  leerNumero,
  leerRelacion,
  leerSelect,
  leerTexto,
  leerTitulo,
  leerUrl,
} from "./props";
import { obtenerParametros } from "./parametros";
import { calcularPrecio, porcentajeDescuento } from "@/lib/precio";
import { slug } from "@/lib/util";
import { PESO_POR_CATEGORIA, type Categoria } from "@/config/negocio";
import type { Marca, ProductoCatalogo } from "@/lib/tipos";

async function leerMarcas(): Promise<Marca[]> {
  const filas = await consultarTodo(DS.marcas, { filter: { property: "Activa", checkbox: { equals: true } } });
  return filas
    .filter((p) => leerCheck(p, "Activa"))
    .map((p) => {
      const nombre = leerTitulo(p, "Marca");
      return {
        id: p.id,
        nombre,
        slug: slug(nombre),
        tableroPinterest: leerUrl(p, "Tablero de Pinterest"),
        tiendaOficial: leerUrl(p, "Tienda oficial"),
        descripcion: leerTexto(p, "Descripción corta"),
        promo: leerTexto(p, "Promo activa"),
        destacada: leerCheck(p, "Destacada"),
        orden: leerNumero(p, "Orden") ?? 999,
      };
    })
    .filter((m) => m.nombre)
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
}

async function leerCatalogo(): Promise<{ productos: ProductoCatalogo[]; marcas: Marca[] }> {
  const [filas, marcas, parametros] = await Promise.all([
    consultarTodo(DS.catalogo, { filter: { property: "Activo", checkbox: { equals: true } } }),
    leerMarcas(),
    obtenerParametros(),
  ]);
  const porId = new Map(marcas.map((m) => [m.id, m]));

  const productos = filas
    .filter((p) => leerCheck(p, "Activo"))
    .map((p): ProductoCatalogo | null => {
      const nombre = leerTitulo(p, "Producto");
      const precioUSD = leerNumero(p, "Precio USD");
      if (!nombre || !precioUSD) return null;
      const categoria = (leerSelect(p, "Categoría") || "Otros") as Categoria;
      const pesoLb = leerNumero(p, "Peso estimado (lb)") ?? PESO_POR_CATEGORIA[categoria] ?? 1;
      const manual = leerNumero(p, "Precio final manual (COP)");
      const antesUSD = leerNumero(p, "Precio antes USD");
      const marca = leerRelacion(p, "Marca")
        .map((id) => porId.get(id))
        .find(Boolean);
      return {
        id: p.id,
        nombre,
        marca: marca?.nombre ?? "",
        marcaSlug: marca?.slug ?? "",
        categoria,
        fotos: leerArchivos(p, "Foto"),
        precioUSD,
        antesUSD,
        descuento: porcentajeDescuento(precioUSD, antesUSD),
        pesoLb,
        tallas: leerMulti(p, "Tallas"),
        colores: leerTexto(p, "Colores")
          .split(/[,/·]/)
          .map((c) => c.trim())
          .filter(Boolean),
        enlace: leerUrl(p, "Enlace tienda"),
        coleccion: leerSelect(p, "Colección"),
        destacado: leerCheck(p, "Destacado"),
        precioCOP: manual && manual > 0 ? manual : calcularPrecio({ precioUSD, pesoLb }, parametros).final,
        precioManual: Boolean(manual && manual > 0),
      };
    })
    .filter((x): x is ProductoCatalogo => x !== null)
    .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre));

  return { productos, marcas };
}

const catalogoEnCache = unstable_cache(leerCatalogo, ["catalogo-v1"], { revalidate: 300, tags: ["catalogo"] });

/** Catálogo + marcas (caché de 5 min). Si Notion falla, devuelve listas vacías y la web sigue viva. */
export async function obtenerCatalogo(): Promise<{ productos: ProductoCatalogo[]; marcas: Marca[]; error?: string }> {
  if (!notionConfigurado()) return { productos: [], marcas: [], error: "Notion no está configurado todavía." };
  try {
    return await catalogoEnCache();
  } catch (e) {
    console.error("[notion] Error leyendo el catálogo:", e);
    return { productos: [], marcas: [], error: "No pude leer el catálogo en este momento." };
  }
}

/** Producto del catálogo por ID (para validar precios al recibir un pedido). */
export async function productoPorId(id: string): Promise<ProductoCatalogo | undefined> {
  const { productos } = await obtenerCatalogo();
  return productos.find((p) => p.id === id);
}
