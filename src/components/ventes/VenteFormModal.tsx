"use client";


import { useEffect, useMemo, useRef, useState } from "react";
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
  clients?: { id: string; name: string }[];
  prefillItem?: AvailableStockItem | null;
}

type VentePayload = {
  date: string;
  customerName: string;
  contactId?: string | null;
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
prefillItem = null,
}: VenteFormModalProps) {
  const isEditing = Boolean(venteInitiale);

  const [form, setForm] = useState({
  date: dateAujourdhui(),
  customerName: "",
  contactId: null as string | null,
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
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const isDirtyRef = useRef(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const inputClasses = `
    w-full rounded-lg px-3 py-2.5 text-sm
    bg-zinc-900/60 text-zinc-200
    border border-zinc-800
    placeholder:text-zinc-600
    focus:outline-none
    focus:border-amber-500/40
    focus:ring-1 focus:ring-amber-500/15
    transition-colors duration-150
  `;

  const labelClasses =
    "block text-[11px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider";
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
    isDirtyRef.current = false;
    setShowUnsavedModal(false);

    if (!venteInitiale) {
      if (prefillItem) {
        const vatMode: SaleVatMode = prefillItem.marginEligible
          ? "margin_vat"
          : "standard_vat";

        setForm({
          date: dateAujourdhui(),
          customerName: "",
          contactId: null,
          vatMode,
          paymentMethod: "Virement",
          notes: "",
          saveClient: false,
        });
        setModeMontantStandard("ttc");
        setLines([
          {
            id: genId(),
            purchaseItemId: prefillItem.id,
            itemReference: prefillItem.itemReference,
            itemName: prefillItem.itemName,
            quantity: "1",
            unitPrice: "",
            purchaseCost: String(prefillItem.unitCost),
            vatRate: String(defaultVatRate),
            notes: "",
          },
        ]);
        setErreurs([]);
      } else {
        resetForm(defaultVatRate);
      }
      return;
    }

setForm({
  date: venteInitiale.date,
  customerName: venteInitiale.customerName,
  contactId: venteInitiale.contactId ?? null,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, venteInitiale, prefillItem]);

  const stockItemsFiltres = useMemo(() => {
    return stockItems.filter((item) =>
      form.vatMode === "margin_vat"
        ? item.marginEligible
        : !item.marginEligible
    );
  }, [stockItems, form.vatMode]);

  const updateForm = (champ: keyof typeof form, valeur: string) => {
    isDirtyRef.current = true;
    setForm((prev) => ({
      ...prev,
      [champ]: valeur,
    }));
    setErreurs([]);
  };

  // Saisie libre : efface toujours le contactId (pas de matching par nom)
  const handleCustomerNameChange = (value: string) => {
    isDirtyRef.current = true;
    setForm((prev) => ({ ...prev, customerName: value, contactId: null }));
    setErreurs([]);
  };

  // Sélection depuis le dropdown : ID réel du contact, pas de matching
  const handleSelectContact = (contact: { id: string; name: string }) => {
    isDirtyRef.current = true;
    setForm((prev) => ({ ...prev, customerName: contact.name, contactId: contact.id }));
    setContactDropdownOpen(false);
    setErreurs([]);
  };

  const filteredContacts = useMemo(() => {
    if (!form.customerName.trim()) return clients;
    const q = form.customerName.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, form.customerName]);

  const updateLine = (id: string, champ: keyof FormLine, valeur: string) => {
    isDirtyRef.current = true;
    setLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, [champ]: valeur } : line
      )
    );
    setErreurs([]);
  };

  const ajouterLigne = () => {
    isDirtyRef.current = true;
    setLines((prev) => [...prev, emptyLine(defaultVatRate)]);
  };

  const supprimerLigne = (id: string) => {
    isDirtyRef.current = true;
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const choisirItemStock = (lineId: string, itemId: string) => {
    isDirtyRef.current = true;
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
    isDirtyRef.current = false;
    setForm({
      date: dateAujourdhui(),
      customerName: "",
      contactId: null,
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
    if (showUnsavedModal) return;
    if (isEditing && isDirtyRef.current) {
      setShowUnsavedModal(true);
      return;
    }
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
      contactId: form.contactId,
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
    <>
    <Modal
      ouvert={ouvert}
      onFermer={handleFermer}
      titre={isEditing ? "Modifier la vente" : "Ajouter une vente"}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleFermer}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg px-5 py-2 text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          >
            {isEditing ? "Enregistrer" : "Ajouter la vente"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <p className="text-sm text-blue-200/80 leading-relaxed">
            Une vente ne peut contenir qu’un seul régime TVA. Pour mélanger TVA
            standard et TVA sur marge, créez deux ventes/factures séparées.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="relative">
              <input
                type="text"
                value={form.customerName}
                maxLength={MAX_TEXT.customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onFocus={() => { if (clients.length > 0) setContactDropdownOpen(true); }}
                onBlur={() => setTimeout(() => setContactDropdownOpen(false), 150)}
                placeholder="Ex : Client comptoir"
                className={`${inputClasses} ${form.contactId ? "pr-14" : ""}`}
                autoComplete="off"
              />

              {form.contactId && (
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  ✓ lié
                </span>
              )}

              {contactDropdownOpen && filteredContacts.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
                  {filteredContacts.map((contact) => (
                    <li key={contact.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectContact(contact); }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-amber-500/10 ${
                          form.contactId === contact.id
                            ? "text-emerald-400 font-semibold"
                            : "text-zinc-200"
                        }`}
                      >
                        {contact.name}
                        {form.contactId === contact.id && (
                          <span className="ml-2 text-[10px] text-emerald-400">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                        : "bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-700"
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
            <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
              <svg className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Le régime de TVA sur marge s'applique uniquement aux biens achetés sans TVA déductible (ex. achat à un particulier). Vérifiez avec votre comptable avant utilisation.
              </p>
            </div>
          )}
        </div>

        {form.vatMode === "standard_vat" && (
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Saisie des prix
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                En TVA standard, les prix peuvent être encodés en HT ou TTC.
              </p>
            </div>

            <div className="inline-flex p-0.5 rounded-md bg-zinc-900/60 border border-zinc-800">
              <button
                type="button"
                onClick={() => setModeMontantStandard("ht")}
                className={`rounded px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  modeMontantStandard === "ht"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-zinc-500 hover:text-zinc-300"
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
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                TTC
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white">
                Lignes de vente
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {form.vatMode === "margin_vat"
                  ? "Sélectionnez un article acheté à un particulier."
                  : "Sélectionnez un article acheté à un pro ou encodez une ligne manuelle."}
              </p>
              <p className="text-[11px] text-zinc-700 mt-1">
                Le taux de TVA par défaut peut être modifié dans les Préférences.
              </p>
            </div>

            <button
              type="button"
              onClick={ajouterLigne}
              className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white active:scale-[0.97] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter une ligne
            </button>
          </div>

          <div className="p-5 space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Ligne #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => supprimerLigne(line.id)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                    title="Supprimer cette ligne"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
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

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[90px_1fr_100px]">
                      <div className="order-1">
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

                      <div className="col-span-2 sm:col-span-1 order-3 sm:order-2">
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

                      <div className="order-2 sm:order-3">
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

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="flex justify-between text-sm px-4 py-2.5">
            <span className="text-zinc-500">HT / Base</span>
            <span className="text-zinc-300 font-medium tabular-nums">
              {totals.subtotalHT.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          <div className="flex justify-between text-sm px-4 py-2.5 border-t border-zinc-800/60">
            <span className="text-zinc-500">TVA</span>
            <span className="text-cyan-400 font-medium tabular-nums">
              {totals.vatAmount.toLocaleString("fr-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          {form.vatMode === "margin_vat" && (
            <div className="flex justify-between text-sm px-4 py-2.5 border-t border-zinc-800/60">
              <span className="text-zinc-500">Marge nette</span>
              <span className="text-emerald-400 font-medium tabular-nums">
                {totals.marginAmount.toLocaleString("fr-BE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800/60 bg-zinc-900/60">
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

<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
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
        mt-0.5 h-4 w-4 rounded border-zinc-700
        bg-zinc-900 text-amber-500
        focus:ring-amber-500/20
      "
    />

    <div>
      <p className="text-sm font-medium text-white">
        Enregistrer ce client dans les contacts
      </p>

      <p className="text-xs text-zinc-500 mt-0.5">
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
      </div>
    </Modal>

    {showUnsavedModal && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-overlay-fade">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden animate-modal-pop">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
          <div className="p-6">
            <h2 className="text-base font-semibold text-white">
              Modifications non enregistrées
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Voulez-vous sauvegarder les modifications ?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  isDirtyRef.current = false;
                  resetForm(defaultVatRate);
                  onFermer();
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40"
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  handleSubmit();
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}