import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "principal" | "secundario" | "suave" | "texto";

const estilos: Record<Variante, string> = {
  principal: "bg-cacao text-crema hover:bg-[#2c1f1c] disabled:bg-cacao/50",
  secundario: "border border-cacao text-cacao hover:bg-cacao hover:text-crema bg-transparent",
  suave: "bg-rosa text-cacao hover:bg-[#efcdc9]",
  texto: "text-rosegold-oscuro underline-offset-4 hover:underline px-2",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed";

/** Botón tipo píldora (mínimo 44 px de alto). */
export function Boton({
  variante = "principal",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${base} ${estilos[variante]} ${className}`} {...props} />;
}

/** Link con forma de botón. */
export function BotonLink({
  href,
  variante = "principal",
  className = "",
  children,
  externo,
  ...props
}: { href: string; variante?: Variante; className?: string; children: ReactNode; externo?: boolean } & Omit<
  ComponentProps<"a">,
  "href"
>) {
  const cls = `${base} ${estilos[variante]} ${className}`;
  if (externo || href.startsWith("http")) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
