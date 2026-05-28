// src/components/legal/LegalPage.tsx
// Composant réutilisable pour les pages légales de Kyrivo
// Design : dark premium, accents amber, responsive mobile-first

import Link from "next/link"
import { ReactNode } from "react"

// ─── Helpers ─────────────────────────────────────────────────────

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4 pb-2.5 border-b border-neutral-800 leading-snug">
        {title}
      </h2>
      <div className="space-y-3 text-sm sm:text-[15px] text-neutral-300 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export function LegalSubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm sm:text-[15px] font-semibold text-neutral-100 mb-2">
        {title}
      </h3>
      <div className="space-y-2 text-sm sm:text-[15px] text-neutral-300 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

/** Champ à compléter manuellement — visuellement mis en évidence */
export function Placeholder({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded px-2 py-0.5 text-xs font-mono font-medium">
      ⚠ {label}
    </span>
  )
}

/** Carte d'information structurée */
export function InfoCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 sm:p-5 space-y-1.5 text-sm sm:text-[15px] text-neutral-300 leading-relaxed">
      {children}
    </div>
  )
}

/** Note d'avertissement en amber */
export function NoteCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 sm:p-5 text-sm text-amber-200/75 leading-relaxed">
      {children}
    </div>
  )
}

/** Liste à puces stylée */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Composant principal ──────────────────────────────────────────

interface LegalPageProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: ReactNode
}

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/conditions-generales", label: "CGU / CGV" },
  { href: "/politique-confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/donnees-personnelles", label: "Données personnelles" },
]

export default function LegalPage({ title, subtitle, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="border-b border-neutral-800/60 bg-[#0c0c0c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-6 sm:pt-9 sm:pb-8">

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-500 hover:text-amber-400 transition-colors mb-5 group"
          >
            <svg
              className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Kyrivo
          </Link>

          <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-white leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm sm:text-[15px] text-neutral-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}

          {lastUpdated && (
            <p className="mt-3 text-xs text-neutral-600">
              Dernière mise à jour : {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* ─── Contenu ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </div>

      {/* ─── Footer légal ────────────────────────────────────── */}
      <div className="border-t border-neutral-800/60 bg-[#0c0c0c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-neutral-600">
              © {new Date().getFullYear()} Kyrivo — Pierre Higny
            </p>
            <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-4 gap-y-2">
              {LEGAL_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[11px] text-neutral-500 hover:text-amber-400 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

    </div>
  )
}
