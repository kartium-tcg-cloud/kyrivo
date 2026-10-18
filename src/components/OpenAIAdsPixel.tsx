"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasMarketingConsent } from "@/lib/analytics";

const PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID;

/** Le SDK ne se charge jamais avant consentement. */
export default function OpenAIAdsPixel() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const updateConsent = () => {
      const granted = hasMarketingConsent();
      setEnabled(granted);
      // En cas de retrait du consentement après un chargement antérieur.
      if (!granted && window.oaiq) window.oaiq("consent", false);
      if (granted && window.oaiq) window.oaiq("consent", true);
    };
    updateConsent();
    window.addEventListener("kyrivo:consent", updateConsent);
    return () => window.removeEventListener("kyrivo:consent", updateConsent);
  }, []);

  if (!PIXEL_ID || !enabled) return null;

  return (
    <Script id="kyrivo-openai-ads-pixel" strategy="afterInteractive">
      {`(function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var js=d.createElement(s);js.async=true;js.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(js,f)})(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("consent",true);oaiq("init",{pixelId:${JSON.stringify(PIXEL_ID)}});`}
    </Script>
  );
}
