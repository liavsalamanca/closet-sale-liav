/**
 * Configuración del negocio — edita aquí sin miedo.
 * Todo lo que cambia seguido (TRM, margen, tarifas) vive en Notion → Parámetros.
 * Lo de este archivo son valores de respaldo y textos fijos.
 */

export const CATEGORIAS = [
  "Ropa",
  "Accesorios",
  "Bolsos",
  "Zapatos",
  "Maquillaje",
  "Skincare",
  "Perfumes",
  "Tecnología",
  "Otros",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/**
 * Pesos estimados (lb) para el cotizador y la extensión.
 * Puedes elegir el tipo de prenda dentro de cada categoría.
 */
export const PESOS_SUGERIDOS: { etiqueta: string; categoria: Categoria; lb: number }[] = [
  { etiqueta: "Leggings", categoria: "Ropa", lb: 0.5 },
  { etiqueta: "Top / brasier deportivo", categoria: "Ropa", lb: 0.3 },
  { etiqueta: "Camiseta", categoria: "Ropa", lb: 0.4 },
  { etiqueta: "Shorts", categoria: "Ropa", lb: 0.3 },
  { etiqueta: "Joggers", categoria: "Ropa", lb: 1.0 },
  { etiqueta: "Hoodie / buzo", categoria: "Ropa", lb: 1.3 },
  { etiqueta: "Chaqueta", categoria: "Ropa", lb: 1.2 },
  { etiqueta: "Zapatos / tenis", categoria: "Zapatos", lb: 2.5 },
  { etiqueta: "Bolso", categoria: "Bolsos", lb: 1.5 },
  { etiqueta: "Perfume", categoria: "Perfumes", lb: 1.0 },
  { etiqueta: "Maquillaje", categoria: "Maquillaje", lb: 0.4 },
  { etiqueta: "Skincare", categoria: "Skincare", lb: 0.4 },
  { etiqueta: "Accesorio", categoria: "Accesorios", lb: 0.3 },
  { etiqueta: "Tecnología", categoria: "Tecnología", lb: 1.0 },
  { etiqueta: "Otro", categoria: "Otros", lb: 1.0 },
];

/** Peso por defecto de cada categoría (el primero de la lista de arriba). */
export const PESO_POR_CATEGORIA: Record<Categoria, number> = Object.fromEntries(
  CATEGORIAS.map((c) => [c, PESOS_SUGERIDOS.find((p) => p.categoria === c)?.lb ?? 1]),
) as Record<Categoria, number>;

/**
 * Valores de respaldo para la fórmula de precio.
 * Se usan SOLO si el campo correspondiente está vacío en Notion → Parámetros.
 */
export const PRECIO_POR_DEFECTO = {
  /** TRM ya con colchón (COP por USD) */
  trm: 3450,
  /** Colchón cambiario adicional (0 = ya incluido en la TRM de arriba) */
  colchon: 0,
  /** Impuesto de venta USA */
  impuesto: 0.07,
  /** Tarifa del casillero (USD por libra) */
  tarifaLb: 5,
  /**
   * Ganancia fija por unidad (COP). Se usa SOLO cuando en Notion
   * no hay Margen objetivo ni Comisiones. Si hay margen/comisión, mandan ellos.
   */
  gananciaFija: 25000,
};

/** Tiempos de entrega que se muestran en la web (días hábiles aprox.). */
export const TIEMPOS_ENTREGA = {
  texto: "Entre 10 y 20 días hábiles desde que confirmas tu pedido.",
  detalle: [
    { paso: "Compra en la tienda", dias: "1–2 días" },
    { paso: "Llega a mi casillero en Miami", dias: "3–7 días" },
    { paso: "Viaja a Bucaramanga", dias: "5–10 días" },
    { paso: "Te lo entrego", dias: "1–2 días" },
  ],
};

/** Etapas del pedido (en el mismo orden del tablero de Notion). */
export const ETAPAS = [
  "Cotizando",
  "Cotización enviada",
  "Pendiente de anticipo",
  "Confirmado",
  "Pendiente de compra",
  "Comprado",
  "En tránsito USA",
  "Recibido en casillero",
  "En consolidación",
  "En tránsito a Colombia",
  "En revisión o aduana",
  "Recibido en Bucaramanga",
  "Listo para entregar",
  "Con incidencia",
  "Entregado",
  "Cancelado",
  "Rechazada",
] as const;
export type Etapa = (typeof ETAPAS)[number];

/** Etapas que ya no cuentan como "pedido activo". */
export const ETAPAS_CERRADAS: Etapa[] = ["Entregado", "Cancelado", "Rechazada"];

/** Preguntas frecuentes de la página de inicio. */
export const PREGUNTAS_FRECUENTES = [
  {
    p: "¿El precio que veo es el final?",
    r: "Sí. El precio en pesos ya incluye el producto, los impuestos de EE. UU., el envío hasta Bucaramanga y mi servicio. Sin letra pequeña.",
  },
  {
    p: "¿Cómo pago?",
    r: "Cuando te confirmo la cotización por WhatsApp o Instagram, pagas un anticipo para que yo haga la compra y el saldo cuando tu pedido llega.",
  },
  {
    p: "¿Puedo pedir algo que no está en el catálogo?",
    r: "¡Claro! Usa el cotizador: pega el link del producto y el precio en dólares, y te muestro un precio estimado al instante.",
  },
  {
    p: "¿Qué pasa si la talla no me queda?",
    r: "Te ayudo a elegir la talla antes de comprar con las guías de cada marca. Como son compras en el exterior, los cambios dependen de la tienda; lo hablamos antes de comprar.",
  },
  {
    p: "¿Hacen envíos a otras ciudades?",
    r: "Sí, entrego en Bucaramanga y envío a otras ciudades de Colombia por transportadora (el envío nacional se cotiza aparte).",
  },
];

/** Promo activa que se muestra en el inicio. */
export const PROMO_ACTIVA = {
  activa: true,
  etiqueta: "Black Friday",
  titulo: "Gymshark con hasta 50% off",
  texto: "Descuentos desde el 30%. Precio final en pesos, puesto en Bucaramanga.",
  marcaSlug: "gymshark",
};
