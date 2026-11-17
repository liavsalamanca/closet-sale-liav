/**
 * POST /api/pedido — recibe el pedido de la web y lo guarda en Notion.
 * La clienta no necesita Notion: todo pasa aquí, en el servidor.
 *
 * Si Notion falla, respondemos igual (guardado: false) para que la web
 * abra WhatsApp/Instagram con el mensaje: ningún pedido se pierde.
 */
import { NextResponse } from "next/server";
import { CATEGORIAS, PESO_POR_CATEGORIA, type Categoria } from "@/config/negocio";
import { ipDe, permitido } from "@/lib/limite";
import { notionConfigurado } from "@/lib/notion/client";
import { obtenerCatalogo } from "@/lib/notion/catalogo";
import { obtenerParametros } from "@/lib/notion/parametros";
import { buscarOCrearClienta, crearLinea, crearPedido, refrescarPanel } from "@/lib/notion/pedidos";
import { calcularPrecio } from "@/lib/precio";
import { esUrl, hoyColombia, limpiarLink, normalizarWhatsApp } from "@/lib/util";
import type { ItemCarrito } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const txt = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  // 1) Honeypot: los robots llenan el campo oculto "sitio_web". Fingimos éxito.
  if (txt(body?.sitio_web)) {
    return NextResponse.json({ ok: true, guardado: false, numero: null });
  }

  // 2) Validación
  const datos = {
    nombre: txt(body?.datos?.nombre, 100),
    whatsapp: txt(body?.datos?.whatsapp, 30),
    instagram: txt(body?.datos?.instagram, 60).replace(/^@?/, "@").replace(/^@$/, ""),
    ciudad: txt(body?.datos?.ciudad, 80),
    contacto: body?.datos?.contacto === "Instagram" ? ("Instagram" as const) : ("WhatsApp" as const),
    notas: txt(body?.datos?.notas, 1000),
  };
  const errores: Record<string, string> = {};
  if (datos.nombre.length < 2) errores.nombre = "Escribe tu nombre";
  if (normalizarWhatsApp(datos.whatsapp).length < 10) errores.whatsapp = "Escribe un WhatsApp válido";
  if (!datos.ciudad) errores.ciudad = "Escribe tu ciudad";

  const entrada: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 30) : [];
  if (entrada.length === 0) errores.items = "Tu pedido está vacío";
  if (Object.keys(errores).length) return NextResponse.json({ ok: false, errores }, { status: 400 });

  // 3) Límite de envíos: 5 pedidos cada 10 minutos por IP
  const ip = ipDe(req);
  if (!permitido(`pedido:${ip}`, 5, 10 * 60_000)) {
    console.warn(`[pedido] Límite de envíos alcanzado para ${ip}`);
    return NextResponse.json({ ok: false, guardado: false, error: "Demasiados envíos seguidos" }, { status: 429 });
  }

  // 4) Recalculamos precios en el servidor (no confiamos en lo que manda el navegador)
  const [{ productos }, parametros] = await Promise.all([obtenerCatalogo(), obtenerParametros()]);
  const items: ItemCarrito[] = entrada.map((x) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const i = x as any;
    const categoria: Categoria = CATEGORIAS.includes(i?.categoria) ? i.categoria : "Otros";
    const cantidad = Math.max(1, Math.min(20, Math.round(num(i?.cantidad)) || 1));
    const delCatalogo = i?.tipo === "catalogo" ? productos.find((p) => p.id === i?.catalogoId) : undefined;
    const enlace = esUrl(txt(i?.enlace, 1000)) ? limpiarLink(txt(i?.enlace, 1000)) : undefined;
    if (delCatalogo) {
      return {
        clave: txt(i?.clave, 60),
        tipo: "catalogo",
        catalogoId: delCatalogo.id,
        nombre: delCatalogo.nombre,
        marca: delCatalogo.marca,
        talla: txt(i?.talla, 20) || undefined,
        color: txt(i?.color, 40) || undefined,
        cantidad,
        enlace: delCatalogo.enlace || enlace,
        precioUSD: delCatalogo.precioUSD,
        pesoLb: delCatalogo.pesoLb,
        categoria: delCatalogo.categoria,
        precioCOP: delCatalogo.precioCOP,
      };
    }
    const precioUSD = Math.max(0, Math.min(20000, num(i?.precioUSD)));
    const pesoLb = Math.max(0, Math.min(100, num(i?.pesoLb))) || PESO_POR_CATEGORIA[categoria];
    return {
      clave: txt(i?.clave, 60),
      tipo: "cotizacion",
      nombre: txt(i?.nombre, 150) || "Producto para cotizar",
      marca: txt(i?.marca, 60) || undefined,
      talla: txt(i?.talla, 20) || undefined,
      color: txt(i?.color, 40) || undefined,
      cantidad,
      enlace,
      precioUSD,
      pesoLb,
      categoria,
      precioCOP: calcularPrecio({ precioUSD, pesoLb }, parametros).final,
    };
  });

  // 5) Guardamos en Notion
  if (!notionConfigurado()) {
    console.error("[pedido] Notion no está configurado: el pedido NO se guardó, solo se envía por chat.", { datos, items });
    return NextResponse.json({ ok: false, guardado: false, items });
  }

  // Si el nombre empieza por "PRUEBA", se marca como ejemplo (para probar sin ensuciar tus números)
  const esEjemplo = /^prueba\b/i.test(datos.nombre);

  try {
    const clienta = await buscarOCrearClienta({ ...datos, esEjemplo });
    const pedido = await crearPedido({
      titulo: `Web · ${datos.nombre} · ${hoyColombia()}`,
      clientaId: clienta.id,
      esEjemplo,
      notas: [
        `Pedido desde la web. Prefiere contacto por ${datos.contacto}.`,
        datos.instagram ? `Instagram: ${datos.instagram}` : "",
        `Ciudad: ${datos.ciudad}`,
        datos.notas ? `Notas de la clienta: ${datos.notas}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    for (const i of items) {
      await crearLinea(
        pedido.id,
        {
          producto: i.marca && i.tipo === "catalogo" ? `${i.nombre} · ${i.marca}` : i.nombre,
          variante: [i.talla && `Talla ${i.talla}`, i.color].filter(Boolean).join(" · "),
          cantidad: i.cantidad,
          enlace: i.enlace,
          precioUSD: i.precioUSD,
          categoria: i.categoria,
          precioCOP: i.precioCOP,
          pesoLb: i.pesoLb,
          tienda: i.marca,
        },
        esEjemplo,
      );
    }
    refrescarPanel();
    console.log(`[pedido] Guardado pedido #${pedido.numero ?? "?"} (${items.length} productos) de ${datos.nombre}`);
    return NextResponse.json({ ok: true, guardado: true, numero: pedido.numero, items });
  } catch (e) {
    // El pedido no se pierde: la web abre el chat igual. Queda el detalle en el log de Vercel.
    console.error("[pedido] ERROR guardando en Notion. Datos del pedido:", JSON.stringify({ datos, items }), e);
    return NextResponse.json({ ok: false, guardado: false, items });
  }
}
