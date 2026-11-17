"use client";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Info, Plus } from "lucide-react";
import { CATEGORIAS, PESOS_SUGERIDOS, type Categoria } from "@/config/negocio";
import { agregar } from "@/lib/carrito";
import { calcularPrecio, formatoCOP, type ParametrosPrecio } from "@/lib/precio";
import { esUrl, limpiarLink, tiendaDesdeLink } from "@/lib/util";

export function Cotizador({ parametros }: { parametros: ParametrosPrecio }) {
  const id = useId();
  const [enlace, setEnlace] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Ropa");
  const [tipo, setTipo] = useState(PESOS_SUGERIDOS[0].etiqueta);
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  const tipos = PESOS_SUGERIDOS.filter((p) => p.categoria === categoria);
  const peso = tipos.find((t) => t.etiqueta === tipo)?.lb ?? tipos[0]?.lb ?? 1;
  const usd = Number(precio.replace(",", "."));
  const unidad = useMemo(
    () => (usd > 0 ? calcularPrecio({ precioUSD: usd, pesoLb: peso }, parametros).final : 0),
    [usd, peso, parametros],
  );

  function cambiarCategoria(c: Categoria) {
    setCategoria(c);
    setTipo(PESOS_SUGERIDOS.find((p) => p.categoria === c)?.etiqueta ?? "");
  }

  function alAgregar(e: React.FormEvent) {
    e.preventDefault();
    if (!(usd > 0)) {
      setError("Escribe el precio en dólares que ves en la tienda.");
      return;
    }
    if (enlace && !esUrl(enlace.trim())) {
      setError("El link no parece válido. Cópialo completo desde la tienda (empieza por https://).");
      return;
    }
    setError("");
    const link = enlace.trim() ? limpiarLink(enlace.trim()) : undefined;
    agregar({
      tipo: "cotizacion",
      nombre: nombre.trim() || (link ? `Producto de ${tiendaDesdeLink(link)}` : tipo),
      marca: link ? tiendaDesdeLink(link) : undefined,
      talla: talla.trim() || undefined,
      color: color.trim() || undefined,
      cantidad,
      enlace: link,
      precioUSD: usd,
      pesoLb: peso,
      categoria,
      precioCOP: unidad,
    });
    setListo(true);
    setEnlace("");
    setNombre("");
    setPrecio("");
    setTalla("");
    setColor("");
    setCantidad(1);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={alAgregar} className="tarjeta space-y-5 p-6 sm:p-8" noValidate>
        <div>
          <label htmlFor={`${id}-link`} className="etiqueta mb-2 block text-rosegold-oscuro">
            Link del producto
          </label>
          <input
            id={`${id}-link`}
            className="campo"
            type="url"
            inputMode="url"
            placeholder="https://www.tienda.com/producto…"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${id}-nombre`} className="etiqueta mb-2 block text-rosegold-oscuro">
            ¿Qué es? <span className="normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            id={`${id}-nombre`}
            className="campo"
            placeholder="Ej. Tenis Nike Air Max blancos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-precio`} className="etiqueta mb-2 block text-rosegold-oscuro">
              Precio en dólares (USD)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rosegold-oscuro">US$</span>
              <input
                id={`${id}-precio`}
                className="campo pl-14"
                inputMode="decimal"
                placeholder="0,00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value.replace(/[^\d.,]/g, ""))}
                aria-describedby={`${id}-ayuda-precio`}
                required
              />
            </div>
            <p id={`${id}-ayuda-precio`} className="mt-1 text-xs text-rosegold-oscuro">
              El precio con descuento que ves hoy en la tienda.
            </p>
          </div>
          <div>
            <label htmlFor={`${id}-cantidad`} className="etiqueta mb-2 block text-rosegold-oscuro">
              Cantidad
            </label>
            <input
              id={`${id}-cantidad`}
              className="campo"
              type="number"
              min={1}
              max={20}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-cat`} className="etiqueta mb-2 block text-rosegold-oscuro">
              Categoría
            </label>
            <select id={`${id}-cat`} className="campo" value={categoria} onChange={(e) => cambiarCategoria(e.target.value as Categoria)}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {tipos.length > 1 && (
            <div>
              <label htmlFor={`${id}-tipo`} className="etiqueta mb-2 block text-rosegold-oscuro">
                Tipo
              </label>
              <select id={`${id}-tipo`} className="campo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {tipos.map((t) => (
                  <option key={t.etiqueta}>{t.etiqueta}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-talla`} className="etiqueta mb-2 block text-rosegold-oscuro">
              Talla <span className="normal-case tracking-normal">(opcional)</span>
            </label>
            <input id={`${id}-talla`} className="campo" value={talla} onChange={(e) => setTalla(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${id}-color`} className="etiqueta mb-2 block text-rosegold-oscuro">
              Color <span className="normal-case tracking-normal">(opcional)</span>
            </label>
            <input id={`${id}-color`} className="campo" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>

        <p role="alert" className="min-h-5 text-sm font-medium text-[#9b2c2c]">
          {error}
        </p>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema hover:bg-[#2c1f1c]"
        >
          <Plus size={18} aria-hidden /> Agregar a mi pedido
        </button>
        {listo && (
          <p role="status" className="flex items-center justify-center gap-2 text-sm">
            <Check size={16} aria-hidden /> ¡Agregado!{" "}
            <Link href="/pedido" className="font-medium underline">
              Ver mi pedido
            </Link>
          </p>
        )}
      </form>

      <aside className="tarjeta flex h-fit flex-col gap-4 bg-rosa p-8 lg:sticky lg:top-28" aria-live="polite">
        <p className="etiqueta text-rosegold-oscuro">Precio estimado</p>
        <p className="font-display text-6xl italic">{unidad ? formatoCOP(unidad * cantidad) : "$ —"}</p>
        {unidad > 0 && cantidad > 1 && <p className="text-sm text-rosegold-oscuro">{formatoCOP(unidad)} c/u</p>}
        <p className="text-sm">Incluye producto, impuestos de EE. UU., envío hasta Bucaramanga y mi servicio.</p>
        <p className="flex gap-2 rounded-2xl bg-crema/70 p-4 text-sm text-rosegold-oscuro">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          Es un precio estimado: te confirmo el precio final por WhatsApp antes de que pagues.
        </p>
      </aside>
    </div>
  );
}
