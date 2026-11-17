/** Lógica del popup "closet sale · guardar". */
import { calcularPrecio, formatoCOP, PARAMETROS_POR_DEFECTO, type ParametrosPrecio } from "@/lib/precio";
import { CATEGORIAS, PESOS_SUGERIDOS } from "@/config/negocio";
import { limpiarLink, tiendaDesdeLink } from "@/lib/util";
import { extraerProducto, type ProductoDetectado } from "./extractor";
import {
  buscarClientas,
  contarPendientes,
  encolar,
  guardar,
  guardarAjustes,
  leerAjustes,
  normalizarSitio,
  obtenerParametros,
  pedidosDe,
  reintentarPendientes,
  type Clienta,
  type Guardado,
} from "./api";

const $ = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;
const vistas = ["vista-ajustes", "vista-cargando", "vista-form", "vista-exito"];
const mostrar = (id: string) => vistas.forEach((v) => ($(v).hidden = v !== id));

let parametros: ParametrosPrecio = PARAMETROS_POR_DEFECTO;
let pesos = PESOS_SUGERIDOS as { etiqueta: string; categoria: string; lb: number }[];
let clientaElegida: Clienta | null = null;
let fotoActual = "";
let pesoTocado = false;

const params = new URLSearchParams(location.search);
if (params.get("ventana")) document.body.classList.add("ventana");

// ------------------------------------------------------------------ Ajustes
async function abrirAjustes() {
  const a = await leerAjustes();
  $("aj-sitio").value = a?.sitio ?? "";
  $("aj-clave").value = a?.clave ?? "";
  $("aj-cancelar").hidden = !a;
  mostrar("vista-ajustes");
  $("aj-sitio").focus();
}

$("btn-ajustes").addEventListener("click", abrirAjustes);
$("aj-cancelar").addEventListener("click", () => iniciar());

$<HTMLFormElement>("form-ajustes").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("aj-msg");
  msg.className = "mensaje";
  let sitio: string;
  try {
    sitio = normalizarSitio($("aj-sitio").value);
  } catch {
    msg.textContent = "La URL no es válida.";
    return;
  }
  const clave = $("aj-clave").value.trim();
  if (clave.length < 16) {
    msg.textContent = "La clave debe tener al menos 16 caracteres.";
    return;
  }
  // Permiso SOLO para tu web (no para todas las páginas)
  const concedido = await chrome.permissions.request({ origins: [`${sitio}/*`] }).catch(() => false);
  if (!concedido) {
    msg.textContent = "Necesito permiso para hablar con tu web. Inténtalo de nuevo y dale “Permitir”.";
    return;
  }
  await guardarAjustes({ sitio, clave });
  const p = await obtenerParametros();
  if (!p) {
    msg.textContent = "Guardé los ajustes, pero la web no respondió. Revisa la URL y la clave.";
    return;
  }
  msg.className = "mensaje ok";
  msg.textContent = "¡Conectado!";
  setTimeout(() => iniciar(), 600);
});

// ------------------------------------------------------------------ Formulario
function llenarCategorias() {
  const sel = $<HTMLSelectElement>("categoria");
  sel.innerHTML = CATEGORIAS.map((c) => `<option>${c}</option>`).join("");
}

function pesoPorCategoria(cat: string) {
  return pesos.find((p) => p.categoria === cat)?.lb ?? 1;
}

/** Adivina la categoría por el nombre o la tienda. */
function adivinarCategoria(texto: string, tienda: string): string {
  const t = `${texto} ${tienda}`.toLowerCase();
  if (/perfum|fragrance|eau de|body mist|parfum/.test(t)) return "Perfumes";
  if (/lipstick|mascara|foundation|concealer|blush|gloss|eyeshadow|makeup|bronzer|lip /.test(t)) return "Maquillaje";
  if (/serum|moistur|cleanser|sunscreen|spf|toner|cream|skincare|retinol|mask/.test(t)) return "Skincare";
  if (/sneaker|shoe|boot|sandal|heel|tenis|zapat|slide/.test(t)) return "Zapatos";
  if (/bag|tote|purse|backpack|crossbody|bolso|clutch/.test(t)) return "Bolsos";
  if (/iphone|ipad|airpods|watch|laptop|headphone|charger|kindle|camera/.test(t)) return "Tecnología";
  if (/earring|necklace|bracelet|ring|sunglasses|hat|cap|scrunch|belt|wallet/.test(t)) return "Accesorios";
  if (/legging|bra|top|shirt|tee|hoodie|jogger|short|jacket|dress|pant|sweat|tank|sephora|ulta/.test(t)) {
    return /sephora|ulta/.test(t) ? "Skincare" : "Ropa";
  }
  return "Ropa";
}

