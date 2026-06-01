"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "kyrivo_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage indisponible
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ marketing: true }));
      window.dispatchEvent(new Event("kyrivo:consent"));
    } catch { /* ignore */ }
    setVisible(false);
  };

  const refuse = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ marketing: false }));
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-neutral-800 bg-neutral-950/98 backdrop-blur-sm px-6 py-4 lg:pl-[calc(16rem+1.5rem)]">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-neutral-400 leading-relaxed">
          Kyrivo utilise des cookies publicitaires (
          <span className="text-neutral-300">Meta Pixel</span>
          ) pour mesurer l'efficacité de ses campagnes marketing.{" "}
          <Link
            href="/cookies"
            className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
          >
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={refuse}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
