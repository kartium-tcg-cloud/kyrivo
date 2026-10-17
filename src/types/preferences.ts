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
  /** Enable specialized Vinted purchase import and fiscal-cost verification tools. */
  enableVinted: boolean;
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
  enableVinted: false,

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