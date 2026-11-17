import { NextResponse } from "next/server";
import { sesionDeRequest } from "@/lib/auth";
import { accionLink } from "@/lib/notion/links";

export const dynamic = "force-dynamic";

const ACCIONES = ["catalogo", "pedido", "descartar", "revisado"] as const;

/** POST /api/panel/links { id, accion, clientaId? } */
export async function POST(req: Request) {
  if (!(await sesionDeRequest(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const { id, accion, clientaId } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !ACCIONES.includes(accion)) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  try {
    const r = await accionLink(id, accion, typeof clientaId === "string" ? clientaId : undefined);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[panel] Error en acción de link:", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 502 });
  }
}
