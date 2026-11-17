"use client";
/**
 * Tablero de Pinterest con el widget OFICIAL (no descarga ni copia imágenes:
 * Pinterest muestra cada pin con su fuente y se actualiza solo).
 *
 * - El script se carga solo en las páginas que usan este componente (lazyOnload).
 * - Next.js cambia de página sin recargar, así que al montar/cambiar tamaño
 *   volvemos a construir el widget con window.PinUtils.build().
 * - Si a los pocos segundos no apareció (bloqueador, tablero privado o vacío),
 *   mostramos un respaldo con el link directo.
 */
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

declare global {
  interface Window {
    PinUtils?: { build: (el?: HTMLElement) => void };
  }
}

export function PinterestTablero({ url, marca }: { url: string; marca: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [estado, setEstado] = useState<"cargando" | "listo" | "fallo">("cargando");

  // Medimos el contenedor para que el tablero ocupe todo el ancho disponible
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(([e]) => {
      clearTimeout(t);
      t = setTimeout(() => setAncho(Math.floor(e.contentRect.width)), 150);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const construir = useCallback(() => {
    if (!contenedor.current) return;
    window.PinUtils?.build(contenedor.current);
  }, []);

  // Cada vez que cambia el ancho, re-creamos el widget
  useEffect(() => {
    if (!ancho) return;
    construir();
    const revisar = setTimeout(() => {
      const ok = contenedor.current?.querySelector('[class^="PIN_"], [class*=" PIN_"]');
      setEstado(ok ? "listo" : "fallo");
    }, 7000);
    const temprano = setInterval(() => {
      if (contenedor.current?.querySelector('[class^="PIN_"], [class*=" PIN_"]')) {
        setEstado("listo");
        clearInterval(temprano);
      }
    }, 500);
    return () => {
      clearTimeout(revisar);
      clearInterval(temprano);
    };
  }, [ancho, construir]);

  // En celular: columnas de ~150 px → 2 columnas. En pantallas grandes: ~230 px.
  const columna = ancho < 520 ? Math.max(110, Math.floor((ancho - 24) / 2)) : 230;

  return (
    <div>
      <Script src="https://assets.pinterest.com/js/pinit.js" strategy="lazyOnload" onLoad={construir} />
      <div ref={contenedor} className="pinterest-tablero min-h-40 overflow-hidden">
        {ancho > 0 && (
          // La key fuerza a React a crear un <a> nuevo para que PinUtils lo procese de nuevo
          <a
            key={`${url}-${ancho}`}
            data-pin-do="embedBoard"
            data-pin-board-width={String(ancho)}
            data-pin-scale-height="520"
            data-pin-scale-width={String(columna)}
            href={url}
            className={estado === "fallo" ? "hidden" : "text-sm text-rosegold-oscuro"}
          >
            Cargando el tablero de {marca}…
          </a>
        )}
      </div>

      {estado === "fallo" && (
        <div className="tarjeta flex flex-col items-center gap-4 bg-rosa-claro p-8 text-center">
          <p className="text-2xl font-display italic">Mira la inspiración de {marca} en Pinterest</p>
          <p className="max-w-md text-sm text-rosegold-oscuro">
            Parece que el tablero no cargó aquí (a veces pasa con bloqueadores de anuncios). Ábrelo directo:
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cacao px-6 text-sm font-medium text-crema"
          >
            Ver el tablero en Pinterest <ExternalLink size={16} aria-hidden />
          </a>
        </div>
      )}
    </div>
  );
}
