"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCompanyPreferences, upsertCompanyPreferences } from "@/lib/preferences";
import {
  CompanyPreferences,
  DEFAULT_COMPANY_PREFERENCES,
} from "@/types/preferences";
import PaymentMethodsPicker, { PAYMENT_METHOD_PRESETS, validatePaymentMethods } from "@/components/preferences/PaymentMethodsPicker";

type Props = {
  companyId: string;
  companyName?: string;
  initialOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onSaved?: (preferences: CompanyPreferences) => void;
};

const fieldClasses = "w-full rounded-lg border border-neutral-700 bg-neutral-900/75 px-3 py-2.5 text-base text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25";
const labels = "mb-1.5 block text-xs font-semibold text-neutral-300";

const STEPS = ["Identité et TVA", "Mentions facture", "Modes de paiement"] as const;

export default function AccountSetupWizard({
  companyId, companyName = "", initialOpen = false, open, onClose, onSaved,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const visible = open ?? internalOpen;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<CompanyPreferences | null>(null);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [lastVatRate, setLastVatRate] = useState(20);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setStep(0);
    getCompanyPreferences(companyId)
      .then((current) => {
        if (cancelled) return;
        const fresh = !current.id;
        const savedRate = fresh ? 0 : current.defaultVatRate;
        const initial = {
          ...current,
          invoiceCompanyName: current.invoiceCompanyName || companyName,
          invoiceFooter: fresh ? "Merci de votre confiance" : current.invoiceFooter,
          invoicePaymentTerms: fresh ? "Paiement à réception" : current.invoicePaymentTerms,
          defaultPaymentMethods: fresh ? [...PAYMENT_METHOD_PRESETS] : current.defaultPaymentMethods,
          defaultVatRate: savedRate,
        };
        setPreferences(initial);
        setVatEnabled(savedRate > 0);
        setLastVatRate(savedRate > 0 ? savedRate : 20);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible de charger les préférences.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, companyId, companyName]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [visible]);

  function close() {
    if (saving) return;
    setInternalOpen(false);
    onClose?.();
  }

  function update<K extends keyof CompanyPreferences>(key: K, value: CompanyPreferences[K]) {
    setPreferences((current) => current ? { ...current, [key]: value } : current);
    setError("");
  }

  function chooseVat(next: boolean) {
    if (next === vatEnabled) return;
    if (!next && preferences && preferences.defaultVatRate > 0) {
      setLastVatRate(preferences.defaultVatRate);
    }
    setVatEnabled(next);
    update("defaultVatRate", next ? lastVatRate || 20 : 0);
  }

  function validateCurrentStep(): string | null {
    if (!preferences) return "Préférences non chargées.";
    if (step === 0) {
      if (!preferences.invoiceCompanyName.trim()) return "Indiquez le nom de votre société ou activité.";
      if (preferences.invoiceCompanyName.trim().length > 120) return "Le nom ne peut pas dépasser 120 caractères.";
      if (vatEnabled && (!Number.isFinite(preferences.defaultVatRate) || preferences.defaultVatRate <= 0 || preferences.defaultVatRate > 100)) {
        return "Indiquez un taux de TVA entre 0,01 % et 100 %.";
      }
    }
    if (step === 1) {
      if (!preferences.invoicePrefix.trim()) return "Choisissez un préfixe de facture.";
      if (preferences.invoicePrefix.trim().length > 8) return "Le préfixe est limité à 8 caractères.";
    }
    if (step === 2) return validatePaymentMethods(preferences.defaultPaymentMethods);
    return null;
  }

  function next() {
    const validation = validateCurrentStep();
    if (validation) { setError(validation); return; }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function finish() {
    const validation = validateCurrentStep();
    if (validation || !preferences) { setError(validation || "Préférences non chargées."); return; }
    setSaving(true);
    setError("");
    try {
      // Réutilise exactement la sauvegarde de Préférences et le compteur
      // d'émission propre à chaque préfixe : aucun numéro existant n'est réinitialisé.
      const saved = await upsertCompanyPreferences({
        ...preferences,
        invoiceCompanyName: preferences.invoiceCompanyName.trim(),
        invoicePrefix: preferences.invoicePrefix.trim(),
        defaultVatRate: vatEnabled ? preferences.defaultVatRate : 0,
      });
      const response = await fetch("/api/onboarding/complete", { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Impossible de finaliser la configuration.");
      }
      setPreferences(saved);
      toast.success("Votre compte Kyrivo est configuré !");
      onSaved?.(saved);
      setInternalOpen(false);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-5"
      role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="account-setup-title"
        className="flex max-h-[min(94dvh,860px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl">
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-neutral-800 p-4 sm:p-6">
          <div className="min-w-0 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400">Configuration guidée</span>
            <h2 id="account-setup-title" className="text-xl font-bold text-white sm:text-2xl">Configurer mon compte en un clic</h2>
            <p className="text-sm text-neutral-400">Étape {step + 1} sur {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button type="button" onClick={close} disabled={saving} aria-label="Fermer la configuration"
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xl text-neutral-400 hover:text-white disabled:opacity-50">×</button>
        </header>
        <div aria-hidden="true" className="flex flex-shrink-0 gap-1 px-4 pt-4 sm:px-6">
          {STEPS.map((label, index) => (
            <span key={label} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-amber-500" : "bg-neutral-800"}`} />
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          {loading ? (
            <p role="status" className="py-10 text-center text-sm text-neutral-400">Chargement des préférences…</p>
          ) : preferences ? (
            <div className="space-y-5">
              {step === 0 && (
                <>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/35 p-4">
                    <p className="mb-3 text-sm font-semibold text-white">Souhaitez-vous travailler avec la TVA ?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => chooseVat(false)}
                        aria-pressed={!vatEnabled}
                        className={`rounded-lg border px-4 py-3 text-sm font-semibold ${!vatEnabled ? "border-amber-500/60 bg-amber-500/15 text-amber-300" : "border-neutral-700 text-neutral-300"}`}>Non</button>
                      <button type="button" onClick={() => chooseVat(true)}
                        aria-pressed={vatEnabled}
                        className={`rounded-lg border px-4 py-3 text-sm font-semibold ${vatEnabled ? "border-amber-500/60 bg-amber-500/15 text-amber-300" : "border-neutral-700 text-neutral-300"}`}>Oui</button>
                    </div>
                    {vatEnabled && (
                      <div className="mt-4 max-w-xs">
                        <label htmlFor="setup-vat-rate" className={labels}>Taux de TVA par défaut (%)</label>
                        <input id="setup-vat-rate" type="number" min="0.01" max="100" step="0.01"
                          value={preferences.defaultVatRate}
                          onChange={(e) => { const rate = Number(e.target.value); update("defaultVatRate", rate); if (rate > 0) setLastVatRate(rate); }}
                          className={fieldClasses} />
                      </div>
                    )}
                    <p className="mt-2 text-xs text-neutral-400">
                      {vatEnabled ? "Taux proposé : 20 %, modifiable selon votre situation." : "Le taux appliqué par défaut sera de 0 %."}
                    </p>
                  </div>
                  <h3 className="text-base font-semibold text-white">Identité de votre société</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="setup-company-name" className={labels}>Nom commercial *</label>
                      <input id="setup-company-name" required maxLength={120} value={preferences.invoiceCompanyName}
                        onChange={(e) => update("invoiceCompanyName", e.target.value)}
                        className={fieldClasses} placeholder="Nom de votre société ou activité" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="setup-company-address" className={labels}>Adresse</label>
                      <textarea id="setup-company-address" rows={2} value={preferences.invoiceCompanyAddress}
                        onChange={(e) => update("invoiceCompanyAddress", e.target.value)}
                        className={fieldClasses} placeholder="Rue, numéro, code postal, ville, pays" />
                    </div>
                    <div>
                      <label htmlFor="setup-company-vat" className={labels}>Numéro de TVA (si applicable)</label>
                      <input id="setup-company-vat" value={preferences.invoiceCompanyVat}
                        onChange={(e) => update("invoiceCompanyVat", e.target.value)}
                        className={fieldClasses} placeholder="BE…" />
                    </div>
                    <div>
                      <label htmlFor="setup-company-email" className={labels}>Email professionnel</label>
                      <input id="setup-company-email" type="email" value={preferences.invoiceCompanyEmail}
                        onChange={(e) => update("invoiceCompanyEmail", e.target.value)} className={fieldClasses} />
                    </div>
                    <div>
                      <label htmlFor="setup-company-phone" className={labels}>Téléphone</label>
                      <input id="setup-company-phone" type="tel" value={preferences.invoiceCompanyPhone}
                        onChange={(e) => update("invoiceCompanyPhone", e.target.value)} className={fieldClasses} />
                    </div>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="text-sm leading-relaxed text-neutral-400">Ces informations apparaîtront sur vos futures factures. Vous pourrez les modifier dans Préférences.</p>
                  <div>
                    <label htmlFor="setup-invoice-footer" className={labels}>Pied de facture</label>
                    <textarea id="setup-invoice-footer" rows={3} value={preferences.invoiceFooter}
                      onChange={(e) => update("invoiceFooter", e.target.value)} className={fieldClasses} />
                  </div>
                  <div>
                    <label htmlFor="setup-invoice-terms" className={labels}>Conditions de paiement</label>
                    <textarea id="setup-invoice-terms" rows={2} value={preferences.invoicePaymentTerms}
                      onChange={(e) => update("invoicePaymentTerms", e.target.value)} className={fieldClasses} />
                  </div>
                  <div>
                    <label htmlFor="setup-invoice-prefix" className={labels}>Préfixe de facture (maximum 8 caractères)</label>
                    <input id="setup-invoice-prefix" maxLength={8} value={preferences.invoicePrefix}
                      onChange={(e) => update("invoicePrefix", e.target.value)}
                      placeholder="FAC" className={fieldClasses} />
                    <p className="mt-2 text-xs text-neutral-400">
                      Aperçu : <span className="font-mono text-amber-300">{preferences.invoicePrefix || "FAC"}000001</span>
                      . La numérotation déjà utilisée sera conservée.
                    </p>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h3 className="text-base font-semibold text-white">Quels modes de paiement utilisez-vous ?</h3>
                  <PaymentMethodsPicker value={preferences.defaultPaymentMethods}
                    onChange={(methods) => update("defaultPaymentMethods", methods)} />
                  <div className="mt-6 rounded-xl border border-neutral-700 bg-neutral-900/45 p-4">
                    <p className="mb-2 text-sm font-semibold text-white">Plateformes que vous utilisez</p>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={preferences.enableVinted}
                        onChange={(e) => update("enableVinted", e.target.checked)}
                        className="mt-1 h-4 w-4 accent-amber-500" />
                      <span className="text-sm text-neutral-200">
                        <strong>J'utilise Vinted</strong>
                        <span className="mt-1 block text-xs text-neutral-400">
                          Activez l'import Vinted avec ventilation des frais et vérification du prix fiscal.
                        </span>
                      </span>
                    </label>
                  </div>
                </>
              )}
              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</p>}
            </div>
          ) : <p role="alert" className="text-sm text-red-400">{error || "Préférences indisponibles."}</p>}
        </div>
        <footer className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-neutral-800 bg-neutral-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
          <button type="button" disabled={saving || loading} onClick={() => { if (step) { setStep((s) => s - 1); setError(""); } else close(); }}
            className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-900 disabled:opacity-50">
            {step === 0 ? "Plus tard" : "Précédent"}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} disabled={loading || !preferences}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-50">Suivant</button>
          ) : (
            <button type="button" onClick={finish} disabled={saving || loading || !preferences}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-50">
              {saving ? "Enregistrement…" : "Enregistrer ma configuration"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
