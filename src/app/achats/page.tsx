"use client";

import { useEffect, useMemo, useState } from "react";
import { Achat, AchatFiltres } from "@/types/achat";
import { ItemStatus, isItemStatus } from "@/types/item";
import { createClient } from "@/lib/supabase/client";
import { exportPurchasesToExcel } from "@/lib/exportPurchases";
import { canCreateLines } from "@/lib/subscriptions";
import { toast } from "sonner";

import {
  createPurchase,
  createPurchaseItems,
  deletePurchase,
  deletePurchaseItems,
  getPurchaseItems,
  getPurchases,
  updatePurchase,
  uploadPurchaseDocument,
} from "@/lib/purchases";

import AchatsHeader from "@/components/achats/AchatsHeader";
import AchatsFiltres from "@/components/achats/AchatsFiltres";
import AchatsTableau from "@/components/achats/AchatsTableau";
import AchatFormModal from "@/components/achats/AchatFormModal";

function mapPurchase(p: any, itemsByPurchaseId: Map<string, any[]>): Achat {
  const articles = (itemsByPurchaseId.get(p.id) || []).map((item: any) => ({
    id: item.id,
    reference: item.item_reference,
    nom: item.item_name,
    quantite: Number(item.quantity),
    stockRestant: Number(item.stock_quantity ?? item.quantity),
    coutHT: Number(item.unit_cost),
    coutTTC:
      item.total_cost !== null && item.quantity
        ? Number(item.total_cost) / Number(item.quantity)
        : undefined,
    statut: isItemStatus(item.status) ? item.status : "in_stock",
    notes: item.notes || undefined,
  }));

  return {
    id: p.id,
    date: p.purchase_date,
    numInterne: p.id.slice(0, 8).toUpperCase(),
    fournisseur: p.supplier,
    produit: p.product,
    type: p.purchase_type as Achat["type"],
    prixHT: Number(p.amount_ht),
    prixTVA: Number(p.vat_amount),
    prixTTC: Number(p.amount_ttc),
    vatRate: Number(p.vat_rate ?? 0),
    paiement: (p.payment_method as Achat["paiement"]) || "Virement",
    numFacture: "",
    commentaire: p.comment || undefined,
    documentUrl: p.document_url || undefined,
    articles,
    avecStock: articles.length > 0,
  };
}

function calcVatRate(achat: Achat): number {
  if (achat.prixHT <= 0) return 0;
  return Number(((achat.prixTVA / achat.prixHT) * 100).toFixed(2));
}

function buildPurchaseItems(params: {
  achat: Achat;
  purchaseId: string;
  companyId: string;
}) {
  const { achat, purchaseId, companyId } = params;
  const vatRate = calcVatRate(achat);
  const vatMultiplier = 1 + vatRate / 100;

  const itemsToCreate =
    achat.items && achat.items.length > 0
      ? achat.items
      : [
          {
            nom: achat.produit,
            cout: achat.prixTTC,
            quantite: 1,
            modeMontant: "ttc" as const,
            notes: "",
          },
        ];

  return itemsToCreate.map((item) => {
    const quantity = Number(item.quantite) || 1;

    let unitCostHT = item.cout;
    let unitCostTTC = item.cout;

    if (item.modeMontant === "ttc") {
      unitCostHT = vatMultiplier > 0 ? item.cout / vatMultiplier : item.cout;
      unitCostTTC = item.cout;
    } else {
      unitCostHT = item.cout;
      unitCostTTC = item.cout * vatMultiplier;
    }

    unitCostHT = Math.round(unitCostHT * 100) / 100;
    unitCostTTC = Math.round(unitCostTTC * 100) / 100;

    return {
      purchase_document_id: purchaseId,
      company_id: companyId,
      item_name: item.nom,
      category: achat.produit,
      quantity,
      stock_quantity: quantity,
      unit_cost: unitCostHT,
      total_cost: Math.round(unitCostTTC * quantity * 100) / 100,
      vat_type: achat.type,
      vat_rate: vatRate,
      margin_eligible: achat.type === "particulier",
      status: "in_stock" as ItemStatus,
      notes: item.notes || "",
    };
  });
}

