// Badges de preuve sociale (Vinted / Google) — reprend les chiffres déjà
// annoncés dans CredibilityFooter (src/app/page.tsx). Recréés en HTML/CSS
// natif plutôt qu'en image (public/brand/Vinted.png et google.png ne sont
// pas utilisés : 900 Ko+ chacun pour un simple badge, non optimisés).

function StarRating() {
  return (
    <span className="flex items-center gap-0.5 text-amber-400" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.8L10 14.9l-5.21 2.74 1-5.8-4.21-4.1 5.82-.85L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default function SocialProofBadges({ compact = false }: { compact?: boolean }) {
  const padding = compact ? "px-4 py-2" : "px-5 py-3";

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className={`inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/40 ${padding}`}>
        <StarRating />
        <span className="h-4 w-px bg-neutral-800" />
        <span className="text-sm text-neutral-300">24 avis Vinted</span>
      </div>
      <div className={`inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/40 ${padding}`}>
        <StarRating />
        <span className="text-sm font-semibold text-white">5,0</span>
        <span className="h-4 w-px bg-neutral-800" />
        <span className="text-sm text-neutral-300">7 avis Google</span>
      </div>
    </div>
  );
}
