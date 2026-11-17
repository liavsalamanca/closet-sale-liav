/**
 * Ayudantes para LEER y ESCRIBIR propiedades de Notion sin repetir código.
 * Las fórmulas y rollups se leen tal como vienen de Notion (no se recalculan).
 */

// Usamos un tipo flexible: Notion devuelve muchas formas distintas por tipo de propiedad.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PaginaNotion = { id: string; url: string; created_time: string; properties: Record<string, any> };

const prop = (p: PaginaNotion, nombre: string) => p.properties?.[nombre];

const textoPlano = (rich: { plain_text?: string }[] | undefined) => (rich ?? []).map((t) => t.plain_text ?? "").join("");

export function leerTitulo(p: PaginaNotion, nombre: string): string {
  return textoPlano(prop(p, nombre)?.title).trim();
}

export function leerTexto(p: PaginaNotion, nombre: string): string {
  const v = prop(p, nombre);
  if (!v) return "";
  if (v.type === "rich_text") return textoPlano(v.rich_text).trim();
  if (v.type === "title") return textoPlano(v.title).trim();
  if (v.type === "url") return v.url ?? "";
  if (v.type === "phone_number") return v.phone_number ?? "";
  if (v.type === "email") return v.email ?? "";
  if (v.type === "select") return v.select?.name ?? "";
  if (v.type === "status") return v.status?.name ?? "";
  if (v.type === "formula" || v.type === "rollup") {
    const x = leerValor(v);
    return x == null ? "" : String(x);
  }
  return "";
}

export function leerNumero(p: PaginaNotion, nombre: string): number | null {
  const v = prop(p, nombre);
  if (!v) return null;
  if (v.type === "number") return v.number ?? null;
  if (v.type === "unique_id") return v.unique_id?.number ?? null;
  const x = leerValor(v);
  if (typeof x === "number") return x;
  if (typeof x === "string" && x.trim() !== "" && !Number.isNaN(Number(x))) return Number(x);
  return null;
}

export function leerCheck(p: PaginaNotion, nombre: string): boolean {
  const v = prop(p, nombre);
  if (!v) return false;
  if (v.type === "checkbox") return Boolean(v.checkbox);
  const x = leerValor(v);
  if (typeof x === "boolean") return x;
  if (typeof x === "string") return ["true", "sí", "si", "yes", "✓"].includes(x.trim().toLowerCase());
  if (typeof x === "number") return x > 0;
  return false;
}

export function leerSelect(p: PaginaNotion, nombre: string): string {
  const v = prop(p, nombre);
  return v?.select?.name ?? v?.status?.name ?? "";
}

export function leerMulti(p: PaginaNotion, nombre: string): string[] {
  return (prop(p, nombre)?.multi_select ?? []).map((o: { name: string }) => o.name);
}

export function leerUrl(p: PaginaNotion, nombre: string): string {
  return prop(p, nombre)?.url ?? "";
}

export function leerFecha(p: PaginaNotion, nombre: string): string | null {
  const v = prop(p, nombre);
  if (!v) return null;
  if (v.type === "date") return v.date?.start ?? null;
  const x = leerValor(v);
  return typeof x === "string" && /^\d{4}-\d{2}-\d{2}/.test(x) ? x : null;
}

export function leerRelacion(p: PaginaNotion, nombre: string): string[] {
  return (prop(p, nombre)?.relation ?? []).map((r: { id: string }) => r.id);
}

/** URLs de los archivos de una propiedad "Archivos" (las de Notion vencen en ~1 h). */
export function leerArchivos(p: PaginaNotion, nombre: string): string[] {
  return (prop(p, nombre)?.files ?? [])
    .map((f: { type: string; file?: { url: string }; external?: { url: string } }) =>
      f.type === "file" ? f.file?.url : f.external?.url,
    )
    .filter(Boolean);
}

/** Valor "crudo" de una fórmula o rollup: número, texto, booleano o fecha. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function leerValor(v: any): string | number | boolean | null {
  if (!v) return null;
  if (v.type === "formula") {
    const f = v.formula;
    if (!f) return null;
    if (f.type === "number") return f.number ?? null;
    if (f.type === "string") return f.string ?? null;
    if (f.type === "boolean") return f.boolean ?? null;
    if (f.type === "date") return f.date?.start ?? null;
    return null;
  }
  if (v.type === "rollup") {
    const r = v.rollup;
    if (!r) return null;
    if (r.type === "number") return r.number ?? null;
    if (r.type === "date") return r.date?.start ?? null;
    if (r.type === "array") {
      // Para un rollup "mostrar original" tomamos el primer valor útil
      for (const item of r.array ?? []) {
        const x = leerValor(item) ?? (item?.type === "number" ? item.number : null);
        if (x != null) return x;
      }
    }
    return null;
  }
  if (v.type === "number") return v.number ?? null;
  if (v.type === "checkbox") return v.checkbox ?? null;
  if (v.type === "rich_text") return textoPlano(v.rich_text);
  if (v.type === "title") return textoPlano(v.title);
  if (v.type === "select") return v.select?.name ?? null;
  if (v.type === "status") return v.status?.name ?? null;
  if (v.type === "date") return v.date?.start ?? null;
  return null;
}

// ---------- Escritura ----------

const corta = (s: string) => s.slice(0, 1900);

export const escribir = {
  titulo: (s: string) => ({ title: [{ type: "text", text: { content: corta(s) } }] }),
  texto: (s: string) => ({ rich_text: s ? [{ type: "text", text: { content: corta(s) } }] : [] }),
  numero: (n: number | null | undefined) => ({ number: n == null || !Number.isFinite(n) ? null : n }),
  check: (b: boolean) => ({ checkbox: b }),
  select: (s: string | null | undefined) => ({ select: s ? { name: s.replace(/,/g, " ").slice(0, 100) } : null }),
  multi: (arr: string[]) => ({ multi_select: arr.map((name) => ({ name: name.replace(/,/g, " ") })) }),
  status: (s: string) => ({ status: { name: s } }),
  url: (s: string | null | undefined) => ({ url: s ? s : null }),
  telefono: (s: string) => ({ phone_number: s || null }),
  fecha: (iso: string) => ({ date: { start: iso } }),
  relacion: (ids: string[]) => ({ relation: ids.map((id) => ({ id })) }),
};
