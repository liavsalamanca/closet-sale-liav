# closet sale · LIAV — web, panel y extensión

Web de encargos de EE. UU. a Colombia conectada a tu Notion.

| Parte | Dónde | Para qué |
|---|---|---|
| Web pública | `/`, `/catalogo`, `/marcas`, `/cotizador`, `/pedido` | Tus clientas ven precios finales en pesos, arman su pedido y te lo mandan por WhatsApp o Instagram |
| Panel privado | `/panel` | Resumen, tablero por etapa, por cobrar, por comprar, entregas y links guardados |
| Extensión de Chrome | carpeta `extension/` | Guardas con un clic cualquier producto de una tienda de EE. UU. en tu Notion |

---

## 1. Conectar Notion (una sola vez)

1. Entra a **https://www.notion.so/profile/integrations** → **Nueva integración**.
   - Nombre: `closet sale web` · Tipo: **Interna** · Espacio de trabajo: el tuyo.
   - En **Capacidades** marca: leer contenido, actualizar contenido e insertar contenido.
2. Copia el **token secreto** (empieza por `ntn_`). Es como una contraseña: no lo mandes por chat ni lo pegues en GitHub.
3. Abre en Notion la página **"Encargos USA → Colombia"** → menú **···** (arriba a la derecha) → **Conexiones** → busca `closet sale web` → **Confirmar**.
   Así la integración ve todas las bases que están dentro de esa página (incluidas *Catálogo web*, *Marcas* y *Links guardados*).

> Para revisar que todo quedó bien, en tu computador (con el proyecto descargado y el token en `.env.local`) corre `npm run revisar-notion`. Te dice base por base si hay acceso y te muestra la fórmula de *Precio sugerido* de Notion.

## 2. Variables de entorno

| Variable | Qué poner |
|---|---|
| `NOTION_TOKEN` | El token del paso 1 |
| `WHATSAPP_NUMBER` | `573133953900` |
| `INSTAGRAM_USER` | `closetsaleliav` |
| `ADMIN_PASSWORD` | Una contraseña larga para entrar al panel (solo tú la sabes) |
| `SITE_URL` | La dirección de tu web en Vercel, ej. `https://closetsaleliav.vercel.app` |
| `EXTENSION_API_KEY` | Una clave larga e inventada (mín. 16 caracteres) que pegas una vez en la extensión |
| `EXTENSION_ID` | (Opcional) El ID de tu extensión, para que solo ella pueda usar la API |

Para inventar claves largas puedes usar un generador de contraseñas (por ejemplo, el de tu gestor de contraseñas o el de Chrome) con 32 caracteres.

## 3. Publicar en Vercel (gratis)

1. Entra a **https://vercel.com** → **Sign up** con tu cuenta de GitHub.
2. **Add New… → Project** → elige el repositorio `closet-sale-liav` → **Import**.
3. Antes de darle Deploy, abre **Environment Variables** y agrega las 6 variables de la tabla de arriba (no pongas `NOTION_MOCK`).
4. **Deploy**. En 1–2 minutos te da una dirección tipo `https://closet-sale-liav.vercel.app`.
5. Si la dirección final es distinta a la que pusiste en `SITE_URL`, cámbiala en **Settings → Environment Variables** y en **Deployments** dale **Redeploy**.
6. Cada vez que se suba un cambio a GitHub (rama principal), Vercel publica solo.

> Puedes cambiar el nombre de la dirección en **Settings → Domains** (ej. `closetsaleliav.vercel.app`) si está libre.

## 4. Instalar la extensión de Chrome

1. En tu computador, dentro de la carpeta del proyecto: `npm run extension` (crea `extension/dist`).
2. Abre Chrome en **chrome://extensions** → activa **Modo de desarrollador** (arriba a la derecha).
3. **Cargar descomprimida** → elige la carpeta **`extension/dist`**.
4. Fija la extensión (ícono de rompecabezas → chincheta junto a *closet sale · guardar*).
5. Ábrela → ícono de ajustes → pega la **URL de tu web** y la **clave** (`EXTENSION_API_KEY`) → **Guardar ajustes** → dale **Permitir** cuando Chrome pregunte.
6. (Opcional, más seguro) Copia el **ID** que aparece en chrome://extensions y ponlo en Vercel como `EXTENSION_ID`.

**Cómo se usa:** en la página de un producto, clic en el ícono (o `Alt+Shift+S`), revisa los datos, elige *Idea*, *Al catálogo* o *Para clienta* y **Guardar**. También: clic derecho sobre una imagen o un link → **Guardar en closet sale**.
Si no hay internet o la web no responde, la extensión guarda el intento y lo reintenta sola la próxima vez que la abras.

