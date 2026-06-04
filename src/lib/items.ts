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

// ─── Vérification stock avant vente ─────────────────────────
// existingLines : lignes de la vente EN COURS DE MODIFICATION
//   → leur quantité s'ajoute au stock courant car le rollback les restituera
export async function checkStockAvailability(
  lines: { purchaseItemId?: string; quantity: number }[],
  existingLines?: { purchaseItemId?: string; quantity: number }[]
): Promise<{ ok: boolean; errors: { available: number; requested: number }[] }> {
  const linkedLines = lines.filter((l) => l.purchaseItemId);
  if (linkedLines.length === 0) return { ok: true, errors: [] };

  // Quantités demandées par article
  const requestedByItem = new Map<string, number>();
  for (const line of linkedLines) {
    const id = line.purchaseItemId!;
    requestedByItem.set(id, (requestedByItem.get(id) ?? 0) + line.quantity);
  }

  // Quantités déjà allouées dans la vente existante (cas modification)
  const existingByItem = new Map<string, number>();
  for (const line of (existingLines ?? []).filter((l) => l.purchaseItemId)) {
    const id = line.purchaseItemId!;
    existingByItem.set(id, (existingByItem.get(id) ?? 0) + line.quantity);
  }

  const itemIds = [...requestedByItem.keys()];
  const { data, error } = await supabase
    .from("purchase_items")
    .select("id, stock_quantity")
    .in("id", itemIds);

  if (error) throw error;

  const stockByItem = new Map<string, number>();
  for (const item of data ?? []) {
    stockByItem.set(item.id, Number(item.stock_quantity ?? 0));
  }

  const errors: { available: number; requested: number }[] = [];
  for (const [itemId, requested] of requestedByItem.entries()) {
    const currentStock = stockByItem.get(itemId) ?? 0;
    const alreadyAllocated = existingByItem.get(itemId) ?? 0;
    const available = currentStock + alreadyAllocated;
    if (requested > available) {
      errors.push({ available, requested });
    }
  }

  return { ok: errors.length === 0, errors };
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