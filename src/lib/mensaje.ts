/** Arma el mensaje del pedido para WhatsApp / Instagram (se usa en el navegador). */
import { formatoCOP, formatoUSD } from "./precio";
import type { DatosPedido, ItemCarrito } from "./tipos";

export function construirMensaje(opts: {
  numero?: string | number | null;
  items: ItemCarrito[];
  datos: DatosPedido;
}): string {
  const { numero, items, datos } = opts;
  const total = items.reduce((s, i) => s + i.precioCOP * i.cantidad, 0);
  const lineas = items.map((i, n) => {
    const detalle = [i.marca, i.talla && `Talla ${i.talla}`, i.color].filter(Boolean).join(" · ");
    const base = `${n + 1}. ${i.nombre}${detalle ? ` (${detalle})` : ""} x${i.cantidad} — ${formatoCOP(i.precioCOP * i.cantidad)}`;
    if (i.tipo === "cotizacion") {
      return `${base}\n   Cotización: ${formatoUSD(i.precioUSD)} c/u${i.enlace ? `\n   ${i.enlace}` : ""}`;
    }
    return base;
  });

  return [
    `¡Hola Lia! Quiero hacer este pedido${numero ? ` (Pedido #${numero})` : ""}:`,
    "",
    ...lineas,
    "",
    `Total estimado: ${formatoCOP(total)}`,
    "",
    `Nombre: ${datos.nombre}`,
    `WhatsApp: ${datos.whatsapp}`,
    datos.instagram ? `Instagram: ${datos.instagram}` : null,
    `Ciudad: ${datos.ciudad}`,
    datos.notas ? `Notas: ${datos.notas}` : null,
    "",
    "Quedo atenta a la confirmación del precio final.",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}
