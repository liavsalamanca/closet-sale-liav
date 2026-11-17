"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Loader2, MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
import { IconoInstagram } from "./Iconos";
import { FotoProducto } from "./FotoProducto";
import { useCarrito } from "@/lib/carrito";
import { construirMensaje } from "@/lib/mensaje";
import { formatoCOP, formatoUSD } from "@/lib/precio";
import type { DatosPedido, ItemCarrito } from "@/lib/tipos";
import type { Contacto } from "@/lib/contacto";

type Resultado = { mensaje: string; numero: number | null; contacto: DatosPedido["contacto"]; guardado: boolean };

export function FormularioPedido({ contacto }: { contacto: Contacto }) {
  const id = useId();
  const { items, total, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [datos, setDatos] = useState<DatosPedido>({
    nombre: "",
    whatsapp: "",
    instagram: "",
    ciudad: "Bucaramanga",
    contacto: "WhatsApp",
    notas: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState(false);

  const linkWhatsApp = (m: string) => `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(m)}`;
  const linkInstagram = `https://ig.me/m/${contacto.instagram}`;

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (datos.nombre.trim().length < 2) e.nombre = "Escribe tu nombre";
    if (datos.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "Escribe tu WhatsApp con los 10 dígitos";
    if (!datos.ciudad.trim()) e.ciudad = "Escribe tu ciudad";
    setErrores(e);
    if (Object.keys(e).length) {
      document.getElementById(`${id}-${Object.keys(e)[0]}`)?.focus();
      return false;
    }
    return true;
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      return true;
    } catch {
      return false;
    }
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando || !validar()) return;
    setEnviando(true);
    const form = new FormData(e.currentTarget);

    let numero: number | null = null;
    let guardado = false;
    let itemsFinales: ItemCarrito[] = items;
    try {
      const control = new AbortController();
      const t = setTimeout(() => control.abort(), 12000);
      const r = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos, items, sitio_web: form.get("sitio_web") }),
        signal: control.signal,
      });
      clearTimeout(t);
      const j = await r.json().catch(() => ({}));
      if (r.status === 400 && j.errores) {
        setErrores(j.errores);
        setEnviando(false);
        return;
      }
      numero = j.numero ?? null;
      guardado = Boolean(j.guardado);
      if (Array.isArray(j.items) && j.items.length === items.length) itemsFinales = j.items;
    } catch {
      // Sin conexión con el servidor: seguimos igual, el mensaje va por chat.
    }

    const mensaje = construirMensaje({ numero, items: itemsFinales, datos });
    setResultado({ mensaje, numero, contacto: datos.contacto, guardado });
    vaciar();
    setEnviando(false);

    if (datos.contacto === "WhatsApp") {
      window.location.href = linkWhatsApp(mensaje);
    } else {
      // Instagram no deja precargar el texto: lo copiamos al portapapeles
      await copiar(mensaje);
    }
  }

  // ---------- Pantalla de éxito ----------
  if (resultado) {
    return (
      <div className="tarjeta mx-auto flex max-w-xl flex-col items-center gap-5 p-8 text-center sm:p-12" role="status">
        <CheckCircle2 size={48} className="text-rosegold" aria-hidden />
        <h2 className="text-4xl">¡Tu pedido está listo!</h2>
        {resultado.numero && <p className="etiqueta text-rosegold-oscuro">Pedido #{resultado.numero}</p>}
        {resultado.contacto === "WhatsApp" ? (
          <>
            <p className="text-rosegold-oscuro">
              Te abrí WhatsApp con el mensaje ya escrito. Solo dale enviar. Si no se abrió, toca el botón:
            </p>
            <a
              href={linkWhatsApp(resultado.mensaje)}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema"
            >
              <MessageCircle size={18} aria-hidden /> Abrir WhatsApp
            </a>
          </>
        ) : (
          <>
            <p className="text-rosegold-oscuro">
              {copiado ? "¡Copiado! Pégalo en el chat de Instagram." : "Copia el mensaje y pégalo en el chat de Instagram."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => copiar(resultado.mensaje)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-cacao px-6 text-sm font-medium"
              >
                <Copy size={18} aria-hidden /> {copiado ? "¡Copiado!" : "Copiar mensaje"}
              </button>
              <a
                href={linkInstagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => copiar(resultado.mensaje)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema"
              >
                <IconoInstagram /> Abrir Instagram
              </a>
            </div>
          </>
        )}
        <details className="w-full text-left">
          <summary className="etiqueta min-h-11 cursor-pointer py-3 text-center text-rosegold-oscuro">Ver el mensaje</summary>
          <pre className="whitespace-pre-wrap rounded-2xl bg-crema p-4 font-sans text-sm">{resultado.mensaje}</pre>
        </details>
        <Link href="/catalogo" className="text-sm underline underline-offset-4">
          Seguir mirando el catálogo
        </Link>
      </div>
    );
  }

  // ---------- Carrito vacío ----------
  if (items.length === 0) {
    return (
      <div className="tarjeta mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <h2 className="text-3xl">Tu pedido está vacío</h2>
        <p className="text-rosegold-oscuro">
          Agrega productos del catálogo o cotiza lo que quieras de cualquier tienda de EE. UU.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/catalogo"
            className="inline-flex min-h-11 items-center rounded-full bg-cacao px-6 text-sm font-medium text-crema"
          >
            Ver catálogo
          </Link>
          <Link
            href="/cotizador"
            className="inline-flex min-h-11 items-center rounded-full border border-cacao px-6 text-sm font-medium"
          >
            Ir al cotizador
          </Link>
        </div>
      </div>
    );
  }

  const campo = (nombre: keyof DatosPedido, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${id}-${nombre}`} className="etiqueta mb-2 block text-rosegold-oscuro">
        {etiqueta}
      </label>
      <input
        id={`${id}-${nombre}`}
        className="campo"
        value={datos[nombre] ?? ""}
        onChange={(e) => setDatos({ ...datos, [nombre]: e.target.value })}
        aria-invalid={Boolean(errores[nombre])}
        aria-describedby={errores[nombre] ? `${id}-${nombre}-error` : undefined}
        {...extra}
      />
      {errores[nombre] && (
        <p id={`${id}-${nombre}-error`} className="mt-1 text-sm font-medium text-[#9b2c2c]">
          {errores[nombre]}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      {/* Lista de productos */}
      <section aria-labelledby={`${id}-lista`}>
        <h2 id={`${id}-lista`} className="mb-5 text-3xl">
          Tus productos
        </h2>
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.clave} className="tarjeta flex gap-4 p-4">
              <FotoProducto src={i.foto} alt={i.nombre} className="size-24 shrink-0 overflow-hidden rounded-2xl" compacto />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="etiqueta text-rosegold-oscuro">{i.tipo === "cotizacion" ? "Cotización" : i.marca}</p>
                <p className="font-medium">{i.nombre}</p>
                <p className="text-sm text-rosegold-oscuro">
                  {[i.talla && `Talla ${i.talla}`, i.color, i.tipo === "cotizacion" && `${formatoUSD(i.precioUSD)} c/u`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {i.enlace && (
                  <a
                    href={i.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-rosegold-oscuro underline"
                  >
                    {i.enlace}
                  </a>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1" role="group" aria-label={`Cantidad de ${i.nombre}`}>
                    <button
                      type="button"
                      className="inline-flex size-11 items-center justify-center rounded-full border border-rosegold/50"
                      onClick={() => cambiarCantidad(i.clave, i.cantidad - 1)}
                      aria-label="Quitar una unidad"
                      disabled={i.cantidad <= 1}
                    >
                      <Minus size={16} aria-hidden />
                    </button>
                    <span className="w-8 text-center" aria-live="polite">
                      {i.cantidad}
                    </span>
                    <button
                      type="button"
                      className="inline-flex size-11 items-center justify-center rounded-full border border-rosegold/50"
                      onClick={() => cambiarCantidad(i.clave, i.cantidad + 1)}
                      aria-label="Agregar una unidad"
                    >
                      <Plus size={16} aria-hidden />
                    </button>
                  </div>
                  <p className="font-semibold">{formatoCOP(i.precioCOP * i.cantidad)}</p>
                  <button
                    type="button"
                    onClick={() => quitar(i.clave)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-rosegold-oscuro hover:bg-rosa"
                  >
                    <Trash2 size={16} aria-hidden /> Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="tarjeta mt-4 flex items-center justify-between bg-rosa p-6">
          <span className="etiqueta">Total estimado</span>
          <span className="font-display text-4xl italic">{formatoCOP(total)}</span>
        </div>
        <p className="mt-3 text-sm text-rosegold-oscuro">
          Los productos cotizados son un estimado: te confirmo el precio final antes de que pagues. El pago se hace por WhatsApp o
          Instagram (anticipo + saldo), no en esta página.
        </p>
      </section>

      {/* Datos de la clienta */}
      <form onSubmit={enviar} className="tarjeta h-fit space-y-5 p-6 sm:p-8" noValidate aria-labelledby={`${id}-form`}>
        <h2 id={`${id}-form`} className="text-3xl">
          Tus datos
        </h2>
        {campo("nombre", "Nombre", { autoComplete: "name", required: true })}
        {campo("whatsapp", "WhatsApp", {
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
          placeholder: "300 123 4567",
          required: true,
        })}
        {campo("instagram", "Usuario de Instagram (opcional)", { placeholder: "@tuusuario", autoCapitalize: "none" })}
        {campo("ciudad", "Ciudad", { autoComplete: "address-level2", required: true })}

        <fieldset>
          <legend className="etiqueta mb-2 text-rosegold-oscuro">¿Por dónde te escribo?</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["WhatsApp", "Instagram"] as const).map((c) => (
              <label key={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="contacto"
                  value={c}
                  checked={datos.contacto === c}
                  onChange={() => setDatos({ ...datos, contacto: c })}
                  className="peer sr-only"
                />
                <span className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-rosegold/50 text-sm peer-checked:border-cacao peer-checked:bg-cacao peer-checked:text-crema peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cacao">
                  {c === "WhatsApp" ? <MessageCircle size={18} aria-hidden /> : <IconoInstagram />}
                  {c}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${id}-notas`} className="etiqueta mb-2 block text-rosegold-oscuro">
            Notas (opcional)
          </label>
          <textarea
            id={`${id}-notas`}
            className="campo min-h-24"
            value={datos.notas}
            onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
            placeholder="Ej. si no hay en negro, lo quiero en gris"
          />
        </div>

        {/* Campo trampa para robots: las personas no lo ven */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={`${id}-sitio`}>No llenes este campo</label>
          <input id={`${id}-sitio`} name="sitio_web" tabIndex={-1} autoComplete="off" />
        </div>

        {errores.items && <p className="text-sm font-medium text-[#9b2c2c]">{errores.items}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema hover:bg-[#2c1f1c] disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : datos.contacto === "WhatsApp" ? (
            <MessageCircle size={18} aria-hidden />
          ) : (
            <IconoInstagram />
          )}
          {enviando ? "Enviando…" : `Enviar pedido por ${datos.contacto}`}
        </button>
      </form>
    </div>
  );
}
