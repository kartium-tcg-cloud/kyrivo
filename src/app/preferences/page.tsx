"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCompanyPreferences,
  upsertCompanyPreferences,
} from "@/lib/preferences";
import {
  CompanyPreferences,
  DEFAULT_COMPANY_PREFERENCES,
} from "@/types/preferences";

// ═══════════════════════════════════════════════════════════
// Liste des modes de paiement disponibles dans Kyrivo
// Cohérent avec achat.ts (Virement, Paypal, Bancontact, etc.)
// ═══════════════════════════════════════════════════════════
const DEFAULT_PAYMENT_METHODS = ["Virement", "Paypal", "Bancontact", "Cash"];

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export default function PreferencesPage() {

  // ─────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────

  const [preferences, setPreferences] = useState<CompanyPreferences | null>(null);
  const [original, setOriginal] = useState<CompanyPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  // ─────────────────────────────────────────────────────────
  // CHARGEMENT INITIAL — récupère companyId puis preferences
  // ─────────────────────────────────────────────────────────

  useEffect(() => {

    async function load() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("Utilisateur non connecté.");
          return;
        }

        const { data: membership, error: mErr } = await supabase
          .from("memberships")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (mErr) throw mErr;
        if (!membership) {
          setErrorMessage("Aucune société associée à ce compte.");
          return;
        }

        const prefs = await getCompanyPreferences(membership.company_id);

        setPreferences(prefs);
        setOriginal(prefs);

      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : "Erreur lors du chargement."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ─────────────────────────────────────────────────────────
  // DÉTECTION DES CHANGEMENTS — passe l'état en "dirty"
  // ─────────────────────────────────────────────────────────

  const isDirty = useMemo(() => {
    if (!preferences || !original) return false;
    return JSON.stringify(preferences) !== JSON.stringify(original);
  }, [preferences, original]);

  useEffect(() => {
    if (isDirty && (saveStatus === "idle" || saveStatus === "saved")) {
      setSaveStatus("dirty");
    } else if (!isDirty && saveStatus === "dirty") {
      setSaveStatus("idle");
    }
  }, [isDirty, saveStatus]);

  // ─────────────────────────────────────────────────────────
  // HELPERS UPDATE
  // ─────────────────────────────────────────────────────────

  function update<K extends keyof CompanyPreferences>(
    key: K,
    value: CompanyPreferences[K]
  ) {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  }

async function handleInvoicePrefixChange(value: string) {
  if (!preferences) return;

  const cleanPrefix = value.trim();

  if (!cleanPrefix) {
    update("invoicePrefix", value);
    return;
  }

  const supabase = createClient();

  const { data } = await supabase
    .from("invoice_prefix_counters")
    .select("next_number")
    .eq("company_id", preferences.companyId)
    .eq("prefix", cleanPrefix)
    .maybeSingle();

  const nextNumber = Number(data?.next_number);

  setPreferences({
    ...preferences,
    invoicePrefix: value,
    invoiceNextNumber:
      Number.isFinite(nextNumber) && nextNumber > 0 ? nextNumber : 1,
  });
}

 function removePaymentMethod(method: string) {
  if (!preferences) return;

  const current = preferences.defaultPaymentMethods ?? [];
  const next = current.filter((m) => m !== method);

  update("defaultPaymentMethods", next);
}

function addPaymentMethod() {
  if (!preferences) return;

  const cleanValue = newPaymentMethod.trim();

  if (!cleanValue) return;

  const current = preferences.defaultPaymentMethods ?? DEFAULT_PAYMENT_METHODS;

  if (current.includes(cleanValue)) {
    setNewPaymentMethod("");
    return;
  }

  update("defaultPaymentMethods", [...current, cleanValue]);
  setNewPaymentMethod("");
}
  // ─────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!preferences || !isDirty) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      const saved = await upsertCompanyPreferences(preferences);
      setPreferences(saved);
      setOriginal(saved);
      setSaveStatus("saved");

      // Auto-reset vers idle après 2.5s
      setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 2500);

    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : "Erreur lors de la sauvegarde."
      );
      setSaveStatus("error");
    }
  }

  function handleReset() {
    if (!original) return;
    setPreferences(original);
    setSaveStatus("idle");
  }

  // ─────────────────────────────────────────────────────────
  // STYLES PARTAGÉS
  // ─────────────────────────────────────────────────────────

  const labelClasses =
    "block text-[11px] font-semibold text-neutral-500 mb-2 uppercase tracking-wider";

  const inputClasses = `
    w-full rounded-lg px-3 py-2.5 text-sm
    bg-neutral-900/60 text-neutral-200
    border border-neutral-800
    placeholder:text-neutral-600
    focus:outline-none
    focus:border-amber-500/40
    focus:ring-1 focus:ring-amber-500/15
    transition-colors duration-150
  `;

  const helperTextClasses = "text-[11px] text-neutral-600 mt-1.5";

  // ─────────────────────────────────────────────────────────
  // RENDER — LOADING
  // ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-neutral-800 rounded" />
          <div className="h-4 w-96 bg-neutral-800/60 rounded" />
          <div className="space-y-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-neutral-900/40 border border-neutral-800 p-6 h-48"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER — ERROR STATE (sans data du tout)
  // ─────────────────────────────────────────────────────────

  if (errorMessage && !preferences) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!preferences) return null;

  // ─────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────

  return (
    <div className="pb-32"> {/* padding bottom pour ne pas être caché par la barre sticky */}

      <div className="p-6 lg:p-8 max-w-4xl space-y-8">

        {/* ═══ HERO ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-2 pb-6 border-b border-neutral-800">

          <div className="inline-flex items-center gap-2 self-start rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1">
            <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest">
              Configuration
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Préférences
          </h1>
          <p className="text-sm text-neutral-500">
            Configurez les informations qui apparaîtront sur vos factures et la numérotation automatique des documents.
          </p>
        </div>

        {/* ═══ SECTION 1 — SOCIÉTÉ ════════════════════════ */}
        <Section
          title="Identité société"
          description="Ces informations apparaissent dans l'en-tête de chaque facture émise."
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className={labelClasses}>Nom commercial</label>
              <input
                type="text"
                value={preferences.invoiceCompanyName}
                onChange={(e) => update("invoiceCompanyName", e.target.value)}
                placeholder="Ex : Kartium TCG"
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Numéro de TVA</label>
              <input
                type="text"
                value={preferences.invoiceCompanyVat}
                onChange={(e) => update("invoiceCompanyVat", e.target.value)}
                placeholder="BE1234.567.890"
                className={`${inputClasses} font-mono text-sm`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClasses}>Adresse</label>
              <textarea
                rows={2}
                value={preferences.invoiceCompanyAddress}
                onChange={(e) => update("invoiceCompanyAddress", e.target.value)}
                placeholder="Rue, numéro, code postal, ville, pays"
                className={`${inputClasses} resize-none`}
              />
            </div>

            <div>
              <label className={labelClasses}>Email contact</label>
              <input
                type="email"
                value={preferences.invoiceCompanyEmail}
                onChange={(e) => update("invoiceCompanyEmail", e.target.value)}
                placeholder="contact@exemple.com"
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Téléphone</label>
              <input
                type="tel"
                value={preferences.invoiceCompanyPhone}
                onChange={(e) => update("invoiceCompanyPhone", e.target.value)}
                placeholder="+32 4 12 34 56 78"
                className={inputClasses}
              />
            </div>

          </div>
        </Section>

        {/* ═══ SECTION 2 — FACTURATION ════════════════════ */}
        <Section
          title="Mentions facture"
          description="Texte affiché en bas de chaque facture et conditions de paiement par défaut."
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
        >
          <div className="space-y-4">

            <div>
              <label className={labelClasses}>Pied de facture</label>
              <textarea
                rows={3}
                value={preferences.invoiceFooter}
                onChange={(e) => update("invoiceFooter", e.target.value)}
                placeholder="Ex : IBAN BE96 0689 5890 1005 — Merci de votre confiance."
                className={`${inputClasses} resize-none`}
              />
              <p className={helperTextClasses}>
                Apparaît en bas de chaque facture. Idéal pour l'IBAN, BIC, mentions légales.
              </p>
            </div>

            <div>
              <label className={labelClasses}>Conditions de paiement</label>
              <textarea
                rows={2}
                value={preferences.invoicePaymentTerms}
                onChange={(e) => update("invoicePaymentTerms", e.target.value)}
                placeholder="Paiement à 30 jours fin de mois."
                className={`${inputClasses} resize-none`}
              />
            </div>

          </div>
        </Section>

        {/* ═══ SECTION 3 — NUMÉROTATION ═══════════════════ */}
        <Section
          title="Numérotation factures"
          description="Définit le préfixe et le prochain numéro qui sera attribué automatiquement."
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
            </svg>
          }
        >
          <div className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">

              <div>
                <label className={labelClasses}>Préfixe</label>
