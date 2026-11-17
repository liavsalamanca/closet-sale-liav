/**
 * Service worker de la extensión:
 * - Crea el menú de clic derecho "Guardar en closet sale" (imágenes y links).
 * - Reintenta guardados pendientes al iniciar Chrome.
 */
import { reintentarPendientes } from "./api";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "guardar-closet-sale",
    title: "Guardar en closet sale",
    contexts: ["image", "link", "page"],
  });
});

chrome.runtime.onStartup.addListener(() => {
  reintentarPendientes().catch(() => undefined);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "guardar-closet-sale") return;
  // Guardamos lo que se clicó para que el popup lo use
  await chrome.storage.session.set({
    desdeMenu: {
      tabId: tab?.id ?? null,
      linkUrl: info.linkUrl ?? null,
      srcUrl: info.mediaType === "image" ? (info.srcUrl ?? null) : null,
      pageUrl: info.pageUrl ?? tab?.url ?? null,
      // linkText existe en Chrome reciente
      texto: (info as { linkText?: string }).linkText ?? info.selectionText ?? null,
      fecha: Date.now(),
    },
  });
  try {
    await chrome.action.openPopup();
  } catch {
    // Si Chrome no deja abrir el popup, lo abrimos en una ventanita
    await chrome.windows.create({
      url: chrome.runtime.getURL(`popup.html?ventana=1&tab=${tab?.id ?? ""}`),
      type: "popup",
      width: 400,
      height: 680,
    });
  }
});
