import { createClient } from "@/lib/supabase/client";
import {
  AvailableStockItem,
  SalePaymentMethod,
  SaleVatMode,
} from "@/types/sale";
import { ItemStatus } from "@/types/item";

const supabase = createClient();

// ═══════════════════════════════════════════════════════════
// LECTURE
// ═══════════════════════════════════════════════════════════

export async function getSales(companyId: string) {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("company_id", companyId)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSaleLines(saleIds: string[]) {
  if (saleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("sale_lines")
    .select("*")
    .in("sale_id", saleIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAvailableStockItems(
  companyId: string
): Promise<AvailableStockItem[]> {
  const { data, error } = await supabase
    .from("purchase_items")
    .select(
      "id, item_reference, item_name, unit_cost, total_cost, quantity, stock_quantity, status, margin_eligible"
    )
    .eq("company_id", companyId)
    .eq("status", "in_stock")
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d) => ({
    id: d.id as string,
    itemReference: d.item_reference as string,
    itemName: d.item_name as string,
    quantity: Number(d.quantity),
    stockQuantity: Number(d.stock_quantity ?? d.quantity),
    unitCost: Number(d.unit_cost),
    status: d.status as ItemStatus,
    marginEligible: Boolean(d.margin_eligible),
  }));
}

// ═══════════════════════════════════════════════════════════
// ÉCRITURE SALES
// ═══════════════════════════════════════════════════════════

export async function createSale(payload: {
  company_id: string;
  sale_date: string;
  customer_name: string;
  vat_mode: SaleVatMode;
  payment_method?: SalePaymentMethod;
  subtotal_ht: number;
  vat_amount: number;
  total_ttc: number;
  margin_amount: number;
  notes?: string;
  contact_id?: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté");

  if (!payload.customer_name?.trim()) {
    throw new Error("Le nom du client est obligatoire.");
  }

  const { data, error } = await supabase
    .from("sales")
    .insert({
      ...payload,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSale(
  id: string,
  payload: {
    sale_date: string;
    customer_name: string;
    vat_mode: SaleVatMode;
    payment_method?: SalePaymentMethod;
    subtotal_ht: number;
    vat_amount: number;
    total_ttc: number;
    margin_amount: number;
    notes?: string;
    contact_id?: string | null;
  }
) {
  if (!payload.customer_name?.trim()) {
    throw new Error("Le nom du client est obligatoire.");
  }

  const { data, error } = await supabase
    .from("sales")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSale(id: string) {
  const { data, error } = await supabase
    .from("sales")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════════════
// ÉCRITURE LIGNES
// ═══════════════════════════════════════════════════════════

export async function createSaleLines(
  lines: {
    sale_id: string;
    company_id: string;
    purchase_item_id?: string;
    item_reference?: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    purchase_cost?: number;
    margin_amount?: number;
    vat_rate: number;
    notes?: string;
  }[]
) {
  if (lines.length === 0) return [];

  const { data, error } = await supabase
    .from("sale_lines")
    .insert(lines)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function deleteSaleLines(saleId: string) {
  const { data, error } = await supabase
    .from("sale_lines")
    .delete()
    .eq("sale_id", saleId)
    .select();

  if (error) throw error;
  return data ?? [];
}