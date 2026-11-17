import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { sesionDeRequest } from "@/lib/auth";
import { notionConfigurado } from "@/lib/notion/client";
import { obtenerDatosPanel } from "@/lib/notion/panel";

export const dynamic = "force-dynamic";

/** GET /api/panel/datos (?fresco=1 para saltarse la caché de 60 s) */
export async function GET(req: Request) {
  if (!(await sesionDeRequest(req))) return NextResponse.json({ ok: false }, { status: 401 });
  if (!notionConfigurado()) {
    return NextResponse.json({ ok: false, error: "Falta NOTION_TOKEN: configura la integración de Notion." }, { status: 503 });
  }
  if (new URL(req.url).searchParams.get("fresco")) revalidateTag("panel", { expire: 0 });
  try {
    const datos = await obtenerDatosPanel();
    return NextResponse.json({ ok: true, datos }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[panel] Error leyendo Notion:", e);
    return NextResponse.json({ ok: false, error: "No pude leer Notion. Intenta de nuevo en un momento." }, { status: 502 });
  }
}
