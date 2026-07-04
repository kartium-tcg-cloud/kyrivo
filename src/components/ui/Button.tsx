// Bouton/CTA réutilisable — remplace les classes dupliquées dans page.tsx,
// mode-emploi, login, register (motif "rounded-xl bg-amber-500 text-neutral-950...")
// Rendu en <Link> si `href` est fourni, sinon en <button>.

import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20",
  secondary:
    "bg-neutral-900/60 text-neutral-200 border border-neutral-700/60 hover:border-neutral-600 hover:bg-neutral-900",
  ghost: "text-neutral-400 hover:text-neutral-200",
  danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "rounded-lg px-4 py-2 text-xs font-semibold",
  md: "rounded-xl px-6 py-3 text-sm font-bold",
  lg: "rounded-xl px-8 py-4 text-sm font-bold",
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const classes = `group inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick as MouseEventHandler<HTMLAnchorElement>} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick as MouseEventHandler<HTMLButtonElement>} {...rest}>
      {children}
    </button>
  );
}
