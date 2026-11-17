"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TarjetaProducto } from "./TarjetaProducto";
import type { ProductoCatalogo } from "@/lib/tipos";

function Chips({
  titulo,
  opciones,
  valor,
  onChange,
}: {
  titulo: string;
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  if (opciones.length < 2) return null;
  return (
    <fieldset>
      <legend className="etiqueta mb-2 text-rosegold-oscuro">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {["", ...opciones].map((o) => (
          <button
            key={o || "todas"}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={valor === o}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors ${
              valor === o ? "border-cacao bg-cacao text-crema" : "border-rosegold/50 bg-blanco hover:bg-rosa"
            }`}
          >
            {o || "Todas"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CatalogoConFiltros({ productos }: { productos: ProductoCatalogo[] }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [marca, setMarca] = useState(params.get("marca") ?? "");
  const [categoria, setCategoria] = useState(params.get("categoria") ?? "");

  const marcas = useMemo(() => [...new Set(productos.map((p) => p.marca).filter(Boolean))].sort(), [productos]);
  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria))].sort(), [productos]);

  const visibles = productos.filter((p) => (!marca || p.marca === marca) && (!categoria || p.categoria === categoria));

  function actualizar(m: string, c: string) {
    setMarca(m);
    setCategoria(c);
    const q = new URLSearchParams();
    if (m) q.set("marca", m);
    if (c) q.set("categoria", c);
    router.replace(`${ruta}${q.size ? `?${q}` : ""}`, { scroll: false });
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5">
        <Chips titulo="Marca" opciones={marcas} valor={marca} onChange={(v) => actualizar(v, categoria)} />
        <Chips titulo="Categoría" opciones={categorias} valor={categoria} onChange={(v) => actualizar(marca, v)} />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {visibles.length} productos
      </p>
      {visibles.length === 0 ? (
        <p className="tarjeta p-8 text-center text-rosegold-oscuro">No hay productos con esos filtros.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p) => (
            <TarjetaProducto key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
