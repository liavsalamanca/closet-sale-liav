/** Tipos compartidos entre servidor y navegador. */
import type { Categoria } from "@/config/negocio";

export type Marca = {
  id: string;
  nombre: string;
  slug: string;
  tableroPinterest: string;
  tiendaOficial: string;
  descripcion: string;
  promo: string;
  destacada: boolean;
  orden: number;
};

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  marca: string;
  marcaSlug: string;
  categoria: Categoria;
  fotos: string[];
  precioUSD: number;
  antesUSD: number | null;
  descuento: number | null;
  pesoLb: number;
  tallas: string[];
  colores: string[];
  enlace: string;
  coleccion: string;
  destacado: boolean;
  /** Precio final por unidad en COP */
  precioCOP: number;
  precioManual: boolean;
};

/** Una línea del carrito ("Mi pedido"). */
export type ItemCarrito = {
  /** id único de la línea en el carrito */
  clave: string;
  tipo: "catalogo" | "cotizacion";
  catalogoId?: string;
  nombre: string;
  marca?: string;
  talla?: string;
  color?: string;
  cantidad: number;
  enlace?: string;
  precioUSD: number;
  pesoLb: number;
  categoria: Categoria;
  /** precio por unidad (COP) que vio la clienta */
  precioCOP: number;
  foto?: string;
};

export type DatosPedido = {
  nombre: string;
  whatsapp: string;
  instagram?: string;
  ciudad: string;
  contacto: "WhatsApp" | "Instagram";
  notas?: string;
};
