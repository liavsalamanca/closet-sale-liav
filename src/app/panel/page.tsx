import { Panel } from "@/components/panel/Panel";
import { ETAPAS } from "@/config/negocio";
import { contactoPublico } from "@/lib/contacto";

export const dynamic = "force-dynamic";

export default function PaginaPanel() {
  return <Panel etapas={[...ETAPAS]} instagram={contactoPublico().instagram} />;
}
