"use client";

import { useRouter } from "next/navigation";
import { buildRegisterUrl, trackFunnel, trackMetaCustom } from "@/lib/analytics";
import Button from "@/components/ui/Button";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

// CTA tracké vers /register :
// - onClick : fire cta_register_click (interne) + ClickStartTrial (Meta si consentement)
// - Navigue vers /register avec UTMs préservés
// - href="/register" est le fallback SSR (pas de mismatch hydratation)
export default function RegisterCTA({
  label,
  variant = "primary",
  size = "lg",
  className = "",
}: {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    trackFunnel("cta_register_click");
    trackMetaCustom("ClickStartTrial");
    router.push(buildRegisterUrl());
  }

  return (
    <Button
      href="/register"
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`cta-pulse ${className}`}
    >
      {label}
      <svg
        className="cta-arrow h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
        />
      </svg>
    </Button>
  );
}
