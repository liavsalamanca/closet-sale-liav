import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { PinterestTablero } from "@/components/PinterestTablero";
import { LlamadoContacto } from "@/components/Secciones";
import { obtenerCatalogo } from "@/lib/notion/catalogo";

export const revalidate = 300;

export async function generateStaticParams() {
  const { marcas } = await obtenerCatalogo();
  return marcas.map((m) => ({ marca: m.slug }));
}

type Props = { params: Promise<{ marca: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { marca } = await params;
  const { marcas } = await obtenerCatalogo();
  const m = marcas.find((x) => x.slug === marca);
  if (!m) return { title: "Marca" };
  return {
    title: `${m.nombre} en Colombia`,
    description: `${m.nombre} desde EE. UU. con precio final en pesos colombianos. ${m.promo}`.trim(),
  };
}

export default async function PaginaMarca({ params }: Props) {
  const { marca } = await params;
  const { marcas, productos } = await obtenerCatalogo();
  const m = marcas.find((x) => x.slug === marca);
  if (!m) notFound();
  const suyos = productos.filter((p) => p.marcaSlug === m.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="mb-12">
        <p className="etiqueta mb-3 text-rosegold-oscuro">Marca</p>
        <h1 className="text-5xl sm:text-7xl">{m.nombre}</h1>
        {m.promo && <p className="etiqueta mt-5 inline-block rounded-full bg-salmon px-4 py-2 text-cacao">{m.promo}</p>}
        {m.descripcion && <p className="mt-5 max-w-xl text-rosegold-oscuro">{m.descripcion}</p>}
        {m.tiendaOficial && (
          <a
            href={m.tiendaOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-rosegold-oscuro underline-offset-4 hover:underline"
          >
            Ver la tienda oficial <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </header>

      {suyos.length > 0 && (
        <section aria-labelledby="productos-marca" className="mb-20">
          <h2 id="productos-marca" className="mb-8 text-4xl">
            Productos con precio en pesos
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suyos.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="inspirate">
        <div className="mb-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="etiqueta mb-3 text-rosegold-oscuro">Inspírate</p>
            <h2 id="inspirate" className="text-4xl sm:text-5xl">
              Ideas de {m.nombre}
            </h2>
            <p className="mt-4 max-w-xl text-rosegold-oscuro">
              ¿Te gustó algo? Toma captura o copia el link del pin y mándamelo, te cotizo el precio final.
            </p>
          </div>
          <LlamadoContacto mensaje={`¡Hola Lia! Vi algo de ${m.nombre} en tu tablero y quiero cotizarlo:`} />
        </div>
        {m.tableroPinterest ? (
          <PinterestTablero url={m.tableroPinterest} marca={m.nombre} />
        ) : (
          <p className="tarjeta bg-rosa-claro p-8 text-center text-rosegold-oscuro">
            Muy pronto verás aquí el tablero de inspiración de {m.nombre}.
          </p>
        )}
      </section>
    </div>
  );
}