<input
  type="text"
  value={preferences.invoicePrefix}
  onChange={(e) => handleInvoicePrefixChange(e.target.value)}
  placeholder="F-"
  className={`${inputClasses} font-mono`}
/>
                <p className={helperTextClasses}>
                  Texte placé avant le numéro. Ex : <span className="font-mono text-neutral-400">F-</span>, <span className="font-mono text-neutral-400">INV-2026-</span>
                </p>
              </div>

              <div>
                <label className={labelClasses}>Prochain numéro</label>
<input
  type="number"
  min={1}
  step={1}
  value={preferences.invoiceNextNumber}
  disabled
  readOnly
  className={`${inputClasses} font-mono tabular-nums cursor-not-allowed opacity-70`}
/>
                <p className={helperTextClasses}>
                  Incrémenté automatiquement à chaque facture.
                </p>
              </div>

            </div>

            {/* Aperçu */}
            <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                Aperçu prochaine facture
              </span>
              <span className="font-mono text-sm text-amber-400 tabular-nums">
                {preferences.invoicePrefix}
                {String(preferences.invoiceNextNumber).padStart(6, "0")}
              </span>
            </div>

          </div>
        </Section>

        {/* ═══ SECTION 4 — MODES DE PAIEMENT ═══════════════ */}
        <Section
          title="Modes de paiement par défaut"
          description="Les modes cochés apparaîtront en premier dans les sélecteurs des formulaires d'achat et de vente."
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          }
        >
