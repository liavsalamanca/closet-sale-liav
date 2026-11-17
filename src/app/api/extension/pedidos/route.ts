import { preflight, rechazar, responder } from "@/lib/extension";
import { pedidosAbiertos } from "@/lib/notion/clientas";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

/** GET ?clienta=<id> — pedidos abiertos de una clienta. */
export async function GET(req: Request) {
  const no = rechazar(req);
  if (no) return no;
  const id = new URL(req.url).searchParams.get("clienta") ?? "";
  if (!/^[0-9a-f-]{32,36}$/i.test(id)) return responder(req, { ok: false, error: "Clienta inválida" }, 400);
  try {
    return responder(req, { ok: true, pedidos: await pedidosAbiertos(id) });
  } catch (e) {
    console.error("[extension] pedidos:", e);
    return responder(req, { ok: false, error: "No pude leer los pedidos" }, 502);
  }
}
