import { NextResponse } from "next/server";
import { sesionDeRequest } from "@/lib/auth";
import { buscarClientas } from "@/lib/notion/clientas";

export const dynamic = "force-dynamic";

/** GET /api/panel/clientas?q=ana — autocompletar clientas */
export async function GET(req: Request) {
  if (!(await sesionDeRequest(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ ok: true, clientas: await buscarClientas(q) });
  } catch (e) {
    console.error("[panel] Error buscando clientas:", e);
    return NextResponse.json({ ok: false, clientas: [] }, { status: 502 });
  }
}
