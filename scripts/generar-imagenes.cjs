/**
 * Genera íconos y la imagen para redes (Open Graph) con las tipografías reales.
 * Uso (necesita Playwright instalado):  node scripts/generar-imagenes.cjs
 */
const { chromium } = require("playwright");
const path = require("node:path");

const raiz = path.resolve(__dirname, "..");
const fuentes = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Jost:wght@400;500&display=block" rel="stylesheet">`;

const monograma = (px) => `<!doctype html><html><head>${fuentes}<style>
html,body{margin:0;background:transparent}
.c{width:${px}px;height:${px}px;border-radius:50%;background:#F4D9D6;box-sizing:border-box;border:${Math.max(1, px / 32)}px solid #B7826F;
display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond';font-style:italic;font-weight:500;color:#3B2A26;
font-size:${px * 0.56}px;line-height:1;padding-bottom:${px * 0.1}px}
</style></head><body><div class="c">cs</div></body></html>`;

const og = `<!doctype html><html><head>${fuentes}<style>
html,body{margin:0}
body{width:1200px;height:630px;background:#FBF5EF;display:flex;align-items:center;justify-content:center;font-family:Jost;color:#3B2A26}
.t{background:#F4D9D6;border-radius:48px;width:1080px;height:510px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}
.l{font-family:'Cormorant Garamond';font-style:italic;font-weight:500;font-size:150px;line-height:1}
.s{display:flex;align-items:center;gap:24px;width:560px;font-size:30px;font-weight:500;letter-spacing:.5em;padding-left:.5em}
.s i{flex:1;height:2px;background:#B7826F}
.p{font-size:34px;color:#8C5A4A;margin-top:18px}
</style></head><body><div class="t"><div class="l">closet sale</div><div class="s"><i></i>LIAV<i></i></div>
<div class="p">Encargos de EE. UU. a Colombia · precio final en pesos</div></div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  const foto = async (html, w, h, salida, transparente = true) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(raiz, salida), omitBackground: transparente, clip: { x: 0, y: 0, width: w, height: h } });
    console.log("✓", salida);
  };
  for (const px of [16, 32, 48, 128]) await foto(monograma(px), px, px, `extension/public/icons/icon-${px}.png`);
  await foto(monograma(32), 32, 32, "src/app/icon.png");
  await foto(monograma(180), 180, 180, "src/app/apple-icon.png", false);
  await foto(og, 1200, 630, "public/og.png", false);
  await b.close();
})();
