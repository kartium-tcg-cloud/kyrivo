"use client";

import type { VintedDraft, VintedKind } from "@/lib/vintedEmailParser";

export interface VintedQueueItem {
  draft: VintedDraft;
  state: "pending" | "saved";
}
const prefix = "kyrivo:vinted:v1:";
const queueKey = (companyId: string) => prefix + companyId + ":queue";
const activeKey = (companyId: string) => prefix + companyId + ":active";

export function readVintedQueue(companyId: string): VintedQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(queueKey(companyId)) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is VintedQueueItem =>
      Boolean(item && typeof item === "object" && typeof item.draft?.key === "string" &&
        (item.draft.kind === "purchase" || item.draft.kind === "sale") &&
        (item.state === "pending" || item.state === "saved"))
    ).slice(0, 250);
  } catch { return []; }
}
export function addVintedDrafts(companyId: string, drafts: VintedDraft[]): VintedQueueItem[] {
  const queue = readVintedQueue(companyId);
  const known = new Set(queue.map(item => item.draft.key));
  for (const draft of drafts) {
    if (known.has(draft.key) || queue.length >= 250) continue;
    queue.push({ draft, state: "pending" });
    known.add(draft.key);
  }
  sessionStorage.setItem(queueKey(companyId), JSON.stringify(queue));
  return queue;
}
export function activateVintedDraft(companyId: string, key: string): void {
  const item = readVintedQueue(companyId).find(i => i.draft.key === key && i.state === "pending");
  if (!item) throw new Error("Transaction introuvable dans la file d'import.");
  sessionStorage.setItem(activeKey(companyId), key);
}
export function getActiveVintedDraft(companyId: string, kind: VintedKind): VintedDraft | null {
  if (typeof window === "undefined") return null;
  const key = sessionStorage.getItem(activeKey(companyId));
  const item = readVintedQueue(companyId).find(i => i.draft.key === key && i.state === "pending");
  return item?.draft.kind === kind ? item.draft : null;
}
export function markVintedDraftSaved(companyId: string, key: string): void {
  const queue = readVintedQueue(companyId).map(item =>
    item.draft.key === key ? { ...item, state: "saved" as const } : item);
  sessionStorage.setItem(queueKey(companyId), JSON.stringify(queue));
  sessionStorage.removeItem(activeKey(companyId));
}
export function clearActiveVintedDraft(companyId: string): void {
  sessionStorage.removeItem(activeKey(companyId));
}
export function clearVintedQueue(companyId: string): void {
  sessionStorage.removeItem(queueKey(companyId));
  sessionStorage.removeItem(activeKey(companyId));
}
