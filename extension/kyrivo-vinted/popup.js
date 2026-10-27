"use strict";
const statusNode = document.getElementById("status");
const countNode = document.getElementById("count");
const itemsNode = document.getElementById("items");
const captureButton = document.getElementById("capture");
const resetButton = document.getElementById("reset");
const sendButton = document.getElementById("send");
const expectedInput = document.getElementById("expected");
const amountsNode = document.getElementById("amounts");
const WORKSPACE_KEY = "kyrivoVintedWorkspaceV2";
const PENDING_KEY = "kyrivoVintedPendingV1";
let workspace = null;

function emptyWorkspace(kind = "purchase") {
  return {
    schemaVersion: 2, kind, expected: 1, items: [],
    order: { sellerPrice: "", shippingFee: "", buyerProtectionFee: "", paidTotal: "" },
  };
}
function setStatus(message) { statusNode.textContent = message; }
function vintedHost(host) {
  return /(^|\.)vinted\.(?:fr|be|nl|de|es|it|pt|pl|com|co\.uk)$/i.test(host);
}
function selectedKind() {
  return document.querySelector("input[name=kind]:checked")?.value === "sale" ? "sale" : "purchase";
}
async function save() { await chrome.storage.local.set({ [WORKSPACE_KEY]: workspace }); }
function draw() {
  if (!workspace) return;
  document.querySelector(`input[name=kind][value="${workspace.kind}"]`).checked = true;
  expectedInput.value = String(workspace.expected);
  countNode.textContent = String(workspace.items.length);
  itemsNode.replaceChildren();
  for (const item of workspace.items) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = item.title + (item.displayPrice ? " — " + item.displayPrice + " (affiché)" : " — prix à compléter");
    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.textContent = "Retirer";
    remove.addEventListener("click", async () => {
      workspace.items = workspace.items.filter(x => x.itemId !== item.itemId);
      await save();
      draw();
    });
    li.append(span, remove);
    itemsNode.append(li);
  }
  const o = workspace.order;
  const known = [
    o.sellerPrice && "Prix vendeur : " + o.sellerPrice,
    o.shippingFee && "Livraison : " + o.shippingFee,
    o.buyerProtectionFee && "Protection : " + o.buyerProtectionFee,
    o.paidTotal && "Total payé : " + o.paidTotal,
  ].filter(Boolean);
  amountsNode.textContent = known.length
    ? "Montants relevés dans le récapitulatif (à vérifier) : " + known.join(" · ")
    : "Aucun récapitulatif chiffré reconnu. Les prix des fiches restent indicatifs ; vérifiez les frais dans Kyrivo.";
  const missing = workspace.expected - workspace.items.length;
  sendButton.disabled = workspace.items.length === 0 || missing > 0;
  sendButton.textContent = missing > 0
    ? "Encore " + missing + " article(s) à ajouter"
    : "Envoyer cette commande à Kyrivo";
}

/* Fonction injectée exclusivement lors du clic utilisateur sur son onglet Vinted.
   Lit le HTML rendu, pas de requête réseau, cookies, compte ni API interne. */
function captureCurrentVintedPage() {
  const hostPattern = /(^|\.)vinted\.(?:fr|be|nl|de|es|it|pt|pl|com|co\.uk)$/i;
  const items = [];
  const found = new Set();
  const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  const itemPattern = /^\/items\/(\d{4,20})(?:[\/-]|$)/;
  const moneyText = /(?:\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)(?:[,.]\d{1,2})?\s*€/;
  function takeItem(id, title, url, price = "") {
    title = String(title || "").replace(/\s+/g, " ").trim().slice(0, 150);
    if (!id || found.has(id) || title.length < 3 || items.length >= 60) return;
    if (/^(?:vinted|commande|mes achats|mes ventes|article|photo|image|collection)$/i.test(title)) return;
    found.add(id);
    items.push({ itemId: id, title, url, displayPrice: String(price || "").slice(0, 40) });
  }
  function priceFrom(node) {
    if (!node) return "";
    const candidates = [...node.querySelectorAll("[data-testid*='price'], [itemprop='price'], [class*='price']")].slice(0, 12);
    for (const el of candidates) {
      const content = text(el);
      const m = content.match(moneyText);
      if (m) return m[0];
    }
    return text(node).match(moneyText)?.[0] || "";
  }
  const match = location.pathname.match(itemPattern);
  if (match) {
    const head = document.querySelector("h1");
    const og = document.querySelector("meta[property='og:title']")?.getAttribute("content") || "";
    const img = document.querySelector("img[alt]")?.getAttribute("alt") || "";
    const title = text(head) || og || img || document.title.split("|")[0];
    const metaPrice = document.querySelector("meta[property='product:price:amount']")?.getAttribute("content") || "";
    let price = "";
    if (/^\d+(?:[.,]\d{1,2})?$/.test(metaPrice)) price = metaPrice.replace(".", ",") + " €";
    if (!price) price = priceFrom(document.querySelector("[data-testid*='item-price'], [data-testid*='price'], [itemprop='offers']"));
    takeItem(match[1], title, location.origin + location.pathname, price);
  }
  // Récapitulatif avec liens d'articles, y compris les commandes en lot.
  if (!match) for (const anchor of document.querySelectorAll("a[href*='/items/']")) {
    if (items.length >= 60) break;
    if (!anchor.getClientRects().length) continue;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { continue; }
    const id = url.pathname.match(itemPattern)?.[1];
    if (!id || !hostPattern.test(url.hostname)) continue;
    const card = anchor.closest("[data-testid*='item'], [data-testid*='product'], article") || anchor;
    const own = text(anchor.querySelector("[data-testid*='title'], h2, h3"));
    const imgTitle = anchor.querySelector("img[alt]")?.getAttribute("alt") || "";
    const title = own || imgTitle || text(anchor).split("€")[0];
    takeItem(id, title, url.origin + url.pathname, priceFrom(card));
  }

  // Montants uniquement si les libellés apparaissent dans un récapitulatif Vinted.
  const bodyLines = (document.body?.innerText || "").split("\n")
    .map(l => l.trim()).filter(Boolean).slice(0, 900);
  function amountFor(re, maxLookahead = 0) {
    for (let i = 0; i < bodyLines.length; i++) {
      const row = bodyLines[i];
      if (!re.test(row)) continue;
      const sameLine = row.match(moneyText);
      if (sameLine) return sameLine[0];
      for (let n = 1; n <= maxLookahead; n++) {
        const following = bodyLines[i + n] || "";
        if (following.length > 60) break;
        const nextAmount = following.match(moneyText);
        if (nextAmount) return nextAmount[0];
      }
    }
    return "";
  }
  return {
    items,
    order: {
      sellerPrice: amountFor(/^(?:articles?|prix des articles?|prix vendeur|sous-total articles?)\s*[:：-]?/i, 1),
      shippingFee: amountFor(/^(?:frais de port|livraison|frais de livraison)\s*[:：-]?/i, 1),
      buyerProtectionFee: amountFor(/^(?:protection acheteur|frais de protection|frais vinted)\s*[:：-]?/i, 1),
      paidTotal: amountFor(/^(?:total payé|montant payé|total de la commande|total à payer)\s*[:：-]?/i, 1),
    },
    pageTitle: document.title.slice(0, 120),
  };
}