function actualizarPrecio() {
  const usd = parseFloat($("precio").value.replace(",", "."));
  const lb = parseFloat($("peso").value.replace(",", ".")) || 0;
  const cant = Math.max(1, Math.min(20, parseInt($("cantidad").value) || 1));
  if (!(usd > 0)) {
    $("cop").textContent = "$ —";
    $("cop-detalle").textContent = "Escribe el precio en dólares";
    return;
  }
  const unidad = calcularPrecio({ precioUSD: usd, pesoLb: lb }, parametros).final;
  $("cop").textContent = formatoCOP(unidad * cant);
  $("cop-detalle").textContent = cant > 1 ? `${formatoCOP(unidad)} c/u` : "Mismo cálculo de la web";
}

function llenarFormulario(d: Partial<ProductoDetectado> & { enlace?: string }) {
  const enlace = d.enlace || d.url || "";
  $("nombre").value = d.nombre ?? "";
  $("enlace").value = enlace ? limpiarLink(enlace) : "";
  $("precio").value = d.precio != null ? String(d.precio) : "";
  const tienda = enlace ? tiendaDesdeLink(enlace) : "";
  $("tienda").textContent = tienda || "Tienda";
  const fuentes: Record<string, string> = {
    "json-ld": "Precio detectado (datos del producto)",
    meta: "Precio detectado (metadatos)",
    texto: "Precio detectado en la página: revísalo",
    "": "No encontré el precio: escríbelo",
  };
  $("fuente").textContent = fuentes[d.fuentePrecio ?? ""];
  fotoActual = d.imagen ?? "";
  const img = $<HTMLImageElement>("foto");
  img.hidden = !fotoActual;
  if (fotoActual) img.src = fotoActual;
  const cat = adivinarCategoria(d.nombre ?? "", tienda);
  $<HTMLSelectElement>("categoria").value = cat;
  $("peso").value = String(pesoPorCategoria(cat));
  pesoTocado = false;
  actualizarPrecio();
}

async function detectar(): Promise<Partial<ProductoDetectado> & { enlace?: string }> {
  const tabParam = params.get("tab");
  const [tab] = tabParam
    ? [await chrome.tabs.get(Number(tabParam)).catch(() => undefined)]
    : await chrome.tabs.query({ active: true, currentWindow: true });

  // ¿Venimos del menú de clic derecho?
  type Menu = { linkUrl: string | null; srcUrl: string | null; texto: string | null; fecha: number };
  const { desdeMenu } = (await chrome.storage.session.get("desdeMenu")) as { desdeMenu?: Menu };
  const menu = desdeMenu && Date.now() - desdeMenu.fecha < 60_000 ? desdeMenu : null;
  if (menu) await chrome.storage.session.remove("desdeMenu");

  let datos: Partial<ProductoDetectado> & { enlace?: string } = { url: tab?.url ?? "" };
  if (tab?.id != null && /^https?:/.test(tab.url ?? "")) {
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extraerProducto });
      if (r?.result) datos = r.result as ProductoDetectado;
    } catch (e) {
      console.warn("No pude leer la página:", e);
    }
  }

  if (menu?.srcUrl) datos.imagen = menu.srcUrl;
  if (menu?.linkUrl && menu.linkUrl !== datos.url) {
    // Clic derecho sobre un link a otro producto: usamos ese link
    let mismoProducto = false;
    try {
      mismoProducto = new URL(menu.linkUrl).pathname === new URL(datos.url ?? "").pathname;
    } catch {
      /* nada */
    }
    if (!mismoProducto) {
      datos = { enlace: menu.linkUrl, nombre: menu.texto ?? "", precio: null, fuentePrecio: "", imagen: menu.srcUrl ?? "" };
    }
  }
  return datos;
}

// ---- Clienta ----
let temporizador: ReturnType<typeof setTimeout> | undefined;
$("buscar-clienta").addEventListener("input", () => {
  clientaElegida = null;
  $("bloque-pedido").hidden = true;
  clearTimeout(temporizador);
  temporizador = setTimeout(async () => {
    const q = $("buscar-clienta").value;
    const lista = $<HTMLUListElement>("lista-clientas");
    try {
      const clientas = await buscarClientas(q);
      lista.innerHTML = "";
      for (const c of clientas) {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.tabIndex = 0;
        const nombre = document.createElement("span");
        nombre.textContent = c.nombre;
        const sub = document.createElement("small");
        sub.textContent = [c.whatsapp, c.instagram].filter(Boolean).join(" · ");
        li.append(nombre, sub);
        const elegir = () => elegirClienta(c);
        li.addEventListener("click", elegir);
        li.addEventListener("keydown", (e) => e.key === "Enter" && elegir());
        lista.append(li);
      }
      if (!clientas.length) lista.innerHTML = `<li aria-disabled="true"><small>Sin resultados. Créala primero en Notion.</small></li>`;
      lista.hidden = false;
      $("buscar-clienta").setAttribute("aria-expanded", "true");
    } catch (e) {
      $("msg").textContent = (e as Error).message;
    }
  }, 250);
});

