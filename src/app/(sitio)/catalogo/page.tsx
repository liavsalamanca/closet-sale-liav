import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogoConFiltros } from "@/components/CatalogoConFiltros";
import { AvisoNotion, Encabezado2 } from "@/components/Secciones";
import { BotonLink } from "@/components/Boton";
import { obtenerCatalogo } from "@/lib/notion/catalogo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Productos de EE. UU. con precio final en pesos colombianos, entregados en Bucaramanga.",
};

export default async function PaginaCatalogo() {
  const { productos, error } = await obtenerCatalogo();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Encabezado2
        etiqueta="Catálogo"
        titulo="Elige, yo me encargo del resto"
        texto="Todos los precios son finales, en pesos y puestos en Bucaramanga. Agrega lo que te guste a tu pedido y me lo mandas por WhatsApp o Instagram."
      />
      {productos.length === 0 ? (
        <AvisoNotion mensaje={error ?? "Estoy preparando el catálogo."} />
      ) : (
        <Suspense>
          <CatalogoConFiltros productos={productos} />
        </Suspense>
      )}
      <div className="tarjeta mt-16 flex flex-col items-center gap-4 bg-rosa-claro p-10 text-center">
        <h2 className="text-3xl">¿No encuentras lo que buscas?</h2>
        <p className="max-w-md text-rosegold-oscuro">
          Pega el link de cualquier tienda de EE. UU. y mira el precio estimado al instante.
        </p>
        <BotonLink href="/cotizador">Ir al cotizador</BotonLink>
      </div>
    </div>
  );
}
