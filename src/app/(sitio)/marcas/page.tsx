import type { Metadata } from "next";
import { AvisoNotion, Encabezado2, TarjetasMarcas } from "@/components/Secciones";
import { obtenerCatalogo } from "@/lib/notion/catalogo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Marcas",
  description: "Marcas de EE. UU. que traigo a Colombia, con inspiración de Pinterest y precio final en pesos.",
};

export default async function PaginaMarcas() {
  const { marcas, error } = await obtenerCatalogo();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Encabezado2
        etiqueta="Marcas"
        titulo="Tus marcas favoritas de EE. UU."
        texto="Entra a cada marca para ver sus productos con precio en pesos y un tablero de inspiración."
      />
      {marcas.length === 0 ? <AvisoNotion mensaje={error ?? "Pronto verás aquí las marcas."} /> : <TarjetasMarcas marcas={marcas} />}
    </div>
  );
}
