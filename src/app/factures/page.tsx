"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { getCompanyPreferences } from "@/lib/preferences";
import { getSales, getSaleLines } from "@/lib/sales";
import { generateInvoicesZip } from "@/lib/invoiceZip";

import { toast } from "sonner";
import { CompanyPreferences } from "@/types/preferences";
import { Sale } from "@/types/sale";

type VatFilterMode = "all" | "standard_vat" | "margin_vat";

interface FacturationFilters {
  dateDebut: string;
  dateFin: string;
  vatMode: VatFilterMode;
  onlyUnbilled: boolean;
}

export default function FacturesPage() {
  const [preferences, setPreferences] = useState<CompanyPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [salesCount, setSalesCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  

  const [filters, setFilters] = useState<FacturationFilters>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      dateDebut: firstDay.toISOString().split("T")[0],
      dateFin: lastDay.toISOString().split("T")[0],
      vatMode: "all",
      onlyUnbilled: true,
    };
  });

  useEffect(() => {
    async function loadPreferences() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("Utilisateur non connecté.");
          return;
        }

        const { data: membership, error } = await supabase
          .from("memberships")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!membership) {
          setErrorMessage("Aucune société associée à ce compte.");
          return;
        }

        const prefs = await getCompanyPreferences(membership.company_id);
        setPreferences(prefs);
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : "Erreur lors du chargement."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  useEffect(() => {
    async function loadSalesPreview() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: membership } = await supabase
          .from("memberships")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!membership) return;

        const sales = await getSales(membership.company_id);

        const filtered = sales.filter((sale: any) => {
          const saleDate = sale.sale_date;

          if (filters.dateDebut && saleDate < filters.dateDebut) {
            return false;
          }

          if (filters.dateFin && saleDate > filters.dateFin) {
            return false;
          }

          if (filters.vatMode !== "all" && sale.vat_mode !== filters.vatMode) {
            return false;
          }

          if (filters.onlyUnbilled && (sale.invoice_number || sale.billed_at)) {
  return false;
}

          return true;
        });

        const saleLines = await getSaleLines(filtered.map((sale: any) => sale.id));

        const mappedSales: Sale[] = filtered.map((sale: any) => ({
          id: sale.id,
          date: sale.sale_date,
          numInterne: sale.id.slice(0, 8).toUpperCase(),
          customerName: sale.customer_name,
          vatMode: sale.vat_mode,
          paymentMethod: sale.payment_method || "Virement",
          subtotalHT: Number(sale.subtotal_ht),
          vatAmount: Number(sale.vat_amount),
          totalTTC: Number(sale.total_ttc),
          marginAmount: Number(sale.margin_amount || 0),
          notes: sale.notes || undefined,
          invoiceNumber: sale.invoice_number || undefined,
          billedAt: sale.billed_at || undefined,

          lines: saleLines
            .filter((line: any) => line.sale_id === sale.id)
            .map((line: any) => ({
              id: line.id,
              saleId: line.sale_id,
              companyId: line.company_id,
              purchaseItemId: line.purchase_item_id || undefined,
              itemReference: line.item_reference || undefined,
              itemName: line.item_name,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unit_price),
              totalPrice: Number(line.total_price),
              purchaseCost:
                line.purchase_cost !== null && line.purchase_cost !== undefined
                  ? Number(line.purchase_cost)
                  : undefined,
              marginAmount:
                line.margin_amount !== null && line.margin_amount !== undefined
                  ? Number(line.margin_amount)
                  : undefined,
              vatRate: Number(line.vat_rate),
              notes: line.notes || undefined,
              createdAt: line.created_at,
            })),
        }));

        setFilteredSales(mappedSales);
        setSalesCount(mappedSales.length);

