import type { NextConfig } from "next";

// Usamos el modelo de caché clásico (revalidate / unstable_cache):
// catálogo y parámetros se refrescan cada 5 min, el panel cada 60 s.
const nextConfig: NextConfig = {
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Fotos que tú subes a Notion (se sirven desde S3 de Notion)
    remotePatterns: [
      { protocol: "https", hostname: "prod-files-secure.s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "*.notion.so" },
      { protocol: "https", hostname: "*.notion.com" },
      { protocol: "https", hostname: "*.notion-static.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/panel/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
