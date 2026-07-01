"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { exportSalesToExcel } from "@/lib/exportSales";

import { canCreateLines } from "@/lib/subscriptions";
import { toast } from "sonner";

import {
  createSale,
  createSaleLines,
  deleteSale,
  deleteSaleLines,
  getAvailableStockItems,
  getSaleLines,
  getSales,
  updateSale,
} from "@/lib/sales";

import {
  applySaleStockMovements,
  checkStockAvailability,
  rollbackSaleStockMovements,
} from "@/lib/items";

import {
  AvailableStockItem,
  Sale,
  SaleFiltres,
  SaleLine,
  SaleLineInput,
  SalePaymentMethod,
  SaleVatMode,
} from "@/types/sale";

import { createClient } from "@/lib/supabase/client";

import VentesHeader from "@/components/ventes/VentesHeader";
import VentesFiltres from "@/components/ventes/VentesFiltres";
import VentesTableau from "@/components/ventes/VentesTableau";
import VenteFormModal from "@/components/ventes/VenteFormModal";

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

function formatDateFr(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function mapSaleLine(line: any): SaleLine {
  return {
    id: line.id,
    saleId: line.sale_id,
    companyId: line.company_id,
    createdAt: line.created_at,
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
  };
}

function mapSale(sale: any, saleLines: any[]): Sale {
  return {
    id: sale.id,
    date: sale.sale_date,
    numInterne: sale.id.slice(0, 8).toUpperCase(),
    customerName: sale.customer_name,
    contactId: sale.contact_id ?? null,
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
      .map(mapSaleLine),
  };
}

function buildSaleLineInsert(params: {
  saleId: string;
  companyId: string;
  vatMode: SaleVatMode;
  line: SaleLineInput;
}) {
  const { saleId, companyId, vatMode, line } = params;

  // When input is TTC (standard VAT + TTC mode), derive HT from the line TTC total
  // so that stored HT is correct and invoice/export re-computations are accurate.
  let unitPriceStored = line.unitPrice;
  let totalPriceStored: number;

  if (vatMode === "margin_vat") {
    totalPriceStored = line.unitPrice;
  } else if (line.isTTC) {
    const lineTTC = Math.round(line.unitPrice * line.quantity * 100) / 100;
    const lineHT =
      line.vatRate > 0
        ? Math.round((lineTTC / (1 + line.vatRate / 100)) * 100) / 100
        : lineTTC;
    totalPriceStored = lineHT;
    unitPriceStored =
      line.quantity > 0
        ? Math.round((lineHT / line.quantity) * 100) / 100
        : lineHT;
  } else {
    totalPriceStored = line.unitPrice * line.quantity;
  }

  return {
    sale_id: saleId,
    company_id: companyId,
    purchase_item_id: line.purchaseItemId,
    item_reference: line.itemReference,
    item_name: line.itemName,
    quantity: line.quantity,
    unit_price: unitPriceStored,
    total_price: totalPriceStored,
    purchase_cost: line.purchaseCost,
    margin_amount: line.marginAmount,
    vat_rate: line.vatRate,
    notes: line.notes,
  };
}

function VentesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemIdParam = searchParams.get("itemId");
  const itemIdHandledRef = useRef(false);

  const [ventes, setVentes] = useState<Sale[]>([]);
  const [stockItems, setStockItems] = useState<AvailableStockItem[]>([]);
  const [stockLoaded, setStockLoaded] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [venteEnEdition, setVenteEnEdition] = useState<Sale | null>(null);
  const [prefillItem, setPrefillItem] = useState<AvailableStockItem | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [filtres, setFiltres] = useState<SaleFiltres>({
    recherche: "",
    vatMode: "tous",
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
      .single();

    if (error || !membership) return null;

    return membership.company_id;
  };

  const refreshStock = async (companyId: string) => {
    const availableItems = await getAvailableStockItems(companyId);
    setStockItems(availableItems);
  };

  const refreshSales = async (companyId: string) => {
    const sales = await getSales(companyId);
    const saleIds = sales.map((sale: any) => sale.id);
    const saleLines = await getSaleLines(saleIds);

    const mappedSales = sales.map((sale: any) => mapSale(sale, saleLines));
    setVentes(mappedSales);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const companyId = await getCompanyId();
        if (!companyId) return;
        await refreshSales(companyId);
        await refreshStock(companyId);
        const { data: contacts } = await createClient()
          .from("contacts")
          .select("id, name")
          .eq("company_id", companyId)
          .eq("type", "client")
          .order("name");

        setClients(
          (contacts || []).map((c) => ({ id: c.id as string, name: c.name as string }))
        );
      } catch (error) {
        console.error(error);
      } finally {
        setStockLoaded(true);
      }
    }

    loadData();
  }, []);

  // Préselection d'un article depuis le stock / la fiche article via ?itemId=
  useEffect(() => {
    if (!stockLoaded) return;
    if (!itemIdParam) return;
    if (itemIdHandledRef.current) return;
    itemIdHandledRef.current = true;

    const item = stockItems.find((stockItem) => stockItem.id === itemIdParam);

    router.replace("/ventes");

    if (item) {
      // Ouverture ponctuelle de la modale suite à ?itemId=, gardée par
      // itemIdHandledRef (ne s'exécute qu'une fois) : pas une synchronisation
      // d'état dérivé, donc pas de cascade de rendus à éviter ici.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefillItem(item);
      setVenteEnEdition(null);
      setModalOuverte(true);
    } else {
      toast.error("Article introuvable ou indisponible à la vente.");
    }
  }, [stockLoaded, itemIdParam, stockItems, router]);

  const ventesFiltrees = useMemo(() => {
    return ventes.filter((vente) => {
      if (filtres.recherche) {
        const q = filtres.recherche.toLowerCase();

        const champs = [
          vente.customerName,
          vente.notes || "",
          vente.numInterne,
          ...(vente.lines?.map(
            (line) => `${line.itemReference || ""} ${line.itemName}`
          ) || []),
        ]
          .join(" ")
          .toLowerCase();

        if (!champs.includes(q)) return false;
      }

      if (filtres.vatMode !== "tous" && vente.vatMode !== filtres.vatMode) {
        return false;
      }

      if (filtres.dateDebut && vente.date < filtres.dateDebut) return false;
      if (filtres.dateFin && vente.date > filtres.dateFin) return false;

      return true;
    });
  }, [ventes, filtres]);

  const totalMontant = useMemo(() => {
    return ventesFiltrees.reduce((sum, vente) => sum + vente.totalTTC, 0);
  }, [ventesFiltrees]);

  const ouvrirConfirmationExport = () => {
    setExportConfirmOpen(true);
  };

  const confirmerExportVentes = async () => {
    if (exportingExcel) return;

    setExportingExcel(true);
    try {
      await exportSalesToExcel(ventesFiltrees);
      setExportConfirmOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export Excel des ventes.");
    } finally {
      setExportingExcel(false);
    }
  };

  const ouvrirAjout = () => {
    setVenteEnEdition(null);
    setModalOuverte(true);
  };

  const ouvrirEdition = (vente: Sale) => {
    setVenteEnEdition(vente);
    setModalOuverte(true);
  };

  const fermerModal = () => {
    setModalOuverte(false);
    setVenteEnEdition(null);
    setPrefillItem(null);
  };

  const ajouterVente = async (vente: VentePayload) => {
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

      const stockCheck = await checkStockAvailability(vente.lines);
      if (!stockCheck.ok) {
        if (stockCheck.errors.length === 1) {
          toast.error(
            `Stock insuffisant pour cet article. Quantité disponible : ${stockCheck.errors[0].available}.`
          );
        } else {
          toast.error("Stock insuffisant pour un ou plusieurs articles sélectionnés.");
        }
        return;
      }

      const supabase = createClient();

      // Résolution du contact_id : priorité au saveClient, sinon contactId déjà connu
      let resolvedContactId: string | null = vente.contactId ?? null;

      if (vente.saveClient) {
        const { data: existingClient, error: existingClientError } = await supabase
          .from("contacts")
          .select("id")
          .eq("company_id", companyId)
          .eq("type", "client")
          .ilike("name", vente.customerName)
          .maybeSingle();

        if (existingClientError) {
          console.error("Erreur lors de la recherche du contact client :", existingClientError);
          toast.error(
            "Impossible d’enregistrer le client associé à cette vente. La vente n’a pas été créée."
          );
          return;
        }

        if (existingClient) {
          resolvedContactId = existingClient.id;
        } else {
          const { data: newContact, error: newContactError } = await supabase
            .from("contacts")
            .insert({ company_id: companyId, type: "client", name: vente.customerName })
            .select("id")
            .single();

          if (newContactError || !newContact) {
            console.error("Erreur lors de la création du contact client :", newContactError);
            toast.error(
              "Impossible d’enregistrer le client associé à cette vente. La vente n’a pas été créée."
            );
            return;
          }

          resolvedContactId = newContact.id;
        }
      }

      // Création de la vente : toute la suite doit réussir intégralement,
      // sinon la vente, ses lignes et le mouvement de stock sont annulés
      // en best-effort.
      let createdSale: any = null;
      let saleLinesCreated = false;
      let stockApplied = false;

      try {
        createdSale = await createSale({
          company_id: companyId,
          sale_date: vente.date,
          customer_name: vente.customerName,
          vat_mode: vente.vatMode,
          payment_method: vente.paymentMethod,
          subtotal_ht: vente.subtotalHT,
          vat_amount: vente.vatAmount,
          total_ttc: vente.totalTTC,
          margin_amount: vente.marginAmount,
          notes: vente.notes,
          contact_id: resolvedContactId,
        });

        await createSaleLines(
          vente.lines.map((line) =>
            buildSaleLineInsert({
              saleId: createdSale.id,
              companyId,
              vatMode: vente.vatMode,
              line,
            })
          )
        );
        saleLinesCreated = true;

        await applySaleStockMovements(vente.lines);
        stockApplied = true;

        const { error: usageError } = await supabase
          .from("usage_events")
          .insert({
            company_id: companyId,
            source_type: "sale",
            source_id: createdSale.id,
            lines_used: 1,
          });

        if (usageError) {
          throw usageError;
        }
      } catch (innerError) {
        console.error(
          "Échec de la création complète de la vente, annulation en cours :",
          innerError
        );

        if (stockApplied) {
          try {
            await rollbackSaleStockMovements(vente.lines);
          } catch (rollbackError) {
            console.error(
              "Échec de l'annulation du mouvement de stock après échec de création de vente :",
              rollbackError
            );
          }
        }

        if (createdSale) {
          if (saleLinesCreated) {
            try {
              await deleteSaleLines(createdSale.id);
            } catch (rollbackError) {
              console.error(
                "Échec de la suppression des lignes de vente après échec de création :",
                rollbackError
              );
            }
          }

          try {
            await deleteSale(createdSale.id);
          } catch (rollbackError) {
            console.error(
              "Échec de la suppression de la vente après échec de création :",
              rollbackError
            );
          }
        }

        throw Object.assign(
          new Error(
            "Impossible d’enregistrer complètement la vente. Aucune vente n’a été créée."
          ),
          { isSaleCreationError: true }
        );
      }

      await refreshSales(companyId);
      await refreshStock(companyId);

      fermerModal();
    } catch (error: any) {
      console.error(error);
      if (error?.isSaleCreationError) {
        toast.error(error.message);
      } else {
        toast.error("Une erreur est survenue lors de la création de la vente.");
      }
    }
  };

  const modifierVente = async (vente: VentePayload) => {
    if (!venteEnEdition) return;

    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const oldLines = venteEnEdition.lines || [];

      const stockCheck = await checkStockAvailability(vente.lines, oldLines);
      if (!stockCheck.ok) {
        if (stockCheck.errors.length === 1) {
          toast.error(
            `Stock insuffisant pour cet article. Quantité disponible : ${stockCheck.errors[0].available}.`
          );
        } else {
          toast.error("Stock insuffisant pour un ou plusieurs articles sélectionnés.");
        }
        return;
      }

      const previousSalePayload = {
        sale_date: venteEnEdition.date,
        customer_name: venteEnEdition.customerName,
        vat_mode: venteEnEdition.vatMode,
        payment_method: venteEnEdition.paymentMethod,
        subtotal_ht: venteEnEdition.subtotalHT,
        vat_amount: venteEnEdition.vatAmount,
        total_ttc: venteEnEdition.totalTTC,
        margin_amount: venteEnEdition.marginAmount,
        notes: venteEnEdition.notes,
        contact_id: venteEnEdition.contactId ?? null,
      };

      // Modification de la vente : si une étape échoue, on restaure l'état
      // précédent (stock, lignes, champs de la vente) en best-effort.
      let stockRolledBack = false;
      let saleUpdated = false;
      let oldLinesDeleted = false;
      let stockApplied = false;

      try {
        await rollbackSaleStockMovements(oldLines);
        stockRolledBack = true;

        await updateSale(venteEnEdition.id, {
          sale_date: vente.date,
          customer_name: vente.customerName,
          vat_mode: vente.vatMode,
          payment_method: vente.paymentMethod,
          subtotal_ht: vente.subtotalHT,
          vat_amount: vente.vatAmount,
          total_ttc: vente.totalTTC,
          margin_amount: vente.marginAmount,
          notes: vente.notes,
          contact_id: vente.contactId ?? null,
        });
        saleUpdated = true;

        await deleteSaleLines(venteEnEdition.id);
        oldLinesDeleted = true;

        await createSaleLines(
          vente.lines.map((line) =>
            buildSaleLineInsert({
              saleId: venteEnEdition.id,
              companyId,
              vatMode: vente.vatMode,
              line,
            })
          )
        );

        await applySaleStockMovements(vente.lines);
        stockApplied = true;
      } catch (innerError) {
        console.error(
          "Échec de la modification de la vente, restauration de l'état précédent :",
          innerError
        );

        if (stockApplied) {
          try {
            await rollbackSaleStockMovements(vente.lines);
          } catch (rollbackError) {
            console.error(
              "Échec de l'annulation du nouveau mouvement de stock :",
              rollbackError
            );
          }
        }

        if (oldLinesDeleted) {
          try {
            await createSaleLines(
              oldLines.map((line) => ({
                sale_id: venteEnEdition.id,
                company_id: companyId,
                purchase_item_id: line.purchaseItemId,
                item_reference: line.itemReference,
                item_name: line.itemName,
                quantity: line.quantity,
                unit_price: line.unitPrice,
                total_price: line.totalPrice,
                purchase_cost: line.purchaseCost,
                margin_amount: line.marginAmount,
                vat_rate: line.vatRate,
                notes: line.notes,
              }))
            );
          } catch (rollbackError) {
            console.error(
              "Échec de la restauration des anciennes lignes de vente :",
              rollbackError
            );
          }
        }

        if (saleUpdated) {
          try {
            await updateSale(venteEnEdition.id, previousSalePayload);
          } catch (rollbackError) {
            console.error(
              "Échec de la restauration des champs de la vente :",
              rollbackError
            );
          }
        }

        if (stockRolledBack) {
          try {
            await applySaleStockMovements(oldLines);
          } catch (rollbackError) {
            console.error(
              "Échec de la restauration du stock initial :",
              rollbackError
            );
          }
        }

        throw Object.assign(
          new Error(
            "Impossible de modifier la vente. Les données précédentes ont été restaurées autant que possible."
          ),
          { isSaleUpdateError: true }
        );
      }

      await refreshSales(companyId);
      await refreshStock(companyId);

      fermerModal();
    } catch (error: any) {
      console.error(error);
      if (error?.isSaleUpdateError) {
        toast.error(error.message);
      } else {
        toast.error("Une erreur est survenue lors de la modification de la vente.");
      }
    }
  };

  const supprimerVente = async (id: string) => {
    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const venteASupprimer = ventes.find((vente) => vente.id === id);

      await rollbackSaleStockMovements(venteASupprimer?.lines || []);
      await deleteSale(id);

      await refreshSales(companyId);
      await refreshStock(companyId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-[1440px]">
      <VentesHeader
        totalVentes={ventesFiltrees.length}
        totalMontant={totalMontant}
        onAjouter={ouvrirAjout}
      />

      {ventes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800/60 bg-zinc-900/40 shadow-sm shadow-black/20 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/60 mb-5">
            <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Aucune vente enregistrée</h3>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-6">
            Enregistrez votre première vente pour commencer à suivre vos marges et votre chiffre d'affaires.
          </p>
          <button
            type="button"
            onClick={ouvrirAjout}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter une vente
          </button>
        </div>
      ) : (
        <>
          <VentesFiltres
            filtres={filtres}
            onChangeFiltres={setFiltres}
            onExporter={ouvrirConfirmationExport}
            exportDisabled={ventesFiltrees.length === 0}
          />
          <VentesTableau
            ventes={ventesFiltrees}
            onModifier={ouvrirEdition}
            onSupprimer={supprimerVente}
          />
        </>
      )}

      <VenteFormModal
        ouvert={modalOuverte}
        onFermer={fermerModal}
        onAjouter={ajouterVente}
        onModifier={modifierVente}
        venteInitiale={venteEnEdition}
stockItems={stockItems}
clients={clients}
prefillItem={prefillItem}
      />

      {exportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-zinc-950 shadow-2xl shadow-amber-500/10 overflow-hidden">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

            <div className="p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </span>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Exporter en Excel
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Souhaitez-vous générer un fichier Excel qui reprend vos ventes{" "}
                    {filtres.dateDebut && filtres.dateFin ? (
                      <>
                        pour la période du{" "}
                        <span className="font-semibold text-amber-400">
                          {formatDateFr(filtres.dateDebut)}
                        </span>{" "}
                        au{" "}
                        <span className="font-semibold text-amber-400">
                          {formatDateFr(filtres.dateFin)}
                        </span>
                      </>
                    ) : (
                      "pour la période sélectionnée"
                    )}{" "}
                    ?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExportConfirmOpen(false)}
                  disabled={exportingExcel}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={confirmerExportVentes}
                  disabled={exportingExcel}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/20"
                >
                  {exportingExcel ? "Génération..." : "Générer le fichier Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VentesPage() {
  return (
    <Suspense fallback={null}>
      <VentesContent />
    </Suspense>
  );
}