import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { IconoInstagram as Instagram } from "./Iconos";
import { Logo } from "./Logo";
import { contacto } from "@/lib/contacto";

export function Pie() {
  const c = contacto();
  return (
    <footer className="mt-24 border-t border-rosegold/30 bg-rosa-claro">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col items-start gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-rosegold-oscuro">
            Compro por ti en tiendas de EE. UU. y te lo entrego en Bucaramanga. Precio final en pesos, sin letra pequeña.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <p className="etiqueta mb-3 text-rosegold-oscuro">Explora</p>
          <ul className="space-y-1 text-sm">
            {[
              ["/catalogo", "Catálogo"],
              ["/marcas", "Marcas"],
              ["/cotizador", "Cotizador"],
              ["/pedido", "Mi pedido"],
              ["/#preguntas", "Preguntas frecuentes"],
            ].map(([href, t]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-9 items-center hover:underline">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="etiqueta mb-3 text-rosegold-oscuro">Escríbeme</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={c.linkWhatsApp("¡Hola Lia! Quiero cotizar algo")}
                className="inline-flex min-h-11 items-center gap-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} aria-hidden /> WhatsApp
              </a>
            </li>
            <li>
              <a
                href={c.perfilInstagram}
                className="inline-flex min-h-11 items-center gap-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} aria-hidden /> @{c.instagram}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-rosegold-oscuro">
        © {new Date().getFullYear()} closet sale · LIAV · Bucaramanga, Colombia. Las marcas mencionadas pertenecen a sus dueños;
        closet sale es un servicio independiente de compras por encargo.
      </p>
    </footer>
  );
}
