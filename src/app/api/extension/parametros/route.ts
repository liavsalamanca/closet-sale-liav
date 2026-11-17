import { PESOS_SUGERIDOS, CATEGORIAS } from "@/config/negocio";
import { preflight, rechazar, responder } from "@/lib/extension";
import { obtenerParametros, parametrosPublicos } from "@/lib/notion/parametros";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

/** GET — parámetros de precio (los mismos de la web) para calcular en la extensión. */
export async function GET(req: Request) {
  const no = rechazar(req);
  if (no) return no;
  const p = await obtenerParametros();
  return responder(req, {
    ok: true,
    parametros: parametrosPublicos(p),
    version: p.versionNombre,
    origen: p.origen,
    categorias: CATEGORIAS,
    pesos: PESOS_SUGERIDOS,
  });
}
