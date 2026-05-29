"use client";


import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCompanyPreferences } from "@/lib/preferences";
import Modal from "@/components/ui/Modal";
import {
  AvailableStockItem,
  Sale,
  SaleLineInput,
  SalePaymentMethod,
  SaleVatMode,
  SALE_VAT_MODE_CONFIG,
  validateSale,
} from "@/types/sale";
import {
  calculateMarginSale,
  calculateStandardSale,
  convertTTCtoHT,
} from "@/lib/saleCalculations";


interface VenteFormModalProps {
  ouvert: boolean;
  onFermer: () => void;
  onAjouter: (vente: VentePayload) => void;
  onModifier: (vente: VentePayload) => void;
  venteInitiale: Sale | null;
  stockItems: AvailableStockItem[];
  clients?: string[];
}

type VentePayload = {
  date: string;
  customerName: string;
  vatMode: SaleVatMode;
  paymentMethod: SalePaymentMethod;
  subtotalHT: number;
  vatAmount: number;
  totalTTC: number;
  marginAmount: number;
  notes?: string;
  lines: SaleLineInput[];
  saveClient?: boolean;
};

interface FormLine {
  id: string;
  purchaseItemId?: string;
  itemReference?: string;
  itemName: string;
  quantity: string;
  unitPrice: string;
  purchaseCost: string;
  vatRate: string;
  notes: string;
}

