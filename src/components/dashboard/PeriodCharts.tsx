"use client";

import { useId, useState } from "react";

export interface EvolutionPoint {
  key: string;
  label: string;
  ventes: number;
  achats: number;
  net: number;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

function signedFmt(n: number): string {
  if (n > 0) return `+${fmt(n)}`;
  if (n < 0) return `−${fmt(Math.abs(n))}`;
  return fmt(0);
}

const W = 600;
const H = 150;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const VIEW_H = PAD_TOP + H + PAD_BOTTOM;

// Lissage Catmull-Rom -> Bézier cubique (aucune dépendance externe)
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function LegendBadge({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 17V10m4 7V6m4 11v-4" />
    </svg>
  );
}

// ── Graphique 1 : évolution de la période ──────────────────────────────────
export function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (data.length <= 1) {
    const single = data[0];
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-6 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-500">
          <ChartIcon />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-300">Pas assez de données pour une courbe</p>
          <p className="text-xs text-zinc-500">
            Sélectionnez une période plus longue pour visualiser une évolution dans le temps.
          </p>
        </div>
        {single && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            <span className="text-emerald-400">
              Ventes&nbsp;: <span className="font-semibold tabular-nums">{fmt(single.ventes)}</span>
            </span>
            <span className="text-rose-400">
              Achats&nbsp;: <span className="font-semibold tabular-nums">{fmt(single.achats)}</span>
            </span>
            <span className={single.net < 0 ? "text-red-400" : "text-amber-400"}>
              Bénéfice net&nbsp;: <span className="font-semibold tabular-nums">{fmt(single.net)}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const allValues = data.flatMap((d) => [d.ventes, d.achats, d.net]);
  let yMin = Math.min(0, ...allValues);
  let yMax = Math.max(0, ...allValues);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const range = yMax - yMin;
  const pad = range * 0.1;
  yMin -= pad;
  yMax += pad;

  const xPos = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * W : W / 2);
  const yPos = (v: number) => PAD_TOP + H - ((v - yMin) / (yMax - yMin)) * H;
  const zeroY = yPos(0);

  const ventesPts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.ventes) }));
  const achatsPts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.achats) }));
  const netPts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.net) }));

  const netAreaPath =
    data.length > 1
      ? `${smoothPath(netPts)} L ${xPos(data.length - 1)} ${zeroY} L ${xPos(0)} ${zeroY} Z`
      : "";

  const maxLabels = 7;
  const step = Math.max(1, Math.ceil(data.length / maxLabels));

  const hoverPct = hover !== null ? (data.length > 1 ? (hover / (data.length - 1)) * 100 : 50) : 0;
  const tooltipAlign =
    hoverPct < 12 ? "translate-x-0" : hoverPct > 88 ? "-translate-x-full" : "-translate-x-1/2";

  // Si le point survolé est dans la moitié haute du graphique, on bascule le
  // tooltip en bas pour ne pas masquer la courbe (utile sur petit écran).
  const hoverAvgY =
    hover !== null ? (yPos(data[hover].ventes) + yPos(data[hover].achats) + yPos(data[hover].net)) / 3 : 0;
  const tooltipVerticalClass = hoverAvgY < VIEW_H / 2 ? "bottom-1" : "top-1";

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${VIEW_H}`}
          className="h-44 w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grille discrète */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={PAD_TOP + H * f}
              y2={PAD_TOP + H * f}
              className="stroke-zinc-800/50"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Ligne zéro */}
          <line x1={0} x2={W} y1={zeroY} y2={zeroY} className="stroke-zinc-700/60" strokeWidth={1} />

          {/* Zone bénéfice net (subtile) */}
          {netAreaPath && <path d={netAreaPath} fill={`url(#${gradientId})`} stroke="none" />}

          {/* Repère au survol */}
          {hover !== null && (
            <line
              x1={xPos(hover)}
              x2={xPos(hover)}
              y1={PAD_TOP}
              y2={PAD_TOP + H}
              className="stroke-zinc-600"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* Courbes */}
          <path d={smoothPath(achatsPts)} fill="none" className="stroke-rose-400" strokeWidth={2} strokeLinecap="round" />
          <path d={smoothPath(ventesPts)} fill="none" className="stroke-emerald-400" strokeWidth={2} strokeLinecap="round" />
          <path d={smoothPath(netPts)} fill="none" className="stroke-amber-400" strokeWidth={2} strokeLinecap="round" />

          {/* Points */}
          {data.map((d, i) => (
            <g key={d.key}>
              <circle cx={xPos(i)} cy={yPos(d.achats)} r={hover === i ? 4 : 2.5} className="fill-rose-400 transition-all" />
              <circle cx={xPos(i)} cy={yPos(d.ventes)} r={hover === i ? 4 : 2.5} className="fill-emerald-400 transition-all" />
              <circle
                cx={xPos(i)}
                cy={yPos(d.net)}
                r={hover === i ? 4 : 2.5}
                className={`transition-all ${d.net < 0 ? "fill-red-400" : "fill-amber-400"}`}
              />
            </g>
          ))}

          {/* Zones de survol */}
          {data.map((d, i) => {
            const bandW = data.length > 1 ? W / data.length : W;
            const x = data.length > 1 ? xPos(i) - bandW / 2 : 0;
            return (
              <rect
                key={`hit-${d.key}`}
                x={x}
                y={0}
                width={bandW}
                height={VIEW_H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}

          {/* Labels axe X */}
          {data.map(
            (d, i) =>
              (i % step === 0 || i === data.length - 1) && (
                <text key={`lbl-${d.key}`} x={xPos(i)} y={VIEW_H - 6} textAnchor="middle" className="fill-zinc-500 text-[10px]">
                  {d.label}
                </text>
              )
          )}
        </svg>

        {/* Tooltip */}
        {hover !== null && (
          <div
            className={`pointer-events-none absolute z-10 ${tooltipVerticalClass} ${tooltipAlign} min-w-[130px] sm:min-w-[150px] max-w-[80vw] rounded-lg border border-zinc-700 bg-zinc-950/95 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs shadow-xl shadow-black/40`}
            style={{ left: `${hoverPct}%` }}
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{data[hover].label}</p>
            <div className="space-y-1">
              <p className="flex items-center justify-between gap-3 text-emerald-400">
                <span>Ventes</span>
                <span className="tabular-nums font-semibold">{fmt(data[hover].ventes)}</span>
              </p>
              <p className="flex items-center justify-between gap-3 text-rose-400">
                <span>Achats</span>
                <span className="tabular-nums font-semibold">{fmt(data[hover].achats)}</span>
              </p>
              <p className={`flex items-center justify-between gap-3 ${data[hover].net < 0 ? "text-red-400" : "text-amber-400"}`}>
                <span>Bénéfice net</span>
                <span className="tabular-nums font-semibold">{fmt(data[hover].net)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <LegendBadge dotClass="bg-emerald-400" label="Ventes" />
        <LegendBadge dotClass="bg-rose-400" label="Achats" />
        <LegendBadge dotClass="bg-amber-400" label="Bénéfice net" />
      </div>
    </div>
  );
}

// ── Graphique 2 : pont de rentabilité ───────────────────────────────────────
export function ProfitBridge({
  recettes,
  depenses,
  soldeTva,
  resultatNet,
}: {
  recettes: number;
  depenses: number;
  soldeTva: number;
  resultatNet: number;
}) {
  const maxAbs = Math.max(recettes, depenses, Math.abs(soldeTva), Math.abs(resultatNet), 1);
  const pct = (v: number) => Math.min(100, (Math.abs(v) / maxAbs) * 100);

  const tvaLabel = soldeTva > 0 ? "− TVA à payer" : soldeTva < 0 ? "+ Crédit TVA" : "TVA (solde nul)";
  const tvaValue = soldeTva > 0 ? -soldeTva : soldeTva < 0 ? Math.abs(soldeTva) : 0;
  const netPositive = resultatNet >= 0;

  const rows = [
    { label: "Ventes encaissées", value: recettes, pct: pct(recettes), barClass: "bg-emerald-500/70" },
    { label: "− Achats / dépenses", value: -depenses, pct: pct(depenses), barClass: "bg-rose-500/60" },
    { label: tvaLabel, value: tvaValue, pct: pct(soldeTva), barClass: "bg-cyan-500/60" },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400">{row.label}</span>
            <span className="tabular-nums font-semibold text-zinc-200">{signedFmt(row.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none ${row.barClass}`}
              style={{ width: `${row.pct}%` }}
            />
          </div>
        </div>
      ))}

      <div className="border-t border-zinc-800/60 pt-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">= Bénéfice net</span>
          <span className={`text-base font-bold tabular-nums leading-none ${netPositive ? "text-emerald-400" : "text-red-400"}`}>
            {fmt(resultatNet)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800/60">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none ${
              netPositive ? "bg-gradient-to-r from-amber-500/70 to-amber-400" : "bg-red-500/60"
            }`}
            style={{ width: `${pct(resultatNet)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
