"use client";

import { useEffect } from "react";
import { trackFunnel, trackMeta } from "@/lib/analytics";

// Composant null-render : fire landing_view (interne) + ViewContent (Meta si consentement)
export default function LandingAnalytics() {
  useEffect(() => {
    trackFunnel("landing_view");
    trackMeta("ViewContent", { content_name: "Landing Kyrivo" });
  }, []);

  return null;
}
