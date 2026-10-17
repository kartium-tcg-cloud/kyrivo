export interface CompanyPreferences {
  id?: string;
  companyId: string;

  invoiceCompanyName: string;
  invoiceCompanyAddress: string;
  invoiceCompanyVat: string;
  invoiceCompanyEmail: string;
  invoiceCompanyPhone: string;

  invoiceFooter: string;
  invoicePaymentTerms: string;

  invoicePrefix: string;
  invoiceNextNumber: number;

  defaultPaymentMethods: string[];
  defaultVatRate: number;
  /** Affiche le suivi optionnel des frais internes et facturés, sans modifier les historiques. */
  enableTransactionFees: boolean;
}

export const DEFAULT_COMPANY_PREFERENCES: Omit<
  CompanyPreferences,
  "companyId"
> = {
  invoiceCompanyName: "",
  invoiceCompanyAddress: "",
  invoiceCompanyVat: "",
  invoiceCompanyEmail: "",
  invoiceCompanyPhone: "",

  invoiceFooter: "Merci de votre confiance",
  invoicePaymentTerms: "Paiement à réception",

  invoicePrefix: "FAC",
  invoiceNextNumber: 1,

  defaultVatRate: 0,
  enableTransactionFees: false,

  defaultPaymentMethods: [
    "Virement",
    "PayPal",
    "Bancontact",
    "Cash",
    "Vinted",
    "Shopify",
    "CardMarket",
    "Voggt",
  ],
};