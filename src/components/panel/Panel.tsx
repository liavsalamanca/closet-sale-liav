"use client";
/**
 * Panel privado de Lia. Lee Notion a través de /api/panel/datos
 * y se actualiza solo cada 60 segundos.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  ShoppingCart,
  Wallet,
  Columns3,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { formatoCOP, formatoUSD } from "@/lib/precio";
import type { DatosPanel, PedidoPanel } from "@/lib/notion/panel";
import { LinksGuardados } from "./LinksGuardados";

const SECCIONES = [
  { id: "resumen", texto: "Resumen", icono: LayoutDashboard },
  { id: "tablero", texto: "Tablero", icono: Columns3 },
  { id: "cobrar", texto: "Por cobrar", icono: Wallet },
  { id: "comprar", texto: "Por comprar", icono: ShoppingCart },
  { id: "entregas", texto: "Entregas", icono: CalendarClock },
  { id: "links", texto: "Links guardados", icono: Link2 },
] as const;
type Seccion = (typeof SECCIONES)[number]["id"];

const CERRADAS = ["Entregado", "Cancelado", "Rechazada"];
const COTIZACION = ["Cotizando", "Cotización enviada", "Pendiente de anticipo"];

export const linkWhatsApp = (numero: string, texto: string) => {
  let d = numero.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("3")) d = "57" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
};

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
    : "—";

const enDias = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

export function Panel({ etapas }: { etapas: string[]; instagram: string }) {
  const [datos, setDatos] = useState<DatosPanel | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [seccion, setSeccion] = useState<Seccion>("resumen");
  const router = useRouter();

  const cargar = useCallback(
    async (fresco = false) => {
      setCargando(true);
      try {
        const r = await fetch(`/api/panel/datos${fresco ? "?fresco=1" : ""}`, { cache: "no-store" });
        if (r.status === 401) {
          router.replace("/panel/entrar");
          return;
        }
        const j = await r.json();
        if (j.ok) {
          setDatos(j.datos);
          setError("");
        } else setError(j.error ?? "No pude leer Notion.");
      } catch {
        setError("Sin conexión. Reintento en un minuto.");
      } finally {
        setCargando(false);
      }
    },
    [router],
  );

  // Primera carga + refresco automático cada 60 s (solo con la pestaña visible)
  useEffect(() => {
    const primera = setTimeout(() => cargar(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, 60_000);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(primera);
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  // Recordar la sección elegida
  useEffect(() => {
    const t = setTimeout(() => {
      const s = sessionStorage.getItem("panel-seccion") as Seccion | null;
      if (s && SECCIONES.some((x) => x.id === s)) setSeccion(s);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => sessionStorage.setItem("panel-seccion", seccion), [seccion]);

  async function cambiarEtapa(p: PedidoPanel, etapa: string) {
    const anterior = p.etapa;
    setDatos((d) => d && { ...d, pedidos: d.pedidos.map((x) => (x.id === p.id ? { ...x, etapa } : x)) });
    const r = await fetch("/api/panel/etapa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId: p.id, etapa }),
    }).catch(() => null);
    if (!r?.ok) {
      setDatos((d) => d && { ...d, pedidos: d.pedidos.map((x) => (x.id === p.id ? { ...x, etapa: anterior } : x)) });
      alert("No se pudo guardar el cambio en Notion. Intenta de nuevo.");
    } else {
      setTimeout(() => cargar(true), 1500);
    }
  }

  async function salir() {
    await fetch("/api/panel/salir", { method: "POST" });
    router.replace("/panel/entrar");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Ir a la web">
            <Logo tamano="sm" />
          </Link>
          <span className="etiqueta rounded-full bg-rosa px-3 py-1">Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-xs text-rosegold-oscuro sm:block" aria-live="polite">
            {datos &&
              `Actualizado ${new Date(datos.actualizado).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}`}
          </p>
          <button
            onClick={() => cargar(true)}
            disabled={cargando}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cacao px-4 text-sm font-medium text-crema disabled:opacity-60"
          >
            {cargando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />}
            Actualizar ahora
          </button>
          <button
            onClick={salir}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-rosa"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden />
          </button>
        </div>
      </header>

      <nav aria-label="Secciones del panel" className="-mx-4 mb-6 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {SECCIONES.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setSeccion(s.id)}
                aria-current={seccion === s.id ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm ${
                  seccion === s.id ? "bg-cacao text-crema" : "bg-blanco hover:bg-rosa"
                }`}
              >
                <s.icono size={16} aria-hidden />
                {s.texto}
                {s.id === "links" && datos && datos.links.filter((l) => l.estado === "Nuevo").length > 0 && (
                  <span className="rounded-full bg-salmon px-2 text-xs text-cacao">
                    {datos.links.filter((l) => l.estado === "Nuevo").length}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {error && (
        <p role="alert" className="tarjeta mb-6 flex items-center gap-2 bg-rosa-claro p-4 text-sm">
          <AlertTriangle size={18} aria-hidden /> {error}
        </p>
      )}
      {datos?.avisos.map((a) => (
        <p key={a} className="tarjeta mb-6 bg-rosa-claro p-4 text-sm">
          {a}
        </p>
      ))}

      {!datos ? (
        <p className="flex items-center gap-2 text-rosegold-oscuro">
          <Loader2 className="animate-spin" size={18} aria-hidden /> Leyendo tu Notion…
        </p>
      ) : (
        <>
          {seccion === "resumen" && <Resumen datos={datos} ir={setSeccion} />}
          {seccion === "tablero" && <Tablero pedidos={datos.pedidos} etapas={etapas} onEtapa={cambiarEtapa} />}
          {seccion === "cobrar" && <PorCobrar pedidos={datos.pedidos} />}
          {seccion === "comprar" && <PorComprar datos={datos} />}
          {seccion === "entregas" && <Entregas pedidos={datos.pedidos} />}
          {seccion === "links" && <LinksGuardados links={datos.links} recargar={() => cargar(true)} />}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------

function Cifra({ titulo, valor, detalle, onClick }: { titulo: string; valor: string; detalle?: string; onClick?: () => void }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className="tarjeta flex flex-col gap-2 p-6 text-left transition-colors hover:bg-rosa-claro">
      <span className="etiqueta text-rosegold-oscuro">{titulo}</span>
      <span className="font-display text-4xl italic">{valor}</span>
      {detalle && <span className="text-xs text-rosegold-oscuro">{detalle}</span>}
    </C>
  );
}

function Resumen({ datos, ir }: { datos: DatosPanel; ir: (s: Seccion) => void }) {
  const r = datos.resumen;
  const nuevos = datos.pedidos.filter((p) => p.etapa === "Cotizando").slice(0, 8);
  const mes = new Date().toLocaleDateString("es-CO", { month: "long" });
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Cifra titulo="Pedidos activos" valor={String(r.activos)} detalle="Confirmados en camino" onClick={() => ir("tablero")} />
        <Cifra titulo="Por cobrar" valor={formatoCOP(r.porCobrar)} detalle="Saldo por cobrar" onClick={() => ir("cobrar")} />
        <Cifra titulo={`Utilidad de ${mes}`} valor={formatoCOP(r.utilidadMes)} detalle="Estimada, por fecha de confirmación" />
        <Cifra titulo={`Ventas de ${mes}`} valor={formatoCOP(r.ventasMes)} detalle="Total acordado" />
        <Cifra
          titulo="Nuevos (Cotizando)"
          valor={String(r.nuevosWeb)}
          detalle="Pedidos por cotizar"
          onClick={() => ir("tablero")}
        />
      </div>
      <section>
        <h2 className="mb-4 text-3xl">Pedidos por cotizar</h2>
        {nuevos.length === 0 ? (
          <p className="text-rosegold-oscuro">No hay pedidos nuevos. ✓</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {nuevos.map((p) => (
              <li key={p.id} className="tarjeta flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    #{p.numero} · {p.clienta}
                  </p>
                  <p className="truncate text-sm text-rosegold-oscuro">
                    {p.titulo} · {fecha(p.fechaCotizacion)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {p.whatsapp && (
                    <a
                      href={linkWhatsApp(
                        p.whatsapp,
                        `¡Hola ${p.clienta.split(" ")[0]}! Te escribo por tu pedido #${p.numero} de closet sale.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-11 items-center justify-center rounded-full bg-rosa"
                      aria-label={`Escribir a ${p.clienta} por WhatsApp`}
                    >
                      <MessageCircle size={18} aria-hidden />
                    </a>
                  )}
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-11 items-center justify-center rounded-full hover:bg-rosa"
                    aria-label="Abrir en Notion"
                  >
                    <ExternalLink size={18} aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SelectorEtapa({
  p,
  etapas,
  onEtapa,
}: {
  p: PedidoPanel;
  etapas: string[];
  onEtapa: (p: PedidoPanel, e: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">Etapa del pedido #{p.numero}</span>
      <select className="campo min-h-11 py-2 text-sm" value={p.etapa} onChange={(e) => onEtapa(p, e.target.value)}>
        {etapas.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
    </label>
  );
}

function TarjetaPedido({
  p,
  etapas,
  onEtapa,
}: {
  p: PedidoPanel;
  etapas: string[];
  onEtapa: (p: PedidoPanel, e: string) => void;
}) {
  return (
    <article className="tarjeta flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            #{p.numero} · {p.clienta}
          </p>
          <p className="truncate text-xs text-rosegold-oscuro">{p.titulo}</p>
        </div>
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-rosa"
          aria-label={`Abrir pedido #${p.numero} en Notion`}
        >
          <ExternalLink size={16} aria-hidden />
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-1 text-xs">
        <dt className="text-rosegold-oscuro">Total</dt>
        <dd className="text-right font-medium">{formatoCOP(p.total)}</dd>
        <dt className="text-rosegold-oscuro">Saldo</dt>
        <dd className="text-right font-medium">{formatoCOP(p.saldo)}</dd>
        {p.fechaPrometida && (
          <>
            <dt className="text-rosegold-oscuro">Prometido</dt>
            <dd className="text-right">{fecha(p.fechaPrometida)}</dd>
          </>
        )}
      </dl>
      {(p.alerta || p.atrasado) && (
        <p className="flex items-center gap-1 rounded-xl bg-rosa-claro px-2 py-1 text-xs">
          <AlertTriangle size={14} aria-hidden /> {p.alerta || "Atrasado"}
        </p>
      )}
      <SelectorEtapa p={p} etapas={etapas} onEtapa={onEtapa} />
    </article>
  );
}

function Tablero({
  pedidos,
  etapas,
  onEtapa,
}: {
  pedidos: PedidoPanel[];
  etapas: string[];
  onEtapa: (p: PedidoPanel, e: string) => void;
}) {
  const [verCerrados, setVerCerrados] = useState(false);
  const columnas = etapas.filter((e) => verCerrados || !CERRADAS.includes(e));
  return (
    <div>
      <label className="mb-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={verCerrados}
          onChange={(e) => setVerCerrados(e.target.checked)}
          className="size-5 accent-cacao"
        />
        Mostrar entregados, cancelados y rechazados
      </label>
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex gap-4">
          {columnas.map((e) => {
            const suyos = pedidos.filter((p) => p.etapa === e);
            return (
              <section
                key={e}
                className="w-72 shrink-0 rounded-[24px] bg-rosa-claro p-3"
                aria-label={`${e}: ${suyos.length} pedidos`}
              >
                <h3 className="etiqueta mb-3 flex items-center justify-between px-1 not-italic">
                  <span className="font-sans">{e}</span>
                  <span className="rounded-full bg-blanco px-2 py-0.5">{suyos.length}</span>
                </h3>
                <div className="flex flex-col gap-3">
                  {suyos.map((p) => (
                    <TarjetaPedido key={p.id} p={p} etapas={etapas} onEtapa={onEtapa} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PorCobrar({ pedidos }: { pedidos: PedidoPanel[] }) {
  const lista = pedidos
    .filter((p) => (p.saldo ?? 0) > 0 && !["Cancelado", "Rechazada"].includes(p.etapa))
    .sort((a, b) => (b.saldo ?? 0) - (a.saldo ?? 0));
  const total = lista.reduce((s, p) => s + (p.saldo ?? 0), 0);
  if (lista.length === 0) return <p className="text-rosegold-oscuro">Nadie te debe nada. ✓</p>;
  return (
    <div>
      <p className="mb-4">
        Total por cobrar: <strong>{formatoCOP(total)}</strong>
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {lista.map((p) => (
          <li key={p.id} className="tarjeta flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium">
                #{p.numero} · {p.clienta}
              </p>
              <p className="text-sm text-rosegold-oscuro">
                {p.estadoFinanciero || "Pendiente"} · {p.etapa}
              </p>
              <p className="text-sm">
                Saldo <strong>{formatoCOP(p.saldo)}</strong> de {formatoCOP(p.total)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {p.whatsapp && (
                <a
                  href={linkWhatsApp(
                    p.whatsapp,
                    `¡Hola ${p.clienta.split(" ")[0]}! Te escribo de closet sale por tu pedido #${p.numero}. El saldo pendiente es ${formatoCOP(p.saldo)}. ¡Gracias!`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cacao px-4 text-sm text-crema"
                >
                  <MessageCircle size={16} aria-hidden /> Cobrar
                </a>
              )}
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-rosa"
                aria-label="Abrir en Notion"
              >
                <ExternalLink size={18} aria-hidden />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PorComprar({ datos }: { datos: DatosPanel }) {
  const lista = datos.porComprar;
  const porTienda = useMemo(() => {
    const m = new Map<string, typeof lista>();
    for (const l of lista) m.set(l.tienda || "Sin tienda", [...(m.get(l.tienda || "Sin tienda") ?? []), l]);
    return [...m.entries()];
  }, [lista]);
  if (lista.length === 0) return <p className="text-rosegold-oscuro">No hay nada pendiente por comprar. ✓</p>;
  return (
    <div className="space-y-8">
      {porTienda.map(([tienda, lineas]) => (
        <section key={tienda}>
          <h2 className="mb-3 text-3xl">{tienda}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {lineas.map((l) => (
              <li key={l.id} className="tarjeta flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {l.cantidad} × {l.producto}
                  </p>
                  <p className="text-sm text-rosegold-oscuro">
                    {[l.variante, l.precioUSD != null && `${formatoUSD(l.precioUSD)} c/u`].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-rosegold-oscuro">
                    Pedido #{l.pedidoNumero} · {l.clienta} · {l.etapaPedido}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {l.enlace && (
                    <a
                      href={l.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 rounded-full bg-rosa px-3 text-sm"
                    >
                      Tienda <ExternalLink size={14} aria-hidden />
                    </a>
                  )}
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-11 items-center justify-center rounded-full hover:bg-rosa"
                    aria-label="Abrir línea en Notion"
                  >
                    <ExternalLink size={18} aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Entregas({ pedidos }: { pedidos: PedidoPanel[] }) {
  const h = hoy();
  const en14 = enDias(14);
  const activos = pedidos.filter((p) => !CERRADAS.includes(p.etapa) && !COTIZACION.includes(p.etapa));
  const atrasados = activos.filter((p) => p.atrasado || (p.fechaPrometida && p.fechaPrometida.slice(0, 10) < h));
  const proximos = activos
    .filter((p) => !atrasados.includes(p) && p.fechaPrometida && p.fechaPrometida.slice(0, 10) <= en14)
    .sort((a, b) => (a.fechaPrometida ?? "").localeCompare(b.fechaPrometida ?? ""));
  const sinFecha = activos.filter((p) => !p.fechaPrometida && !atrasados.includes(p));

  return (
    <div className="space-y-10">
      <ListaEntregas titulo="Atrasados" lista={atrasados} vacio="Ningún pedido atrasado. ✓" />
      <ListaEntregas titulo="Próximos 14 días" lista={proximos} vacio="No hay entregas prometidas en los próximos 14 días." />
      {sinFecha.length > 0 && <ListaEntregas titulo="Sin fecha prometida" lista={sinFecha} vacio="" />}
    </div>
  );
}

function ListaEntregas({ titulo, lista, vacio }: { titulo: string; lista: PedidoPanel[]; vacio: string }) {
  return (
    <section>
      <h2 className="mb-3 text-3xl">{titulo}</h2>
      {lista.length === 0 ? (
        <p className="text-rosegold-oscuro">{vacio}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id} className="tarjeta flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  #{p.numero} · {p.clienta}
                </p>
                <p className="text-sm text-rosegold-oscuro">
                  {p.etapa} · prometido {fecha(p.fechaPrometida)}
                </p>
                {p.alerta && <p className="text-xs">{p.alerta}</p>}
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-rosa"
                aria-label="Abrir en Notion"
              >
                <ExternalLink size={18} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
