// Pilule colorée réutilisable — généralise PlanBadge (Sidebar.tsx) et
// ItemStatusBadge.tsx, qui réimplémentent chacun le même motif.

import type { ReactNode } from "react";

type BadgeTone = "brand" | "success" | "danger" | "info" | "violet" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  danger: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
  info: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
  violet: "bg-violet-500/10 text-violet-400 border border-violet-500/25",
  neutral: "bg-neutral-800/60 text-neutral-300 border border-neutral-700",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export default function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
