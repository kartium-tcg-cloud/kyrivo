"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Achat, AchatItemInput } from "@/types/achat";

// ─── Parser ──────────────────────────────────────────────────────────────────

interface ParsedVinted {
  articleName?: string;
  vendeur?: string;
  date?: string;
  prixArticle?: number;
  fraisLivraison?: number;
  fraisVinted?: number;
  total?: number;
  reference?: string;
}

const MONTH_PATTERN =
  "(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)";

function monthToNum(m: string): string | undefined {
  const n = m
    .toLowerCase()
    .replace(/[éè]/g, "e")
    .replace(/û/g, "u");
  const map: Record<string, string> = {
    janvier: "01", fevrier: "02", mars: "03", avril: "04",
    mai: "05", juin: "06", juillet: "07", aout: "08",
    septembre: "09", octobre: "10", novembre: "11", decembre: "12",
  };
  return map[n];
}

function extractPrice(raw: string): number | undefined {
  const s = raw.replace(/\s/g, "").replace(",", ".");
  const m = s.match(/(\d+\.\d{1,2}|\d+)/);
  if (!m) return undefined;
  const v = parseFloat(m[1]);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

function extractDate(text: string): string | undefined {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = text.match(/\b(\d{1,2})\/(\d{2})\/(\d{4})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1].padStart(2, "0")}`;

  const longRe = new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_PATTERN})\\s+(\\d{4})\\b`, "i");
  const m2 = text.match(longRe);
  if (m2) {
    const month = monthToNum(m2[2]);
    if (month) return `${m2[3]}-${month}-${m2[1].padStart(2, "0")}`;
  }

  return undefined;
}

function tryPatterns(text: string, patterns: RegExp[]): number | undefined {
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m?.[1]) {
      const v = extractPrice(m[1]);
      if (v !== undefined) return v;
    }
  }
  return undefined;
}

