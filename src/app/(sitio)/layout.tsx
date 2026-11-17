import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";

export default function LayoutSitio({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cacao focus:px-4 focus:py-2 focus:text-crema">
        Saltar al contenido
      </a>
      <Encabezado />
      <main id="contenido">{children}</main>
      <Pie />
    </>
  );
}
