import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/contacto";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const descripcion =
  "Compro por ti en tiendas de EE. UU. (Gymshark, Victoria's Secret, Sephora y más) y te lo entrego en Bucaramanga. Precio final en pesos colombianos, sin letra pequeña.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "closet sale · LIAV — Encargos de EE. UU. a Colombia",
    template: "%s · closet sale",
  },
  description: descripcion,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "closet sale · LIAV",
    title: "closet sale · LIAV — Encargos de EE. UU. a Colombia",
    description: descripcion,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "closet sale LIAV" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#FBF5EF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
