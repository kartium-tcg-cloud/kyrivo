import { ItemStatus } from "@/types/item";
import type { TransactionFeeDraft } from "@/lib/transactionFees";

export type TypeAchat = "pro" | "particulier";

export interface VintedSourceDetails {
  sellerPrice: number;
  shippingFee: number;
  buyerProtectionFee: number;
  otherFees: number;
  paidTotal: number;
  orderReference?: string;
  importKey?: string;
  /** Price split manually checked against a Vinted order recap. */
  amountsConfirmed: boolean;
}

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
  taille?: string;
}

export interface AchatArticle {
  id: string;
  reference: string;
  nom: string;
  quantite: number;
  stockRestant: number;
  coutHT: number;
  coutTTC?: number;
  fiscalUnitCost?: number | null;
  economicUnitCost?: number | null;
  fiscalCostReviewRequired?: boolean;
  statut: ItemStatus;
  notes?: string;
  taille?: string;
}

export interface Achat {
  id: string;
  date: string;
  numInterne: string;
  fournisseur: string;
  supplierContactId?: string | null;
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
  source?: "manual" | "vinted_import";
  sourceDetails?: VintedSourceDetails;
  items?: AchatItemInput[];
  articles?: AchatArticle[];
  saveSupplier?: boolean;
  draftFees?: TransactionFeeDraft[];
  /** true = achat de stock (défaut), false = dépense sans stock */
  avecStock?: boolean;
}

export interface AchatFiltres {
  recherche: string;
  type: TypeAchat | "tous";
  dateDebut: string;
  dateFin: string;
}