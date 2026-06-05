"use client";

import { useEffect } from "react";
import { storeUtmsInSession, trackFunnel, trackMeta } from "@/lib/analytics";

// Composant null-render monté sur la landing.
// Ordre d'exécution intentionnel :
//   1. storeUtmsInSession() — capture les UTM AVANT tout changement d'URL
//   2. trackFunnel("landing_view") — lit les UTM (URL ou session)
//   3. trackMeta("ViewContent") — si consentement marketing
export default function LandingAnalytics() {
  useEffect(() => {
    storeUtmsInSession();
    trackFunnel("landing_view");
    trackMeta("ViewContent", { content_name: "Landing Kyrivo" });
  }, []);

  return null;
}
