import { preflight, rechazar, responder } from "@/lib/extension";
import { buscarClientas } from "@/lib/notion/clientas";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

/** GET ?q= — autocompletar clientas. */
export async function GET(req: Request) {
  const no = rechazar(req);
  if (no) return no;
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return responder(req, { ok: true, clientas: await buscarClientas(q) });
  } catch (e) {
    console.error("[extension] clientas:", e);
    return responder(req, { ok: false, error: "No pude leer Clientes en Notion" }, 502);
  }
}
