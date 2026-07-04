// Input texte réutilisable — reprend le style déjà en place dans
// login/page.tsx et register/page.tsx (bordure neutral-800, focus ambre)

import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder:text-neutral-700 outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 ${className}`}
      {...props}
    />
  );
}
