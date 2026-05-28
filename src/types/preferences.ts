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

  invoiceFooter: "Merci pour votre confiance.",
  invoicePaymentTerms: "Paiement à réception.",

  invoicePrefix: "FAC",
  invoiceNextNumber: 1,

  defaultVatRate: 21,

  defaultPaymentMethods: [
    "Virement",
    "Paypal",
    "Bancontact",
    "Cash",
    "Vinted",
    "Shopify",
    "Cardmarket",
    "Stripe",
  ],
};