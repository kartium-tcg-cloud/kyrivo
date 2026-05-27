import { createClient } from "@/lib/supabase/client";
import { ItemStatus } from "@/types/item";

const supabase = createClient();

export async function updateItemStatus(
  itemId: string,
  newStatus: ItemStatus
): Promise<void> {
  const { error } = await supabase
    .from("purchase_items")
    .update({ status: newStatus })
    .eq("id", itemId);

  if (error) throw error;
}

export async function getItemsByStatus(
  companyId: string,
  status: ItemStatus
) {
  const { data, error } = await supabase
    .from("purchase_items")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function adjustItemStock(params: {
  itemId: string;
  delta: number;
}) {
  const { data: item, error: readError } = await supabase
    .from("purchase_items")
    .select("id, quantity, stock_quantity")
    .eq("id", params.itemId)
    .single();

  if (readError) throw readError;

  const initialQuantity = Number(item.quantity);
  const currentStock = Number(item.stock_quantity ?? item.quantity);
  const nextStock = Math.max(
    0,
    Math.min(initialQuantity, currentStock + params.delta)
  );

  const nextStatus: ItemStatus = nextStock <= 0 ? "sold" : "in_stock";

  const { data, error } = await supabase
    .from("purchase_items")
    .update({
      stock_quantity: nextStock,
      status: nextStatus,
    })
    .eq("id", params.itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function applySaleStockMovements(
  lines: {
    purchaseItemId?: string;
    quantity: number;
  }[]
) {
  const linkedLines = lines.filter((line) => line.purchaseItemId);

  for (const line of linkedLines) {
    await adjustItemStock({
      itemId: line.purchaseItemId!,
      delta: -line.quantity,
    });
  }
}

export async function rollbackSaleStockMovements(
  lines: {
    purchaseItemId?: string;
    quantity: number;
  }[]
) {
  const linkedLines = lines.filter((line) => line.purchaseItemId);

  for (const line of linkedLines) {
    await adjustItemStock({
      itemId: line.purchaseItemId!,
      delta: line.quantity,
    });
  }
}

export async function updateItemStockQuantity(params: {
  itemId: string;
  stockQuantity: number;
}) {
  const { data: item, error: readError } = await supabase
    .from("purchase_items")
    .select("id, quantity")
    .eq("id", params.itemId)
    .single();

  if (readError) throw readError;

  const initialQuantity = Number(item.quantity);
  const safeStock = Math.max(
    0,
    Math.min(initialQuantity, params.stockQuantity)
  );

  const nextStatus: ItemStatus = safeStock <= 0 ? "sold" : "in_stock";

  const { data, error } = await supabase
    .from("purchase_items")
    .update({
      stock_quantity: safeStock,
      status: nextStatus,
    })
    .eq("id", params.itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}