export default function AchatsPage() {
  const [achats, setAchats] = useState<Achat[]>([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [achatEnEdition, setAchatEnEdition] = useState<Achat | null>(null);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  const [filtres, setFiltres] = useState<AchatFiltres>({
    recherche: "",
    type: "tous",
    dateDebut: "",
    dateFin: "",
  });

  const getCompanyId = async (): Promise<string | null> => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: membership, error } = await supabase
      .from("memberships")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !membership) return null;

    return membership.company_id;
  };

  const refreshPurchases = async (companyId: string) => {
    const { data: contacts } = await createClient()
  .from("contacts")
  .select("name")
  .eq("company_id", companyId)
  .eq("type", "supplier");

setSuppliers(
  [...new Set((contacts || []).map((c) => c.name))]
);
    const purchases = await getPurchases(companyId);
    const purchaseIds = purchases.map((p: any) => p.id);
    const purchaseItems = await getPurchaseItems(purchaseIds);

    const itemsByPurchaseId = new Map<string, any[]>();

    purchaseItems.forEach((item: any) => {
      const pid = item.purchase_document_id;
      if (!itemsByPurchaseId.has(pid)) itemsByPurchaseId.set(pid, []);
      itemsByPurchaseId.get(pid)?.push(item);
    });

    setAchats(purchases.map((p: any) => mapPurchase(p, itemsByPurchaseId)));
  };

  useEffect(() => {
    async function loadPurchases() {
      try {
        const companyId = await getCompanyId();
        if (!companyId) return;
        await refreshPurchases(companyId);
      } catch (error) {
        console.error(error);
        toast.error("Erreur lors du chargement des achats.");
      }
    }

    loadPurchases();
  }, []);

  const achatsFiltres = useMemo(() => {
    return achats.filter((achat) => {
      if (filtres.recherche) {
        const q = filtres.recherche.toLowerCase();

        const champs = [
          achat.fournisseur,
          achat.produit,
          achat.commentaire || "",
          achat.numInterne,
          ...(achat.articles?.map(
            (a) => `${a.reference} ${a.nom}`
          ) || []),
        ]
          .join(" ")
          .toLowerCase();

        if (!champs.includes(q)) return false;
      }

      if (filtres.type !== "tous" && achat.type !== filtres.type) {
        return false;
      }

      if (filtres.dateDebut && achat.date < filtres.dateDebut) return false;
      if (filtres.dateFin && achat.date > filtres.dateFin) return false;

      return true;
    });
  }, [filtres, achats]);

  const totalMontant = useMemo(() => {
    return achatsFiltres.reduce((sum, a) => sum + a.prixTTC, 0);
  }, [achatsFiltres]);

  const exporterAchats = async () => {
  try {
    await exportPurchasesToExcel(achatsFiltres);
  } catch (error) {
    console.error(error);
    toast.error("Erreur lors de l'export Excel des achats.");
  }
};

  const ouvrirAjout = () => {
    setAchatEnEdition(null);
    setModalOuverte(true);
  };

  const ouvrirEdition = (achat: Achat) => {
    setAchatEnEdition(achat);
    setModalOuverte(true);
  };

  const fermerModal = () => {
    setModalOuverte(false);
    setAchatEnEdition(null);
  };

  const ajouterAchat = async (nouvelAchat: Achat) => {
    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

const usageCheck = await canCreateLines({
  companyId,
  linesToCreate: 1,
});

if (!usageCheck.allowed) {
toast.error(
  `Limite mensuelle atteinte (${usageCheck.used}/${usageCheck.limit}).`
);
  return;
}

      const supabase = createClient();

      if (nouvelAchat.saveSupplier) {
  const { data: existingSupplier } = await supabase
    .from("contacts")
    .select("id")
    .eq("company_id", companyId)
    .eq("type", "supplier")
    .ilike("name", nouvelAchat.fournisseur)
    .maybeSingle();

  if (!existingSupplier) {
    await supabase.from("contacts").insert({
      company_id: companyId,
      type: "supplier",
      name: nouvelAchat.fournisseur,
    });
  }
}

      const created = await createPurchase({
        company_id: companyId,
        purchase_date: nouvelAchat.date,
        supplier: nouvelAchat.fournisseur,
        product: nouvelAchat.produit,
        purchase_type: nouvelAchat.type,
        payment_method: nouvelAchat.paiement,
        amount_ht: nouvelAchat.prixHT,
        vat_rate: calcVatRate(nouvelAchat),
        vat_amount: nouvelAchat.prixTVA,
        amount_ttc: nouvelAchat.prixTTC,
        comment: nouvelAchat.commentaire,
      });

      let documentPath: string | undefined = undefined;

      if (nouvelAchat.documentFile) {
        documentPath = await uploadPurchaseDocument(
          nouvelAchat.documentFile,
          created.id
        );

        await supabase
          .from("purchases")
          .update({ document_url: documentPath })
          .eq("id", created.id);
      }

      // Achat de stock : créer les purchase_items avec référence YYYY-XXXXXXX
      if (nouvelAchat.avecStock !== false) {
        const purchaseYear = nouvelAchat.date.split("-")[0];

        // Compter les items existants avec le nouveau format pour cette année
        const { count: existingYearCount } = await supabase
          .from("purchase_items")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .like("item_reference", `${purchaseYear}-%`);

        const startRef = (existingYearCount ?? 0) + 1;

        const baseItems = buildPurchaseItems({
          achat: nouvelAchat,
          purchaseId: created.id,
          companyId,
        });

        const createdItems = await createPurchaseItems(baseItems);

        // Mettre à jour les références avec le format YYYY-XXXXXXX
        // (le trigger DB peut avoir généré un format PKM-..., on le remplace)
        await Promise.all(
          createdItems.map((item: any, i: number) =>
            supabase
              .from("purchase_items")
              .update({
                item_reference: `${purchaseYear}-${String(startRef + i).padStart(7, "0")}`,
              })
              .eq("id", item.id)
          )
        );
      }

      const { error: usageError } = await supabase
  .from("usage_events")
  .insert({
    company_id: companyId,
    source_type: "purchase",
    source_id: created.id,
    lines_used: 1,
  });

if (usageError) {
  throw usageError;
}

      await refreshPurchases(companyId);
      fermerModal();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la création de l'achat.");
    }
  };

