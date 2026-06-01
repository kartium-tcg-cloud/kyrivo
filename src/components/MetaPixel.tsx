"use client";
import Script from "next/script";
import { useState, useEffect } from "react";

const PIXEL_ID = "1315659723326651";
const CONSENT_KEY = "kyrivo_cookie_consent";

export default function MetaPixel() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
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

  if (!shouldLoad) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
