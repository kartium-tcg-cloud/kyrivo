"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PeriodStatsProps {
  companyId: string;
}

interface Stats {
  depenses: number;
  recettes: number;
  tvaCollectee: number;
  tvaDeductible: number;
  soldeTva: number;
  resultatNet: number;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function firstOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function PeriodStats({ companyId }: PeriodStatsProps) {
  const [dateDebut, setDateDebut] = useState(firstOfMonthISO());
  const [dateFin, setDateFin]     = useState(todayISO());
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const rangeInvalid = !!dateDebut && !!dateFin && dateDebut > dateFin;

  useEffect(() => {
    if (!dateDebut || !dateFin || rangeInvalid) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const [{ data: achats, error: eA }, { data: ventes, error: eV }] =
          await Promise.all([
            supabase
              .from("purchases")
              .select("amount_ttc, vat_amount")
              .eq("company_id", companyId)
              .gte("purchase_date", dateDebut)
              .lte("purchase_date", dateFin),
            supabase
              .from("sales")
              .select("total_ttc, vat_amount")
              .eq("company_id", companyId)
              .gte("sale_date", dateDebut)
              .lte("sale_date", dateFin),
          ]);

        if (eA) throw eA;
        if (eV) throw eV;
        if (cancelled) return;

        const depenses      = round2((achats ?? []).reduce((s, a) => s + Number(a.amount_ttc  ?? 0), 0));
        const tvaDeductible = round2((achats ?? []).reduce((s, a) => s + Number(a.vat_amount  ?? 0), 0));
        const recettes      = round2((ventes ?? []).reduce((s, v) => s + Number(v.total_ttc   ?? 0), 0));
        const tvaCollectee  = round2((ventes ?? []).reduce((s, v) => s + Number(v.vat_amount  ?? 0), 0));
        const soldeTva      = round2(tvaCollectee - tvaDeductible);
        const resultatNet   = round2(recettes - depenses - soldeTva);

        setStats({ depenses, recettes, tvaCollectee, tvaDeductible, soldeTva, resultatNet });
      } catch {
        if (!cancelled) setError("Impossible de charger les données de la période.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [companyId, dateDebut, dateFin, rangeInvalid]);

  return (
    <section className="space-y-5 pt-2">

      {/* ── Titre de section ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-800/60" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600">
          Analyse par période
        </span>
        <div className="h-px flex-1 bg-neutral-800/60" />
      </div>

      {/* ── Sélecteurs de dates ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
            Du
          </label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="
              w-full rounded-lg border border-neutral-800
              bg-neutral-900/60 px-3 py-2.5
              text-sm text-neutral-200
              outline-none transition-colors
              focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10
            "
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
            Au
          </label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="
              w-full rounded-lg border border-neutral-800
              bg-neutral-900/60 px-3 py-2.5
              text-sm text-neutral-200
              outline-none transition-colors
              focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10
            "
          />
        </div>
      </div>

      {/* ── Erreur de plage ──────────────────────────────────── */}
      {rangeInvalid && (
        <p className="text-center text-xs text-amber-400/70">
          La date de début doit être antérieure à la date de fin.
        </p>
      )}

      {/* ── Erreur réseau ────────────────────────────────────── */}
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      {/* ── Squelette chargement ─────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-neutral-800 bg-neutral-900/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Cartes statistiques ──────────────────────────────── */}
      {stats && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Argent dépensé */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
                  <ArrowDownIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 leading-tight">
                  Argent dépensé
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums text-red-400 leading-none">
                {fmt(stats.depenses)}
              </p>
            </div>

            {/* Argent rentré */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <ArrowUpIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 leading-tight">
                  Argent rentré
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums text-emerald-400 leading-none">
                {fmt(stats.recettes)}
              </p>
            </div>

            {/* Solde TVA */}
            <div className={`
              rounded-xl border p-4 flex flex-col gap-3
              ${stats.soldeTva >= 0
                ? "border-amber-500/20 bg-amber-500/5"
                : "border-blue-500/20 bg-blue-500/5"}
            `}>
              <div className="flex items-center gap-2">
                <span className={`
                  inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border
                  ${stats.soldeTva >= 0
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    : "border-blue-500/20 bg-blue-500/10 text-blue-400"}
                `}>
                  <ReceiptIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 leading-tight">
                  {stats.soldeTva >= 0 ? "TVA estimée à payer" : "Crédit TVA estimé"}
                </p>
              </div>
              <p className={`text-xl font-bold tabular-nums leading-none ${stats.soldeTva >= 0 ? "text-amber-400" : "text-blue-400"}`}>
                {fmt(Math.abs(stats.soldeTva))}
              </p>
              <div className="space-y-0.5 border-t border-neutral-800/60 pt-2">
                <p className="text-[10px] text-neutral-600">
                  Collectée&nbsp;: <span className="text-neutral-500 tabular-nums">{fmt(stats.tvaCollectee)}</span>
                </p>
                <p className="text-[10px] text-neutral-600">
                  Déductible&nbsp;: <span className="text-neutral-500 tabular-nums">{fmt(stats.tvaDeductible)}</span>
                </p>
              </div>
            </div>

            {/* Résultat net */}
            <div className={`
              rounded-xl border p-4 flex flex-col gap-3
              ${stats.resultatNet >= 0
                ? "border-emerald-500/25 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"}
            `}>
              <div className="flex items-center gap-2">
                <span className={`
                  inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border
                  ${stats.resultatNet >= 0
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"}
                `}>
                  <TrendIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 leading-tight">
                  Résultat net estimé
                </p>
              </div>
              <p className={`text-xl font-bold tabular-nums leading-none ${stats.resultatNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmt(stats.resultatNet)}
              </p>
            </div>

          </div>

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-neutral-700">
            Montants estimatifs basés sur les achats et ventes enregistrés dans Kyrivo. Non certifiés comptablement.
          </p>
        </>
      )}

    </section>
  );
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function ArrowDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0-6-6m6 6 6-6" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6 6m6-6 6 6" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}
