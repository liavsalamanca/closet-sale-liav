import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BotonLink } from "@/components/Boton";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { ComoFunciona, Encabezado2, Preguntas, TarjetasMarcas, Tiempos } from "@/components/Secciones";
import { PROMO_ACTIVA } from "@/config/negocio";
import { obtenerCatalogo } from "@/lib/notion/catalogo";

// Se vuelve a generar cada 5 minutos con lo último de Notion
export const revalidate = 300;

export default async function Inicio() {
  const { productos, marcas } = await obtenerCatalogo();
  const destacados = productos.filter((p) => p.destacado).slice(0, 3);
  const marcasDestacadas = marcas.filter((m) => m.destacada).slice(0, 6);
  const maxDescuento = Math.max(0, ...productos.map((p) => p.descuento ?? 0));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <Logo tamano="lg" />
          <p className="mt-8 max-w-xl text-lg text-rosegold-oscuro sm:text-xl">
            Compro por ti en tiendas de Estados Unidos y te lo entrego en Bucaramanga.
            <br className="hidden sm:block" /> <strong className="font-medium text-cacao">Precio final en pesos</strong>, sin
            letra pequeña.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotonLink href="/catalogo">
              Ver catálogo <ArrowRight size={16} aria-hidden />
            </BotonLink>
            <BotonLink href="/cotizador" variante="secundario">
              Cotizar otro producto
            </BotonLink>
          </div>
        </div>
      </section>

      {/* Promo activa */}
      {PROMO_ACTIVA.activa && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="promo">
          <div className="tarjeta flex flex-col items-start gap-6 bg-rosa p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div>
              <p className="etiqueta inline-flex items-center gap-2 rounded-full bg-salmon px-3 py-1.5">
                <Sparkles size={14} aria-hidden /> {PROMO_ACTIVA.etiqueta}
                {maxDescuento > 0 && ` · hasta ${maxDescuento}% off`}
              </p>
              <h2 id="promo" className="mt-4 text-4xl sm:text-6xl">
                {PROMO_ACTIVA.titulo}
              </h2>
              <p className="mt-3 max-w-lg text-rosegold-oscuro">{PROMO_ACTIVA.texto}</p>
            </div>
            <BotonLink href={`/marcas/${PROMO_ACTIVA.marcaSlug}`} className="shrink-0">
              Ver la colección <ArrowRight size={16} aria-hidden />
            </BotonLink>
          </div>
        </section>
      )}

      {/* Destacados */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <Encabezado2 etiqueta="Favoritos" titulo="Lo más pedido" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destacados.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <BotonLink href="/catalogo" variante="secundario">
              Ver todo el catálogo
            </BotonLink>
          </div>
        </section>
      )}

      <ComoFunciona />
      <Tiempos />

      {/* Inspírate por marca */}
      {marcasDestacadas.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <Encabezado2
            etiqueta="Inspírate"
            titulo="Inspírate por marca"
            texto="Mira tableros con lo más lindo de cada marca y mándame lo que te guste: te cotizo el precio final."
          />
          <TarjetasMarcas marcas={marcasDestacadas} />
        </section>
      )}

      <Preguntas />
    </>
  );
}
