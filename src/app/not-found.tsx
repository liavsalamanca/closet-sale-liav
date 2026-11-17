import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NoEncontrada() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <Link href="/" aria-label="closet sale, inicio">
        <Logo />
      </Link>
      <div>
        <p className="etiqueta text-rosegold-oscuro">Error 404</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Esta prenda no está en el clóset</h1>
        <p className="mx-auto mt-4 max-w-md text-rosegold-oscuro">
          La página que buscas no existe o cambió de lugar. Pero tengo muchas cosas lindas esperándote.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/catalogo" className="inline-flex min-h-11 items-center rounded-full bg-cacao px-6 text-sm font-medium text-crema">
          Ver catálogo
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-cacao px-6 text-sm font-medium">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
