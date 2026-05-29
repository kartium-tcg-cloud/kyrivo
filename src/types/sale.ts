import { ItemStatus } from "@/types/item";

export type SaleVatMode = "standard_vat" | "margin_vat";

export interface SaleVatModeConfig {
  label: string;
  shortLabel: string;
  description: string;
  text: string;
  bg: string;
  border: string;
}

export const SALE_VAT_MODE_CONFIG: Record<SaleVatMode, SaleVatModeConfig> = {
  standard_vat: {
    label: "TVA standard",
    shortLabel: "Standard",
    description: "TVA classique sur le prix de vente",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
  margin_vat: {
    label: "TVA sur marge",
    shortLabel: "Marge",
    description: "TVA calculée sur la marge bénéficiaire",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
};

export function isSaleVatMode(value: unknown): value is SaleVatMode {
  return value === "standard_vat" || value === "margin_vat";
}

export type SalePaymentMethod =
  | "Virement"
  | "Paypal"
  | "Bancontact"
  | "Cash"
  | "Vinted"
  | "Shopify"
  | "Cardmarket"
  | "Stripe";

export interface SaleLineInput {
  purchaseItemId?: string;
  itemReference?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  purchaseCost?: number;
  marginAmount?: number;
  vatRate: number;
  notes?: string;
}

export interface SaleLine {
  id: string;
  saleId: string;
  companyId: string;
  purchaseItemId?: string;
  itemReference?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseCost?: number;
  marginAmount?: number;
  vatRate: number;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  date: string;
  numInterne: string;
  customerName: string;
  vatMode: SaleVatMode;
  paymentMethod: SalePaymentMethod;
  subtotalHT: number;
  vatAmount: number;
  totalTTC: number;
  marginAmount: number;
  notes?: string;
  lines?: SaleLine[];
  saveClient?: boolean;
  invoiceNumber?: string;
  billedAt?: string;
}

export interface SaleFiltres {
  recherche: string;
  vatMode: SaleVatMode | "tous";
  dateDebut: string;
  dateFin: string;
}

export interface AvailableStockItem {
  id: string;
  itemReference: string;
  itemName: string;
  unitCost: number;
  status: ItemStatus;
  marginEligible: boolean;
  quantity: number;
  stockQuantity: number;
}

export interface SaleValidationResult {
  valid: boolean;
  errors: string[];
}

const MAX_TEXT = {
  customerName: 120,
  itemName: 150,
  notes: 1000,
};

const MAX_VALUES = {
  quantity: 9999,
  amount: 999999,
  vatRate: 100,
};

export function validateSale(input: {
  customerName: string;
  vatMode: SaleVatMode;
  lines: SaleLineInput[];
  notes?: string;
}): SaleValidationResult {
  const errors: string[] = [];

  if (!input.customerName?.trim()) {
    errors.push("Le nom du client est obligatoire.");
  } else if (input.customerName.length > MAX_TEXT.customerName) {
    errors.push(`Le nom du client est trop long.`);
  }

  if (input.notes && input.notes.length > MAX_TEXT.notes) {
    errors.push("Les notes de la vente sont trop longues.");
  }

  if (input.lines.length === 0) {
    errors.push("Au moins une ligne est requise.");
  }

  input.lines.forEach((line, i) => {
    const label = `Ligne ${i + 1}`;

    if (!line.itemName?.trim()) {
      errors.push(`${label} : nom de l'article requis.`);
    } else if (line.itemName.length > MAX_TEXT.itemName) {
      errors.push(`${label} : nom de l'article trop long.`);
    }

    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      errors.push(`${label} : quantité invalide.`);
    } else if (line.quantity > MAX_VALUES.quantity) {
      errors.push(`${label} : quantité trop élevée.`);
    }

    if (!Number.isFinite(line.unitPrice) || line.unitPrice <= 0) {
      errors.push(`${label} : prix de vente invalide.`);
    } else if (line.unitPrice > MAX_VALUES.amount) {
      errors.push(`${label} : prix de vente trop élevé.`);
    }

    if (!Number.isFinite(line.vatRate) || line.vatRate < 0 || line.vatRate > MAX_VALUES.vatRate) {
      errors.push(`${label} : taux TVA invalide.`);
    }

    if (line.notes && line.notes.length > MAX_TEXT.notes) {
      errors.push(`${label} : notes trop longues.`);
    }

    if (input.vatMode === "margin_vat") {
      if (line.purchaseCost === undefined || !Number.isFinite(line.purchaseCost) || line.purchaseCost <= 0) {
        errors.push(`${label} : coût d'achat requis pour le régime TVA sur marge.`);
      } else if (line.purchaseCost > MAX_VALUES.amount) {
        errors.push(`${label} : coût d'achat trop élevé.`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}