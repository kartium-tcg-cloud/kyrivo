"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCompanyPreferences } from "@/lib/preferences";
import { Achat, AchatItemInput, TypeAchat } from "@/types/achat";
import Modal from "@/components/ui/Modal";

interface AchatFormModalProps {
  ouvert: boolean;
  onFermer: () => void;
  onAjouter: (achat: Achat) => void;
  onModifier?: (achat: Achat) => void;
  achatInitial?: Achat | null;
  suppliers?: string[];
}

interface AchatItem {
  id: string;
  nom: string;
  cout: string;
  modeMontant: "ht" | "ttc";
  notes: string;
  quantite: string;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function dateAujourdhui(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyItem(): AchatItem {
  return {
    id: genId(),
    nom: "",
    quantite: "",
    cout: "",
    modeMontant: "ttc",
    notes: "",
  };
}

const MAX_TEXT = {
  fournisseur: 100,
  produit: 120,
  commentaire: 1000,
  articleNom: 150,
  notes: 1000,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AchatFormModal({
  ouvert,
  onFermer,
  onAjouter,
  onModifier,
  achatInitial = null,
  suppliers = [],
}: AchatFormModalProps) {
  const isEditing = Boolean(achatInitial);

  const [form, setForm] = useState({
  date: dateAujourdhui(),
  fournisseur: "",
  produit: "",
  type: "pro" as TypeAchat,
  prixHT: "",
  commentaire: "",
  paiement: "Virement",
  saveSupplier: false,
});

  const [modeMontant, setModeMontant] = useState<"ht" | "ttc">("ttc");
  const [tauxTVA, setTauxTVA] = useState(21);
  const [defaultVatRate, setDefaultVatRate] = useState(21);
  const [avecStock, setAvecStock] = useState(true);
  const [items, setItems] = useState<AchatItem[]>([emptyItem()]);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [documentFile, setDocumentFile] = useState<File | null>(null);
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

  const erreurClasses = "text-red-400 text-[11px] mt-1.5";

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
        setTauxTVA(prefs.defaultVatRate);
      }
    } catch (e) {
      console.error(e);
    }
  }

