import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/contacto";
import { obtenerCatalogo } from "@/lib/notion/catalogo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { marcas } = await obtenerCatalogo();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/marcas`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/cotizador`, changeFrequency: "monthly", priority: 0.7 },
    ...marcas.map((m) => ({ url: `${base}/marcas/${m.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
