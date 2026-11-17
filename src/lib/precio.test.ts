import { describe, expect, it } from "vitest";
import { calcularPrecio, formatoCOP, PARAMETROS_POR_DEFECTO, porcentajeDescuento, precioFinal, redondearPrecio } from "./precio";

describe("redondearPrecio (4.900 / 9.900)", () => {
  it("sube al siguiente precio terminado en 4.900 o 9.900", () => {
    expect(redondearPrecio(131819)).toBe(134900);
    expect(redondearPrecio(136200)).toBe(139900);
    expect(redondearPrecio(140001)).toBe(144900);
  });
  it("deja igual un precio que ya termina en 4.900 o 9.900", () => {
    expect(redondearPrecio(134900)).toBe(134900);
    expect(redondearPrecio(139900)).toBe(139900);
  });
  it("redondea valores pequeños", () => {
    expect(redondearPrecio(100)).toBe(4900);
    expect(redondearPrecio(4901)).toBe(9900);
    expect(redondearPrecio(0)).toBe(0);
  });
});

describe("calcularPrecio con valores por defecto (ganancia fija $25.000)", () => {
  it("Everyday Seamless Leggings: 26,60 USD y 0,5 lb → $134.900", () => {
    const d = calcularPrecio({ precioUSD: 26.6, pesoLb: 0.5 });
    expect(Math.round(d.sinRedondear)).toBe(131819);
    expect(d.final).toBe(134900);
  });

  it("los 6 productos de Black Friday Gymshark", () => {
    const casos: [number, number, number][] = [
      [26.6, 0.5, 134900], // Everyday Seamless Leggings (131.819)
      [32.4, 0.5, 154900], // Whitney High-Rise Leggings (153.230)
      [36.0, 0.5, 169900], // Adapt Solid Leggings (166.519)
      [26.6, 0.3, 129900], // SoftSense Sports Bra (128.369)
      [28.0, 1.0, 149900], // Cosy Luxe Joggers (145.612)
      [44.8, 1.0, 209900], // SoftSense Jacket (207.629)
    ];
    for (const [usd, lb, esperado] of casos) {
      const d = calcularPrecio({ precioUSD: usd, pesoLb: lb });
      expect(d.final).toBe(esperado);
      // el final es el primer precio 4.900/9.900 que no es menor que el valor exacto
      expect(d.final).toBeGreaterThanOrEqual(d.sinRedondear);
      expect(d.final - d.sinRedondear).toBeLessThan(5000);
      expect(d.final % 5000).toBe(4900);
    }
  });

  it("precio 0 da 0", () => {
    expect(precioFinal(0, 0.5)).toBe(0);
  });
});

describe("calcularPrecio con margen y comisión de Notion", () => {
  const p = { ...PARAMETROS_POR_DEFECTO, trm: 4000, colchon: 0.02, margen: 0.25, comision: 0.03 };
  it("aplica costo ÷ (1 − margen − comisión) y el colchón sobre la TRM", () => {
    const d = calcularPrecio({ precioUSD: 26.6, pesoLb: 0.5 }, p);
    expect(d.trmEfectiva).toBeCloseTo(4080);
    // costo = (26.6×1.07 + 0.5×5) × 4080 = 126.324,96
    expect(d.costoCOP).toBeCloseTo(126324.96, 1);
    // 126.324,96 / 0.72 = 175.451,33 → 179.900
    expect(d.final).toBe(179900);
  });
  it("si solo hay comisión, también usa porcentajes", () => {
    const d = calcularPrecio({ precioUSD: 10, pesoLb: 0 }, { ...PARAMETROS_POR_DEFECTO, comision: 0.1 });
    // 10 × 1.07 × 3450 = 36.915 / 0.9 = 41.016,67 → 44.900
    expect(d.final).toBe(44900);
  });
});

describe("utilidades", () => {
  it("porcentajeDescuento", () => {
    expect(porcentajeDescuento(26.6, 38)).toBe(30);
    expect(porcentajeDescuento(28, 56)).toBe(50);
    expect(porcentajeDescuento(30, null)).toBeNull();
  });
  it("formatoCOP usa punto de miles", () => {
    expect(formatoCOP(134900)).toBe("$134.900");
  });
});

import { limpiarLink, tiendaDesdeLink } from "./util";
describe("links", () => {
  it("quita rastreo y deja lo útil", () => {
    expect(limpiarLink("https://www.nike.com/t/x?utm_source=ig&color=white&size=M#reviews")).toBe(
      "https://www.nike.com/t/x?color=white&size=M",
    );
    expect(limpiarLink("https://www.amazon.com/dp/B0?th=1&psc=1&tag=abc-20")).toBe("https://www.amazon.com/dp/B0");
    expect(limpiarLink("https://www.sephora.com/p?skuId=1&src=home")).toBe("https://www.sephora.com/p?skuId=1&src=home");
  });
  it("nombre de tienda", () => {
    expect(tiendaDesdeLink("https://www.gymshark.com/products/x")).toBe("Gymshark");
    expect(tiendaDesdeLink("https://shop.lululemon.com/p/x")).toBe("Lululemon");
    expect(tiendaDesdeLink("https://www.miTienda.com/x")).toBe("Mitienda");
  });
});
