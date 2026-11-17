/**
 * Notion "de mentiras" para probar la web en local sin token (NOTION_MOCK=1).
 * Guarda todo en memoria: al reiniciar `npm run dev` vuelve a los datos iniciales.
 * Nunca se usa en Vercel a menos que pongas NOTION_MOCK=1 (no lo hagas).
 */
import { DS } from "./ids";
import type { NotionMinimo } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;
type Pagina = { object: "page"; id: string; url: string; created_time: string; properties: Props; parent: string };

const rt = (s: string) => [{ type: "text", plain_text: s, text: { content: s } }];

/** Convierte el formato de ESCRITURA de Notion al formato de LECTURA. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aLectura(v: any): any {
  if (v == null || typeof v !== "object") return v;
  if ("type" in v && (v.type === "formula" || v.type === "rollup" || v.type === "unique_id")) return v;
  if ("title" in v) return { type: "title", title: v.title.map((t: { text: { content: string } }) => rt(t.text.content)[0]) };
  if ("rich_text" in v)
    return { type: "rich_text", rich_text: v.rich_text.map((t: { text: { content: string } }) => rt(t.text.content)[0]) };
  if ("number" in v) return { type: "number", number: v.number };
  if ("checkbox" in v) return { type: "checkbox", checkbox: v.checkbox };
  if ("select" in v) return { type: "select", select: v.select };
  if ("multi_select" in v) return { type: "multi_select", multi_select: v.multi_select };
  if ("status" in v) return { type: "status", status: v.status };
  if ("url" in v) return { type: "url", url: v.url };
  if ("phone_number" in v) return { type: "phone_number", phone_number: v.phone_number };
  if ("date" in v) return { type: "date", date: v.date };
  if ("relation" in v) return { type: "relation", relation: v.relation };
  if ("files" in v) return { type: "files", files: v.files };
  return v;
}

const W = {
  t: (s: string) => ({ title: [{ text: { content: s } }] }),
  x: (s: string) => ({ rich_text: s ? [{ text: { content: s } }] : [] }),
  n: (n: number | null) => ({ number: n }),
  c: (b: boolean) => ({ checkbox: b }),
  s: (s: string | null) => ({ select: s ? { name: s } : null }),
  st: (s: string) => ({ status: { name: s } }),
  m: (a: string[]) => ({ multi_select: a.map((name) => ({ name })) }),
  u: (s: string | null) => ({ url: s }),
  d: (s: string | null) => ({ date: s ? { start: s } : null }),
  r: (ids: string[]) => ({ relation: ids.map((id) => ({ id })) }),
  fn: (n: number | null) => ({ type: "formula", formula: { type: "number", number: n } }),
  fs: (s: string | null) => ({ type: "formula", formula: { type: "string", string: s } }),
  fb: (b: boolean) => ({ type: "formula", formula: { type: "boolean", boolean: b } }),
  rn: (n: number | null) => ({ type: "rollup", rollup: { type: "number", number: n } }),
};

let contador = 1000;
const nuevoId = () => `00000000-0000-4000-8000-${String(++contador).padStart(12, "0")}`;

function semilla(): Pagina[] {
  const hoy = new Date();
  const dia = (d: number) => new Date(hoy.getTime() + d * 864e5).toISOString().slice(0, 10);
  const mk = (parent: string, props: Props, id = nuevoId()): Pagina => ({
    object: "page",
    id,
    url: `https://www.notion.so/${id.replace(/-/g, "")}`,
    created_time: new Date().toISOString(),
    parent,
    properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, aLectura(v)])),
  });

  const gym = "00000000-0000-4000-8000-000000000001";
  const vs = "00000000-0000-4000-8000-000000000002";
  const ana = "00000000-0000-4000-8000-000000000010";
  const caro = "00000000-0000-4000-8000-000000000011";
  const p1 = "00000000-0000-4000-8000-000000000020";
  const p2 = "00000000-0000-4000-8000-000000000021";
  const p3 = "00000000-0000-4000-8000-000000000022";
  const param = "00000000-0000-4000-8000-000000000030";

  const catalogo: [string, number, number, number, boolean][] = [
    ["Everyday Seamless Leggings", 26.6, 38, 0.5, true],
    ["Whitney High-Rise Leggings", 32.4, 54, 0.5, true],
    ["Adapt Solid Leggings", 36, 60, 0.5, false],
    ["SoftSense Sports Bra", 26.6, 38, 0.3, true],
    ["Cosy Luxe Joggers", 28, 56, 1, false],
    ["SoftSense Jacket", 44.8, 64, 1, false],
  ];

  return [
    mk(
      DS.parametros,
      {
        Versión: W.t("V-001"),
        "Tarifa casillero (USD por lb)": W.n(5),
        "Colchón cambiario": W.n(0),
        "TRM referencia (COP por USD)": W.n(null),
        "Margen objetivo": W.n(null),
        "Comisiones (% del precio)": W.n(null),
        "Es ejemplo": W.c(false),
      },
      param,
    ),
    mk(
      DS.marcas,
      {
        Marca: W.t("Gymshark"),
        "Tienda oficial": W.u("https://www.gymshark.com"),
        "Descripción corta": W.x("Ropa deportiva que se ve tan bien en el gym como en la calle."),
        "Promo activa": W.x("Black Friday · hasta 50% off"),
        "Tablero de Pinterest": W.u(null),
        Destacada: W.c(true),
        Activa: W.c(true),
        Orden: W.n(1),
      },
      gym,
    ),
    mk(
      DS.marcas,
      {
        Marca: W.t("Victoria's Secret"),
        "Tienda oficial": W.u("https://www.victoriassecret.com"),
        "Descripción corta": W.x("Pijamas, brasieres y body mists."),
        "Promo activa": W.x(""),
        "Tablero de Pinterest": W.u("https://www.pinterest.com/pinterest/official-news/"),
        Destacada: W.c(true),
        Activa: W.c(true),
        Orden: W.n(2),
      },
      vs,
    ),
    ...catalogo.map(([nombre, usd, antes, lb, dest]) =>
      mk(DS.catalogo, {
        Producto: W.t(nombre),
        Marca: W.r([gym]),
        Categoría: W.s("Ropa"),
        "Precio USD": W.n(usd),
        "Precio antes USD": W.n(antes),
        "Peso estimado (lb)": W.n(lb),
        Tallas: W.m(["XS", "S", "M", "L", "XL"]),
        Colores: W.x(nombre.includes("Jacket") ? "Negro, Gris" : "Negro, Rosa, Azul marino"),
        Colección: W.s("Black Friday Gymshark"),
        Activo: W.c(true),
        Destacado: W.c(dest),
        "Precio final manual (COP)": W.n(null),
        Foto: { files: [] },
      }),
    ),
    mk(
      DS.clientes,
      {
        Cliente: W.t("Ana Prueba"),
        WhatsApp: { phone_number: "+57 300 111 2233" },
        Instagram: W.x("@ana.prueba"),
        Ciudad: W.x("Bucaramanga"),
        "Es ejemplo": W.c(false),
      },
      ana,
    ),
    mk(
      DS.clientes,
      {
        Cliente: W.t("Carolina Demo"),
        WhatsApp: { phone_number: "3004445566" },
        Instagram: W.x(""),
        Ciudad: W.x("Floridablanca"),
        "Es ejemplo": W.c(false),
      },
      caro,
    ),
    mk(
      DS.pedidos,
      {
        Pedido: W.t("Leggings + top Ana"),
        ID: { type: "unique_id", unique_id: { number: 12, prefix: null } },
        Cliente: W.r([ana]),
        Etapa: W.st("En tránsito a Colombia"),
        "Fecha de cotización": W.d(dia(-15)),
        "Fecha de confirmación": W.d(dia(-12)),
        "Fecha prometida": W.d(dia(3)),
        "Total acordado (COP)": W.rn(264800),
        "Pagado (COP)": W.rn(132400),
        "Saldo por cobrar (COP)": W.fn(132400),
        "Estado financiero": W.fs("Anticipo recibido"),
        "Utilidad estimada (COP)": W.fn(48000),
        Alerta: W.fs(""),
        Atrasado: W.fb(false),
        "Es ejemplo": W.c(false),
      },
      p1,
    ),
    mk(
      DS.pedidos,
      {
        Pedido: W.t("Joggers Carolina"),
        ID: { type: "unique_id", unique_id: { number: 13, prefix: null } },
        Cliente: W.r([caro]),
        Etapa: W.st("Pendiente de compra"),
        "Fecha de cotización": W.d(dia(-5)),
        "Fecha de confirmación": W.d(dia(-2)),
        "Fecha prometida": W.d(dia(-1)),
        "Total acordado (COP)": W.rn(149900),
        "Pagado (COP)": W.rn(75000),
        "Saldo por cobrar (COP)": W.fn(74900),
        "Estado financiero": W.fs("Saldo pendiente"),
        "Utilidad estimada (COP)": W.fn(25000),
        Alerta: W.fs("Fecha prometida vencida"),
        Atrasado: W.fb(true),
        "Es ejemplo": W.c(false),
      },
      p2,
    ),
    mk(
      DS.pedidos,
      {
        Pedido: W.t("Pedido de ejemplo (no debe salir)"),
        ID: { type: "unique_id", unique_id: { number: 1, prefix: null } },
        Etapa: W.st("Confirmado"),
        "Saldo por cobrar (COP)": W.fn(999999),
        "Es ejemplo": W.c(true),
      },
      p3,
    ),
    mk(DS.productos, {
      Producto: W.t("Cosy Luxe Joggers"),
      Pedido: W.r([p2]),
      Variante: W.x("M · Negro"),
      Cantidad: W.n(1),
      Categoría: W.s("Ropa"),
      "Precio unitario (USD)": W.n(28),
      "Precio final (COP)": W.n(149900),
      Enlace: W.u("https://www.gymshark.com/"),
      Compra: W.r([]),
      "Pendiente de comprar": W.fn(1),
      "Es ejemplo": W.c(false),
    }),
    mk(DS.links, {
      Producto: W.t("Body mist Bare Vanilla"),
      Enlace: W.u("https://www.victoriassecret.com/"),
      Tienda: W.s("Victoria's Secret"),
      Foto: W.u(null),
      "Precio USD": W.n(14.95),
      "Precio estimado (COP)": W.n(94900),
      Categoría: W.s("Perfumes"),
      Variante: W.x("250 ml"),
      Cantidad: W.n(1),
      Para: W.s("Idea"),
      Estado: W.st("Nuevo"),
      Notas: W.x("Para la promo de diciembre"),
      "Guardado el": W.d(dia(0)),
    }),
  ];
}

export function crearNotionDePrueba(): NotionMinimo {
  const paginas: Pagina[] = semilla();
  let ultimoIdPedido = 13;
  console.warn("[notion] MODO DE PRUEBA activo (NOTION_MOCK=1): los datos son ficticios y viven en memoria.");

  return {
    dataSources: {
      async query({ data_source_id }) {
        // El modo de prueba ignora filtros: la web siempre vuelve a filtrar en código.
        return { results: paginas.filter((p) => p.parent === data_source_id), has_more: false, next_cursor: null };
      },
      async retrieve({ data_source_id }) {
        return { object: "data_source", id: data_source_id, properties: {} };
      },
    },
    pages: {
      async create({ parent, properties }) {
        const id = nuevoId();
        const props: Props = Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, aLectura(v)]));
        if (parent.data_source_id === DS.pedidos) {
          props.ID = { type: "unique_id", unique_id: { number: ++ultimoIdPedido, prefix: null } };
        }
        const p: Pagina = {
          object: "page",
          id,
          url: `https://www.notion.so/${id.replace(/-/g, "")}`,
          created_time: new Date().toISOString(),
          parent: parent.data_source_id,
          properties: props,
        };
        paginas.push(p);
        console.log(`[notion:prueba] creada página en ${parent.data_source_id}:`, JSON.stringify(properties).slice(0, 300));
        return p;
      },
      async update({ page_id, properties }) {
        const p = paginas.find((x) => x.id === page_id);
        if (!p) throw new Error("Página no encontrada");
        for (const [k, v] of Object.entries(properties ?? {})) p.properties[k] = aLectura(v);
        return p;
      },
      async retrieve({ page_id }) {
        const p = paginas.find((x) => x.id === page_id);
        if (!p) throw new Error("Página no encontrada");
        return p;
      },
    },
  };
}
