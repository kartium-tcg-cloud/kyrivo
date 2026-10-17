import type { ReactNode } from "react";

/**
 * Identité visuelle Kyrivo : symbole approuvé (carte + flèches)
 * et nom en typographie simple, sans ancien monogramme K.
 */
export default function BrandLogo({
  className = "",
  iconClassName = "h-11 w-11",
  children,
}: {
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Kyrivo">
      <img
        src="/brand/kyrivo-mark-2026.png"
        alt=""
        width={48}
        height={48}
        className={`shrink-0 object-contain ${iconClassName}`}
      />
      <span className="text-2xl font-semibold tracking-[-0.045em] text-white">
        Kyrivo
      </span>
      {children}
    </span>
  );
}
