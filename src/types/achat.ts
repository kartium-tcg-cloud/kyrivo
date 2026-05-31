import { ItemStatus } from "@/types/item";

export type TypeAchat = "pro" | "particulier";

export type ModePaiement =
  | "Virement"
  | "Paypal"
  | "Bancontact"
  | "Cash"
  | "Vinted"
  | "Shopify";

export interface AchatItemInput {
  id?: string;
  nom: string;
  cout: number;
  quantite: number;
  modeMontant: "ht" | "ttc";
  notes?: string;
}

export interface AchatArticle {
  id: string;
  reference: string;
  nom: string;
  quantite: number;
  stockRestant: number;
  coutHT: number;
  coutTTC?: number;
  statut: ItemStatus;
  notes?: string;
}

export interface Achat {
  id: string;
  date: string;
  numInterne: string;
  fournisseur: string;
  produit: string;
  type: TypeAchat;
  prixHT: number;
  prixTVA: number;
  prixTTC: number;
  /** Taux de TVA en % (ex. 21). Issu de purchases.vat_rate. */
  vatRate?: number;
  paiement: ModePaiement;
  numFacture: string;
  commentaire?: string;
  documentUrl?: string;
  documentFile?: File | null;
  items?: AchatItemInput[];
  articles?: AchatArticle[];
  saveSupplier?: boolean;
  /** true = achat de stock (défaut), false = dépense sans stock */
  avecStock?: boolean;
}

export interface AchatFiltres {
  recherche: string;
  type: TypeAchat | "tous";
  dateDebut: string;
  dateFin: string;
}