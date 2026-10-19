"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/analytics";
import { trackOpenAIAds } from "@/lib/openaiAds";
import { KYRIVO_OPENAI_ADS_PIXEL_ID } from "@/lib/openaiAdsConfig";

const PIXEL_ID = KYRIVO_OPENAI_ADS_PIXEL_ID;

/** On ne mesure pas les pages métiers des clients ou les données de leur compte. */
const MARKETING_PAGES: Record<string, string> = {
  "/": "Accueil Kyrivo",
  "/register": "Inscription Kyrivo",
  "/abonnements": "Tarifs Kyrivo",
  "/nouveautes": "Nouveautés Kyrivo",
  "/nouveautes/v1-1": "Mise à jour Kyrivo v1.1",
  "/nouveautes/guide-demarrage": "Tutoriel de démarrage Kyrivo",
};

/**
 * Charge le SDK et mesure les pages publiques UNIQUEMENT après consentement.
 * Le Pixel est unique et partagé par toutes les pages Next.js.
 */
export default function OpenAIAdsPixel() {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  const trackPage = useCallback((path: string) => {
    if (!hasMarketingConsent() || !window.oaiq || !MARKETING_PAGES[path]) return;
    if (lastTrackedPath.current === path) return;
    lastTrackedPath.current = path;
    trackOpenAIAds("page_viewed", {
      type: "contents",
      contents: [{ id: path, name: MARKETING_PAGES[path], content_type: "page" }],
    });
  }, []);

  useEffect(() => {
    const updateConsent = () => {
      const granted = hasMarketingConsent();
      setEnabled(granted);
      if (!granted) lastTrackedPath.current = null;
      // Le SDK supprime également ses cookies publicitaires quand le consentement est retiré.
      if (!granted && window.oaiq) window.oaiq("consent", false);
      if (granted && window.oaiq) window.oaiq("consent", true);
    };
    updateConsent();
    window.addEventListener("kyrivo:consent", updateConsent);
    return () => window.removeEventListener("kyrivo:consent", updateConsent);
  }, []);

  // Sur navigation client-side, la racine est persistante : compter chaque page
  // publique consultée, sans envoyer de double événement au premier chargement.
  useEffect(() => {
    if (enabled) trackPage(pathname);
  }, [enabled, pathname, trackPage]);

  if (!PIXEL_ID || !enabled) return null;

  return (
    <Script
      id="kyrivo-openai-ads-pixel"
      strategy="afterInteractive"
      onReady={() => trackPage(window.location.pathname)}
    >
      {`(function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var js=d.createElement(s);js.async=true;js.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(js,f)})(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("consent",true);oaiq("init",{pixelId:${JSON.stringify(PIXEL_ID)},debug:true});`}
    </Script>
  );
}