function dateAujourdhui(): string {
  return new Date().toISOString().split("T")[0];
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyLine(vatRate = 21): FormLine {
  return {
    id: genId(),
    itemName: "",
    quantity: "1",
    unitPrice: "",
    purchaseCost: "",
    vatRate: String(vatRate),
    notes: "",
  };
}

const MAX_TEXT = {
  customerName: 120,
  itemName: 150,
  notes: 1000,
};

export default function VenteFormModal({
  ouvert,
  onFermer,
  onAjouter,
  onModifier,
  venteInitiale,
stockItems,
clients = [],
}: VenteFormModalProps) {
  const isEditing = Boolean(venteInitiale);

  const [form, setForm] = useState({
  date: dateAujourdhui(),
  customerName: "",
  vatMode: "standard_vat" as SaleVatMode,
  paymentMethod: "Virement" as SalePaymentMethod,
  notes: "",
  saveClient: false,
});

  const [modeMontantStandard, setModeMontantStandard] =
    useState<"ht" | "ttc">("ttc");

  const [defaultVatRate, setDefaultVatRate] = useState(21);
  const [lines, setLines] = useState<FormLine[]>([emptyLine()]);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([
  "Virement",
  "Paypal",
  "Bancontact",
  "Cash",
]);

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

  const labelClasses =
    "block text-[11px] font-semibold text-neutral-500 mb-2 uppercase tracking-wider";
useEffect(() => {
  async function loadPaymentMethods() {
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

      const prefs = await getCompanyPreferences(
        membership.company_id
      );

      if (
        prefs.defaultPaymentMethods &&
        prefs.defaultPaymentMethods.length > 0
      ) {
        setPaymentMethods(prefs.defaultPaymentMethods);
      }

      if (Number.isFinite(prefs.defaultVatRate)) {
        setDefaultVatRate(prefs.defaultVatRate);
      }
    } catch (e) {
      console.error(e);
    }
  }

  loadPaymentMethods();
}, []);

  useEffect(() => {
    if (!ouvert) return;

    if (!venteInitiale) {
      resetForm(defaultVatRate);
      return;
    }

setForm({
  date: venteInitiale.date,
  customerName: venteInitiale.customerName,
  vatMode: venteInitiale.vatMode,
  paymentMethod: venteInitiale.paymentMethod,
  notes: venteInitiale.notes || "",
  saveClient: false,
});

    setModeMontantStandard("ht");

    setLines(
      venteInitiale.lines && venteInitiale.lines.length > 0
        ? venteInitiale.lines.map((line) => ({
            id: line.id || genId(),
            purchaseItemId: line.purchaseItemId,
            itemReference: line.itemReference,
            itemName: line.itemName,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            purchaseCost:
              line.purchaseCost !== undefined ? String(line.purchaseCost) : "",
            vatRate: String(line.vatRate),
            notes: line.notes || "",
          }))
        : [emptyLine()]
    );

    setErreurs([]);
  }, [ouvert, venteInitiale]);

  const stockItemsFiltres = useMemo(() => {
    return stockItems.filter((item) =>
      form.vatMode === "margin_vat"
        ? item.marginEligible
        : !item.marginEligible
    );
  }, [stockItems, form.vatMode]);

  const updateForm = (champ: keyof typeof form, valeur: string) => {
    setForm((prev) => ({
      ...prev,
      [champ]: valeur,
    }));

    setErreurs([]);
  };

  const updateLine = (id: string, champ: keyof FormLine, valeur: string) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, [champ]: valeur } : line
      )
    );

    setErreurs([]);
  };

  const ajouterLigne = () => {
    setLines((prev) => [...prev, emptyLine(defaultVatRate)]);
  };

  const supprimerLigne = (id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const choisirItemStock = (lineId: string, itemId: string) => {
    if (!itemId) {
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                purchaseItemId: undefined,
                itemReference: undefined,
                purchaseCost: "",
              }
            : line
        )
      );
      return;
    }

    const item = stockItems.find((stockItem) => stockItem.id === itemId);
    if (!item) return;

    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              purchaseItemId: item.id,
              itemReference: item.itemReference,
              itemName: item.itemName,
              purchaseCost: String(item.unitCost),
              quantity: "1",
            }
          : line
      )
    );
  };

  const mappedLines: SaleLineInput[] = useMemo(() => {
    return lines.map((line) => {
      const quantity = Number(line.quantity) || 0;
      const vatRate = Number(line.vatRate) || 0;
      const rawUnitPrice = Number(line.unitPrice) || 0;

      const unitPrice =
        form.vatMode === "standard_vat" && modeMontantStandard === "ttc"
          ? convertTTCtoHT(rawUnitPrice, vatRate)
          : rawUnitPrice;

      return {
        purchaseItemId: line.purchaseItemId,
        itemReference: line.itemReference,
        itemName: line.itemName.trim(),
        quantity,
        unitPrice,
        purchaseCost:
          line.purchaseCost.trim() !== "" ? Number(line.purchaseCost) : undefined,
        vatRate,
        notes: line.notes.trim() || undefined,
      };
    });
  }, [lines, form.vatMode, modeMontantStandard]);

  const totals = useMemo(() => {
    if (form.vatMode === "margin_vat") {
      return calculateMarginSale({
        lines: mappedLines.map((line) => ({
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          purchaseCost: line.purchaseCost || 0,
          vatRate: line.vatRate,
        })),
      });
    }

    return {
      ...calculateStandardSale({
        lines: mappedLines.map((line) => ({
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          vatRate: line.vatRate,
        })),
      }),
      marginAmount: 0,
    };
  }, [form.vatMode, mappedLines]);

  const resetForm = (vatRate = defaultVatRate) => {
    setForm({
      date: dateAujourdhui(),
      customerName: "",
      vatMode: "standard_vat",
      paymentMethod: "Virement",
      notes: "",
      saveClient: false,
    });

    setModeMontantStandard("ttc");
    setLines([emptyLine(vatRate)]);
    setErreurs([]);
  };

  const handleFermer = () => {
    resetForm(defaultVatRate);
    onFermer();
  };

  const validateStock = (): string[] => {
    const stockErrors: string[] = [];

    mappedLines.forEach((line, index) => {
      if (!line.purchaseItemId) return;

      const stockItem = stockItems.find((item) => item.id === line.purchaseItemId);

      if (!stockItem && !isEditing) {
        stockErrors.push(`Ligne ${index + 1} : article en stock introuvable.`);
        return;
      }

      if (stockItem && line.quantity > stockItem.stockQuantity && !isEditing) {
        stockErrors.push(
          `Ligne ${index + 1} : stock insuffisant (${stockItem.stockQuantity} disponible).`
        );
      }
    });

    return stockErrors;
  };

  const handleSubmit = () => {
    const validation = validateSale({
      customerName: form.customerName,
      vatMode: form.vatMode,
      lines: mappedLines,
      notes: form.notes,
    });

    const stockErrors = validateStock();
    const allErrors = [...validation.errors, ...stockErrors];

    if (!validation.valid || stockErrors.length > 0) {
      setErreurs(allErrors);
      return;
    }

    const payload: VentePayload = {
      date: form.date,
      customerName: form.customerName.trim(),
      vatMode: form.vatMode,
      paymentMethod: form.paymentMethod,
      subtotalHT: totals.subtotalHT,
      vatAmount: totals.vatAmount,
      totalTTC: totals.totalTTC,
      marginAmount: totals.marginAmount,
      notes: form.notes.trim() || undefined,
      lines: mappedLines,
      saveClient: form.saveClient,
    };

    if (isEditing) {
      onModifier(payload);
    } else {
      onAjouter(payload);
    }
  };

  return (
    <Modal
      ouvert={ouvert}
      onFermer={handleFermer}
      titre={isEditing ? "Modifier la vente" : "Ajouter une vente"}
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-200/80 leading-relaxed">
            Une vente ne peut contenir qu’un seul régime TVA. Pour mélanger TVA
            standard et TVA sur marge, créez deux ventes/factures séparées.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateForm("date", e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Client</label>
<>
  <input
    list="clients-list"
    type="text"
    value={form.customerName}
    maxLength={MAX_TEXT.customerName}
    onChange={(e) => updateForm("customerName", e.target.value)}
    placeholder="Ex : Client comptoir"
    className={inputClasses}
  />

  <datalist id="clients-list">
    {clients.map((client) => (
      <option key={client} value={client} />
    ))}
  </datalist>
</>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Régime TVA</label>

          <div className="grid grid-cols-2 gap-2">
            {(["standard_vat", "margin_vat"] as SaleVatMode[]).map((mode) => {
              const config = SALE_VAT_MODE_CONFIG[mode];
              const active = form.vatMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateForm("vatMode", mode)}
                  className={`
                    rounded-lg px-4 py-3 text-sm border text-left
                    transition-all duration-150
                    ${
                      active
                        ? `${config.bg} ${config.text} ${config.border}`
                        : "bg-neutral-900/40 text-neutral-500 border-neutral-800 hover:border-neutral-700"
                    }
                  `}
                >
                  <div className="font-semibold">{config.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {config.description}
                  </div>
                </button>
              );
            })}
          </div>

          {form.vatMode === "margin_vat" && (
            <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
              <svg className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Le régime de TVA sur marge s'applique uniquement aux biens achetés sans TVA déductible (ex. achat à un particulier). Vérifiez avec votre comptable avant utilisation.
              </p>
            </div>
          )}
        </div>

        {form.vatMode === "standard_vat" && (
          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Saisie des prix
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                En TVA standard, les prix peuvent être encodés en HT ou TTC.
              </p>
            </div>

            <div className="inline-flex p-0.5 rounded-md bg-neutral-900/60 border border-neutral-800">
              <button
                type="button"
                onClick={() => setModeMontantStandard("ht")}
                className={`rounded px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  modeMontantStandard === "ht"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                HT
              </button>

              <button
                type="button"
                onClick={() => setModeMontantStandard("ttc")}
                className={`rounded px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  modeMontantStandard === "ttc"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                TTC
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/40">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Lignes de vente
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {form.vatMode === "margin_vat"
                  ? "Sélectionnez un article acheté à un particulier."
                  : "Sélectionnez un article acheté à un pro ou encodez une ligne manuelle."}
              </p>
              <p className="text-[11px] text-neutral-700 mt-1">
                Le taux de TVA par défaut peut être modifié dans les Préférences.
              </p>
            </div>

            <button
              type="button"
              onClick={ajouterLigne}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.97] transition-all duration-150"
            >
              Ajouter une ligne
            </button>
          </div>

          <div className="p-5 space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/80 bg-neutral-900/40">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Ligne #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => supprimerLigne(line.id)}
                    className="h-7 w-7 rounded-md text-neutral-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <label className={labelClasses}>Article en stock</label>

                    <select
                      value={line.purchaseItemId || ""}
                      onChange={(e) => choisirItemStock(line.id, e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">— Ligne manuelle / aucun item lié —</option>

                      {stockItemsFiltres.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.itemReference} · {item.itemName} · stock{" "}
                          {item.stockQuantity}/{item.quantity} · coût{" "}
                          {item.unitCost.toLocaleString("fr-BE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={labelClasses}>Article</label>
                      <input
                        type="text"
                        value={line.itemName}
                        maxLength={MAX_TEXT.itemName}
                        onChange={(e) =>
                          updateLine(line.id, "itemName", e.target.value)
                        }
                        placeholder="Nom de l'article"
                        className={inputClasses}
                      />
                    </div>

                    <div className="grid grid-cols-[90px_1fr_100px] gap-3">
                      <div>
                        <label className={labelClasses}>Qté</label>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, "quantity", e.target.value)
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                          className={inputClasses}
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>
                          {form.vatMode === "margin_vat"
                            ? "Prix vente total "
                            : "Prix vente "}
                          {form.vatMode === "standard_vat"
                            ? modeMontantStandard.toUpperCase()
                            : "TTC"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="999999"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLine(line.id, "unitPrice", e.target.value)
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="0.00"
                          className={inputClasses}
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>TVA %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={line.vatRate}
                          onChange={(e) =>
                            updateLine(line.id, "vatRate", e.target.value)
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </div>

                  {form.vatMode === "margin_vat" && (
                    <div>
                      <label className={labelClasses}>
                        Coût achat à l&apos;unité TTC
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        step="0.01"
                        value={line.purchaseCost}
                        onChange={(e) =>
                          updateLine(line.id, "purchaseCost", e.target.value)
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Coût unitaire"
                        className={inputClasses}
                      />
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={line.notes}
                    maxLength={MAX_TEXT.notes}
                    onChange={(e) =>
                      updateLine(line.id, "notes", e.target.value)
                    }
                    placeholder="Notes ligne..."
                    className={`${inputClasses} resize-none`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <div className="flex justify-between text-sm px-4 py-2.5">
            <span className="text-neutral-500">HT / Base</span>
            <span className="text-neutral-300 font-medium tabular-nums">
              {totals.subtotalHT.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          <div className="flex justify-between text-sm px-4 py-2.5 border-t border-neutral-800/60">
            <span className="text-neutral-500">TVA</span>
            <span className="text-amber-400 font-medium tabular-nums">
              {totals.vatAmount.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          {form.vatMode === "margin_vat" && (
            <div className="flex justify-between text-sm px-4 py-2.5 border-t border-neutral-800/60">
              <span className="text-neutral-500">Marge nette</span>
              <span className="text-emerald-400 font-medium tabular-nums">
                {totals.marginAmount.toLocaleString("fr-BE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center px-4 py-3 border-t border-neutral-800/60 bg-neutral-900/60">
            <span className="text-white font-semibold text-sm">Total TTC</span>
            <span className="text-white font-bold text-base tabular-nums">
              {totals.totalTTC.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
        </div>

        {erreurs.length > 0 && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3">
            <ul className="space-y-1 text-sm text-red-300">
              {erreurs.map((erreur) => (
                <li key={erreur}>• {erreur}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className={labelClasses}>Mode de paiement</label>
          <select
            value={form.paymentMethod}
            onChange={(e) =>
              updateForm("paymentMethod", e.target.value as SalePaymentMethod)
            }
            className={inputClasses}
          >
           {paymentMethods.map((method) => (
  <option key={method} value={method}>
    {method}
  </option>
))}
          </select>
        </div>

<div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={form.saveClient}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          saveClient: e.target.checked,
        }))
      }
      className="
        mt-0.5 h-4 w-4 rounded border-neutral-700
        bg-neutral-900 text-amber-500
        focus:ring-amber-500/20
      "
    />

    <div>
      <p className="text-sm font-medium text-white">
        Enregistrer ce client dans les contacts
      </p>

      <p className="text-xs text-neutral-500 mt-0.5">
        Le client sera ajouté automatiquement dans l’onglet Contacts.
      </p>
    </div>
  </label>
</div>

        <div>
          <label className={labelClasses}>Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            maxLength={MAX_TEXT.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            placeholder="Notes..."
            className={`${inputClasses} resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleFermer}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg px-5 py-2 text-sm font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-amber-500/10"
          >
            {isEditing ? "Enregistrer" : "Ajouter la vente"}
          </button>
        </div>
      </div>
    </Modal>
  );
}