import "server-only";
import { unstable_cache } from "next/cache";
import { consultarTodo, linkNotion } from "./client";
import { DS } from "./ids";
import { leerCheck, leerFecha, leerNumero, leerRelacion, leerSelect, leerTexto, leerTitulo, leerUrl } from "./props";
import { listarLinks, type LinkGuardado } from "./links";
import { ETAPAS_CERRADAS, type Etapa } from "@/config/negocio";
import { mesColombia } from "@/lib/util";

/** Etapas en que todavía no hay compromiso de compra. */
const ETAPAS_COTIZACION: Etapa[] = ["Cotizando", "Cotización enviada", "Pendiente de anticipo"];

export type PedidoPanel = {
  id: string;
  url: string;
  numero: number | null;
  titulo: string;
  clienta: string;
  clientaUrl: string | null;
  whatsapp: string;
  etapa: string;
  fechaCotizacion: string | null;
  fechaConfirmacion: string | null;
  fechaPrometida: string | null;
  total: number | null;
  pagado: number | null;
  saldo: number | null;
  estadoFinanciero: string;
  utilidad: number | null;
  alerta: string;
  atrasado: boolean;
};

export type LineaPanel = {
  id: string;
  url: string;
  producto: string;
  variante: string;
  cantidad: number;
  enlace: string;
  precioUSD: number | null;
  precioCOP: number | null;
  tienda: string;
  pedidoNumero: number | null;
  pedidoUrl: string | null;
  clienta: string;
  etapaPedido: string;
};

export type DatosPanel = {
  actualizado: string;
  resumen: { activos: number; porCobrar: number; utilidadMes: number; ventasMes: number; nuevosWeb: number };
  pedidos: PedidoPanel[];
  porComprar: LineaPanel[];
  links: LinkGuardado[];
  avisos: string[];
};

async function leerPanel(): Promise<DatosPanel> {
  const sinEjemplos = { filter: { property: "Es ejemplo", checkbox: { equals: false } } };
  const [filasPedidos, filasClientes, filasLineas, links] = await Promise.all([
    consultarTodo(DS.pedidos, sinEjemplos),
    consultarTodo(DS.clientes),
    consultarTodo(DS.productos, sinEjemplos),
    listarLinks().catch((e) => {
      console.error("[panel] No pude leer Links guardados:", e);
      return [] as LinkGuardado[];
    }),
  ]);

  const clientes = new Map(
    filasClientes.map((c) => [c.id, { nombre: leerTitulo(c, "Cliente"), whatsapp: leerTexto(c, "WhatsApp") }]),
  );

  const pedidos: PedidoPanel[] = filasPedidos
    .filter((p) => !leerCheck(p, "Es ejemplo"))
    .map((p) => {
      const clientaId = leerRelacion(p, "Cliente")[0];
      const c = clientaId ? clientes.get(clientaId) : undefined;
      return {
        id: p.id,
        url: linkNotion(p.id),
        numero: leerNumero(p, "ID"),
        titulo: leerTitulo(p, "Pedido"),
        clienta: c?.nombre ?? "Sin clienta",
        clientaUrl: clientaId ? linkNotion(clientaId) : null,
        whatsapp: c?.whatsapp ?? "",
        etapa: leerSelect(p, "Etapa") || "Cotizando",
        fechaCotizacion: leerFecha(p, "Fecha de cotización"),
        fechaConfirmacion: leerFecha(p, "Fecha de confirmación"),
        fechaPrometida: leerFecha(p, "Fecha prometida"),
        // Fórmulas y rollups: se leen tal cual vienen de Notion
        total: leerNumero(p, "Total acordado (COP)"),
        pagado: leerNumero(p, "Pagado (COP)"),
        saldo: leerNumero(p, "Saldo por cobrar (COP)"),
        estadoFinanciero: leerTexto(p, "Estado financiero"),
        utilidad: leerNumero(p, "Utilidad estimada (COP)"),
        alerta: leerTexto(p, "Alerta"),
        atrasado: leerCheck(p, "Atrasado"),
      };
    })
    .sort((a, b) => (b.numero ?? 0) - (a.numero ?? 0));

  const porId = new Map(pedidos.map((p) => [p.id, p]));
  const cerrada = (e: string) => ETAPAS_CERRADAS.includes(e as Etapa);
  const mes = mesColombia();

  const activos = pedidos.filter((p) => !cerrada(p.etapa));
  const delMes = pedidos.filter(
    (p) =>
      p.fechaConfirmacion &&
      mesColombia(p.fechaConfirmacion.slice(0, 10)) === mes &&
      !["Cancelado", "Rechazada"].includes(p.etapa),
  );

  // Por comprar: líneas sin compra de pedidos ya confirmados
  const porComprar: LineaPanel[] = filasLineas
    .filter((l) => !leerCheck(l, "Es ejemplo"))
    .map((l) => {
      const pedido = porId.get(leerRelacion(l, "Pedido")[0] ?? "");
      const pendienteFormula = leerNumero(l, "Pendiente de comprar");
      const sinCompra = leerRelacion(l, "Compra").length === 0;
      return { l, pedido, pendiente: pendienteFormula != null ? pendienteFormula > 0 : sinCompra };
    })
    .filter(
      ({ pedido, pendiente }) =>
        pendiente && pedido && !cerrada(pedido.etapa) && !ETAPAS_COTIZACION.includes(pedido.etapa as Etapa),
    )
    .map(({ l, pedido }) => ({
      id: l.id,
      url: linkNotion(l.id),
      producto: leerTitulo(l, "Producto"),
      variante: leerTexto(l, "Variante"),
      cantidad: leerNumero(l, "Cantidad") ?? 1,
      enlace: leerUrl(l, "Enlace"),
      precioUSD: leerNumero(l, "Precio unitario (USD)"),
      precioCOP: leerNumero(l, "Precio final (COP)"),
      tienda: leerSelect(l, "Tienda"),
      pedidoNumero: pedido?.numero ?? null,
      pedidoUrl: pedido?.url ?? null,
      clienta: pedido?.clienta ?? "",
      etapaPedido: pedido?.etapa ?? "",
    }));

  const avisos: string[] = [];
  if (pedidos.length > 0 && pedidos.every((p) => p.saldo == null))
    avisos.push("No pude leer 'Saldo por cobrar (COP)'. Revisa que la integración tenga acceso a Pagos.");

  return {
    actualizado: new Date().toISOString(),
    resumen: {
      activos: activos.filter((p) => !ETAPAS_COTIZACION.includes(p.etapa as Etapa)).length,
      porCobrar: activos.reduce((s, p) => s + Math.max(0, p.saldo ?? 0), 0),
      utilidadMes: delMes.reduce((s, p) => s + (p.utilidad ?? 0), 0),
      ventasMes: delMes.reduce((s, p) => s + (p.total ?? 0), 0),
      nuevosWeb: pedidos.filter((p) => p.etapa === "Cotizando").length,
    },
    pedidos,
    porComprar,
    links,
    avisos,
  };
}

const panelEnCache = unstable_cache(leerPanel, ["panel-v1"], { revalidate: 60, tags: ["panel"] });

export async function obtenerDatosPanel(): Promise<DatosPanel> {
  return panelEnCache();
}
