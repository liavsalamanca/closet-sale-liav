"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { FotoProducto } from "./FotoProducto";
import { agregar } from "@/lib/carrito";
import { formatoCOP, formatoUSD } from "@/lib/precio";
import type { ProductoCatalogo } from "@/lib/tipos";

export function TarjetaProducto({ producto: p }: { producto: ProductoCatalogo }) {
  const id = useId();
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState(p.colores.length === 1 ? p.colores[0] : "");
  const [agregado, setAgregado] = useState(false);
  const [aviso, setAviso] = useState("");

  function alAgregar() {
    if (p.tallas.length > 0 && !talla) {
      setAviso("Elige tu talla");
      return;
    }
    setAviso("");
    agregar({
      tipo: "catalogo",
      catalogoId: p.id,
      nombre: p.nombre,
      marca: p.marca,
      talla: talla || undefined,
      color: color || undefined,
      cantidad: 1,
      enlace: p.enlace || undefined,
      precioUSD: p.precioUSD,
      pesoLb: p.pesoLb,
      categoria: p.categoria,
      precioCOP: p.precioCOP,
      foto: p.fotos[0],
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2200);
  }

  return (
    <article className="tarjeta flex flex-col overflow-hidden" aria-labelledby={`${id}-nombre`}>
      <div className="relative">
        <FotoProducto src={p.fotos[0]} alt={p.nombre} className="aspect-[4/5] w-full" />
        {p.descuento ? (
          <span className="etiqueta absolute left-3 top-3 rounded-full bg-salmon px-3 py-1.5 text-cacao">−{p.descuento}%</span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          {p.marca && (
            <p className="etiqueta text-rosegold-oscuro">
              {p.marcaSlug ? (
                <Link href={`/marcas/${p.marcaSlug}`} className="hover:underline">
                  {p.marca}
                </Link>
              ) : (
                p.marca
              )}
              <span aria-hidden> · </span>
              {p.categoria}
            </p>
          )}
          <h3 id={`${id}-nombre`} className="mt-1 text-2xl">
            {p.nombre}
          </h3>
        </div>

        <div className="flex items-baseline gap-3">
          <p className="text-xl font-semibold">{formatoCOP(p.precioCOP)}</p>
          {p.antesUSD && p.descuento ? (
            <p className="text-sm text-rosegold-oscuro">
              <span className="sr-only">Precio en tienda: </span>
              {formatoUSD(p.precioUSD)} <s className="opacity-80">{formatoUSD(p.antesUSD)}</s>
            </p>
          ) : (
            <p className="text-sm text-rosegold-oscuro">{formatoUSD(p.precioUSD)} en tienda</p>
          )}
        </div>
        <p className="-mt-2 text-xs text-rosegold-oscuro">Precio final puesto en Bucaramanga</p>

        {p.tallas.length > 0 && (
          <fieldset>
            <legend className="etiqueta mb-2 text-rosegold-oscuro">Talla</legend>
            <div className="flex flex-wrap gap-2">
              {p.tallas.map((t) => (
                <label key={t} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`${id}-talla`}
                    value={t}
                    checked={talla === t}
                    onChange={() => {
                      setTalla(t);
                      setAviso("");
                    }}
                    className="peer sr-only"
                  />
                  <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-rosegold/50 px-3 text-sm peer-checked:border-cacao peer-checked:bg-cacao peer-checked:text-crema peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cacao">
                    {t}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {p.colores.length > 0 && (
          <div>
            <label htmlFor={`${id}-color`} className="etiqueta mb-2 block text-rosegold-oscuro">
              Color
            </label>
            <select id={`${id}-color`} className="campo" value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="">Te ayudo a elegir</option>
              {p.colores.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={alAgregar}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema hover:bg-[#2c1f1c]"
          >
            {agregado ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
            {agregado ? "¡Agregado a tu pedido!" : "Agregar a mi pedido"}
          </button>
          <p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-rosegold-oscuro">
            {aviso}
          </p>
        </div>
      </div>
    </article>
  );
}
