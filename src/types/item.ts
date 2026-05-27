// Types pour la gestion des items (purchase_items)
// Centralise statuts + configuration UI

export type ItemStatus =
  | "in_stock"
  | "reserved"
  | "sold"
  | "returned"
  | "lost";

export interface ItemStatusConfig {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
}

/** Configuration UI pour chaque statut — utilisée par les badges */
export const ITEM_STATUS_CONFIG: Record<ItemStatus, ItemStatusConfig> = {
  in_stock: {
    label: "En stock",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  reserved: {
    label: "Réservé",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  sold: {
    label: "Vendu",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    dot: "bg-blue-400",
  },
  returned: {
    label: "Retourné",
    text: "text-neutral-300",
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/30",
    dot: "bg-neutral-400",
  },
  lost: {
    label: "Perdu",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-400",
  },
};

/** Type guard pour valider une valeur de status venant de la DB */
export function isItemStatus(value: unknown): value is ItemStatus {
  return (
    typeof value === "string" &&
    ["in_stock", "reserved", "sold", "returned", "lost"].includes(value)
  );
}

/** Structure typée d'un item côté front */
export interface PurchaseItem {
  id: string;
  reference: string; // PKM-000001 — toujours présent (DB garantie)
  nom: string;
  quantite: number;
  coutHT: number;
  statut: ItemStatus;
  notes?: string;
  purchaseDocumentId: string;
  companyId: string;
  category?: string;
  createdAt: string;
}