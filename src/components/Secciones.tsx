import Link from "next/link";
import { IconoInstagram as Instagram } from "./Iconos";
import { ArrowRight, Calculator, MessageCircle, PackageCheck, Send, ShoppingBag, Truck } from "lucide-react";
import { PREGUNTAS_FRECUENTES, TIEMPOS_ENTREGA } from "@/config/negocio";
import { contacto } from "@/lib/contacto";
import type { Marca } from "@/lib/tipos";

export function Encabezado2({ etiqueta, titulo, texto }: { etiqueta?: string; titulo: string; texto?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      {etiqueta && <p className="etiqueta mb-3 text-rosegold-oscuro">{etiqueta}</p>}
      <h2 className="text-4xl sm:text-5xl">{titulo}</h2>
      {texto && <p className="mt-4 text-rosegold-oscuro">{texto}</p>}
    </div>
  );
}

const pasos = [
  { icono: Send, titulo: "Envíame la prenda", texto: "Elige del catálogo o mándame el link de lo que quieras de cualquier tienda de EE. UU." },
  { icono: Calculator, titulo: "Te cotizo el precio final", texto: "Un solo precio en pesos: producto, impuestos, envío y mi servicio. Sin sorpresas." },
  { icono: ShoppingBag, titulo: "Pagas y yo compro", texto: "Con tu anticipo hago la compra y te aviso cada paso del viaje." },
  { icono: PackageCheck, titulo: "Te llega", texto: "Te lo entrego en Bucaramanga o te lo envío a tu ciudad. Pagas el saldo al recibir." },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <Encabezado2 etiqueta="Así de fácil" titulo="¿Cómo funciona?" />
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="tarjeta flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-rosa">
                <p.icono size={22} aria-hidden />
              </span>
              <span className="font-display text-4xl italic text-rosegold" aria-hidden>
                {i + 1}
              </span>
            </div>
            <h3 className="text-2xl">
              <span className="sr-only">Paso {i + 1}: </span>
              {p.titulo}
            </h3>
            <p className="text-sm text-rosegold-oscuro">{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Tiempos() {
  return (
    <section className="bg-rosa-claro">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="etiqueta mb-3 text-rosegold-oscuro">Tiempos de entrega</p>
          <h2 className="text-4xl sm:text-5xl">De la tienda a tus manos</h2>
          <p className="mt-4 text-rosegold-oscuro">{TIEMPOS_ENTREGA.texto}</p>
        </div>
        <ul className="tarjeta divide-y divide-rosa p-2">
          {TIEMPOS_ENTREGA.detalle.map((d) => (
            <li key={d.paso} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="flex items-center gap-3">
                <Truck size={18} className="text-rosegold" aria-hidden />
                {d.paso}
              </span>
              <span className="etiqueta text-rosegold-oscuro">{d.dias}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Preguntas() {
  return (
    <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
      <Encabezado2 etiqueta="Resolvamos dudas" titulo="Preguntas frecuentes" />
      <div className="space-y-3">
        {PREGUNTAS_FRECUENTES.map((q) => (
          <details key={q.p} className="tarjeta group px-6 py-1 open:pb-5">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q.p}
              <span className="text-2xl text-rosegold transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="text-rosegold-oscuro">{q.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function TarjetasMarcas({ marcas }: { marcas: Marca[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {marcas.map((m) => (
        <li key={m.id}>
          <Link
            href={`/marcas/${m.slug}`}
            className="tarjeta group flex h-full min-h-48 flex-col justify-between gap-6 p-7 transition-transform hover:-translate-y-0.5"
          >
            <div>
              {m.promo && <span className="etiqueta rounded-full bg-salmon px-3 py-1.5 text-cacao">{m.promo}</span>}
              <h3 className="mt-5 text-4xl">{m.nombre}</h3>
              {m.descripcion && <p className="mt-2 text-sm text-rosegold-oscuro">{m.descripcion}</p>}
            </div>
            <span className="etiqueta inline-flex items-center gap-2">
              Ver productos e inspiración <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Botones para escribirme o cotizar (página de marca y otras). */
export function LlamadoContacto({ mensaje }: { mensaje: string }) {
  const c = contacto();
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={c.linkWhatsApp(mensaje)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cacao px-5 text-sm font-medium text-crema"
      >
        <MessageCircle size={18} aria-hidden /> WhatsApp
      </a>
      <a
        href={c.linkInstagram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cacao px-5 text-sm font-medium"
      >
        <Instagram size={18} aria-hidden /> Instagram
      </a>
      <Link href="/cotizador" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rosa px-5 text-sm font-medium">
        <Calculator size={18} aria-hidden /> Cotizador
      </Link>
    </div>
  );
}

export function AvisoNotion({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="tarjeta mx-auto max-w-xl bg-rosa-claro p-6 text-center text-rosegold-oscuro">
      {mensaje} Mientras tanto puedes usar el <Link href="/cotizador" className="underline">cotizador</Link> o escribirme
      por WhatsApp.
    </p>
  );
}