  loadPaymentMethods();
}, []);

  useEffect(() => {
    if (!ouvert) return;

    if (!achatInitial) {
      resetForm();
      return;
    }

setForm({
  date: achatInitial.date,
  fournisseur: achatInitial.fournisseur,
  produit: achatInitial.produit,
  type: achatInitial.type,
  prixHT: String(achatInitial.prixTTC),
  commentaire: achatInitial.commentaire || "",
  paiement: achatInitial.paiement,
  saveSupplier: false,
});

    setModeMontant("ttc");

    const computedVatRate =
      achatInitial.prixHT > 0
        ? Number(((achatInitial.prixTVA / achatInitial.prixHT) * 100).toFixed(2))
        : 0;

    setTauxTVA(achatInitial.type === "particulier" ? 0 : computedVatRate || defaultVatRate);

    const hasArticles = (achatInitial.articles?.length ?? 0) > 0;
    setAvecStock(hasArticles);

    setItems(
      hasArticles
        ? achatInitial.articles!.map((article) => ({
            id: article.id,
            nom: article.nom,
            quantite: String(article.quantite),
            cout:
              article.coutTTC !== undefined
                ? String(article.coutTTC)
                : String(article.coutHT),
            modeMontant: article.coutTTC !== undefined ? "ttc" : "ht",
            notes: article.notes || "",
          }))
        : []
    );

    setDocumentFile(null);
    setErreurs({});
  }, [ouvert, achatInitial]);

  const updateChamp = (champ: string, valeur: string) => {
    setForm((prev) => ({
      ...prev,
      [champ]: valeur,
    }));

    if (champ === "type") {
      if (valeur === "particulier") {
        setTauxTVA(0);
      } else if (tauxTVA === 0) {
        setTauxTVA(defaultVatRate);
      }
    }

    if (erreurs[champ]) {
      setErreurs((prev) => {
        const copy = { ...prev };
        delete copy[champ];
        return copy;
      });
    }
  };

  const handleAvecStockChange = (value: boolean) => {
    setAvecStock(value);
    if (value && items.length === 0) {
      setItems([emptyItem()]);
    }
  };

  const ajouterItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const supprimerItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, champ: keyof AchatItem, valeur: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [champ]: valeur } : item))
    );

    const key = `item-${id}-${champ}`;
    if (erreurs[key]) {
      setErreurs((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const totalItems = useMemo(() => {
    let totalHT = 0;
    let totalTTC = 0;

    items.forEach((item) => {
      const quantite = Number(item.quantite) || 1;
      const montantUnitaire = parseFloat(item.cout) || 0;
      const montant = montantUnitaire * quantite;

      if (item.modeMontant === "ht") {
        totalHT += montant;
        totalTTC += montant * (1 + tauxTVA / 100);
      } else {
        totalTTC += montant;
        totalHT += tauxTVA > 0 ? montant / (1 + tauxTVA / 100) : montant;
      }
    });

    return {
      ht: Math.round(totalHT * 100) / 100,
      ttc: Math.round(totalTTC * 100) / 100,
    };
  }, [items, tauxTVA]);

  const montant = parseFloat(form.prixHT) || 0;
  const tauxTVAEffectif = form.type === "particulier" ? 0 : tauxTVA;
  const ratioTVA = tauxTVAEffectif / 100;

  let prixHT = 0;
  let montantTVA = 0;
  let prixTTC = 0;

  if (modeMontant === "ht") {
    prixHT = montant;
    montantTVA = prixHT * ratioTVA;
    prixTTC = prixHT + montantTVA;
  } else {
    prixTTC = montant;
    prixHT = ratioTVA > 0 ? prixTTC / (1 + ratioTVA) : prixTTC;
    montantTVA = prixTTC - prixHT;
  }

  prixHT = Math.round(prixHT * 100) / 100;
  montantTVA = Math.round(montantTVA * 100) / 100;
  prixTTC = Math.round(prixTTC * 100) / 100;

  const valider = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.date) errs.date = "Date requise";

    if (!form.fournisseur.trim()) {
      errs.fournisseur = "Fournisseur requis";
    } else if (form.fournisseur.length > MAX_TEXT.fournisseur) {
      errs.fournisseur = `Maximum ${MAX_TEXT.fournisseur} caractères`;
    }

    if (!form.produit.trim()) {
      errs.produit = "Produit requis";
    } else if (form.produit.length > MAX_TEXT.produit) {
      errs.produit = `Maximum ${MAX_TEXT.produit} caractères`;
    }

    if (!form.prixHT || montant <= 0) {
      errs.prixHT = "Montant requis";
    } else if (montant > 999999) {
      errs.prixHT = "Montant trop élevé";
    }

    if (tauxTVA < 0 || tauxTVA > 100) {
      errs.tauxTVA = "TVA invalide";
    }

    if (form.commentaire.length > MAX_TEXT.commentaire) {
      errs.commentaire = `Maximum ${MAX_TEXT.commentaire} caractères`;
    }

    if (avecStock) {
      if (items.length === 0) {
        errs["items"] = "Ajoutez au moins un article en stock.";
      }

      items.forEach((item, index) => {
        const prefix = `Article ${index + 1}`;

        if (!item.nom.trim()) {
          errs[`item-${item.id}-nom`] = `${prefix} : nom requis`;
        } else if (item.nom.length > MAX_TEXT.articleNom) {
          errs[`item-${item.id}-nom`] = `${prefix} : nom trop long`;
        }

        const quantite = Number(item.quantite) || 1;
        if (quantite <= 0 || quantite > 9999) {
          errs[`item-${item.id}-quantite`] = `${prefix} : quantité invalide`;
        }

        const cout = parseFloat(item.cout) || 0;
        if (cout <= 0 || cout > 999999) {
          errs[`item-${item.id}-cout`] = `${prefix} : coût invalide`;
        }

        if (item.notes.length > MAX_TEXT.notes) {
          errs[`item-${item.id}-notes`] = `${prefix} : notes trop longues`;
        }
      });
    }

    if (documentFile) {
      if (!ALLOWED_FILE_TYPES.includes(documentFile.type)) {
        errs.documentFile = "Format de fichier non autorisé";
      }

      if (documentFile.size > MAX_FILE_SIZE) {
        errs.documentFile = "Fichier trop lourd, maximum 10 Mo";
      }
    }

    setErreurs(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setForm({
      date: dateAujourdhui(),
      fournisseur: "",
      produit: "",
      type: "pro",
      prixHT: "",
      commentaire: "",
      paiement: "Virement",
      saveSupplier: false,
    });

    setModeMontant("ttc");
    setTauxTVA(defaultVatRate);
    setAvecStock(true);
    setItems([emptyItem()]);
    setDocumentFile(null);
    setErreurs({});
  };

const buildPayload = (): Achat => {
  const mappedItems: AchatItemInput[] = avecStock
    ? items.map((item) => ({
        id: item.id,
        nom: item.nom.trim(),
        cout: parseFloat(item.cout) || 0,
        quantite: Number(item.quantite) || 1,
        modeMontant: item.modeMontant,
        notes: item.notes.trim() || undefined,
      }))
    : [];

  return {
    id: achatInitial?.id || genId(),
    date: form.date,
    numInterne: achatInitial?.numInterne || "NOUVEAU",
    fournisseur: form.fournisseur.trim(),
    produit: form.produit.trim(),
    type: form.type,
    prixHT,
    prixTVA: montantTVA,
    prixTTC,
    paiement: form.paiement as Achat["paiement"],
    numFacture: achatInitial?.numFacture || "",
    commentaire: form.commentaire.trim() || undefined,
    documentUrl: achatInitial?.documentUrl,
    documentFile,
    items: mappedItems,
    avecStock,
    saveSupplier: form.saveSupplier,
  };
};

  const handleSubmit = () => {
    if (!valider()) return;

    const payload = buildPayload();

    if (isEditing && onModifier) {
      onModifier(payload);
    } else {
      onAjouter(payload);
    }
  };

  const handleFermer = () => {
    resetForm();
    onFermer();
  };

  return (
    <Modal
      ouvert={ouvert}
      onFermer={handleFermer}
      titre={isEditing ? "Modifier l'achat" : "Ajouter un achat"}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateChamp("date", e.target.value)}
              className={`${inputClasses} ${
                erreurs.date ? "border-red-500/50" : ""
              }`}
            />
            {erreurs.date && <p className={erreurClasses}>{erreurs.date}</p>}
          </div>

          <div>
            <label className={labelClasses}>Type d&apos;achat</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <button
                type="button"
                onClick={() => updateChamp("type", "pro")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  form.type === "pro"
                    ? "bg-amber-500/15 text-amber-400 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                PRO
              </button>

              <button
                type="button"
                onClick={() => updateChamp("type", "particulier")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  form.type === "particulier"
                    ? "bg-amber-500/15 text-amber-400 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Particulier
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Fournisseur</label>
<>
  <input
    list="suppliers-list"
    type="text"
    placeholder="Ex : Cardmarket"
    value={form.fournisseur}
    onChange={(e) => updateChamp("fournisseur", e.target.value)}
    maxLength={MAX_TEXT.fournisseur}
    className={`${inputClasses} ${
      erreurs.fournisseur ? "border-red-500/50" : ""
    }`}
  />

  <datalist id="suppliers-list">
    {suppliers.map((supplier) => (
      <option key={supplier} value={supplier} />
    ))}
  </datalist>
</>
            {erreurs.fournisseur && (
              <p className={erreurClasses}>{erreurs.fournisseur}</p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Produit / Catégorie</label>
            <input
              type="text"
              placeholder="Ex : Lot Pokémon"
              value={form.produit}
              onChange={(e) => updateChamp("produit", e.target.value)}
              maxLength={MAX_TEXT.produit}
              className={`${inputClasses} ${
                erreurs.produit ? "border-red-500/50" : ""
              }`}
            />
            {erreurs.produit && (
              <p className={erreurClasses}>{erreurs.produit}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Montant total
            </label>

            <div className="inline-flex p-0.5 rounded-md bg-neutral-900/60 border border-neutral-800">
              <button
                type="button"
                onClick={() => setModeMontant("ht")}
                className={`rounded px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  modeMontant === "ht"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                HT
              </button>

              <button
                type="button"
                onClick={() => setModeMontant("ttc")}
                className={`rounded px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  modeMontant === "ttc"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                TTC
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999"
                placeholder="0.00"
                value={form.prixHT}
                onChange={(e) => updateChamp("prixHT", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className={`${inputClasses} ${
                  erreurs.prixHT ? "border-red-500/50" : ""
                }`}
              />
              <p className="text-[10px] text-neutral-600 mt-1.5 px-1">
                Montant en {modeMontant === "ht" ? "HT" : "TTC"}
              </p>
              {erreurs.prixHT && (
                <p className={erreurClasses}>{erreurs.prixHT}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tauxTVA}
                  onChange={(e) => setTauxTVA(Number(e.target.value))}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="21"
                  className={`${inputClasses} pr-7 ${
                    erreurs.tauxTVA ? "border-red-500/50" : ""
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">
                  %
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 mt-1.5 px-1">
                Taux TVA · <span className="text-neutral-700">modifiable dans les Préférences</span>
              </p>
              {erreurs.tauxTVA && (
                <p className={erreurClasses}>{erreurs.tauxTVA}</p>
              )}
            </div>
          </div>

          {montant > 0 && (
            <div className="mt-4 rounded-lg bg-neutral-900/40 border border-neutral-800 overflow-hidden">
              <div className="flex justify-between text-sm px-4 py-2.5">
                <span className="text-neutral-500">HT</span>
                <span className="text-neutral-300 tabular-nums font-medium">
                  {prixHT.toLocaleString("fr-BE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>

              <div className="flex justify-between text-sm px-4 py-2.5 border-t border-neutral-800/60">
                <span className="text-neutral-500">
                  TVA ({tauxTVAEffectif}%)
                </span>
                <span className="text-amber-400 tabular-nums font-medium">
                  {montantTVA.toLocaleString("fr-BE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center px-4 py-3 border-t border-neutral-800/60 bg-neutral-900/60">
                <span className="text-white font-semibold text-sm">TTC</span>
                <span className="text-white font-bold text-base tabular-nums">
                  {prixTTC.toLocaleString("fr-BE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Toggle Achat de stock / Dépense sans stock ──────── */}
        <div>
          <label className={labelClasses}>Type d&apos;achat</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <button
              type="button"
              onClick={() => handleAvecStockChange(true)}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition-all duration-150 text-left flex items-center gap-2 ${
                avecStock
                  ? "bg-amber-500/15 text-amber-400 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              Achat de stock
            </button>
            <button
              type="button"
              onClick={() => handleAvecStockChange(false)}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition-all duration-150 text-left flex items-center gap-2 ${
                !avecStock
                  ? "bg-amber-500/15 text-amber-400 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
              </svg>
              Dépense sans stock
            </button>
          </div>
        </div>

        {/* ── Info : Dépense sans stock ────────────────────────── */}
        {!avecStock && (
          <div className="flex items-start gap-2.5 rounded-lg border border-neutral-800/60 bg-neutral-900/20 px-4 py-3">
            <svg className="h-4 w-4 text-neutral-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Cette dépense sera comptabilisée dans vos achats et votre TVA déductible, mais ne créera aucun article en stock.
            </p>
          </div>
        )}

        {/* ── Section Articles en stock (conditionnelle) ─────── */}
        {avecStock && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/40">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Articles en stock
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Ajoutez les produits qui doivent entrer dans votre stock.
              </p>
              <p className="text-[10px] text-neutral-700 mt-1 font-mono">
                Références : {form.date ? `${form.date.split("-")[0]}-0000001` : "AAAA-0000001"}, …
              </p>
              {erreurs["items"] && (
                <p className="text-red-400 text-[11px] mt-1">{erreurs["items"]}</p>
              )}
            </div>

            <button
              type="button"
              onClick={ajouterItem}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.97] transition-all duration-150"
            >
              Ajouter un article
            </button>
          </div>

          <div className="p-5 space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/80 bg-neutral-900/40">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Article #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => supprimerItem(item.id)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-neutral-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Supprimer cet article"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-[90px_1fr] gap-2">
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="9999"
                        value={item.quantite}
                        onChange={(e) =>
                          updateItem(item.id, "quantite", e.target.value)
                        }
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Qté"
                        className={`${inputClasses} ${
                          erreurs[`item-${item.id}-quantite`]
                            ? "border-red-500/50"
                            : ""
                        }`}
                      />
                      {erreurs[`item-${item.id}-quantite`] && (
                        <p className={erreurClasses}>
                          {erreurs[`item-${item.id}-quantite`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        value={item.nom}
                        onChange={(e) =>
                          updateItem(item.id, "nom", e.target.value)
                        }
                        placeholder="Nom de l'article"
                        maxLength={MAX_TEXT.articleNom}
                        className={`${inputClasses} ${
                          erreurs[`item-${item.id}-nom`]
                            ? "border-red-500/50"
                            : ""
                        }`}
                      />
                      {erreurs[`item-${item.id}-nom`] && (
                        <p className={erreurClasses}>
                          {erreurs[`item-${item.id}-nom`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <div className="inline-flex p-0.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, "modeMontant", "ht")}
                        className={`flex-1 rounded px-2 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                          item.modeMontant === "ht"
                            ? "bg-amber-500/15 text-amber-400"
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        HT
                      </button>

                      <button
                        type="button"
                        onClick={() => updateItem(item.id, "modeMontant", "ttc")}
                        className={`flex-1 rounded px-2 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                          item.modeMontant === "ttc"
                            ? "bg-amber-500/15 text-amber-400"
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        TTC
                      </button>
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="999999"
                        value={item.cout}
                        onChange={(e) =>
                          updateItem(item.id, "cout", e.target.value)
                        }
                        placeholder="0.00 €"
                        className={`${inputClasses} ${
                          erreurs[`item-${item.id}-cout`]
                            ? "border-red-500/50"
                            : ""
                        }`}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      {erreurs[`item-${item.id}-cout`] && (
                        <p className={erreurClasses}>
                          {erreurs[`item-${item.id}-cout`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(item.id, "notes", e.target.value)
                      }
                      placeholder="Notes (facultatif)"
                      maxLength={MAX_TEXT.notes}
                      className={`${inputClasses} resize-none ${
                        erreurs[`item-${item.id}-notes`]
                          ? "border-red-500/50"
                          : ""
                      }`}
                    />
                    {erreurs[`item-${item.id}-notes`] && (
                      <p className={erreurClasses}>
                        {erreurs[`item-${item.id}-notes`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {items.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden mt-2">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Total réparti
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {(modeMontant === "ht"
                      ? totalItems.ht
                      : totalItems.ttc
                    ).toLocaleString("fr-BE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>

                {(() => {
                  const montantReference =
                    modeMontant === "ht" ? prixHT : prixTTC;
                  const totalReference =
                    modeMontant === "ht" ? totalItems.ht : totalItems.ttc;
                  const ecart =
                    Math.round((montantReference - totalReference) * 100) / 100;
                  const presqueZero = Math.abs(ecart) < 0.01;

                  return (
                    <div
                      className={`flex items-center justify-between px-4 py-3 border-t border-neutral-800 ${
                        presqueZero
                          ? "bg-emerald-500/[0.03]"
                          : ecart > 0
                          ? "bg-amber-500/[0.03]"
                          : "bg-red-500/[0.03]"
                      }`}
                    >
                      <span className="text-xs text-neutral-500">
                        Écart vs montant total
                      </span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          presqueZero
                            ? "text-emerald-400"
                            : ecart > 0
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {presqueZero
                          ? "Équilibré"
                          : ecart.toLocaleString("fr-BE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClasses}>Mode de paiement</label>
            <select
              value={form.paiement}
              onChange={(e) => updateChamp("paiement", e.target.value)}
              className={inputClasses}
            >
   {paymentMethods.map((method) => (
  <option key={method} value={method}>
    {method}
  </option>
))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Facture / preuve</label>

            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                setDocumentFile(e.target.files?.[0] || null);

                if (erreurs.documentFile) {
                  setErreurs((prev) => {
                    const copy = { ...prev };
                    delete copy.documentFile;
                    return copy;
                  });
                }
              }}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-amber-400"
            />

            {documentFile && (
              <p className="text-xs text-neutral-500">{documentFile.name}</p>
            )}

            {!documentFile && isEditing && achatInitial?.documentUrl && (
              <p className="text-xs text-neutral-500">
                Document actuel conservé si aucun nouveau fichier n’est choisi.
              </p>
            )}

            {erreurs.documentFile && (
              <p className={erreurClasses}>{erreurs.documentFile}</p>
            )}
          </div>

<div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={form.saveSupplier}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          saveSupplier: e.target.checked,
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
        Enregistrer ce fournisseur dans les contacts
      </p>

      <p className="text-xs text-neutral-500 mt-0.5">
        Le fournisseur sera ajouté automatiquement dans l’onglet Contacts.
      </p>
    </div>
  </label>
</div>

          <div>
            <label className={labelClasses}>
              Commentaire{" "}
              <span className="text-neutral-700 normal-case tracking-normal ml-1">
                (facultatif)
              </span>
            </label>
            <textarea
              rows={2}
              placeholder="Notes..."
              value={form.commentaire}
              onChange={(e) => updateChamp("commentaire", e.target.value)}
              maxLength={MAX_TEXT.commentaire}
              className={`${inputClasses} resize-none ${
                erreurs.commentaire ? "border-red-500/50" : ""
              }`}
            />
            {erreurs.commentaire && (
              <p className={erreurClasses}>{erreurs.commentaire}</p>
            )}
          </div>
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
            {isEditing ? "Enregistrer" : "Ajouter l'achat"}
          </button>
        </div>
      </div>
    </Modal>
  );
}