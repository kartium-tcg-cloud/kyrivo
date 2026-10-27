"use strict";

const statusNode = document.getElementById("status");
const preview = document.getElementById("preview");
const count = document.getElementById("count");
const list = document.getElementById("items");
const captureBtn = document.getElementById("capture");
const sendBtn = document.getElementById("send");
const STORAGE_KEY = "kyrivoVintedPendingV1";
let snapshot = null;
let selected = new Set();

function status(message) { statusNode.textContent = message; }
function isVintedHost(name) {
  return /(^|\.)vinted\.(?:fr|be|nl|de|es|it|pt|pl|com|co\.uk)$/i.test(name);
}

// Fonction autonome exécutée uniquement sur l'onglet dont l'utilisateur
// a explicitement demandé la lecture. Pas de fetch, cookies, API privées.
function readVisibleVintedItems() {
  const found = new Map();
  const maxItems = 60;
  const anchors = document.querySelectorAll("a[href*='/items/']");
  for (const anchor of anchors) {
    if (found.size >= maxItems) break;
    if (!anchor.getClientRects().length) continue;
    const href = anchor.getAttribute("href") || "";
    let url;
    try { url = new URL(href, location.href); } catch { continue; }
    if (!/(^|\.)vinted\.(?:fr|be|nl|de|es|it|pt|pl|com|co\.uk)$/i.test(url.hostname)) continue;
    const id = url.pathname.match(/^\/items\/(\d{4,20})(?:[\/-]|$)/)?.[1];
    if (!id || found.has(id)) continue;

    const imgAlt = anchor.querySelector("img[alt]")?.getAttribute("alt")?.trim() || "";
    const titleNode = anchor.querySelector("[data-testid*='title'], [data-testid*='name'], h2, h3");
    const lines = (anchor.innerText || "").split("\n").map(x => x.trim()).filter(Boolean);
    const rawTitle = titleNode?.textContent?.trim() ||
      (imgAlt && !/^(photo|image|article|item|product|vinted)$/i.test(imgAlt) ? imgAlt : "") ||
      lines.find(x => x.length > 3 && !/^(\d+[.,]?\d*\s*€|voir|acheter|vendu|sold|favori|wishlist)/i.test(x)) || "";
    const title = rawTitle.replace(/\s+/g, " ").slice(0, 150);
    if (title.length < 4) continue;

    // Montant indicatif uniquement : jamais traité comme un prix de vente ou coût fiscal.
    const displayPrice = lines.find(x => /\b\d+[.,]\d{2}\s*€|\b\d+\s*€/.test(x))?.slice(0, 40) || "";
    found.set(id, { itemId: id, title, url: url.origin + url.pathname, displayPrice });
  }
  return { items: [...found.values()], pageTitle: document.title.slice(0, 120) };
}

captureBtn.addEventListener("click", async () => {
  snapshot = null;
  selected = new Set();
  preview.hidden = true;
  status("");
  captureBtn.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || !isVintedHost(new URL(tab.url).hostname)) {
      throw new Error("Ouvrez un onglet Vinted connecté puis réessayez.");
    }
    const locationPath = new URL(tab.url).pathname;
    if (locationPath === "/" || /^\/(?:catalog|search)(?:\/|$)/i.test(locationPath)) {
      throw new Error("Ouvrez l'historique des achats ou ventes, et non le catalogue ou l'accueil Vinted.");
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id }, func: readVisibleVintedItems
    });
    const entries = results?.[0]?.result?.items || [];
    if (!entries.length) {
      throw new Error("Aucun article identifiable. Ouvrez vos achats ou ventes sur Vinted, puis rechargez la page. La présentation peut varier selon les comptes.");
    }
    snapshot = entries;
    selected = new Set(entries.map(item => item.itemId));
    count.textContent = String(entries.length);
    list.replaceChildren();
    for (const item of entries) {
      const li = document.createElement("li");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selected.add(item.itemId);
        else selected.delete(item.itemId);
        sendBtn.disabled = selected.size === 0;
      });
      const title = document.createElement("span");
      title.textContent = item.title + (item.displayPrice ? " — prix affiché : " + item.displayPrice : "");
      label.append(checkbox, title);
      li.append(label);
      list.append(li);
    }
    sendBtn.disabled = false;
    preview.hidden = false;
    status(entries.length + " article(s) trouvé(s). Vérifiez la liste avant de poursuivre.");
  } catch (err) {
    status(err instanceof Error ? err.message : "Impossible de lire cette page.");
  } finally {
    captureBtn.disabled = false;
  }
});

sendBtn.addEventListener("click", async () => {
  if (!snapshot?.length || !selected.size) return;
  sendBtn.disabled = true;
  try {
    const kind = document.querySelector("input[name=kind]:checked")?.value;
    if (kind !== "purchase" && kind !== "sale") throw new Error("Type d'opération manquant.");
    const transfer = {
      schemaVersion: 1,
      transferId: crypto.randomUUID(),
      timestamp: Date.now(),
      kind,
      items: snapshot.filter(item => selected.has(item.itemId))
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: transfer });
    await chrome.tabs.create({ url: "https://kyrivo.fr/import-vinted?extension=1" });
    status("Kyrivo est ouvert. Vérifiez chaque article avant tout enregistrement.");
  } catch (err) {
    status(err instanceof Error ? err.message : "Impossible de transférer les articles.");
  } finally {
    sendBtn.disabled = false;
  }
});
