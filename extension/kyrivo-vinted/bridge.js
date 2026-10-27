/* Passerelle à usage unique : transfert vers la page Kyrivo ouverte par l'utilisateur.
   Aucun cookie, token de session ou identifiant Vinted n'est lu. */
(() => {
  if (!location.pathname.startsWith("/import-vinted") ||
      new URL(location.href).searchParams.get("extension") !== "1") return;

  const origin = location.origin;
  const storageKey = "kyrivoVintedPendingV1";

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.origin !== origin ||
        !event.data || typeof event.data !== "object") return;

    if (event.data.type === "KYRIVO_VINTED_REQUEST_V1") {
      try {
        const stored = await chrome.storage.local.get(storageKey);
        const pending = stored[storageKey];
        if (!pending || (pending.schemaVersion !== 1 && pending.schemaVersion !== 2) ||
            typeof pending.timestamp !== "number" ||
            Date.now() - pending.timestamp > 30 * 60 * 1000) return;
        window.postMessage({ type: "KYRIVO_VINTED_CAPTURE_V1", payload: pending }, origin);
      } catch { /* Extension désinstallée ou stockage indisponible */ }
    }

    if (event.data.type === "KYRIVO_VINTED_ACCEPTED_V1" &&
        typeof event.data.transferId === "string") {
      try {
        const stored = await chrome.storage.local.get(storageKey);
        if (stored[storageKey]?.transferId === event.data.transferId)
          await chrome.storage.local.remove(storageKey);
      } catch { /* Ne pas gêner le formulaire */ }
    }
  });
})();
