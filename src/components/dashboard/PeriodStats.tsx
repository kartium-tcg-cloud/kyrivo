"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EvolutionChart, ProfitBridge, type EvolutionPoint } from "./PeriodCharts";

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

type Granularity = "day" | "week" | "month";

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

// ── Helpers évolution temporelle (graphique 1) ──────────────────────────────
// Toutes les dates sont manipulées en UTC pour éviter les décalages de fuseau
// horaire avec les chaînes "YYYY-MM-DD" stockées/affichées.

function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mondayOf(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  return monday;
}

function getGranularity(dateDebut: string, dateFin: string): Granularity {
  const start = parseISO(dateDebut);
  const end = parseISO(dateFin);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (diffDays <= 31) return "day";
  if (diffDays <= 92) return "week";
  return "month";
}

function buildBuckets(dateDebut: string, dateFin: string, granularity: Granularity): string[] {
  const start = parseISO(dateDebut);
  const end = parseISO(dateFin);
  const keys: string[] = [];

  if (granularity === "day") {
    const cursor = new Date(start);
    while (cursor <= end) {
      keys.push(toISO(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  } else if (granularity === "week") {
    const cursor = mondayOf(start);
    while (cursor <= end) {
      keys.push(toISO(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
  } else {
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cursor <= endMonth) {
      keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  return keys;
}

function bucketKeyFor(dateStr: string, granularity: Granularity): string {
  const d = parseISO(dateStr);
  if (granularity === "day") return toISO(d);
  if (granularity === "month") return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return toISO(mondayOf(d));
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1, 1));
    return d.toLocaleDateString("fr-BE", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  const d = parseISO(key);
  const formatted = d.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return granularity === "week" ? `Sem. ${formatted}` : formatted;
}

function granularityLabel(granularity: Granularity): string {
  if (granularity === "day") return "Par jour";
  if (granularity === "week") return "Par semaine";
  return "Par mois";
}

export default function PeriodStats({ companyId }: PeriodStatsProps) {
  const [dateDebut, setDateDebut] = useState(firstOfMonthISO());
  const [dateFin, setDateFin]     = useState(todayISO());
  const [stats, setStats]         = useState<Stats | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [granularity, setGranularity] = useState<Granularity>("day");
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
              .select("amount_ttc, vat_amount, purchase_date")
              .eq("company_id", companyId)
              .gte("purchase_date", dateDebut)
              .lte("purchase_date", dateFin),
            supabase
              .from("sales")
              .select("total_ttc, vat_amount, sale_date")
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

        // Évolution par bucket (jour / semaine / mois) — même formule que ci-dessus,
        // appliquée par sous-période pour le graphique d'évolution.
        const bucketGranularity = getGranularity(dateDebut, dateFin);
        const bucketKeys = buildBuckets(dateDebut, dateFin, bucketGranularity);
        const buckets = new Map<string, { ventes: number; achats: number; tvaCol: number; tvaDed: number }>();
        bucketKeys.forEach((k) => buckets.set(k, { ventes: 0, achats: 0, tvaCol: 0, tvaDed: 0 }));

        (achats ?? []).forEach((a) => {
          if (!a.purchase_date) return;
          const entry = buckets.get(bucketKeyFor(a.purchase_date, bucketGranularity));
          if (entry) {
            entry.achats += Number(a.amount_ttc ?? 0);
            entry.tvaDed += Number(a.vat_amount ?? 0);
          }
        });
        (ventes ?? []).forEach((v) => {
          if (!v.sale_date) return;
          const entry = buckets.get(bucketKeyFor(v.sale_date, bucketGranularity));
          if (entry) {
            entry.ventes += Number(v.total_ttc ?? 0);
            entry.tvaCol += Number(v.vat_amount ?? 0);
          }
        });

        setGranularity(bucketGranularity);
        setEvolution(
          bucketKeys.map((key) => {
            const e = buckets.get(key)!;
            return {
              key,
              label: bucketLabel(key, bucketGranularity),
              ventes: round2(e.ventes),
              achats: round2(e.achats),
              net: round2(e.ventes - e.achats - (e.tvaCol - e.tvaDed)),
            };
          })
        );
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
        <div className="h-px flex-1 bg-zinc-800/60" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Analyse par période
        </span>
        <div className="h-px flex-1 bg-zinc-800/60" />
      </div>

      {/* ── Sélecteurs de dates ──────────────────────────────── */}
      <div className="surface space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 sm:p-4">
        <p className="text-xs text-zinc-400">
          Choisissez une période pour générer automatiquement les statistiques et graphiques ci-dessous.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Du
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="
                w-full rounded-lg border border-zinc-800
                bg-zinc-900/60 px-3 py-2.5
                text-sm text-zinc-200
                outline-none transition-colors
                focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10
              "
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Au
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="
                w-full rounded-lg border border-zinc-800
                bg-zinc-900/60 px-3 py-2.5
                text-sm text-zinc-200
                outline-none transition-colors
                focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10
              "
            />
          </div>
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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse"
              />
            ))}
          </div>
        </>
      )}

      {/* ── Cartes statistiques ──────────────────────────────── */}
      {stats && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Argent dépensé */}
            <div className="surface rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-3 transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
                  <ArrowDownIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 leading-tight">
                  Argent dépensé
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums text-red-400 leading-none">
                {fmt(stats.depenses)}
              </p>
            </div>

            {/* Argent rentré */}
            <div className="surface rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-3 transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <ArrowUpIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 leading-tight">
                  Argent rentré
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums text-emerald-400 leading-none">
                {fmt(stats.recettes)}
              </p>
            </div>

            {/* Solde TVA */}
            <div className={`
              surface rounded-xl border p-4 flex flex-col gap-3 transition-colors
              ${stats.soldeTva >= 0
                ? "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/30"
                : "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/30"}
            `}>
              <div className="flex items-center gap-2">
                <span className={`
                  inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border
                  ${stats.soldeTva >= 0
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                    : "border-violet-500/20 bg-violet-500/10 text-violet-400"}
                `}>
                  <ReceiptIcon />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 leading-tight">
                  {stats.soldeTva >= 0 ? "TVA estimée à payer" : "Crédit TVA estimé"}
                </p>
              </div>
              <p className={`text-xl font-bold tabular-nums leading-none ${stats.soldeTva >= 0 ? "text-cyan-400" : "text-violet-400"}`}>
                {fmt(Math.abs(stats.soldeTva))}
              </p>
              <div className="space-y-0.5 border-t border-zinc-800/60 pt-2">
                <p className="text-[10px] text-zinc-600">
                  Collectée&nbsp;: <span className="text-zinc-500 tabular-nums">{fmt(stats.tvaCollectee)}</span>
                </p>
                <p className="text-[10px] text-zinc-600">
                  Déductible&nbsp;: <span className="text-zinc-500 tabular-nums">{fmt(stats.tvaDeductible)}</span>
                </p>
              </div>
            </div>

            {/* Résultat net */}
            <div className={`
              surface rounded-xl border p-4 flex flex-col gap-3 transition-colors
              ${stats.resultatNet >= 0
                ? "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/35"
                : "border-red-500/20 bg-red-500/5 hover:border-red-500/30"}
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 leading-tight">
                  Résultat net estimé
                </p>
              </div>
              <p className={`text-xl font-bold tabular-nums leading-none ${stats.resultatNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmt(stats.resultatNet)}
              </p>
            </div>

          </div>

          {/* Phrase d'aide */}
          <p className="text-xs text-zinc-400">
            Visualisez l’évolution de votre activité et la composition de votre rentabilité sur la période sélectionnée.
          </p>

          {/* ── Graphiques ──────────────────────────────────────── */}
          <div
            key={`${dateDebut}_${dateFin}`}
            className="animate-chart-fade grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            {/* Graphique 1 — Évolution de la période */}
            <div className="surface rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-200">Évolution de la période</h3>
                <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {granularityLabel(granularity)}
                </span>
              </div>
              <EvolutionChart data={evolution} />
            </div>

            {/* Graphique 2 — Pont de rentabilité */}
            <div className="surface rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-4 text-sm font-semibold text-zinc-200">Pont de rentabilité</h3>
              <ProfitBridge
                recettes={stats.recettes}
                depenses={stats.depenses}
                soldeTva={stats.soldeTva}
                resultatNet={stats.resultatNet}
              />
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-zinc-700">
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
