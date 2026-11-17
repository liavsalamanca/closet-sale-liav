/**
 * Se inyecta en la página de la tienda (chrome.scripting.executeScript) para
 * detectar nombre, link, foto y precio en USD.
 *
 * IMPORTANTE: esta función debe ser autosuficiente (sin imports ni variables
 * de afuera), porque Chrome la copia tal cual dentro de la página.
 *
 * Orden para el precio:
 *   1) JSON-LD Product / ProductGroup / Offer
 *   2) metas og:price:amount / product:price:amount
 *   3) texto visible con "$"
 */
export type ProductoDetectado = {
  nombre: string;
  url: string;
  imagen: string;
  precio: number | null;
  moneda: string;
  fuentePrecio: "json-ld" | "meta" | "texto" | "";
  marca: string;
};

export function extraerProducto(): ProductoDetectado {
  const meta = (...selectores: string[]) => {
    for (const s of selectores) {
      const v = document.querySelector(s)?.getAttribute("content")?.trim();
      if (v) return v;
    }
    return "";
  };
  const aNumero = (v: unknown): number | null => {
    if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
    if (typeof v !== "string") return null;
    let s = v.replace(/[^\d.,]/g, "");
    if (!s) return null;
    // "1,299.99" → 1299.99 ; "29,99" → 29.99
    if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
    else if (s.includes(",") && /,\d{2}$/.test(s)) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const tipos = (o: Record<string, unknown>) => {
    const t = o["@type"];
    return (Array.isArray(t) ? t : [t]).map((x) => String(x ?? "").toLowerCase());
  };
  const imagenDe = (img: unknown): string => {
    if (!img) return "";
    if (typeof img === "string") return img;
    if (Array.isArray(img)) return imagenDe(img[0]);
    if (typeof img === "object") {
      const o = img as Record<string, unknown>;
      return String(o.url ?? o.contentUrl ?? "");
    }
    return "";
  };

  let nombre = "";
  let imagen = "";
  let marca = "";
  let precio: number | null = null;
  let moneda = "";
  let fuente: ProductoDetectado["fuentePrecio"] = "";

  // ---------- 1) JSON-LD ----------
  const ofertas: { precio: number; moneda: string }[] = [];
  const leerOferta = (o: unknown) => {
    if (!o) return;
    if (Array.isArray(o)) return o.forEach(leerOferta);
    if (typeof o !== "object") return;
    const x = o as Record<string, unknown>;
    const spec = x.priceSpecification as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const specPrecio = Array.isArray(spec) ? spec[0]?.price : spec?.price;
    const p = aNumero(x.price ?? x.lowPrice ?? specPrecio);
    const m = String(x.priceCurrency ?? (Array.isArray(spec) ? spec[0]?.priceCurrency : spec?.priceCurrency) ?? "");
    if (p) ofertas.push({ precio: p, moneda: m.toUpperCase() });
    if (x.offers) leerOferta(x.offers);
  };
  const visitar = (nodo: unknown, profundidad = 0) => {
    if (!nodo || profundidad > 6) return;
    if (Array.isArray(nodo)) return nodo.forEach((n) => visitar(n, profundidad + 1));
    if (typeof nodo !== "object") return;
    const o = nodo as Record<string, unknown>;
    if (o["@graph"]) visitar(o["@graph"], profundidad + 1);
    const t = tipos(o);
    if (t.includes("product") || t.includes("productgroup")) {
      if (!nombre && typeof o.name === "string") nombre = o.name;
      if (!imagen) imagen = imagenDe(o.image);
      if (!marca) {
        const b = o.brand as Record<string, unknown> | string | undefined;
        marca = typeof b === "string" ? b : String(b?.name ?? "");
      }
      leerOferta(o.offers);
      if (o.hasVariant) visitar(o.hasVariant, profundidad + 1);
    } else if (t.includes("offer") || t.includes("aggregateoffer")) {
      leerOferta(o);
    }
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      visitar(JSON.parse(s.textContent || ""));
    } catch {
      /* JSON roto en la página: lo ignoramos */
    }
  });
  if (ofertas.length) {
    const enUSD = ofertas.filter((o) => !o.moneda || o.moneda === "USD");
    const elegidas = enUSD.length ? enUSD : ofertas;
    // Si hay varias (variantes), tomamos el precio más bajo
    const mejor = elegidas.reduce((a, b) => (b.precio < a.precio ? b : a));
    precio = mejor.precio;
    moneda = mejor.moneda || "USD";
    fuente = "json-ld";
  }

  // ---------- 2) Metas ----------
  if (precio == null) {
    const p = aNumero(meta('meta[property="og:price:amount"]', 'meta[property="product:price:amount"]', 'meta[itemprop="price"]'));
    if (p) {
      precio = p;
      moneda = meta('meta[property="og:price:currency"]', 'meta[property="product:price:currency"]', 'meta[itemprop="priceCurrency"]').toUpperCase() || "USD";
      fuente = "meta";
    }
  }

  // ---------- 3) Texto visible con "$" ----------
  if (precio == null) {
    const selectores = [
      "#corePrice_feature_div .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-offscreen",
      ".priceToPay .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".a-price .a-offscreen",
      '[itemprop="price"]',
      '[data-testid*="price" i]',
      '[data-test*="price" i]',
      '[class*="price" i]',
      '[id*="price" i]',
    ];
    buscar: for (const sel of selectores) {
      const els = Array.from(document.querySelectorAll(sel)).slice(0, 40);
      for (const el of els) {
        const texto = (el.getAttribute("content") || el.textContent || "").replace(/\s+/g, " ").trim();
        const m = texto.match(/\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/);
        const p = m ? aNumero(m[1]) : null;
        if (p && p < 20000) {
          precio = p;
          moneda = "USD";
          fuente = "texto";
          break buscar;
        }
      }
    }
  }

  if (!nombre) nombre = meta('meta[property="og:title"]', 'meta[name="twitter:title"]') || document.querySelector("h1")?.textContent?.trim() || document.title;
  if (!imagen) imagen = meta('meta[property="og:image"]', 'meta[property="og:image:secure_url"]', 'meta[name="twitter:image"]');
  if (imagen && !/^https?:/i.test(imagen)) {
    try {
      imagen = new URL(imagen, location.href).toString();
    } catch {
      imagen = "";
    }
  }
  const canonica = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || meta('meta[property="og:url"]');
  let url = location.href;
  try {
    if (canonica) {
      const c = new URL(canonica, location.href);
      if (c.hostname.replace(/^www\./, "") === location.hostname.replace(/^www\./, "")) url = c.toString();
    }
  } catch {
    /* usamos location.href */
  }

  // Si la moneda no es USD, no adivinamos: dejamos el precio vacío para escribirlo a mano
  if (precio != null && moneda && moneda !== "USD") {
    precio = null;
    fuente = "";
  }

  return {
    nombre: nombre.replace(/\s+/g, " ").trim().slice(0, 200),
    url,
    imagen,
    precio: precio != null ? Math.round(precio * 100) / 100 : null,
    moneda: moneda || "USD",
    fuentePrecio: fuente,
    marca: marca.trim(),
  };
}
