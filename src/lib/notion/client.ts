import "server-only";
import { Client } from "@notionhq/client";
import type { PaginaNotion } from "./props";
import { crearNotionDePrueba } from "./mock";

/**
 * Conexión con Notion. SOLO corre en el servidor: el token nunca llega al navegador.
 *
 * - Respeta el límite de Notion (~3 solicitudes por segundo) con una cola.
 * - Pagina las consultas (de 100 en 100).
 * - Con NOTION_MOCK=1 usa datos de prueba en memoria (solo para desarrollo local).
 */

export class NotionNoConfigurado extends Error {
  constructor() {
    super("Falta NOTION_TOKEN en las variables de entorno.");
  }
}

// Interfaz mínima que usamos del SDK (así el modo de prueba puede imitarla).
export type NotionMinimo = {
  dataSources: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: (args: any) => Promise<{ results: any[]; has_more: boolean; next_cursor: string | null }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retrieve: (args: { data_source_id: string }) => Promise<any>;
  };
  pages: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (args: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retrieve: (args: { page_id: string }) => Promise<any>;
  };
};

let instancia: NotionMinimo | null = null;

export const modoPrueba = () => process.env.NOTION_MOCK === "1";

export function notionConfigurado(): boolean {
  return modoPrueba() || Boolean(process.env.NOTION_TOKEN);
}

function cliente(): NotionMinimo {
  if (instancia) return instancia;
  if (modoPrueba()) {
    instancia = crearNotionDePrueba();
    return instancia;
  }
  if (!process.env.NOTION_TOKEN) throw new NotionNoConfigurado();
  // La versión de API por defecto del SDK (2025-09-03) ya usa "data sources".
  instancia = new Client({
    auth: process.env.NOTION_TOKEN,
    timeoutMs: 15_000,
    retry: { maxRetries: 3 },
  }) as unknown as NotionMinimo;
  return instancia;
}

// ---- Cola para no pasar de ~3 solicitudes por segundo ----
const ESPACIO_MS = 340;
let ultima = 0;
let cadena: Promise<unknown> = Promise.resolve();

function enCola<T>(fn: () => Promise<T>): Promise<T> {
  const turno = cadena.then(async () => {
    const espera = ultima + ESPACIO_MS - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultima = Date.now();
  });
  cadena = turno.catch(() => undefined);
  return turno.then(fn);
}

/** Trae TODAS las filas de una base (paginando). */
export async function consultarTodo(
  dataSourceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opciones: { filter?: any; sorts?: any[] } = {},
): Promise<PaginaNotion[]> {
  const n = cliente();
  const filas: PaginaNotion[] = [];
  let cursor: string | undefined;
  do {
    const r = await enCola(() =>
      n.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        start_cursor: cursor,
        ...opciones,
      }),
    );
    for (const x of r.results) if (x.object === "page" && x.properties) filas.push(x as PaginaNotion);
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return filas;
}

export async function crearPagina(
  dataSourceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>,
): Promise<PaginaNotion> {
  const n = cliente();
  return enCola(() => n.pages.create({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function actualizarPagina(pageId: string, properties: Record<string, any>): Promise<PaginaNotion> {
  const n = cliente();
  return enCola(() => n.pages.update({ page_id: pageId, properties }));
}

export async function leerPagina(pageId: string): Promise<PaginaNotion> {
  const n = cliente();
  return enCola(() => n.pages.retrieve({ page_id: pageId }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function leerEsquema(dataSourceId: string): Promise<any> {
  const n = cliente();
  return enCola(() => n.dataSources.retrieve({ data_source_id: dataSourceId }));
}

/** Link para abrir una página en Notion. */
export const linkNotion = (id: string) => `https://www.notion.so/${id.replace(/-/g, "")}`;