setInvoiceCount(mappedSales.length);
      } catch (e) {
        console.error(e);
      }
    }

    loadSalesPreview();
  }, [filters]);

  function updateFilter<K extends keyof FacturationFilters>(
    key: K,
    value: FacturationFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function formatInvoiceNumber(prefix: string, num: number): string {
    return `${prefix}${String(num).padStart(6, "0")}`;
  }

  const completenessScore = useMemo(() => {
    if (!preferences) return { filled: 0, total: 5 };

    let filled = 0;

    if (preferences.invoiceCompanyName?.trim()) filled++;
    if (preferences.invoiceCompanyAddress?.trim()) filled++;
    if (preferences.invoiceCompanyVat?.trim()) filled++;
    if (preferences.invoiceCompanyEmail?.trim()) filled++;
    if (preferences.invoicePrefix?.trim()) filled++;

    return { filled, total: 5 };
  }, [preferences]);

  const isComplete = completenessScore.filled === completenessScore.total;

function formatDateFr(value: string): string {
  if (!value) return "date inconnue";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function handleGenerateZip() {
  if (!preferences) {
    toast.error("Préférences introuvables.");
    return;
  }

  if (filteredSales.length === 0) {
    toast.error("Aucune vente à facturer.");
    return;
  }

  setConfirmModalOpen(true);
}

async function confirmGenerateZip() {
  try {
    if (!preferences) return;

    setConfirmModalOpen(false);
    setGeneratingZip(true);

    const supabase = createClient();

    const cleanPrefix = preferences.invoicePrefix || "F-";
    const firstInvoiceNumber = preferences.invoiceNextNumber || 1;
    const nextInvoiceNumber = firstInvoiceNumber + filteredSales.length;

    const updatedPreferences = await generateInvoicesZip({
      sales: filteredSales,
      preferences,
    });

    await Promise.all(
      filteredSales.map((sale, index) =>
        supabase
          .from("sales")
          .update({
            invoice_number: formatInvoiceNumber(
              cleanPrefix,
              firstInvoiceNumber + index
            ),
            billed_at: new Date().toISOString(),
          })
          .eq("id", sale.id)
      )
    );

    await supabase.from("invoice_prefix_counters").upsert(
      {
        company_id: preferences.companyId,
        prefix: cleanPrefix,
        next_number: nextInvoiceNumber,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "company_id,prefix",
      }
    );

    await supabase
      .from("company_preferences")
      .update({
        invoice_next_number: nextInvoiceNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", preferences.companyId);

    setPreferences({
      ...updatedPreferences,
      invoiceNextNumber: nextInvoiceNumber,
    });

    if (filters.onlyUnbilled) {
      setFilteredSales([]);
      setSalesCount(0);
      setInvoiceCount(0);
    }
  } catch (e) {
    console.error(e);
    toast.error("Erreur lors de la génération des factures.");
  } finally {
    setGeneratingZip(false);
  }
}

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

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-neutral-800 rounded" />
          <div className="h-4 w-96 bg-neutral-800/60 rounded" />
          <div className="space-y-4 mt-8">
            {[...Array(3)].map((_, i) => (
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

  if (errorMessage && !preferences) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="pb-32">
      <div className="p-6 lg:p-8 max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 mb-3">
              <PdfIcon className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest">
                PDF · ZIP
              </span>
            </div>

            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Factures
            </h1>

            <p className="text-sm text-neutral-500 mt-1">
              Génération groupée de factures PDF à partir des ventes.
            </p>
          </div>
        </div>

        <Section
          title="Informations société"
          description="Ces informations seront utilisées en en-tête de chaque facture générée."
          icon={<BuildingIcon />}
          headerExtra={
            <div className="flex items-center gap-3">
              <CompletenessBadge
                filled={completenessScore.filled}
                total={completenessScore.total}
              />

              <Link
                href="/preferences"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                Modifier les préférences
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PreferenceField
              label="Nom commercial"
              value={preferences.invoiceCompanyName}
            />

            <PreferenceField
              label="Numéro de TVA"
              value={preferences.invoiceCompanyVat}
              mono
            />

            <PreferenceField
              label="Adresse"
              value={preferences.invoiceCompanyAddress}
              className="sm:col-span-2"
              multiline
            />

            <PreferenceField
              label="Email contact"
              value={preferences.invoiceCompanyEmail}
            />

            <PreferenceField
              label="Téléphone"
              value={preferences.invoiceCompanyPhone}
            />

            <PreferenceField
              label="Pied de facture"
              value={preferences.invoiceFooter}
              className="sm:col-span-2"
              multiline
            />

            <PreferenceField
              label="Conditions de paiement"
              value={preferences.invoicePaymentTerms}
              className="sm:col-span-2"
              multiline
            />

            <PreferenceField
              label="Préfixe facture"
              value={preferences.invoicePrefix}
              mono
            />

            <PreferenceField
              label="Prochain numéro"
              value={
                preferences.invoiceNextNumber
                  ? formatInvoiceNumber(
                      preferences.invoicePrefix || "F-",
                      preferences.invoiceNextNumber
                    )
                  : ""
              }
              mono
              accent
            />
          </div>
        </Section>

        <Section
          title="Période à facturer"
          description="Sélectionnez la plage de dates et le régime TVA des ventes à inclure."
          icon={<CalendarIcon />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClasses}>Date début</label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => updateFilter("dateDebut", e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Date fin</label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => updateFilter("dateFin", e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClasses}>Régime TVA</label>
              <select
                value={filters.vatMode}
                onChange={(e) =>
                  updateFilter("vatMode", e.target.value as VatFilterMode)
                }
                className={inputClasses}
              >
                <option value="all">Toutes les ventes</option>
                <option value="standard_vat">TVA standard</option>
                <option value="margin_vat">TVA sur marge</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <CheckboxRow
              checked={filters.onlyUnbilled}
              onChange={(v) => updateFilter("onlyUnbilled", v)}
              label="Inclure uniquement les ventes non facturées"
              description="La gestion anti-doublon sera verrouillée avec l'historique des factures."
            />


          </div>
        </Section>

        <Section
          title="Aperçu de la génération"
          description="Estimation basée sur les filtres ci-dessus."
          icon={<SparkleIcon />}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <PreviewCard
              label="Ventes trouvées"
              value={String(salesCount)}
              hint="Sur la période"
            />

            <PreviewCard
              label="Factures à générer"
              value={String(invoiceCount)}
              hint="Selon les options"
            />

            <PreviewCard
              label="Premier numéro"
              value={formatInvoiceNumber(
                preferences.invoicePrefix || "F-",
                preferences.invoiceNextNumber || 1
              )}
              hint="Prochain à attribuer"
              mono
              accent
            />

            <PreviewCard
              label="Dernier numéro estimé"
              value={formatInvoiceNumber(
                preferences.invoicePrefix || "F-",
                (preferences.invoiceNextNumber || 1) +
                  Math.max(invoiceCount - 1, 0)
              )}
              hint="Après génération"
              mono
            />
          </div>

          {!isComplete && (
            <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
              <svg
                className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>

              <div className="text-xs text-neutral-300 leading-relaxed">
                Certaines informations société sont manquantes. Les factures
                seront générées mais incomplètes — pensez à compléter vos
                préférences avant la génération définitive.
              </div>
            </div>
          )}
        </Section>
      </div>

{confirmModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-neutral-950 shadow-2xl shadow-amber-500/10 overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
            <ZipIcon className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Confirmer la génération
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Voulez-vous générer les factures des ventes du{" "}
              <span className="font-semibold text-amber-400">
                {formatDateFr(filters.dateDebut)}
              </span>{" "}
              au{" "}
              <span className="font-semibold text-amber-400">
                {formatDateFr(filters.dateFin)}
              </span>{" "}
              ?
            </p>

            <p className="mt-3 text-sm text-neutral-300">
              <span className="font-semibold text-white">
                {filteredSales.length}
              </span>{" "}
              facture{filteredSales.length > 1 ? "s" : ""} seront générées.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmModalOpen(false)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={confirmGenerateZip}
            disabled={generatingZip}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/20"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 border-t border-neutral-800 backdrop-blur-md bg-neutral-950/85">
        <div className="max-w-5xl px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] text-neutral-500">
            <svg
              className="h-3.5 w-3.5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
              />
            </svg>

            <span className="italic">
              Chaque vente sélectionnée générera une facture PDF, puis
              l’ensemble sera téléchargé dans un ZIP.
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerateZip}
            disabled={generatingZip || filteredSales.length === 0}
            className="
              inline-flex items-center gap-2
              rounded-lg px-5 py-2
              text-sm font-semibold
              bg-amber-500 text-neutral-950
              hover:bg-amber-400
              disabled:opacity-40
              disabled:cursor-not-allowed
              transition-colors
              shadow-lg shadow-amber-500/10
            "
          >
            <ZipIcon className="h-3.5 w-3.5" />
            {generatingZip ? "Génération..." : "Générer et télécharger le ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  headerExtra,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 pb-5 border-b border-neutral-800/60">
          <div className="flex items-start gap-3">
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

          {headerExtra && <div className="flex-shrink-0">{headerExtra}</div>}
        </div>

        {children}
      </div>
    </section>
  );
}

function PreferenceField({
  label,
  value,
  className = "",
  mono = false,
  accent = false,
  multiline = false,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
  accent?: boolean;
  multiline?: boolean;
}) {
  const isEmpty = !value?.trim();

  return (
    <div className={className}>
      <p className="text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
        {label}
      </p>

      <div
        className={`
          rounded-lg px-3 py-2.5 text-sm border
          ${
            isEmpty
              ? "border-dashed border-neutral-800 bg-neutral-900/20"
              : "border-neutral-800 bg-neutral-900/40"
          }
          ${multiline ? "min-h-[2.75rem]" : ""}
        `}
      >
        {isEmpty ? (
          <Link
            href="/preferences"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-amber-400 italic transition-colors"
          >
            À compléter dans Préférences
          </Link>
        ) : (
          <span
            className={`
              ${mono ? "font-mono" : ""}
              ${accent ? "text-amber-400 font-semibold" : "text-neutral-200"}
              ${multiline ? "whitespace-pre-wrap" : ""}
              break-words
            `}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`
        flex items-start gap-3 rounded-lg px-4 py-3 border cursor-pointer
        transition-all duration-150
        ${
          checked
            ? "bg-amber-500/5 border-amber-500/25"
            : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
        }
      `}
    >
      <span
        className={`
          mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded border flex-shrink-0
          transition-colors
          ${
            checked
              ? "bg-amber-500 border-amber-500"
              : "bg-neutral-900 border-neutral-700"
          }
        `}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-neutral-950"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        )}
      </span>

      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            checked ? "text-amber-100" : "text-neutral-200"
          }`}
        >
          {label}
        </p>

        <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
}

function PreviewCard({
  label,
  value,
  hint,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl p-4 border transition-colors duration-200
        ${
          accent
            ? "bg-amber-500/5 border-amber-500/25"
            : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
        }
      `}
    >
      <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
        {label}
      </p>

      <p
        className={`
          mt-2 text-xl font-bold tabular-nums truncate
          ${mono ? "font-mono text-base" : ""}
          ${accent ? "text-amber-400" : "text-white"}
        `}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-neutral-600">{hint}</p>
    </div>
  );
}

function CompletenessBadge({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  const complete = filled === total;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
        text-[10px] font-semibold uppercase tracking-wider border
        ${
          complete
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/25 text-amber-400"
        }
      `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          complete ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
        }`}
      />
      {filled}/{total} renseigné{filled > 1 ? "s" : ""}
    </span>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function ZipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z M18 3l.75 1.5L20.25 5.25l-1.5.75L18 7.5l-.75-1.5L15.75 5.25l1.5-.75L18 3z"
      />
    </svg>
  );
}