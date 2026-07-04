"use client";
import Script from "next/script";
import { useState, useEffect } from "react";

// Nécessite NEXT_PUBLIC_GA_MEASUREMENT_ID (ex: "G-XXXXXXX") en variable
// d'environnement Vercel. Sans elle, ce composant ne rend rien.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = "kyrivo_cookie_consent";

export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const checkConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored) {
          const consent = JSON.parse(stored) as { marketing?: boolean };
          setShouldLoad(consent.marketing === true);
        }
      } catch {
        // localStorage indisponible ou JSON invalide
      }
    };

    checkConsent();
    window.addEventListener("kyrivo:consent", checkConsent);
    return () => window.removeEventListener("kyrivo:consent", checkConsent);
  }, []);

  if (!GA_MEASUREMENT_ID || !shouldLoad) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
