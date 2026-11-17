import type { Metadata } from "next";
import { Cotizador } from "@/components/Cotizador";
import { Encabezado2 } from "@/components/Secciones";
import { obtenerParametros, parametrosPublicos } from "@/lib/notion/parametros";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Cotizador",
  description: "Pega el link de cualquier tienda de EE. UU. y mira al instante el precio estimado en pesos colombianos.",
};

export default async function PaginaCotizador() {
  const parametros = parametrosPublicos(await obtenerParametros());
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Encabezado2
        etiqueta="Cotizador"
        titulo="¿Viste algo que te encantó?"
        texto="Pega el link, escribe el precio en dólares y mira cuánto te sale en pesos, puesto en Bucaramanga."
      />
      <Cotizador parametros={parametros} />
    </div>
  );
}
