"use client";

import { useEffect, useMemo, useState } from "react";
import { Achat, AchatFiltres, AchatItemInput } from "@/types/achat";
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
    supplierContactId: p.supplier_contact_id ?? null,
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
  purchaseYear: string;
  startRef: number;
}) {
  const { achat, purchaseId, companyId, purchaseYear, startRef } = params;
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

  return itemsToCreate.map((item, index) => {
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
      item_reference: `${purchaseYear}-${String(startRef + index).padStart(7, "0")}`,
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

// Calcule le prochain numéro de référence YYYY-XXXXXXX en se basant sur le
// maximum existant pour cette entreprise et cette année. La génération est
// scopée par company_id : la contrainte d'unicité doit être (company_id,
// item_reference), pas globale sur item_reference seul (sinon le calcul
// effectué depuis le client, soumis aux RLS, ne voit jamais les références
// des autres entreprises et entre en collision avec elles).
async function getNextItemReferenceStart(
  companyId: string,
  purchaseYear: string
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("purchase_items")
    .select("item_reference")
    .eq("company_id", companyId)
    .like("item_reference", `${purchaseYear}-%`)
    .order("item_reference", { ascending: false })
    .limit(1);

  if (error) throw error;

  const lastRef = data?.[0]?.item_reference as string | undefined;
  if (!lastRef) return 1;

  const lastNumber = parseInt(lastRef.split("-")[1], 10);
  return Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
}

// Crée les purchase_items en générant des références YYYY-XXXXXXX uniques
// pour cette entreprise. En cas de collision (concurrence), on recalcule la
// prochaine référence et on réessaie.
async function createPurchaseItemsWithRetry(params: {
  achat: Achat;
  purchaseId: string;
  companyId: string;
  purchaseYear: string;
}) {
  const { achat, purchaseId, companyId, purchaseYear } = params;

  for (let attempt = 0; attempt < 3; attempt++) {
    const startRef = await getNextItemReferenceStart(companyId, purchaseYear);

    const itemsToCreate = buildPurchaseItems({
      achat,
      purchaseId,
      companyId,
      purchaseYear,
      startRef,
    });

    try {
      const createdItems = await createPurchaseItems(itemsToCreate);

      // Un achat de stock doit obligatoirement repartir avec ses articles
      if (createdItems.length !== itemsToCreate.length) {
        throw new Error(
          "Les articles de l'achat n'ont pas tous été enregistrés en stock."
        );
      }

      // Sécurité : une référence d'article ne doit jamais commencer par "PKM-"
      const invalidItem = createdItems.find((item: any) =>
        String(item.item_reference || "").startsWith("PKM-")
      );

      if (invalidItem) {
        throw new Error(
          `Référence invalide générée pour l'article "${invalidItem.item_name}".`
        );
      }

      return createdItems;
    } catch (error: any) {
      const isRefCollision =
        error?.code === "23505" &&
        String(error?.message || "").includes("item_reference");

      if (isRefCollision && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Impossible de générer une référence d'article unique.");
}

export default function AchatsPage() {
  const [achats, setAchats] = useState<Achat[]>([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [achatEnEdition, setAchatEnEdition] = useState<Achat | null>(null);
  const [supplierContacts, setSupplierContacts] = useState<Array<{ id: string; name: string }>>([]);

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
      .select("id, name")
      .eq("company_id", companyId)
      .eq("type", "supplier")
      .order("name", { ascending: true });

    setSupplierContacts(contacts ?? []);
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

      let resolvedSupplierContactId: string | null =
        nouvelAchat.supplierContactId ?? null;

      if (!resolvedSupplierContactId && nouvelAchat.saveSupplier) {
        const { data: newContact } = await supabase
          .from("contacts")
          .insert({
            company_id: companyId,
            type: "supplier",
            name: nouvelAchat.fournisseur,
          })
          .select("id")
          .single();

        if (newContact) {
          resolvedSupplierContactId = newContact.id;
        }
      }

      const created = await createPurchase({
        company_id: companyId,
        purchase_date: nouvelAchat.date,
        supplier: nouvelAchat.fournisseur,
        supplier_contact_id: resolvedSupplierContactId,
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

      try {
        if (nouvelAchat.documentFile) {
          documentPath = await uploadPurchaseDocument(
            nouvelAchat.documentFile,
            created.id
          );

          const { error: docError } = await supabase
            .from("purchases")
            .update({ document_url: documentPath })
            .eq("id", created.id);

          if (docError) throw docError;
        }

        // Achat de stock : créer les purchase_items avec référence YYYY-XXXXXXX
        if (nouvelAchat.avecStock !== false) {
          const purchaseYear = nouvelAchat.date.split("-")[0];

          await createPurchaseItemsWithRetry({
            achat: nouvelAchat,
            purchaseId: created.id,
            companyId,
            purchaseYear,
          });
        }
      } catch (itemError: any) {
        // Rollback best-effort : éviter un achat "fantôme" sans ses articles de stock
        await deletePurchase(created.id).catch(() => {});
        itemError.isStockItemError = true;
        throw itemError;
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
    } catch (error: any) {
      console.error(error);
      if (error?.isStockItemError) {
        toast.error(
          "Impossible d'enregistrer les articles de stock. Aucun achat n'a été créé. Réessayez ou contactez le support."
        );
      } else {
        toast.error("Une erreur est survenue lors de la création de l'achat.");
      }
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

    let resolvedSupplierContactIdEdit: string | null =
      achatModifie.supplierContactId ?? null;

    if (!resolvedSupplierContactIdEdit && achatModifie.saveSupplier && companyId) {
      const { data: newContact } = await createClient()
        .from("contacts")
        .insert({
          company_id: companyId,
          type: "supplier",
          name: achatModifie.fournisseur,
        })
        .select("id")
        .single();

      if (newContact) {
        resolvedSupplierContactIdEdit = newContact.id;
      }
    }

    await updatePurchase(achatEnEdition.id, {
      purchase_date: achatModifie.date,
      supplier: achatModifie.fournisseur,
      supplier_contact_id: resolvedSupplierContactIdEdit,
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

    // Sépare les articles déjà existants (à mettre à jour) des nouveaux
    // articles ajoutés pendant la modification (à créer en base).
    const existingItems: AchatItemInput[] = [];
    const newItems: AchatItemInput[] = [];

    for (const item of achatModifie.items || []) {
      const oldArticle = item.id
        ? achatEnEdition.articles?.find((article) => article.id === item.id)
        : undefined;

      if (oldArticle) {
        existingItems.push(item);
      } else {
        newItems.push(item);
      }
    }

    for (const item of existingItems) {
      const oldArticle = achatEnEdition.articles!.find(
        (article) => article.id === item.id
      )!;

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

    // Articles ajoutés pendant la modification : ils n'existent pas encore
    // en base, il faut les créer comme à la création d'un achat de stock.
    if (achatModifie.avecStock !== false && newItems.length > 0) {
      const purchaseYear = achatModifie.date.split("-")[0];

      try {
        await createPurchaseItemsWithRetry({
          achat: { ...achatModifie, items: newItems },
          purchaseId: achatEnEdition.id,
          companyId,
          purchaseYear,
        });
      } catch (itemError: any) {
        itemError.isStockItemError = true;
        throw itemError;
      }
    }

    await refreshPurchases(companyId);
    fermerModal();
  } catch (error: any) {
    console.error(error);
    if (error?.isStockItemError) {
      toast.error(
        "Impossible d'enregistrer les nouveaux articles de stock. Réessayez ou contactez le support."
      );
    } else {
      toast.error("Une erreur est survenue lors de la modification de l'achat.");
    }
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

      {achats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800/60 bg-zinc-900/40 shadow-sm shadow-black/20 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/60 mb-5">
            <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Aucun achat enregistré</h3>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-6">
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
          <AchatsFiltres
            filtres={filtres}
            onChangeFiltres={setFiltres}
            onExporter={exporterAchats}
            exportDisabled={achatsFiltres.length === 0}
          />
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
        supplierContacts={supplierContacts}
      />
    </div>
  );
}