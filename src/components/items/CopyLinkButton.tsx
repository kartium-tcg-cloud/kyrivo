"use client";

import { useState } from "react";

interface CopyLinkButtonProps {
  url: string;
}

export default function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API indisponible (permissions/contexte) — on ignore silencieusement
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="
        inline-flex items-center gap-2
        rounded-lg border border-neutral-800 bg-neutral-900
        px-3 py-1.5
        text-xs font-semibold text-neutral-300
        hover:bg-neutral-800
        transition-colors
      "
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        />
      </svg>
      {copied ? "Lien copié !" : "Copier le lien"}
    </button>
  );
}