**Cuando cambie algo de la extensión:** vuelve a correr `npm run extension` y en chrome://extensions dale al ícono de **recargar** (↻) de la extensión.

---

## 5. Guía de uso diario

### Agregar productos al catálogo
1. En Notion abre **Catálogo web** → **Nuevo**.
2. Llena: *Producto*, *Marca* (elige de la lista), *Categoría*, *Precio USD*, *Precio antes USD* (para el % de descuento), *Peso estimado (lb)*, *Tallas*, *Colores* (separados por coma) y *Colección*.
3. Sube **tu foto** en *Foto*.
4. Marca **Activo** para que salga en la web (y **Destacado** si quieres que salga en el inicio).
5. Si quieres un precio especial, escríbelo en *Precio final manual (COP)*: ese manda sobre la fórmula.
6. La web se actualiza sola en máximo **5 minutos**.

### Actualizar la TRM, el margen o las tarifas
En Notion → **Parámetros**. Como dice tu plantilla, crea una **versión nueva** (no edites las anteriores), llena *Vigente desde* con la fecha de hoy y los valores. La web toma la versión vigente más reciente (en máx. 5 min) y la relaciona con los pedidos nuevos.

**Cómo calcula la web el precio final** (igual en catálogo, cotizador y extensión):

```
TRM efectiva = TRM × (1 + colchón)
costo        = (precio USD × (1 + impuesto) + peso lb × tarifa lb) × TRM efectiva
si hay margen o comisión en Parámetros:  precio = costo ÷ (1 − margen − comisión)
si no hay:                               precio = costo + $25.000 por unidad
redondeo hacia arriba a precios terminados en 4.900 o 9.900
```

Mientras en *V-001* falten la TRM, el impuesto, el margen o la comisión, la web usa los valores de respaldo (TRM 3.450, impuesto 7%, USD 5/lb, $25.000 de ganancia). Los puedes cambiar en `src/config/negocio.ts`. Los pesos por categoría del cotizador también están ahí.

### Marcas y tableros de Pinterest
1. Crea en Pinterest un tablero **público** por marca (ej. "Gymshark · closet sale").
2. En Notion → **Marcas**: pega la URL del tablero en *Tablero de Pinterest*, escribe la *Promo activa* y marca *Activa* (y *Destacada* para que salga en el inicio).
3. Cuando agregas pines al tablero, la web los muestra solos.

### Entrar al panel
Ve a `https://TU-WEB/panel` → escribe tu `ADMIN_PASSWORD`. La sesión dura 7 días en ese navegador. El panel se refresca cada 60 s; usa **Actualizar ahora** si acabas de cambiar algo en Notion.
- **Tablero**: cambia la etapa de un pedido desde la lista desplegable (se guarda en Notion; al pasar a *Confirmado* llena la fecha de confirmación si estaba vacía).
- **Por cobrar**: botón **Cobrar** que abre WhatsApp con el saldo.
- **Links guardados**: *Pasar al catálogo* (queda inactivo para que le pongas tu foto), *Crear pedido para clienta* o *Descartar*.
- Los registros con **Es ejemplo** marcado nunca aparecen.

### Pedidos de prueba
Si haces un pedido en la web con un nombre que empiece por **PRUEBA** (ej. "PRUEBA Lia"), se guarda en Notion con *Es ejemplo* marcado y no afecta tus números.

### Si Notion falla
La clienta igual llega a tu WhatsApp/Instagram con el pedido completo. En Vercel → tu proyecto → **Logs** verás el detalle con la palabra `[pedido] ERROR`.

---

## Para programadores

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Notion con `@notionhq/client` (API de *data sources*, versión `2025-09-03`).
- `npm run dev` — web local. Con `NOTION_MOCK=1` en `.env.local` usa datos de prueba en memoria (sin token).
- `npm test` — pruebas de la fórmula de precio y de los links. `npm --prefix extension test` — pruebas del detector de productos.
- `npm run extension` — compila la extensión en `extension/dist`.
- `node scripts/generar-imagenes.cjs` — regenera íconos y la imagen para redes (necesita Playwright).
- Estructura: `src/app` (páginas y API), `src/components`, `src/lib/notion` (todo lo que habla con Notion, solo servidor), `src/lib/precio.ts` (fórmula compartida con la extensión), `src/config/negocio.ts` (valores editables).
- Caché: catálogo, marcas y parámetros 5 min; panel 60 s. La cola de Notion respeta ~3 solicitudes/s.
