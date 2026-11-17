/**
 * POST /api/extension/guardar
 * {
 *   destino: "idea" | "catalogo" | "clienta",
 *   producto, enlace, foto, precioUSD, categoria, variante, cantidad, pesoLb, notas,
 *   clientaId?, pedidoId? (si se agrega a un pedido abierto) | nuevoPedido?: true
 * }
 */
import { CATEGORIAS, PESO_POR_CATEGORIA, type Categoria } from "@/config/negocio";
import { preflight, rechazar, responder } from "@/lib/extension";
import { leerPagina } from "@/lib/notion/client";
import { agregarAPedido, crearEnCatalogo, crearPedidoConProducto, guardarLink, type DatosLink } from "@/lib/notion/links";
import { obtenerParametros } from "@/lib/notion/parametros";
import { leerTitulo } from "@/lib/notion/props";
import { calcularPrecio } from "@/lib/precio";
import { esUrl, limpiarLink } from "@/lib/util";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

const txt = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esId = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{32,36}$/i.test(v);

export async function POST(req: Request) {
  const no = rechazar(req);
  if (no) return no;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = await req.json().catch(() => null);
  if (!b) return responder(req, { ok: false, error: "Datos inválidos" }, 400);

  const destino = b.destino;
  if (!["idea", "catalogo", "clienta"].includes(destino)) return responder(req, { ok: false, error: "Destino inválido" }, 400);
  const enlace = txt(b.enlace, 1500);
  if (enlace && !esUrl(enlace)) return responder(req, { ok: false, error: "Link inválido" }, 400);

  const categoria: Categoria = CATEGORIAS.includes(b.categoria) ? b.categoria : "Otros";
  const precioUSD = Number(b.precioUSD) > 0 ? Math.min(20000, Number(b.precioUSD)) : null;
  const pesoLb = Number(b.pesoLb) > 0 ? Math.min(100, Number(b.pesoLb)) : PESO_POR_CATEGORIA[categoria];
  const parametros = await obtenerParametros();

  const d: DatosLink = {
    producto: txt(b.producto, 200) || "Producto sin nombre",
    enlace: enlace ? limpiarLink(enlace) : "",
    foto: esUrl(txt(b.foto, 1500)) ? txt(b.foto, 1500) : undefined,
    precioUSD,
    // El precio en COP siempre se calcula aquí, con la misma fórmula de la web
    precioCOP: precioUSD ? calcularPrecio({ precioUSD, pesoLb }, parametros).final : null,
    categoria,
    variante: txt(b.variante, 200),
    cantidad: Math.max(1, Math.min(20, Math.round(Number(b.cantidad) || 1))),
    pesoLb,
    notas: txt(b.notas, 1000),
  };

  try {
    if (destino === "idea") {
      const r = await guardarLink({ ...d, para: "Idea" });
      return responder(req, { ok: true, url: r.url, precioCOP: d.precioCOP });
    }

    if (destino === "catalogo") {
      const r = await crearEnCatalogo(d);
      await guardarLink({ ...d, para: "Catálogo", estado: "Revisado" });
      return responder(req, { ok: true, url: r.url, precioCOP: d.precioCOP });
    }

    // destino === "clienta"
    if (!esId(b.clientaId)) return responder(req, { ok: false, error: "Elige la clienta" }, 400);
    if (esId(b.pedidoId)) {
      await agregarAPedido(b.pedidoId, d);
      const pedido = await leerPagina(b.pedidoId);
      await guardarLink({ ...d, para: "Clienta", estado: "Pasado a pedido", clientaId: b.clientaId, pedidoId: b.pedidoId });
      return responder(req, { ok: true, url: pedido.url, precioCOP: d.precioCOP });
    }
    const clienta = await leerPagina(b.clientaId);
    const r = await crearPedidoConProducto(b.clientaId, leerTitulo(clienta, "Cliente"), d);
    await guardarLink({ ...d, para: "Clienta", estado: "Pasado a pedido", clientaId: b.clientaId, pedidoId: r.pedidoId });
    return responder(req, { ok: true, url: r.url, numero: r.numero, precioCOP: d.precioCOP });
  } catch (e) {
    console.error("[extension] Error guardando en Notion:", JSON.stringify({ destino, d }), e);
    return responder(req, { ok: false, error: "Notion no respondió. Lo reintento después." }, 502);
  }
}
