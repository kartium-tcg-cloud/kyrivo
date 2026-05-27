"use client";

import { useEffect, useMemo, useState } from "react";

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
    vatMode: sale.vat_mode,
    paymentMethod: sale.payment_method || "Virement",
    subtotalHT: Number(sale.subtotal_ht),
    vatAmount: Number(sale.vat_amount),
    totalTTC: Number(sale.total_ttc),
    marginAmount: Number(sale.margin_amount || 0),
    notes: sale.notes || undefined,
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

  return {
    sale_id: saleId,
    company_id: companyId,
    purchase_item_id: line.purchaseItemId,
    item_reference: line.itemReference,
    item_name: line.itemName,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    total_price:
      vatMode === "margin_vat"
        ? line.unitPrice
        : line.unitPrice * line.quantity,
    purchase_cost: line.purchaseCost,
    margin_amount: line.marginAmount,
    vat_rate: line.vatRate,
    notes: line.notes,
  };
}

export default function VentesPage() {
  const [ventes, setVentes] = useState<Sale[]>([]);
  const [stockItems, setStockItems] = useState<AvailableStockItem[]>([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [venteEnEdition, setVenteEnEdition] = useState<Sale | null>(null);
  const [clients, setClients] = useState<string[]>([]);

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
  .select("name")
  .eq("company_id", companyId)
  .eq("type", "client");

setClients(
  [...new Set((contacts || []).map((c) => c.name))]
);
      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, []);

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

  const exporterVentes = async () => {
  try {
    await exportSalesToExcel(ventesFiltrees);
  } catch (error) {
    console.error(error);
    alert("Erreur lors de l'export Excel des ventes.");
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

const supabase = createClient();

if (vente.saveClient) {
  const { data: existingClient } = await supabase
    .from("contacts")
    .select("id")
    .eq("company_id", companyId)
    .eq("type", "client")
    .ilike("name", vente.customerName)
    .maybeSingle();

  if (!existingClient) {
    await supabase.from("contacts").insert({
      company_id: companyId,
      type: "client",
      name: vente.customerName,
    });
  }
}

      const createdSale = await createSale({
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

      await applySaleStockMovements(vente.lines);


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

      await refreshSales(companyId);
      await refreshStock(companyId);

      fermerModal();
    } catch (error) {
      console.error(error);
    }
  };

  const modifierVente = async (vente: VentePayload) => {
    if (!venteEnEdition) return;

    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      await rollbackSaleStockMovements(venteEnEdition.lines || []);

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
      });

      await deleteSaleLines(venteEnEdition.id);

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

      await refreshSales(companyId);
      await refreshStock(companyId);

      fermerModal();
    } catch (error) {
      console.error(error);
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exporterVentes}
          disabled={ventesFiltrees.length === 0}
          className="
            rounded-lg border border-amber-500/30
            bg-amber-500/10 px-4 py-2
            text-sm font-semibold text-amber-400
            hover:bg-amber-500/15
            disabled:cursor-not-allowed disabled:opacity-40
            transition-colors
          "
        >
          Exporter les ventes Excel
        </button>
      </div>

      <VentesFiltres
        filtres={filtres}
        onChangeFiltres={setFiltres}
      />

      <VentesTableau
        ventes={ventesFiltrees}
        onModifier={ouvrirEdition}
        onSupprimer={supprimerVente}
      />

      <VenteFormModal
        ouvert={modalOuverte}
        onFermer={fermerModal}
        onAjouter={ajouterVente}
        onModifier={modifierVente}
        venteInitiale={venteEnEdition}
stockItems={stockItems}
clients={clients}
      />
    </div>
  );
}