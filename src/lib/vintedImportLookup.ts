"use client";

import type { VintedDraft } from "@/lib/vintedEmailParser";
import { createClient } from "@/lib/supabase/client";

type DatabaseClient = ReturnType<typeof createClient>;
type SourceDetails = { importKey?: string; orderReference?: string } | null;

/**
 * Look up only the receipt keys that are currently present in the local queue.
 * Previously /import-vinted downloaded every purchase and sale, including all
 * sale lines and purchase items, to check possible duplicates.
 *
 * Queries remain scoped to the signed-in company and inherit Supabase RLS.
 * We also check legacy Vinted receipts whose source_details contains only
 * an orderReference. The normal save path performs a second duplicate check.
 */
export async function findExistingVintedKeys(
  db: DatabaseClient,
  companyId: string,
  drafts: VintedDraft[]
): Promise<Set<string>> {
  const found = new Set<string>();
  const unique = [...new Map(drafts.map(draft => [draft.key, draft])).values()];
  const purchases = unique.filter(d => d.kind === "purchase");
  const sales = unique.filter(d => d.kind === "sale");

  // Small bounded requests avoid expensive full-history queries and long URLs.
  const batches = <T,>(items: T[], max = 40): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += max) result.push(items.slice(i, i + max));
    return result;
  };
  const purchaseReferences = new Map<string, string>();
  for (const draft of purchases) if (draft.orderReference) {
    purchaseReferences.set(draft.orderReference, draft.key);
  }

  async function search(
    table: "purchases" | "sales",
    jsonField: "importKey" | "orderReference",
    values: string[]
  ): Promise<SourceDetails[]> {
    if (!values.length) return [];
    const requests = batches([...new Set(values)]).map(async group => {
      const { data, error } = await db.from(table)
        .select("source_details")
        .eq("company_id", companyId)
        .in("source_details->>" + jsonField, group);
      if (error) throw error;
      return (data ?? []).map(row => row.source_details as SourceDetails);
    });
    return (await Promise.all(requests)).flat();
  }

  const [purchaseKeys, saleKeys, legacyPurchaseRefs] = await Promise.all([
    search("purchases", "importKey", purchases.map(d => d.key)),
    search("sales", "importKey", sales.map(d => d.key)),
    search("purchases", "orderReference", [...purchaseReferences.keys()]),
  ]);
  const candidateKeys = new Set(unique.map(d => d.key));
  for (const details of [...purchaseKeys, ...saleKeys, ...legacyPurchaseRefs]) {
    if (!details) continue;
    if (details.importKey && candidateKeys.has(details.importKey)) found.add(details.importKey);
    if (details.orderReference) {
      const key = purchaseReferences.get(details.orderReference);
      if (key) found.add(key);
    }
  }
  return found;
}
