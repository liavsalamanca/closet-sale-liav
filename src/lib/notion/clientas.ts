import "server-only";
import { unstable_cache } from "next/cache";
import { consultarTodo, linkNotion } from "./client";
import { DS } from "./ids";
import { leerCheck, leerNumero, leerRelacion, leerSelect, leerTitulo } from "./props";
import { listarClientas } from "./pedidos";
import { ETAPAS_CERRADAS, type Etapa } from "@/config/negocio";

const clientasEnCache = unstable_cache(listarClientas, ["clientas-v1"], { revalidate: 60, tags: ["panel"] });

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca clientas por nombre, WhatsApp o Instagram (máx. 8 resultados). */
export async function buscarClientas(q: string) {
  const todas = await clientasEnCache();
  const t = sinTildes(q.trim());
  const digitos = q.replace(/\D/g, "");
  const r = !t
    ? todas.slice(0, 8)
    : todas.filter(
        (c) =>
          sinTildes(c.nombre).includes(t) ||
          sinTildes(c.instagram).includes(t.replace(/^@/, "")) ||
          (digitos.length >= 3 && c.whatsapp.replace(/\D/g, "").includes(digitos)),
      );
  return r.slice(0, 8).map((c) => ({ id: c.id, nombre: c.nombre, whatsapp: c.whatsapp, instagram: c.instagram }));
}

/** Pedidos abiertos de una clienta (para agregarle productos). */
export async function pedidosAbiertos(clientaId: string) {
  const filas = await consultarTodo(DS.pedidos, {
    filter: { property: "Cliente", relation: { contains: clientaId } },
  });
  return filas
    .filter((p) => !leerCheck(p, "Es ejemplo") && leerRelacion(p, "Cliente").includes(clientaId))
    .filter((p) => !ETAPAS_CERRADAS.includes(leerSelect(p, "Etapa") as Etapa))
    .map((p) => ({
      id: p.id,
      numero: leerNumero(p, "ID"),
      titulo: leerTitulo(p, "Pedido"),
      etapa: leerSelect(p, "Etapa"),
      url: linkNotion(p.id),
    }))
    .sort((a, b) => (b.numero ?? 0) - (a.numero ?? 0));
}
