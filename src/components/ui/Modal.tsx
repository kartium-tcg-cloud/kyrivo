// Modal générique réutilisable
// Overlay sombre + centré + fermeture au clic extérieur et Escape

"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  children: React.ReactNode;
}

export default function Modal({ ouvert, onFermer, titre, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fermeture avec Escape
  useEffect(() => {
    if (!ouvert) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };

    document.addEventListener("keydown", handleEscape);

    // Empêche le scroll du body quand la modal est ouverte
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Contenu de la modal */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-neutral-950 border border-neutral-800/80 shadow-2xl shadow-black/60 overflow-hidden">

        {/* Ligne amber signature */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/60">
          <h2 className="text-base font-bold tracking-tight text-white">{titre}</h2>
          <button
            onClick={onFermer}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[76vh] sm:max-h-[82vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}