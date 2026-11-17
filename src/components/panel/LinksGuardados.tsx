"use client";
/* eslint-disable @next/next/no-img-element -- fotos de referencia guardadas por la extensión, solo visibles en tu panel privado */
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, ShoppingBag, Store, Trash2, UserRound } from "lucide-react";
import { formatoCOP, formatoUSD } from "@/lib/precio";
import { FotoProducto } from "@/components/FotoProducto";
import type { LinkGuardado } from "@/lib/notion/links";

type Clienta = { id: string; nombre: string; whatsapp: string; instagram: string };

const ESTADOS = ["Nuevo", "Revisado", "Pasado a pedido", "Descartado"];

export function LinksGuardados({ links, recargar }: { links: LinkGuardado[]; recargar: () => void }) {
  const [estado, setEstado] = useState("pendientes");
  const [tienda, setTienda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; url?: string } | null>(null);
  const [eligiendo, setEligiendo] = useState<string | null>(null);

  const tiendas = useMemo(() => [...new Set(links.map((l) => l.tienda).filter(Boolean))].sort(), [links]);
  const categorias = useMemo(() => [...new Set(links.map((l) => l.categoria))].sort(), [links]);

  const visibles = links.filter(
    (l) =>
      (estado === "todos" || (estado === "pendientes" ? ["Nuevo", "Revisado"].includes(l.estado) : l.estado === estado)) &&
      (!tienda || l.tienda === tienda) &&
      (!categoria || l.categoria === categoria),
  );

  async function accion(l: LinkGuardado, tipo: "catalogo" | "pedido" | "descartar", clientaId?: string) {
    if (tipo === "pedido" && !l.clientaId && !clientaId) {
      setEligiendo(l.id);
      return;
    }
    setOcupado(l.id + tipo);
    setAviso(null);
    const r = await fetch("/api/panel/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: l.id, accion: tipo, clientaId }),
    }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setOcupado(null);
    setEligiendo(null);
    if (r?.ok) {
      setAviso({
        texto:
          tipo === "catalogo"
            ? "Listo: quedó en Catálogo web como inactivo. Súbele tu foto y márcalo Activo."
            : tipo === "pedido"
              ? "Listo: pedido creado en Cotizando."
              : "Descartado.",
        url: j.url,
      });
      recargar();
    } else {
      setAviso({ texto: j?.error ?? "No se pudo completar. Intenta de nuevo." });
    }
  }

  const filtro = (etiqueta: string, valor: string, set: (v: string) => void, opciones: [string, string][]) => (
    <label className="flex flex-col gap-1">
      <span className="etiqueta text-rosegold-oscuro">{etiqueta}</span>
      <select className="campo min-h-11 py-2 text-sm" value={valor} onChange={(e) => set(e.target.value)}>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {filtro("Estado", estado, setEstado, [
          ["pendientes", "Nuevos y revisados"],
          ["todos", "Todos"],
          ...ESTADOS.map((e) => [e, e] as [string, string]),
        ])}
        {filtro("Tienda", tienda, setTienda, [["", "Todas"], ...tiendas.map((t) => [t, t] as [string, string])])}
        {filtro("Categoría", categoria, setCategoria, [["", "Todas"], ...categorias.map((c) => [c, c] as [string, string])])}
      </div>

      {aviso && (
        <p role="status" className="tarjeta mb-6 bg-rosa-claro p-4 text-sm">
          {aviso.texto}{" "}
          {aviso.url && (
            <a href={aviso.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
              Abrir en Notion
            </a>
          )}
        </p>
      )}

      {visibles.length === 0 ? (
        <p className="text-rosegold-oscuro">No hay links con esos filtros. Guarda productos con la extensión de Chrome.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((l) => (
            <li key={l.id} className="tarjeta flex flex-col overflow-hidden">
              {l.foto ? (
                <img src={l.foto} alt="" loading="lazy" className="aspect-square w-full bg-rosa-claro object-contain" referrerPolicy="no-referrer" />
              ) : (
                <FotoProducto alt={l.producto} className="aspect-square w-full" />
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="etiqueta text-rosegold-oscuro">
                  {l.tienda || "Tienda"} · {l.categoria} · <span className="rounded-full bg-rosa px-2">{l.estado}</span>
                </p>
                <h3 className="text-2xl">{l.producto}</h3>
                <p className="text-sm">
                  {formatoUSD(l.precioUSD)} → <strong>{formatoCOP(l.precioCOP)}</strong>
                  {l.cantidad > 1 && ` · x${l.cantidad}`}
                </p>
                {l.variante && <p className="text-sm text-rosegold-oscuro">{l.variante}</p>}
                {l.notas && <p className="text-sm text-rosegold-oscuro">“{l.notas}”</p>}
                <div className="flex gap-3 text-sm">
                  {l.enlace && (
                    <a href={l.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 underline">
                      Ver en tienda <ExternalLink size={14} aria-hidden />
                    </a>
                  )}
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 underline">
                    Notion <ExternalLink size={14} aria-hidden />
                  </a>
                </div>

                {eligiendo === l.id && (
                  <ElegirClienta onElegir={(c) => accion(l, "pedido", c.id)} onCancelar={() => setEligiendo(null)} />
                )}

                {!["Descartado", "Pasado a pedido"].includes(l.estado) && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <BotonAccion onClick={() => accion(l, "catalogo")} ocupado={ocupado === l.id + "catalogo"} icono={<Store size={16} aria-hidden />}>
                      Pasar al catálogo
                    </BotonAccion>
                    <BotonAccion onClick={() => accion(l, "pedido")} ocupado={ocupado === l.id + "pedido"} icono={<ShoppingBag size={16} aria-hidden />}>
                      Crear pedido para clienta
                    </BotonAccion>
                    <BotonAccion onClick={() => accion(l, "descartar")} ocupado={ocupado === l.id + "descartar"} icono={<Trash2 size={16} aria-hidden />} suave>
                      Descartar
                    </BotonAccion>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BotonAccion({
  children,
  onClick,
  ocupado,
  icono,
  suave,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ocupado: boolean;
  icono: React.ReactNode;
  suave?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={ocupado}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm disabled:opacity-60 ${
        suave ? "hover:bg-rosa" : "border border-cacao hover:bg-cacao hover:text-crema"
      }`}
    >
      {ocupado ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icono}
      {children}
    </button>
  );
}

/** Autocompletar de clientas (desde Notion → Clientes). */
export function ElegirClienta({ onElegir, onCancelar }: { onElegir: (c: Clienta) => void; onCancelar: () => void }) {
  const [q, setQ] = useState("");
  const [lista, setLista] = useState<Clienta[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setCargando(true);
      const r = await fetch(`/api/panel/clientas?q=${encodeURIComponent(q)}`).catch(() => null);
      const j = await r?.json().catch(() => ({}));
      setLista(j?.clientas ?? []);
      setCargando(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="rounded-2xl bg-rosa-claro p-3">
      <label className="etiqueta mb-2 flex items-center gap-2 text-rosegold-oscuro">
        <UserRound size={14} aria-hidden /> ¿Para qué clienta?
        <input className="campo mt-1 min-h-11 py-2 text-sm normal-case tracking-normal" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, WhatsApp o @instagram" autoFocus />
      </label>
      <ul className="max-h-48 overflow-auto">
        {cargando && <li className="p-2 text-sm text-rosegold-oscuro">Buscando…</li>}
        {!cargando && lista.length === 0 && <li className="p-2 text-sm text-rosegold-oscuro">Sin resultados. Créala primero en Notion.</li>}
        {lista.map((c) => (
          <li key={c.id}>
            <button onClick={() => onElegir(c)} className="flex min-h-11 w-full flex-col items-start rounded-xl px-3 py-1 text-left text-sm hover:bg-blanco">
              <span className="font-medium">{c.nombre}</span>
              <span className="text-xs text-rosegold-oscuro">{[c.whatsapp, c.instagram].filter(Boolean).join(" · ")}</span>
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onCancelar} className="mt-1 min-h-11 px-3 text-sm underline">
        Cancelar
      </button>
    </div>
  );
}
