import type { Metadata } from "next";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Encabezado2 } from "@/components/Secciones";
import { contactoPublico } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Mi pedido",
  robots: { index: false },
};

export default function PaginaPedido() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Encabezado2
        etiqueta="Mi pedido"
        titulo="Ya casi es tuyo"
        texto="Revisa tus productos, déjame tus datos y te escribo para confirmar el precio final y el pago."
      />
      <FormularioPedido contacto={contactoPublico()} />
    </div>
  );
}
