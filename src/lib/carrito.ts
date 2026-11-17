"use client";
/**
 * Carrito "Mi pedido" guardado en el navegador (localStorage).
 * Se comparte entre pestañas y sobrevive si la clienta cierra la página.
 */
import { useSyncExternalStore } from "react";
import type { ItemCarrito } from "./tipos";

const CLAVE = "closetsale-pedido-v1";
const vacio: ItemCarrito[] = [];
let cache: ItemCarrito[] | null = null;
const oyentes = new Set<() => void>();

function leer(): ItemCarrito[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(CLAVE);
    const datos = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(datos) ? datos : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function guardar(items: ItemCarrito[]) {
  cache = items;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    /* modo privado: el carrito vive solo en memoria */
  }
  oyentes.forEach((f) => f());
}

function suscribir(f: () => void) {
  oyentes.add(f);
  const alCambiarOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) {
      cache = null;
      f();
    }
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(f);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

export function useCarrito() {
  const items = useSyncExternalStore(suscribir, leer, () => vacio);
  return {
    items,
    cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
    total: items.reduce((s, i) => s + i.precioCOP * i.cantidad, 0),
    agregar,
    cambiarCantidad,
    quitar,
    vaciar: () => guardar([]),
  };
}

export function agregar(item: Omit<ItemCarrito, "clave">) {
  const items = leer();
  // Si ya existe el mismo producto con la misma talla/color, sumamos cantidad
  const igual = items.find(
    (i) =>
      i.tipo === item.tipo &&
      i.catalogoId === item.catalogoId &&
      i.nombre === item.nombre &&
      i.talla === item.talla &&
      i.color === item.color &&
      i.enlace === item.enlace &&
      i.precioUSD === item.precioUSD,
  );
  if (igual) {
    guardar(items.map((i) => (i === igual ? { ...i, cantidad: Math.min(20, i.cantidad + item.cantidad) } : i)));
  } else {
    guardar([...items, { ...item, clave: crypto.randomUUID() }]);
  }
}

export function cambiarCantidad(clave: string, cantidad: number) {
  guardar(leer().map((i) => (i.clave === clave ? { ...i, cantidad: Math.max(1, Math.min(20, cantidad)) } : i)));
}

export function quitar(clave: string) {
  guardar(leer().filter((i) => i.clave !== clave));
}
