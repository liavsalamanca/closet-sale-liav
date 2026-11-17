/** Datos de contacto (salen de las variables de entorno). Solo servidor. */
import "server-only";

export function contacto() {
  const whatsapp = (process.env.WHATSAPP_NUMBER || "573133953900").replace(/\D/g, "");
  const instagram = (process.env.INSTAGRAM_USER || "closetsaleliav").replace(/^@/, "");
  return {
    whatsapp,
    instagram,
    linkWhatsApp: (texto?: string) => `https://wa.me/${whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`,
    linkInstagram: `https://ig.me/m/${instagram}`,
    perfilInstagram: `https://www.instagram.com/${instagram}/`,
  };
}

export type Contacto = { whatsapp: string; instagram: string };

export function contactoPublico(): Contacto {
  const c = contacto();
  return { whatsapp: c.whatsapp, instagram: c.instagram };
}

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
