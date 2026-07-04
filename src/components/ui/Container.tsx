// Largeur de page centralisée — remplace les 5 valeurs max-w-* incohérentes
// utilisées page par page (max-w-6xl, max-w-[1500px], max-w-[1440px], max-w-5xl, max-w-4xl)

import type { ReactNode } from "react";

type ContainerSize = "marketing" | "app" | "prose";

const SIZE_CLASSES: Record<ContainerSize, string> = {
  marketing: "max-w-6xl", // landing, abonnements, login, register
  app: "max-w-[1440px]", // dashboard, achats, ventes, stock, contacts, factures
  prose: "max-w-[44rem]", // mode-emploi, pages légales — ligne de lecture 65-75 caractères
};

interface ContainerProps {
  size?: ContainerSize;
  children: ReactNode;
  className?: string;
}

export default function Container({ size = "marketing", children, className = "" }: ContainerProps) {
  return (
    <div className={`relative mx-auto w-full px-5 sm:px-6 lg:px-10 ${SIZE_CLASSES[size]} ${className}`}>
      {children}
    </div>
  );
}
