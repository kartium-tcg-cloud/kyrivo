// Rythme vertical des sections marketing — formalise les 3 paliers d'espacement
// (mb-16/mb-24/mb-32) utilisés jusqu'ici de façon ad hoc dans page.tsx

import type { ReactNode } from "react";

type SectionSpacing = "compact" | "standard" | "hero";

const SPACING_CLASSES: Record<SectionSpacing, string> = {
  compact: "mb-16",
  standard: "mb-24",
  hero: "mb-32",
};

interface SectionProps {
  children: ReactNode;
  spacing?: SectionSpacing;
  className?: string;
}

export default function Section({ children, spacing = "standard", className = "" }: SectionProps) {
  return <section className={`relative ${SPACING_CLASSES[spacing]} ${className}`}>{children}</section>;
}