document.querySelectorAll("input[name=kind]").forEach(input => {
  input.addEventListener("change", async () => {
    if (workspace.items.length && selectedKind() !== workspace.kind) {
      input.checked = false;
      document.querySelector(`input[name=kind][value="${workspace.kind}"]`).checked = true;
      setStatus("Commencez une nouvelle commande pour changer achat / vente.");
      return;
    }
    workspace.kind = selectedKind();
    await save();
    draw();
  });
});
expectedInput.addEventListener("change", async () => {
  const count = Number(expectedInput.value);
  workspace.expected = Number.isInteger(count) && count >= 1 && count <= 60 ? count : 1;
  await save();
  draw();
});
resetButton.addEventListener("click", async () => {
  workspace = emptyWorkspace(selectedKind());
  await save();
  setStatus("Nouvelle commande. Ouvrez la page du récapitulatif, puis chaque article du lot.");
  draw();
});
captureButton.addEventListener("click", async () => {
  captureButton.disabled = true;
  setStatus("");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || !vintedHost(new URL(tab.url).hostname))
      throw new Error("Ouvrez une page Vinted, puis cliquez de nouveau sur l'extension.");
    const [{ result: capture }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id }, func: captureCurrentVintedPage
    });
    if (!capture) throw new Error("Cette page n'a pas pu être lue.");
    let added = 0;
    for (const item of capture.items) {
      const index = workspace.items.findIndex(x => x.itemId === item.itemId);
      if (index >= 0) {
        // Réactualiser la fiche lorsqu'on vient de l'ouvrir : titre/prix plus précis.
        workspace.items[index] = {
          ...workspace.items[index],
          title: item.title || workspace.items[index].title,
          displayPrice: item.displayPrice || workspace.items[index].displayPrice,
        };
      } else if (workspace.items.length < 60) {
        workspace.items.push(item);
        added++;
      }
    }
    for (const [key, value] of Object.entries(capture.order || {})) {
      if (value) workspace.order[key] = value;
    }
    // Aucun lien sur la page récapitulative ? Retenir tout de même les frais
    // pour que l'utilisateur puisse ensuite ouvrir chaque fiche une par une.
    if (workspace.items.length > workspace.expected) workspace.expected = workspace.items.length;
    await save();
    draw();
    if (!added && !capture.items.length && !Object.values(capture.order || {}).some(Boolean)) {
      setStatus("Aucun article ou montant reconnu sur cette page. Cliquez sur la fiche d'un des articles Vinted, puis revenez ajouter sa page.");
    } else {
      setStatus(added + " article(s) ajouté(s). " +
        (workspace.items.length < workspace.expected
          ? "Ouvrez la fiche suivante sur Vinted pour compléter le lot."
          : "Vérifiez les articles et les montants, puis envoyez la commande unique."));
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Lecture impossible.");
  } finally {
    captureButton.disabled = false;
  }
});

sendButton.addEventListener("click", async () => {
  if (!workspace.items.length || workspace.items.length < workspace.expected) return;
  sendButton.disabled = true;
  try {
    const transfer = {
      schemaVersion: 2, transferId: crypto.randomUUID(), timestamp: Date.now(),
      kind: workspace.kind, items: workspace.items, order: workspace.order,
    };
    await chrome.storage.local.set({ [PENDING_KEY]: transfer });
    await chrome.tabs.create({ url: "https://kyrivo.fr/import-vinted?extension=1" });
    setStatus("Commande envoyée. Un seul brouillon sera préparé dans Kyrivo.");
    workspace = emptyWorkspace(workspace.kind);
    await save();
    draw();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Envoi impossible.");
    draw();
  }
});

(async () => {
  try {
    const stored = await chrome.storage.local.get(WORKSPACE_KEY);
    const candidate = stored[WORKSPACE_KEY];
    workspace = candidate?.schemaVersion === 2 && Array.isArray(candidate.items) &&
      candidate.items.length <= 60 && (candidate.kind === "sale" || candidate.kind === "purchase")
      ? candidate : emptyWorkspace();
  } catch { workspace = emptyWorkspace(); }
  draw();
})();
