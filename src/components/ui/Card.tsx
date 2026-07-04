// Carte réutilisable — remplace les blocs "rounded-2xl border border-neutral-800
// bg-neutral-900/30" répétés dans page.tsx, abonnements, mode-emploi.
// `surface` applique le léger reflet/ombre déjà défini dans globals.css (.surface),
// `glow` applique le halo ambre au hover déjà défini (.card-amber-glow).

import type { ReactNode } from "react";

type CardPadding = "sm" | "md" | "lg";

const PADDING_CLASSES: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  surface?: boolean;
  glow?: boolean;
  className?: string;
}

export default function Card({
  children,
  padding = "md",
  surface = true,
  glow = false,
  className = "",
}: CardProps) {
  const classes = [
    "rounded-2xl border border-neutral-800 bg-neutral-900/30",
    PADDING_CLASSES[padding],
    surface ? "surface" : "",
    glow ? "card-amber-glow" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