<div className="space-y-4">
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {(preferences.defaultPaymentMethods?.length
      ? preferences.defaultPaymentMethods
      : DEFAULT_PAYMENT_METHODS
    ).map((method) => (
      <div
        key={method}
        className="
          relative flex items-center justify-between gap-2
          rounded-lg px-3 py-2.5 text-sm font-medium
          border transition-all duration-150
          bg-amber-500/10 text-amber-400 border-amber-500/30
        "
      >
        <span>{method}</span>

        <button
          type="button"
          onClick={() => removePaymentMethod(method)}
          className="
            absolute -top-2 -right-2
            inline-flex h-5 w-5 items-center justify-center
            rounded-full
            bg-neutral-950 border border-neutral-700
            text-neutral-400
            hover:text-red-400 hover:border-red-500/50
            transition-colors
          "
          aria-label={`Supprimer ${method}`}
        >
          ×
        </button>
      </div>
    ))}
  </div>

  <div className="flex flex-col sm:flex-row gap-2">
    <input
      type="text"
      value={newPaymentMethod}
      onChange={(e) => setNewPaymentMethod(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addPaymentMethod();
        }
      }}
      placeholder="Ajouter un mode de paiement"
      className={inputClasses}
    />

    <button
      type="button"
      onClick={addPaymentMethod}
      className="
        rounded-lg px-4 py-2.5
        text-sm font-semibold
        bg-amber-500 text-neutral-950
        hover:bg-amber-400
        transition-colors
        whitespace-nowrap
      "
    >
      Ajouter
    </button>
  </div>
</div>
        </Section>

      </div>

      {/* ═══ STICKY SAVE BAR ═══════════════════════════════ */}
      {(saveStatus !== "idle") && (
        <div
          className="
            fixed bottom-0 left-0 right-0 z-40
            border-t border-neutral-800
            backdrop-blur-md
            bg-neutral-950/85
            transition-all duration-200
          "
        >
          <div className="max-w-4xl px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

            {/* Status indicator */}
            <div className="flex items-center gap-2.5">
              <StatusIcon status={saveStatus} />
              <StatusLabel status={saveStatus} errorMessage={errorMessage} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">

              {(saveStatus === "dirty" || saveStatus === "error") && (
                <button
                  onClick={handleReset}
                  className="
                    rounded-lg px-3 py-1.5
                    text-sm font-medium
                    text-neutral-400
                    hover:bg-neutral-800/60 hover:text-neutral-200
                    transition-colors
                  "
                >
                  Annuler
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className={`
                  inline-flex items-center gap-2
                  rounded-lg px-4 py-1.5
                  text-sm font-semibold
                  transition-all duration-200
                  ${
                    saveStatus === "saving"
                      ? "bg-amber-500/40 text-neutral-950 cursor-wait"
                      : saveStatus === "saved"
                      ? "bg-emerald-500 text-neutral-950"
                      : "bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.97] shadow-lg shadow-amber-500/10"
                  }
                `}
              >
                {saveStatus === "saving" && (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {saveStatus === "saving" && "Enregistrement…"}
                {saveStatus === "saved" && "Enregistré"}
                {(saveStatus === "dirty" || saveStatus === "error") && "Enregistrer"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">

      {/* Bande dorée discrète */}
      <div className="h-px w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />

      <div className="p-5 sm:p-6">

        <div className="flex items-start gap-3 mb-5 pb-5 border-b border-neutral-800/60">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <p className="text-[12px] text-neutral-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {children}
      </div>

    </section>
  );
}

function StatusIcon({ status }: { status: SaveStatus }) {

  if (status === "saving") {
    return (
      <svg className="h-4 w-4 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40">
        <svg className="h-2.5 w-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500/20 border border-red-500/40">
        <svg className="h-2.5 w-2.5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }

  // dirty
  return (
    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
  );
}

function StatusLabel({
  status,
  errorMessage,
}: {
  status: SaveStatus;
  errorMessage: string | null;
}) {

  const baseClass = "text-sm font-medium";

  if (status === "saving") return <span className={`${baseClass} text-amber-400`}>Enregistrement en cours…</span>;
  if (status === "saved") return <span className={`${baseClass} text-emerald-400`}>Préférences enregistrées</span>;
  if (status === "error") return <span className={`${baseClass} text-red-400`}>{errorMessage ?? "Erreur"}</span>;
  if (status === "dirty") return <span className={`${baseClass} text-neutral-300`}>Modifications non enregistrées</span>;
  return null;
}