function parseVintedText(text: string): ParsedVinted {
  const result: ParsedVinted = {};

  const refM =
    text.match(/(?:commande|order)\s*n[°o]?\s*#?\s*([A-Z0-9_-]{5,25})/i) ??
    text.match(/#\s*([A-Z0-9_-]{5,25})/i);
  if (refM) result.reference = refM[1].trim();

  result.date = extractDate(text);

  result.total = tryPatterns(text, [
    /total\s+pay[ée]\s*:?\s*([\d\s,.']+\s*€?)/i,
    /total\s+command[ée]\s*:?\s*([\d\s,.']+\s*€?)/i,
    /montant\s+total\s*:?\s*([\d\s,.']+\s*€?)/i,
    /vous\s+avez\s+pay[ée]\s*:?\s*([\d\s,.']+\s*€?)/i,
    /total\s*:?\s*([\d\s,.']+\s*€?)/i,
  ]);

  result.fraisLivraison = tryPatterns(text, [
    /frais\s+de\s+livraison\s*:?\s*([\d\s,.']+\s*€?)/i,
    /co[uû]t\s+de\s+livraison\s*:?\s*([\d\s,.']+\s*€?)/i,
    /livraison\s*:?\s*([\d\s,.']+\s*€?)/i,
    /exp[eé]dition\s*:?\s*([\d\s,.']+\s*€?)/i,
    /\bport\s*:?\s*([\d\s,.']+\s*€?)/i,
  ]);

  result.fraisVinted = tryPatterns(text, [
    /frais\s+de\s+protection\s+acheteur\s*:?\s*([\d\s,.']+\s*€?)/i,
    /protection\s+acheteur\s*:?\s*([\d\s,.']+\s*€?)/i,
    /frais\s+vinted\s*:?\s*([\d\s,.']+\s*€?)/i,
    /frais\s+de\s+service\s*:?\s*([\d\s,.']+\s*€?)/i,
  ]);

  result.prixArticle = tryPatterns(text, [
    /prix\s+de\s+l['']article\s*:?\s*([\d\s,.']+\s*€?)/i,
    /prix\s+article\s*:?\s*([\d\s,.']+\s*€?)/i,
    /prix\s+du\s+produit\s*:?\s*([\d\s,.']+\s*€?)/i,
    /prix\s*:?\s*([\d\s,.']+\s*€?)/i,
  ]);

  const vendeurPatterns = [
    /vendu\s+par\s*:?\s*([^\n\r·•,]{2,60})/i,
    /vendeur\s*:?\s*([^\n\r·•,]{2,60})/i,
    /seller\s*:?\s*([^\n\r·•,]{2,60})/i,
    /de\s+@([^\n\r\s·•,]{3,30})/i,
    /@([a-z0-9_.]{3,30})/i,
  ];
  for (const pat of vendeurPatterns) {
    const m = text.match(pat);
    if (m?.[1]?.trim()) {
      result.vendeur = m[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  const articlePatterns = [
    /nom\s+de\s+l['']article\s*:?\s*([^\n\r]{3,120})/i,
    /\barticle\s*:?\s*([^\n\r]{3,120})/i,
    /\bproduit\s*:?\s*([^\n\r]{3,120})/i,
    /\bitem\s*:?\s*([^\n\r]{3,120})/i,
  ];
  for (const pat of articlePatterns) {
    const m = text.match(pat);
    if (m?.[1]?.trim()) {
      result.articleName = m[1].trim();
      break;
    }
  }

  // Heuristic fallback: first substantial non-metadata line
  if (!result.articleName) {
    const skipRe =
      /commande|order|vendu\s+par|vendeur|total|livraison|frais|protection|date|vinted|acheteur|paiement|bonjour|merci|votre|vous|€|\d{4}-\d{2}|\d{2}\/\d{2}|@[a-z]/i;
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length < 3 || line.length > 120) continue;
      if (skipRe.test(line)) continue;
      if (/^\d/.test(line)) continue;
      result.articleName = line;
      break;
    }
  }

  // Estimate total from components if not found
  if (result.total === undefined && result.prixArticle !== undefined) {
    const estimated =
      (result.prixArticle ?? 0) +
      (result.fraisLivraison ?? 0) +
      (result.fraisVinted ?? 0);
    if (estimated > 0) result.total = estimated;
  }

  return result;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface VintedImportModalProps {
  ouvert: boolean;
  onFermer: () => void;
  onCreer: (achat: Achat) => void;
  existingCategories?: string[];
}

type Step = "paste" | "preview";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function VintedImportModal({
  ouvert,
  onFermer,
  onCreer,
  existingCategories = [],
}: VintedImportModalProps) {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedVinted | null>(null);

  const [date, setDate] = useState(todayIso());
  const [fournisseur, setFournisseur] = useState("");
  const [produit, setProduit] = useState("");
  const [totalStr, setTotalStr] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCats = existingCategories
    .filter(
      (c) => !produit.trim() || c.toLowerCase().includes(produit.toLowerCase())
    )
    .slice(0, 8);

  const handleAnalyser = () => {
    if (!rawText.trim()) return;

    const result = parseVintedText(rawText);
    setParsed(result);

    setDate(result.date || todayIso());
    setFournisseur(result.vendeur || "");
    setProduit(result.articleName || "");
    setTotalStr(result.total !== undefined ? result.total.toFixed(2) : "");

    const parts = ["Import Vinted"];
    if (result.reference) parts.push(`Commande ${result.reference}`);
    if (result.prixArticle !== undefined)
      parts.push(`Article ${result.prixArticle.toFixed(2)} €`);
    if (result.fraisLivraison !== undefined)
      parts.push(`Livraison ${result.fraisLivraison.toFixed(2)} €`);
    if (result.fraisVinted !== undefined)
      parts.push(`Protection ${result.fraisVinted.toFixed(2)} €`);
    setCommentaire(parts.join(" · "));

    setErrors({});
    setStep("preview");
  };

  const handleCreer = () => {
    const errs: Record<string, string> = {};
    if (!produit.trim()) errs.produit = "Nom de l'article requis";
    if (!date) errs.date = "Date requise";
    const totalNum = parseFloat(totalStr);
    if (!totalStr || isNaN(totalNum) || totalNum <= 0)
      errs.total = "Montant requis";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const item: AchatItemInput = {
      nom: produit.trim(),
      cout: totalNum,
      quantite: 1,
      modeMontant: "ttc",
      notes: "",
    };

    const achat: Achat = {
      id: genId(),
      date,
      numInterne: "NOUVEAU",
      fournisseur: fournisseur.trim() || "Vinted",
      produit: produit.trim(),
      type: "particulier",
      prixHT: totalNum,
      prixTVA: 0,
      prixTTC: totalNum,
      paiement: "Vinted",
      numFacture: "",
      commentaire: commentaire.trim() || undefined,
      avecStock: true,
      items: [item],
    };

    onCreer(achat);
    handleFermer();
  };

  const handleFermer = () => {
    setStep("paste");
    setRawText("");
    setParsed(null);
    setErrors({});
    onFermer();
  };

  const hasMissing =
    !produit.trim() ||
    !totalStr ||
    parseFloat(totalStr) <= 0 ||
    !fournisseur.trim() ||
    !date;

  const inputCls =
    "w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-900/60 text-zinc-200 border border-zinc-800 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15 transition-colors";
  const labelCls =
    "block text-[11px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider";
  const errCls = "text-red-400 text-[11px] mt-1.5";

  return (
    <Modal
      ouvert={ouvert}
      onFermer={handleFermer}
      titre={
        step === "paste" ? "Importer depuis Vinted" : "Prévisualisation de l'import"
      }
      footer={
        step === "paste" ? (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleFermer}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAnalyser}
              disabled={!rawText.trim()}
              className="rounded-lg px-5 py-2 text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all shadow-lg shadow-amber-500/10"
            >
              Analyser
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("paste")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
            >
              ← Retour
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFermer}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreer}
                className="rounded-lg px-5 py-2 text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-[0.97] transition-all shadow-lg shadow-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              >
                Créer l'achat
              </button>
            </div>
          </div>
        )
      }
    >
      {step === "paste" ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5">
            <svg
              className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Comment importer
              </p>
              <ol className="mt-1.5 text-xs text-zinc-400 space-y-0.5 list-decimal list-inside leading-relaxed">
                <li>Ouvrez votre commande Vinted (appli ou email de confirmation)</li>
                <li>Copiez le texte du récapitulatif ou du reçu</li>
                <li>Collez-le ci-dessous et cliquez sur Analyser</li>
              </ol>
            </div>
          </div>

          <div>
            <label className={labelCls}>Texte Vinted collé</label>
            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                "Commande #12345678\nVendu par : vendeur123\n\nAir Jordan 1 Retro High OG\nPrix article : 75,00 €\nFrais de livraison : 4,95 €\nProtection acheteur : 3,80 €\nTotal : 83,75 €\nDate : 15 juin 2025"
              }
              className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
            />
            <p className="text-[10px] text-zinc-600 mt-1.5">
              Vous pourrez corriger les données détectées à l'étape suivante.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {parsed && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Données détectées
                </span>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {parsed.prixArticle !== undefined && (
                  <>
                    <span className="text-zinc-500">Prix article</span>
                    <span className="text-zinc-300 tabular-nums font-medium">
                      {parsed.prixArticle.toFixed(2)} €
                    </span>
                  </>
                )}
                {parsed.fraisLivraison !== undefined && (
                  <>
                    <span className="text-zinc-500">Livraison</span>
                    <span className="text-zinc-300 tabular-nums font-medium">
                      {parsed.fraisLivraison.toFixed(2)} €
                    </span>
                  </>
                )}
                {parsed.fraisVinted !== undefined && (
                  <>
                    <span className="text-zinc-500">Protection acheteur</span>
                    <span className="text-zinc-300 tabular-nums font-medium">
                      {parsed.fraisVinted.toFixed(2)} €
                    </span>
                  </>
                )}
                {parsed.total !== undefined && (
                  <>
                    <span className="text-zinc-600 font-semibold">Total payé</span>
                    <span className="text-amber-400 tabular-nums font-bold">
                      {parsed.total.toFixed(2)} €
                    </span>
                  </>
                )}
                {parsed.reference && (
                  <>
                    <span className="text-zinc-500">Référence</span>
                    <span className="text-zinc-400 font-mono truncate">
                      {parsed.reference}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {hasMissing && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-3">
              <svg
                className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Certaines informations n'ont pas été détectées. Vous pouvez les
                compléter avant de créer l'achat.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputCls} ${errors.date ? "border-red-500/50" : ""}`}
                />
                {errors.date && <p className={errCls}>{errors.date}</p>}
              </div>

              <div>
                <label className={labelCls}>Vendeur</label>
                <input
                  type="text"
                  value={fournisseur}
                  onChange={(e) => setFournisseur(e.target.value)}
                  placeholder="Pseudo vendeur"
                  maxLength={100}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Article / Catégorie</label>
              <div className="relative">
                <input
                  type="text"
                  value={produit}
                  onChange={(e) => {
                    setProduit(e.target.value);
                    setShowCatDropdown(true);
                    if (errors.produit)
                      setErrors((p) => {
                        const c = { ...p };
                        delete c.produit;
                        return c;
                      });
                  }}
                  onFocus={() => setShowCatDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowCatDropdown(false), 150)
                  }
                  placeholder="Ex. Air Jordan 1, Sneakers, Carte Pokémon…"
                  maxLength={120}
                  className={`${inputCls} ${errors.produit ? "border-red-500/50" : ""}`}
                />
                {showCatDropdown && filteredCats.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                    {filteredCats.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onMouseDown={() => {
                          setProduit(cat);
                          setShowCatDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-amber-500/5 hover:text-amber-400 transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.produit && <p className={errCls}>{errors.produit}</p>}
            </div>

            <div>
              <label className={labelCls}>Total payé (TTC)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999"
                  value={totalStr}
                  onChange={(e) => {
                    setTotalStr(e.target.value);
                    if (errors.total)
                      setErrors((p) => {
                        const c = { ...p };
                        delete c.total;
                        return c;
                      });
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  className={`${inputCls} pr-7 ${errors.total ? "border-red-500/50" : ""}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">
                  €
                </span>
              </div>
              {errors.total && <p className={errCls}>{errors.total}</p>}
              <p className="text-[10px] text-zinc-600 mt-1.5">
                Coût réel = prix article + livraison + protection acheteur
              </p>
            </div>

            <div>
              <label className={labelCls}>
                Commentaire{" "}
                <span className="text-zinc-700 normal-case tracking-normal ml-1">
                  (facultatif)
                </span>
              </label>
              <textarea
                rows={2}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                maxLength={1000}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
            <svg
              className="h-4 w-4 text-zinc-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Achat créé en mode{" "}
              <span className="text-zinc-300 font-medium">Particulier</span>,
              TVA 0 %, paiement{" "}
              <span className="text-zinc-300 font-medium">Vinted</span>.
              L'article sera mis en stock avec le coût réel total payé.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
