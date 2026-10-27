// Modal générique réutilisable
// Overlay sombre + centré + fermeture au clic extérieur et Escape

"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
}

export default function Modal({
  ouvert,
  onFermer,
  titre,
  children,
  footer,
  maxWidthClassName = "max-w-xl",
}: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-overlay-fade" />

      {/* Contenu de la modal */}
      <div role="dialog" aria-modal="true" aria-label={titre} className={`ky-dialog relative z-10 flex max-h-[100dvh] min-w-0 w-full ${maxWidthClassName} flex-col rounded-t-2xl border border-neutral-800/80 bg-neutral-950 shadow-2xl shadow-black/60 overflow-hidden animate-modal-pop sm:max-h-[90vh] sm:rounded-2xl`}>

        {/* Ligne amber signature */}
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

        {/* Header */}
        <div className="ky-dialog-header flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800/60 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="min-w-0 text-base font-bold tracking-tight text-white">{titre}</h2>
          <button
            type="button"
            aria-label="Fermer la fenêtre"
            onClick={onFermer}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="ky-form-area min-h-0 flex-1 overscroll-contain overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {/* Footer (optionnel) */}
        {footer && (
          <div className="ky-dialog-footer shrink-0 border-t border-neutral-800/60 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
