"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasMarketingConsent, storeOpenAIAdsClickReference } from "@/lib/analytics";

const STORAGE_KEY = "kyrivo_cookie_consent";

export default function MarketingConsentSettings() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setConsent(hasMarketingConsent());
  }, []);

  async function change(value: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ marketing: value }));
      if (!value) sessionStorage.removeItem("kyrivo_ads_oppref");
      window.dispatchEvent(new Event("kyrivo:consent"));
      if (value) storeOpenAIAdsClickReference();
      setConsent(value);
      setNotice(value ? "Mesure publicitaire autorisée." : "Mesure publicitaire refusée.");

      // Garde le choix durable jusqu'au paiement (CAPI) pour les comptes enregistrés.
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const attribution = user.user_metadata?.kyrivo_campaign_attribution;
        if (attribution && typeof attribution === "object") {
          const { error } = await supabase.auth.updateUser({
            data: { kyrivo_campaign_attribution: {
              ...attribution,
              marketing_consent: value,
              ...(value ? {} : { oppref: null }),
            } },
          });
          if (error) {
            setNotice("Préférence enregistrée sur cet appareil. Pour une suppression complète des données de suivi, contactez le support.");
          }
        }
      }
    } catch {
      setNotice("Impossible de modifier ce paramètre dans ce navigateur.");
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-neutral-700 bg-neutral-900/40 p-4">
      <p className="text-sm text-neutral-200">
        État actuel : <strong>{consent === null ? "non chargé" : consent ? "accepté" : "refusé"}</strong>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => change(false)}
          className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
          Refuser / retirer mon consentement
        </button>
        <button type="button" onClick={() => change(true)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400">
          Autoriser la mesure publicitaire
        </button>
      </div>
      {notice && <p role="status" className="mt-3 text-xs text-neutral-300">{notice}</p>}
    </div>
  );
}
