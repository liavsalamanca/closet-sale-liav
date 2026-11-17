/* eslint-disable @next/next/no-img-element -- las fotos vienen de Notion con links firmados; un <img> simple evita gastar la cuota de optimización de Vercel */
import { Monograma } from "./Logo";

/** Foto del producto, o un respaldo bonito con el monograma si aún no hay foto. */
export function FotoProducto({
  src,
  alt,
  className = "",
  compacto = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  compacto?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-rosa to-rosa-claro ${className}`}
        role="img"
        aria-label={`${alt} (foto pronto)`}
      >
        <div className="flex flex-col items-center gap-2 opacity-80">
          <Monograma size={compacto ? 40 : 56} />
          {!compacto && <span className="etiqueta text-rosegold-oscuro">Foto pronto</span>}
        </div>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}
