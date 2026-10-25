import Link from "next/link";

/**
 * Action d'import Vinted commune aux pages Achats et Ventes.
 * Intentionnellement plus visible que les actions habituelles pendant la bêta,
 * sans animation permanente ni détour vers une page promotionnelle.
 */
export default function VintedImportCTA() {
  return (
    <Link
      href="/import-vinted"
      aria-label="Tester l'import Vinted en bêta pour les achats et les ventes"
      className="
        group relative isolate inline-flex min-h-[60px] w-full items-center justify-between
        gap-3 overflow-hidden rounded-xl border border-teal-200/70
        bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300
        px-4 py-2.5 text-slate-950
        shadow-[0_8px_28px_rgba(20,184,166,0.30)]
        transition-[transform,box-shadow,filter] duration-200
        hover:brightness-105 hover:shadow-[0_12px_34px_rgba(20,184,166,0.42)]
        active:translate-y-0 active:scale-[0.99]
        motion-safe:hover:-translate-y-0.5
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-cyan-200
        sm:w-auto
      "
    >
      <span
        aria-hidden="true"
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950/15 ring-1 ring-slate-950/10"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
          <path d="M4.5 16v3.5c0 .6.4 1 1 1h13c.6 0 1-.4 1-1V16" />
        </svg>
      </span>

      <span className="relative min-w-0 flex-1 text-left">
        <span className="block text-sm font-extrabold leading-5 tracking-tight sm:text-base">
          Importer Vinted
        </span>
        <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-900/80">
          Testez avec un email
        </span>
      </span>

      <span
        aria-label="Fonctionnalité en bêta"
        className="relative inline-flex shrink-0 items-center rounded-md bg-slate-950 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-teal-200 shadow-sm"
      >
        Bêta
      </span>

      <svg
        aria-hidden="true"
        className="relative hidden h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 sm:block"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </svg>
    </Link>
  );
}
