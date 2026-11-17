/** Utilidades pequeñas que se usan en servidor y navegador. */

export function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deja solo dígitos y agrega 57 a celulares colombianos de 10 dígitos. */
export function normalizarWhatsApp(valor: string): string {
  let d = (valor || "").replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("3")) d = "57" + d;
  return d;
}

/** Compara dos teléfonos por sus últimos 10 dígitos. */
export function mismoTelefono(a: string, b: string): boolean {
  const x = (a || "").replace(/\D/g, "").slice(-10);
  const y = (b || "").replace(/\D/g, "").slice(-10);
  return x.length >= 7 && x === y;
}

/** Quita parámetros de rastreo (utm_*, fbclid, etc.) de un link. */
export function limpiarLink(url: string): string {
  try {
    const u = new URL(url);
    const basura = /^(utm_|fbclid|gclid|gbraid|wbraid|msclkid|mc_|_ga|_gl|igshid|ref_?$|ref_src|spm|clickid|irclickid|cjevent|ranMID|ranEAID|ranSiteID|sc_|epik|pp|psc|smid|th|content-id|pd_rd_|pf_rd_|qid|sr|crid|sprefix|dib|dib_tag|keywords)/i;
    for (const k of [...u.searchParams.keys()]) if (basura.test(k)) u.searchParams.delete(k);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

const TIENDAS_CONOCIDAS: Record<string, string> = {
  "gymshark.com": "Gymshark",
  "amazon.com": "Amazon",
  "sephora.com": "Sephora",
  "nike.com": "Nike",
  "adidas.com": "Adidas",
  "victoriassecret.com": "Victoria's Secret",
  "bathandbodyworks.com": "Bath & Body Works",
  "ulta.com": "Ulta",
  "lululemon.com": "Lululemon",
  "aloyoga.com": "Alo Yoga",
  "zara.com": "Zara",
  "hm.com": "H&M",
  "shein.com": "Shein",
  "target.com": "Target",
  "walmart.com": "Walmart",
  "macys.com": "Macy's",
  "nordstrom.com": "Nordstrom",
  "coach.com": "Coach",
  "michaelkors.com": "Michael Kors",
  "apple.com": "Apple",
  "bestbuy.com": "Best Buy",
  "skims.com": "Skims",
  "abercrombie.com": "Abercrombie",
  "hollisterco.com": "Hollister",
  "americaneagle.com": "American Eagle",
  "ae.com": "American Eagle",
  "aerie.com": "Aerie",
};

/** Nombre bonito de la tienda a partir del link: "www.gymshark.com" → "Gymshark". */
export function tiendaDesdeLink(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const partes = host.split(".");
    const base = partes.slice(-2).join(".");
    if (TIENDAS_CONOCIDAS[host]) return TIENDAS_CONOCIDAS[host];
    if (TIENDAS_CONOCIDAS[base]) return TIENDAS_CONOCIDAS[base];
    const nombre = partes.length >= 2 ? partes[partes.length - 2] : partes[0];
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  } catch {
    return "";
  }
}

/** Fecha de hoy en Colombia (YYYY-MM-DD). */
export function hoyColombia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export function mesColombia(fecha: Date | string = new Date()): string {
  const d = typeof fecha === "string" ? new Date(fecha + (fecha.length === 10 ? "T12:00:00" : "")) : fecha;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit" }).format(d);
}

export function esUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
