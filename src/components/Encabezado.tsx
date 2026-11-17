"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "./Logo";
import { useCarrito } from "@/lib/carrito";

const enlaces = [
  { href: "/catalogo", texto: "Catálogo" },
  { href: "/marcas", texto: "Marcas" },
  { href: "/cotizador", texto: "Cotizador" },
  { href: "/#como-funciona", texto: "Cómo funciona" },
];

export function Encabezado() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { cantidadTotal } = useCarrito();

  // Cierra el menú del celular al cambiar de página
  useEffect(() => setAbierto(false), [ruta]);

  return (
    <header className="sticky top-0 z-40 border-b border-rosegold/20 bg-crema/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          className="inline-flex size-11 items-center justify-center rounded-full md:hidden"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        >
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" aria-label="closet sale LIAV, inicio" className="py-2">
          <Logo tamano="sm" />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className={`etiqueta inline-flex min-h-11 items-center rounded-full px-4 hover:bg-rosa ${
                    ruta.startsWith(e.href) && e.href !== "/#como-funciona" ? "bg-rosa" : ""
                  }`}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/pedido"
          className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-cacao px-4 text-sm font-medium text-crema"
        >
          <ShoppingBag size={18} aria-hidden />
          <span className="hidden sm:inline">Mi pedido</span>
          <span className="sr-only sm:hidden">Mi pedido</span>
          {cantidadTotal > 0 && (
            <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-salmon px-1.5 text-xs font-semibold text-cacao">
              {cantidadTotal}
              <span className="sr-only"> productos</span>
            </span>
          )}
        </Link>
      </div>

      {abierto && (
        <nav id="menu-movil" aria-label="Principal" className="border-t border-rosegold/20 bg-crema md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="etiqueta flex min-h-12 items-center rounded-2xl px-4 hover:bg-rosa">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
