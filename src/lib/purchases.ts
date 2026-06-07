import { createClient } from "@/lib/supabase/client";
import { ItemStatus } from "@/types/item";

const supabase = createClient();

export async function getPurchases(companyId: string) {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("company_id", companyId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPurchase(payload: {
  company_id: string;
  purchase_date: string;
  supplier: string;
  supplier_contact_id?: string | null;
  product: string;
  purchase_type: string;
  payment_method?: string;
  amount_ht: number;
  vat_rate: number;
  vat_amount: number;
  amount_ttc: number;
  comment?: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilisateur non connecté");

  const { data, error } = await supabase
    .from("purchases")
    .insert({
      ...payload,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePurchase(
  id: string,
  payload: {
    purchase_date: string;
    supplier: string;
    supplier_contact_id?: string | null;
    product: string;
    purchase_type: string;
    payment_method?: string;
    amount_ht: number;
    vat_rate: number;
    vat_amount: number;
    amount_ttc: number;
    comment?: string;
    document_url?: string;
  }
) {
  const { data, error } = await supabase
    .from("purchases")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePurchase(id: string) {
  const { data, error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function createPurchaseItems(
  items: {
    purchase_document_id: string;
    company_id: string;
    item_name: string;
    item_reference?: string;
    category?: string;
    quantity: number;
    stock_quantity: number;
    unit_cost: number;
    total_cost: number;
    vat_type?: string;
    vat_rate: number;
    margin_eligible: boolean;
    status: ItemStatus;
    notes?: string;
  }[]
) {
  if (items.length === 0) return [];

  const { data, error } = await supabase
    .from("purchase_items")
    .insert(items)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function deletePurchaseItems(purchaseId: string) {
  const { data, error } = await supabase
    .from("purchase_items")
    .delete()
    .eq("purchase_document_id", purchaseId)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function getPurchaseItems(purchaseIds: string[]) {
  if (purchaseIds.length === 0) return [];

  const { data, error } = await supabase
    .from("purchase_items")
    .select("*")
    .in("purchase_document_id", purchaseIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function uploadPurchaseDocument(file: File, purchaseId: string) {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "file";
  const fileName = `${purchaseId}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { error } = await supabase.storage
    .from("purchase-documents")
    .upload(filePath, file, { upsert: true });

  if (error) throw error;
  return filePath;
}

export async function getPurchaseDocumentSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("purchase-documents")
    .createSignedUrl(filePath, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}