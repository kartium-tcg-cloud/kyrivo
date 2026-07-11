// Page 404 globale — remplace la page par défaut Next.js (anglais, fond blanc)
// par une page cohérente avec le thème sombre Kyrivo.

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
          Erreur 404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">
          Page introuvable
        </h1>

        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
          Cette page n&apos;existe pas, a été déplacée, ou vous n&apos;avez pas
          accès à cette ressource.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href="/" variant="primary" size="sm" className="w-full sm:w-auto">
            Retour à l&apos;accueil
          </Button>

          <Button href="/abonnements" variant="secondary" size="sm" className="w-full sm:w-auto">
            Voir les tarifs
          </Button>
        </div>
      </Card>
    </div>
  );
}