const modifierAchat = async (achatModifie: Achat) => {
  if (!achatEnEdition) return;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return;

    let documentPath = achatEnEdition.documentUrl;

    if (achatModifie.documentFile) {
      documentPath = await uploadPurchaseDocument(
        achatModifie.documentFile,
        achatEnEdition.id
      );
    }

    await updatePurchase(achatEnEdition.id, {
      purchase_date: achatModifie.date,
      supplier: achatModifie.fournisseur,
      product: achatModifie.produit,
      purchase_type: achatModifie.type,
      payment_method: achatModifie.paiement,
      amount_ht: achatModifie.prixHT,
      vat_rate: calcVatRate(achatModifie),
      vat_amount: achatModifie.prixTVA,
      amount_ttc: achatModifie.prixTTC,
      comment: achatModifie.commentaire,
      document_url: documentPath,
    });

    for (const item of achatModifie.items || []) {
      if (!item.id) continue;

      const oldArticle = achatEnEdition.articles?.find(
        (article) => article.id === item.id
      );

      if (!oldArticle) continue;

      const oldQuantity = oldArticle.quantite;
      const oldStock = oldArticle.stockRestant;
      const alreadySold = Math.max(0, oldQuantity - oldStock);

      const newQuantity = item.quantite;
      const newStock = Math.max(0, newQuantity - alreadySold);

      const vatRate = calcVatRate(achatModifie);
      const vatMultiplier = 1 + vatRate / 100;

      let unitCostHT = item.cout;
      let unitCostTTC = item.cout;

      if (item.modeMontant === "ttc") {
        unitCostHT = vatMultiplier > 0 ? item.cout / vatMultiplier : item.cout;
        unitCostTTC = item.cout;
      } else {
        unitCostHT = item.cout;
        unitCostTTC = item.cout * vatMultiplier;
      }

      unitCostHT = Math.round(unitCostHT * 100) / 100;
      unitCostTTC = Math.round(unitCostTTC * 100) / 100;

      const { error } = await createClient()
        .from("purchase_items")
        .update({
          item_name: item.nom,
          category: achatModifie.produit,
          quantity: newQuantity,
          stock_quantity: newStock,
          unit_cost: unitCostHT,
          total_cost: Math.round(unitCostTTC * newQuantity * 100) / 100,
          vat_type: achatModifie.type,
          vat_rate: vatRate,
          margin_eligible: achatModifie.type === "particulier",
          status: newStock <= 0 ? "sold" : "in_stock",
          notes: item.notes || "",
        })
        .eq("id", item.id);

      if (error) throw error;

      const { error: saleLineUpdateError } = await createClient()
        .from("sale_lines")
        .update({
          item_name: item.nom,
          item_reference: oldArticle.reference,
          purchase_cost: unitCostTTC,
        })
        .eq("purchase_item_id", item.id);

      if (saleLineUpdateError) throw saleLineUpdateError;
    }

    await refreshPurchases(companyId);
    fermerModal();
  } catch (error) {
    console.error(error);
  }
};



  const supprimerAchat = async (id: string) => {
    try {
      const confirmed = window.confirm(
        "Supprimer cet achat ? Les articles liés seront supprimés si la base autorise la cascade."
      );

      if (!confirmed) return;

      const companyId = await getCompanyId();

      await deletePurchase(id);

      if (companyId) {
        await refreshPurchases(companyId);
      } else {
        setAchats((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-[1440px]">
      <AchatsHeader
        totalAchats={achatsFiltres.length}
        totalMontant={totalMontant}
        onAjouter={ouvrirAjout}
      />

   <div className="flex justify-end">
    <button
      type="button"
      onClick={exporterAchats}
      disabled={achatsFiltres.length === 0}
      className="
        rounded-lg border border-amber-500/30
        bg-amber-500/10 px-4 py-2
        text-sm font-semibold text-amber-400
        hover:bg-amber-500/15
        disabled:cursor-not-allowed disabled:opacity-40
        transition-colors
      "
    >
      Exporter les achats Excel
    </button>
  </div>

      {achats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-900/30 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 mb-5">
            <svg className="h-7 w-7 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Aucun achat enregistré</h3>
          <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-6">
            Commencez par enregistrer votre premier achat. Tous vos achats PRO et particuliers seront centralisés ici.
          </p>
          <button
            type="button"
            onClick={ouvrirAjout}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un achat
          </button>
        </div>
      ) : (
        <>
          <AchatsFiltres filtres={filtres} onChangeFiltres={setFiltres} />
          <AchatsTableau
            achats={achatsFiltres}
            onModifier={ouvrirEdition}
            onSupprimer={supprimerAchat}
          />
        </>
      )}

      <AchatFormModal
        ouvert={modalOuverte}
        onFermer={fermerModal}
        onAjouter={ajouterAchat}
        onModifier={modifierAchat}
        achatInitial={achatEnEdition}
          suppliers={suppliers}

      />
    </div>
  );
}