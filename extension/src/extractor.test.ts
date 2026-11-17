/**
 * Pruebas del detector con páginas de ejemplo que imitan la estructura de
 * Gymshark, Amazon y Sephora. (Las páginas reales cambian seguido: si una deja
 * de detectarse, el popup deja el precio vacío para escribirlo a mano.)
 */
import { beforeEach, describe, expect, it } from "vitest";
import { extraerProducto } from "./extractor";

function pagina(html: string, url: string) {
  window.history.replaceState({}, "", new URL(url).pathname + new URL(url).search);
  document.documentElement.innerHTML = html;
}

beforeEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
});

describe("extraerProducto", () => {
  it("Gymshark: JSON-LD ProductGroup con variantes (toma el precio más bajo en USD)", () => {
    pagina(
      `<head>
        <title>Gymshark Everyday Seamless Leggings - Black | Gymshark</title>
        <meta property="og:image" content="https://cdn.shopify.com/s/files/everyday.jpg">
        <link rel="canonical" href="https://www.gymshark.com/products/gymshark-everyday-seamless-leggings-black">
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"ProductGroup","name":"Everyday Seamless Leggings","brand":{"@type":"Brand","name":"Gymshark"},
          "image":["https://cdn.shopify.com/s/files/everyday-1.jpg"],
          "hasVariant":[{"@type":"Product","name":"XS","offers":{"@type":"Offer","price":"26.60","priceCurrency":"USD"}},
                        {"@type":"Product","name":"S","offers":{"@type":"Offer","price":"26.60","priceCurrency":"USD"}}]}</script>
      </head><body><h1>Everyday Seamless Leggings</h1><span class="price">$26.60</span></body>`,
      "https://www.gymshark.com/products/gymshark-everyday-seamless-leggings-black?utm_source=ig",
    );
    const r = extraerProducto();
    expect(r.nombre).toBe("Everyday Seamless Leggings");
    expect(r.precio).toBe(26.6);
    expect(r.fuentePrecio).toBe("json-ld");
    expect(r.marca).toBe("Gymshark");
    expect(r.imagen).toContain("everyday-1.jpg");
  });

  it("Amazon: sin JSON-LD, precio en .a-offscreen", () => {
    pagina(
      `<head><title>Amazon.com: CeraVe Moisturizing Cream</title>
        <meta property="og:title" content="CeraVe Moisturizing Cream | Body and Face Moisturizer">
        <meta property="og:image" content="https://m.media-amazon.com/images/I/cerave.jpg"></head>
       <body><span id="productTitle"> CeraVe Moisturizing Cream 19 oz </span>
         <div id="corePriceDisplay_desktop_feature_div"><span class="a-price"><span class="a-offscreen">$17.78</span><span aria-hidden="true">$17<sup>78</sup></span></span></div>
         <div class="a-price"><span class="a-offscreen">$1,299.00</span></div></body>`,
      "https://www.amazon.com/dp/B00TTD9BRC?th=1&psc=1",
    );
    const r = extraerProducto();
    expect(r.precio).toBe(17.78);
    expect(r.fuentePrecio).toBe("texto");
    expect(r.nombre).toContain("CeraVe");
    expect(r.imagen).toContain("cerave.jpg");
  });

  it("Sephora: JSON-LD Product con Offer", () => {
    pagina(
      `<head><meta property="og:title" content="Lip Sleeping Mask - LANEIGE | Sephora">
        <script type="application/ld+json">[{"@type":"BreadcrumbList"},{"@context":"http://schema.org","@type":"Product","name":"Lip Sleeping Mask Intense Hydration","brand":"LANEIGE",
          "image":"https://www.sephora.com/productimages/sku/s1966286-main-zoom.jpg",
          "offers":[{"@type":"Offer","price":24.00,"priceCurrency":"USD","availability":"InStock"}]}]</script></head>
       <body><h1>Lip Sleeping Mask</h1></body>`,
      "https://www.sephora.com/product/lip-sleeping-mask-P420652?skuId=1966286",
    );
    const r = extraerProducto();
    expect(r.precio).toBe(24);
    expect(r.nombre).toBe("Lip Sleeping Mask Intense Hydration");
    expect(r.marca).toBe("LANEIGE");
  });

  it("Metas og:price:amount cuando no hay JSON-LD", () => {
    pagina(
      `<head><meta property="og:title" content="Bolso tote">
        <meta property="og:price:amount" content="89.50"><meta property="og:price:currency" content="USD"></head><body></body>`,
      "https://tienda.com/bolso",
    );
    const r = extraerProducto();
    expect(r.precio).toBe(89.5);
    expect(r.fuentePrecio).toBe("meta");
  });

  it("Si la moneda no es USD deja el precio vacío", () => {
    pagina(
      `<head><script type="application/ld+json">{"@type":"Product","name":"X","offers":{"price":"120000","priceCurrency":"COP"}}</script></head><body></body>`,
      "https://tienda.co/x",
    );
    expect(extraerProducto().precio).toBeNull();
  });

  it("Sin precio en ningún lado: null", () => {
    pagina(`<head><title>Algo</title></head><body><h1>Algo</h1></body>`, "https://tienda.com/algo");
    const r = extraerProducto();
    expect(r.precio).toBeNull();
    expect(r.nombre).toBe("Algo");
  });
});
