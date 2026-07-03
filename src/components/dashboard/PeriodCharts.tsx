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

// Couleurs explicites (hex constants), appliquées via style inline plutôt que
// des classes Tailwind — évite tout décalage fill/bg/stroke selon qu'un
// élément est un span HTML ou une forme SVG. Validées daltonisme + bande de
// luminosité "dark" (skill dataviz) : lightness 0.48–0.67, CVD ΔE > 12.
const CHART_COLORS = {
  ventes: "#059669",
  achats: "#f43f5e",
  netPos: "#d97706",
  netNeg: "#dc2626",
  tvaDue: "#0891b2",
  tvaCredit: "#7c3aed",
};

const W = 640;
const H = 220;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
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

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
      <span className="h-[3px] w-5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// La couleur porte l'identité via la puce ; le texte reste sur des tokens
// neutres pour garantir le contraste quel que soit le hue (ex. violet/rouge
// sont trop proches de 4.5:1 pour être lisibles en texte coloré à cette taille).
function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <p className="flex items-center gap-2.5">
      <span className="h-[3px] w-3.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-zinc-400">{label}</span>
      <span className="tabular-nums font-semibold text-zinc-100">{value}</span>
    </p>
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
      <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-6 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/60 text-zinc-500">
          <ChartIcon />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-300">Pas assez de données pour une courbe</p>
          <p className="text-xs text-zinc-500">
            Sélectionnez une période plus longue pour visualiser une évolution dans le temps.
          </p>
        </div>
        {single && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[3px] w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.ventes }} />
              Ventes&nbsp;: <span className="font-semibold tabular-nums text-zinc-100">{fmt(single.ventes)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[3px] w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.achats }} />
              Achats&nbsp;: <span className="font-semibold tabular-nums text-zinc-100">{fmt(single.achats)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[3px] w-3 rounded-full" style={{ backgroundColor: single.net < 0 ? CHART_COLORS.netNeg : CHART_COLORS.netPos }} />
              Bénéfice net&nbsp;: <span className="font-semibold tabular-nums text-zinc-100">{fmt(single.net)}</span>
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
  const pad = range * 0.12;
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
          className="h-56 sm:h-64 lg:h-72 w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.netPos} stopOpacity="0.2" />
              <stop offset="100%" stopColor={CHART_COLORS.netPos} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grille discrète — hairline pleine, jamais pointillée */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={PAD_TOP + H * f}
              y2={PAD_TOP + H * f}
              stroke="#3f3f46"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ))}

          {/* Ligne zéro */}
          <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="#71717a" strokeOpacity={0.8} strokeWidth={1} />

          {/* Repères d'échelle */}
          <text x={4} y={PAD_TOP + 10} fill="#a1a1aa" fontSize={11}>{fmt(yMax).replace(/\s?€/, "")}</text>
          <text x={4} y={zeroY - 5} fill="#a1a1aa" fontSize={11}>0</text>

          {/* Zone bénéfice net (wash) */}
          {netAreaPath && <path d={netAreaPath} fill={`url(#${gradientId})`} stroke="none" />}

          {/* Repère au survol (le lecteur vise une date, jamais un trait 2px) */}
          {hover !== null && (
            <line
              x1={xPos(hover)}
              x2={xPos(hover)}
              y1={PAD_TOP}
              y2={PAD_TOP + H}
              stroke="#71717a"
              strokeWidth={1}
            />
          )}

          {/* Courbes — 2.5px, jonctions arrondies */}
          <path d={smoothPath(achatsPts)} fill="none" stroke={CHART_COLORS.achats} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={smoothPath(ventesPts)} fill="none" stroke={CHART_COLORS.ventes} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={smoothPath(netPts)} fill="none" stroke={CHART_COLORS.netPos} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Points — uniquement au survol (≥8px, anneau surface) pour rester sobre au repos */}
          {hover !== null && (
            <g>
              <circle cx={xPos(hover)} cy={yPos(data[hover].achats)} r={5} fill={CHART_COLORS.achats} stroke="#18181b" strokeWidth={2} />
              <circle cx={xPos(hover)} cy={yPos(data[hover].ventes)} r={5} fill={CHART_COLORS.ventes} stroke="#18181b" strokeWidth={2} />
              <circle
                cx={xPos(hover)}
                cy={yPos(data[hover].net)}
                r={5}
                fill={data[hover].net < 0 ? CHART_COLORS.netNeg : CHART_COLORS.netPos}
                stroke="#18181b"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Zones de survol (bande = cible de hover, plus grande que le trait) */}
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

          {/* Labels axe X — sélectifs, jamais un par point */}
          {data.map(
            (d, i) =>
              (i % step === 0 || i === data.length - 1) && (
                <text key={`lbl-${d.key}`} x={xPos(i)} y={VIEW_H - 8} textAnchor="middle" fill="#a1a1aa" fontSize={11}>
                  {d.label}
                </text>
              )
          )}
        </svg>

        {/* Tooltip premium */}
        {hover !== null && (
          <div
            className={`pointer-events-none absolute z-10 ${tooltipVerticalClass} ${tooltipAlign} min-w-[160px] sm:min-w-[180px] max-w-[80vw] rounded-xl border border-zinc-600 bg-zinc-950/95 backdrop-blur-sm px-3.5 py-3 text-xs shadow-2xl shadow-black/50`}
            style={{ left: `${hoverPct}%` }}
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{data[hover].label}</p>
            <div className="space-y-1.5">
              <TooltipRow color={CHART_COLORS.ventes} label="Ventes" value={fmt(data[hover].ventes)} />
              <TooltipRow color={CHART_COLORS.achats} label="Achats" value={fmt(data[hover].achats)} />
              <div className="border-t border-zinc-700 pt-1.5">
                <TooltipRow
                  color={data[hover].net < 0 ? CHART_COLORS.netNeg : CHART_COLORS.netPos}
                  label="Bénéfice net"
                  value={fmt(data[hover].net)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LegendKey color={CHART_COLORS.ventes} label="Ventes" />
        <LegendKey color={CHART_COLORS.achats} label="Achats" />
        <LegendKey color={CHART_COLORS.netPos} label="Bénéfice net" />
      </div>
    </div>
  );
}

// ── Graphique 2 : pont de rentabilité (waterfall) ───────────────────────────
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
  const afterAchats = recettes - depenses;

  const tvaColor = soldeTva > 0 ? CHART_COLORS.tvaDue : soldeTva < 0 ? CHART_COLORS.tvaCredit : CHART_COLORS.achats;
  const tvaLabel = soldeTva > 0 ? "TVA à payer" : soldeTva < 0 ? "Crédit TVA" : "TVA neutre";
  const netColor = resultatNet >= 0 ? CHART_COLORS.netPos : CHART_COLORS.netNeg;

  const steps: { key: string; label: string; from: number; to: number; color: string }[] = [
    { key: "ventes", label: "Ventes", from: 0, to: recettes, color: CHART_COLORS.ventes },
    { key: "achats", label: "Achats", from: recettes, to: afterAchats, color: CHART_COLORS.achats },
    { key: "tva", label: tvaLabel, from: afterAchats, to: resultatNet, color: tvaColor },
  ];

  const allBounds = [0, recettes, afterAchats, resultatNet];
  let yMin = Math.min(...allBounds);
  let yMax = Math.max(...allBounds);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const span = yMax - yMin;
  const pad = span * 0.22;
  yMin -= pad;
  yMax += pad;

  const CW = 420;
  const CH = 210;
  const TOP = 16;
  const AXIS_Y = TOP + CH;
  const yPos = (v: number) => TOP + CH - ((v - yMin) / (yMax - yMin)) * CH;
  const zeroY = yPos(0);

  const cols = 4;
  const slot = CW / cols;
  const barW = Math.min(46, slot * 0.42);

  const bars = [
    ...steps.map((s, i) => ({
      key: s.key,
      label: s.label,
      x: slot * i + slot / 2,
      yTop: yPos(Math.max(s.from, s.to)),
      yBottom: yPos(Math.min(s.from, s.to)),
      value: s.to - s.from,
      color: s.color,
    })),
    {
      key: "net",
      label: "Résultat net",
      x: slot * 3 + slot / 2,
      yTop: yPos(Math.max(0, resultatNet)),
      yBottom: yPos(Math.min(0, resultatNet)),
      value: resultatNet,
      color: netColor,
    },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${CW} ${AXIS_Y + 40}`} className="h-64 sm:h-72 lg:h-80 w-full overflow-visible" preserveAspectRatio="xMidYMid meet">
        {/* Ligne zéro — bien visible, sert de repère pour les barres flottantes */}
        <line x1={0} x2={CW} y1={zeroY} y2={zeroY} stroke="#a1a1aa" strokeOpacity={0.6} strokeWidth={1.5} />
        <text x={CW} y={zeroY - 5} textAnchor="end" fill="#71717a" fontSize={10}>0 €</text>

        {/* Repères verticaux discrets ancrant chaque barre flottante à la ligne zéro */}
        {bars.slice(0, 3).map((b) => {
          if (Math.abs(b.yBottom - zeroY) < 1 && Math.abs(b.yTop - zeroY) < 1) return null;
          const anchorY = Math.abs(b.yBottom - zeroY) < Math.abs(b.yTop - zeroY) ? b.yTop : b.yBottom;
          return (
            <line
              key={`drop-${b.key}`}
              x1={b.x}
              x2={b.x}
              y1={Math.min(anchorY, zeroY)}
              y2={Math.max(anchorY, zeroY)}
              stroke="#3f3f46"
              strokeOpacity={0.5}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          );
        })}

        {/* Connecteurs entre les marches (continuité de la cascade) */}
        {steps.map((s, i) => {
          if (i === steps.length - 1) return null;
          const x1 = slot * i + slot / 2 + barW / 2;
          const x2 = slot * (i + 1) + slot / 2 - barW / 2;
          const y = yPos(s.to);
          return <line key={`conn-${s.key}`} x1={x1} x2={x2} y1={y} y2={y} stroke="#71717a" strokeOpacity={0.6} strokeWidth={1.25} />;
        })}
        {/* Connecteur vers la barre finale */}
        <line
          x1={slot * 2 + slot / 2 + barW / 2}
          x2={slot * 3 + slot / 2 - barW / 2}
          y1={yPos(resultatNet)}
          y2={yPos(resultatNet)}
          stroke="#71717a"
          strokeOpacity={0.6}
          strokeWidth={1.25}
        />

        {/* Barres — data-end arrondi, jonction carrée côté connecteur */}
        {bars.map((b) => {
          const height = Math.max(3, b.yBottom - b.yTop);
          const isFinal = b.key === "net";
          const labelAbove = b.yTop - 14 >= TOP;
          return (
            <g key={b.key}>
              <rect
                x={b.x - barW / 2}
                y={b.yTop}
                width={barW}
                height={height}
                rx={5}
                fill={b.color}
                opacity={isFinal ? 1 : 0.9}
                stroke={isFinal ? b.color : "none"}
                strokeWidth={isFinal ? 1.5 : 0}
              />
              {/* Valeur — grande, contrastée, jamais collée au bord */}
              <text
                x={b.x}
                y={labelAbove ? b.yTop - 10 : b.yBottom + 20}
                textAnchor="middle"
                fill="#f4f4f5"
                fontSize={14}
                fontWeight={700}
              >
                {signedFmt(b.value)}
              </text>
              {/* Libellé sous la barre */}
              <text x={b.x} y={AXIS_Y + 24} textAnchor="middle" fill="#a1a1aa" fontSize={11} fontWeight={600} letterSpacing={0.3}>
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LegendKey color={CHART_COLORS.ventes} label="Ventes" />
        <LegendKey color={CHART_COLORS.achats} label="Achats" />
        <LegendKey color={tvaColor} label={tvaLabel} />
        <LegendKey color={netColor} label="Résultat net" />
      </div>
    </div>
  );
}
