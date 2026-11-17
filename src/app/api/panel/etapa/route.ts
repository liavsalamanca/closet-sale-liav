import { NextResponse } from "next/server";
import { sesionDeRequest } from "@/lib/auth";
import { ETAPAS } from "@/config/negocio";
import { actualizarPagina, leerPagina } from "@/lib/notion/client";
import { escribir, leerFecha } from "@/lib/notion/props";
import { refrescarPanel } from "@/lib/notion/pedidos";
import { hoyColombia } from "@/lib/util";

export const dynamic = "force-dynamic";

/** POST /api/panel/etapa { pedidoId, etapa } — cambia la Etapa del pedido en Notion. */
export async function POST(req: Request) {
  if (!(await sesionDeRequest(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const { pedidoId, etapa } = await req.json().catch(() => ({}));
  if (typeof pedidoId !== "string" || !/^[0-9a-f-]{32,36}$/i.test(pedidoId) || !ETAPAS.includes(etapa)) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = { Etapa: escribir.status(etapa) };
    // Al confirmar, si no tiene fecha de confirmación, la ponemos hoy
    if (etapa === "Confirmado") {
      const p = await leerPagina(pedidoId);
      if (!leerFecha(p, "Fecha de confirmación")) cambios["Fecha de confirmación"] = escribir.fecha(hoyColombia());
    }
    await actualizarPagina(pedidoId, cambios);
    refrescarPanel();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[panel] Error cambiando etapa:", e);
    return NextResponse.json({ ok: false, error: "Notion no aceptó el cambio." }, { status: 502 });
  }
}
