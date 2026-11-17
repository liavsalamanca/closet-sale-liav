/**
 * Revisa que la integración de Notion tenga acceso a todas las bases y que
 * existan las propiedades que usa la web. También muestra la fórmula de
 * "Precio sugerido (COP)" para compararla con la de la web.
 *
 * Uso:  npm run revisar-notion
 * (lee NOTION_TOKEN de .env.local)
 */
import { readFileSync, existsSync } from "node:fs";
import { Client } from "@notionhq/client";

if (!process.env.NOTION_TOKEN && existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.NOTION_TOKEN) {
  console.error("✗ Falta NOTION_TOKEN en .env.local");
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const BASES = {
  "Pedidos y cotizaciones": {
    id: "bce2c5b2-87ac-4271-8455-f29bce1887f9",
    props: ["Pedido", "ID", "Cliente", "Etapa", "Modalidad", "Fecha de cotización", "Fecha de confirmación", "Fecha prometida",
      "Notas y compromisos", "Versión de parámetros", "Es ejemplo", "Total acordado (COP)", "Pagado (COP)", "Saldo por cobrar (COP)",
      "Estado financiero", "Utilidad estimada (COP)", "Alerta", "Atrasado"],
  },
  "Productos de los pedidos": {
    id: "8e82b5a1-1caf-451e-9c26-bdec0594b401",
    props: ["Producto", "Pedido", "Variante", "Cantidad", "Categoría", "Enlace", "Precio unitario (USD)", "Precio final (COP)",
      "Peso por unidad (lb)", "Certeza del peso", "Tienda", "Compra", "Pendiente de comprar", "Es ejemplo", "Precio sugerido (COP)"],
  },
  Clientes: {
    id: "41b4b8d0-856b-45a7-a83c-45ef78c2f81f",
    props: ["Cliente", "WhatsApp", "Instagram", "Ciudad", "Contacto preferido", "Origen", "Es ejemplo"],
  },
  Parámetros: {
    id: "91cf1761-95e9-44a2-bc6b-18284f3432a7",
    props: ["Versión", "Vigente desde", "TRM referencia (COP por USD)", "Colchón cambiario", "Impuesto venta USA por defecto",
      "Tarifa casillero (USD por lb)", "Margen objetivo", "Comisiones (% del precio)", "Es ejemplo"],
  },
  "Catálogo web": {
    id: "41b4164b-e4f4-8148-9db2-000be109c2f1",
    props: ["Producto", "Marca", "Categoría", "Foto", "Precio USD", "Precio antes USD", "Peso estimado (lb)", "Tallas", "Colores",
      "Enlace tienda", "Colección", "Activo", "Destacado", "Precio final manual (COP)"],
  },
  Marcas: {
    id: "41b4164b-e4f4-811a-8a8e-000b3734255d",
    props: ["Marca", "Tablero de Pinterest", "Tienda oficial", "Descripción corta", "Promo activa", "Destacada", "Activa", "Orden"],
  },
  "Links guardados": {
    id: "41b4164b-e4f4-817f-bd27-000bad2ec576",
    props: ["Producto", "Enlace", "Tienda", "Foto", "Precio USD", "Precio estimado (COP)", "Categoría", "Variante", "Cantidad", "Para",
      "Clienta", "Pedido", "Estado", "Notas", "Guardado el"],
  },
};

let problemas = 0;
for (const [nombre, { id, props }] of Object.entries(BASES)) {
  try {
    const ds = await notion.dataSources.retrieve({ data_source_id: id });
    const faltan = props.filter((p) => !ds.properties[p]);
    if (faltan.length) {
      problemas++;
      console.log(`⚠ ${nombre}: faltan propiedades → ${faltan.join(", ")}`);
    } else {
      console.log(`✓ ${nombre}`);
    }
    if (nombre === "Productos de los pedidos") {
      for (const f of ["Precio sugerido (COP)", "Costo estimado (COP)", "Costo unitario (COP)", "Precio aplicado (COP)"]) {
        const expr = ds.properties[f]?.formula?.expression;
        if (expr) console.log(`\n  Fórmula de "${f}":\n  ${expr.replace(/\n/g, "\n  ")}\n`);
      }
    }
  } catch (e) {
    problemas++;
    console.log(`✗ ${nombre}: sin acceso (${e.code ?? e.message}). ¿Conectaste la página "Encargos USA → Colombia" a la integración?`);
  }
}
console.log(problemas ? `\n${problemas} base(s) con problemas.` : "\n¡Todo en orden! La web puede leer y escribir en tu Notion.");
process.exit(problemas ? 1 : 0);