async function elegirClienta(c: Clienta) {
  clientaElegida = c;
  $("buscar-clienta").value = c.nombre;
  $("lista-clientas").hidden = true;
  $("buscar-clienta").setAttribute("aria-expanded", "false");
  const sel = $<HTMLSelectElement>("pedido");
  sel.innerHTML = `<option value="">Crear pedido nuevo (Cotizando)</option>`;
  $("bloque-pedido").hidden = false;
  try {
    const pedidos = await pedidosDe(c.id);
    for (const p of pedidos) {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = `Agregar a #${p.numero ?? "?"} · ${p.etapa}`;
      sel.append(o);
    }
  } catch {
    /* si falla, solo queda "crear pedido nuevo" */
  }
}

document.querySelectorAll<HTMLInputElement>('input[name="destino"]').forEach((r) =>
  r.addEventListener("change", () => {
    const d = (document.querySelector('input[name="destino"]:checked') as HTMLInputElement).value;
    $("bloque-clienta").hidden = d !== "clienta";
    $("btn-guardar").textContent = d === "idea" ? "Guardar idea" : d === "catalogo" ? "Guardar en el catálogo" : "Guardar para la clienta";
  }),
);

["precio", "cantidad"].forEach((id) => $(id).addEventListener("input", actualizarPrecio));
$("peso").addEventListener("input", () => {
  pesoTocado = true;
  actualizarPrecio();
});
$("categoria").addEventListener("change", () => {
  if (!pesoTocado) $("peso").value = String(pesoPorCategoria($<HTMLSelectElement>("categoria").value));
  actualizarPrecio();
});

$<HTMLFormElement>("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("msg");
  msg.textContent = "";
  const destino = (document.querySelector('input[name="destino"]:checked') as HTMLInputElement).value as Guardado["destino"];
  const nombre = $("nombre").value.trim();
  if (!nombre) {
    msg.textContent = "Escribe el nombre del producto.";
    $("nombre").focus();
    return;
  }
  if (destino === "clienta" && !clientaElegida) {
    msg.textContent = "Elige la clienta de la lista.";
    $("buscar-clienta").focus();
    return;
  }
  const usd = parseFloat($("precio").value.replace(",", "."));
  const g: Guardado = {
    destino,
    producto: nombre,
    enlace: $("enlace").value.trim(),
    foto: fotoActual || undefined,
    precioUSD: usd > 0 ? usd : null,
    categoria: $<HTMLSelectElement>("categoria").value,
    variante: $("variante").value.trim(),
    cantidad: Math.max(1, Math.min(20, parseInt($("cantidad").value) || 1)),
    pesoLb: parseFloat($("peso").value.replace(",", ".")) || pesoPorCategoria($<HTMLSelectElement>("categoria").value),
    notas: $("notas").value.trim(),
    clientaId: clientaElegida?.id,
    pedidoId: destino === "clienta" ? $<HTMLSelectElement>("pedido").value || undefined : undefined,
  };

  const btn = $<HTMLButtonElement>("btn-guardar");
  btn.disabled = true;
  btn.textContent = "Guardando…";
  try {
    const r = await guardar(g);
    $("exito-titulo").textContent = "¡Guardado! ✓";
    $("exito-texto").textContent =
      destino === "idea"
        ? `Quedó en Links guardados${r.precioCOP ? ` · ${formatoCOP(r.precioCOP)}` : ""}.`
        : destino === "catalogo"
          ? "Quedó en Catálogo web como inactivo. Súbele tu foto y márcalo Activo."
          : `Quedó en el pedido de ${clientaElegida?.nombre}${r.numero ? ` (#${r.numero})` : ""}.`;
    const a = $<HTMLAnchorElement>("exito-link");
    a.href = r.url;
    a.hidden = !r.url;
    mostrar("vista-exito");
    reintentarPendientes().catch(() => undefined);
  } catch (err) {
    await encolar(g);
    $("exito-titulo").textContent = "Lo guardé para después";
    $("exito-texto").textContent = `No pude conectar con tu web (${(err as Error).message}). Lo reintento solo la próxima vez que abras la extensión.`;
    $<HTMLAnchorElement>("exito-link").hidden = true;
    mostrar("vista-exito");
  } finally {
    btn.disabled = false;
  }
});

$("btn-otro").addEventListener("click", () => iniciar());

// ------------------------------------------------------------------ Inicio
async function iniciar() {
  llenarCategorias();
  const ajustes = await leerAjustes();
  if (!ajustes) return abrirAjustes();
  mostrar("vista-cargando");

  const [datosParam, detectado] = await Promise.all([obtenerParametros(), detectar()]);
  if (datosParam) {
    parametros = datosParam.parametros;
    if (datosParam.pesos?.length) pesos = datosParam.pesos;
  }
  llenarFormulario(detectado);
  mostrar("vista-form");
  $("nombre").focus();

  // Reintentos pendientes
  const ok = await reintentarPendientes().catch(() => 0);
  const quedan = await contarPendientes();
  const p = $("pendientes");
  p.hidden = !ok && !quedan;
  p.textContent = [ok ? `Se guardaron ${ok} pendientes.` : "", quedan ? `${quedan} por reintentar.` : ""].filter(Boolean).join(" ");
}

iniciar();
