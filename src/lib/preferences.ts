import { createClient } from "@/lib/supabase/client";

import {
  CompanyPreferences,
  DEFAULT_COMPANY_PREFERENCES,
} from "@/types/preferences";

const supabase = createClient();

function mapPreference(row: any): CompanyPreferences {
  const invoiceNextNumber = Number(row.invoice_next_number);

  return {
    id: row.id,
    companyId: row.company_id,

    invoiceCompanyName: row.invoice_company_name ?? "",
    invoiceCompanyAddress: row.invoice_company_address ?? "",
    invoiceCompanyVat: row.invoice_company_vat ?? "",
    invoiceCompanyEmail: row.invoice_company_email ?? "",
    invoiceCompanyPhone: row.invoice_company_phone ?? "",

    invoiceFooter:
      row.invoice_footer ?? DEFAULT_COMPANY_PREFERENCES.invoiceFooter,

    invoicePaymentTerms:
      row.invoice_payment_terms ??
      DEFAULT_COMPANY_PREFERENCES.invoicePaymentTerms,

    invoicePrefix:
      row.invoice_prefix ?? DEFAULT_COMPANY_PREFERENCES.invoicePrefix,

    invoiceNextNumber:
      Number.isFinite(invoiceNextNumber) && invoiceNextNumber > 0
        ? invoiceNextNumber
        : DEFAULT_COMPANY_PREFERENCES.invoiceNextNumber,

    defaultPaymentMethods: Array.isArray(row.default_payment_methods)
      ? row.default_payment_methods
      : DEFAULT_COMPANY_PREFERENCES.defaultPaymentMethods,

    defaultVatRate: Number.isFinite(Number(row.default_vat_rate))
      ? Number(row.default_vat_rate)
      : DEFAULT_COMPANY_PREFERENCES.defaultVatRate,
  };
}

async function getPrefixNextNumber(
  companyId: string,
  prefix: string
): Promise<number> {
  const cleanPrefix = prefix.trim() || DEFAULT_COMPANY_PREFERENCES.invoicePrefix;

  const { data, error } = await supabase
    .from("invoice_prefix_counters")
    .select("next_number")
    .eq("company_id", companyId)
    .eq("prefix", cleanPrefix)
    .maybeSingle();

  if (error) throw error;

  const nextNumber = Number(data?.next_number);

  return Number.isFinite(nextNumber) && nextNumber > 0 ? nextNumber : 1;
}

async function savePrefixCounter(
  companyId: string,
  prefix: string,
  nextNumber: number
): Promise<void> {
  const cleanPrefix = prefix.trim() || DEFAULT_COMPANY_PREFERENCES.invoicePrefix;

  const { error } = await supabase.from("invoice_prefix_counters").upsert(
    {
      company_id: companyId,
      prefix: cleanPrefix,
      next_number: Math.max(1, nextNumber),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "company_id,prefix",
    }
  );

  if (error) throw error;
}

export async function getCompanyPreferences(
  companyId: string
): Promise<CompanyPreferences> {
  const { data, error } = await supabase
    .from("company_preferences")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const defaultPrefix = DEFAULT_COMPANY_PREFERENCES.invoicePrefix;

    return {
      ...DEFAULT_COMPANY_PREFERENCES,
      companyId,
      invoicePrefix: defaultPrefix,
      invoiceNextNumber: await getPrefixNextNumber(companyId, defaultPrefix),
    };
  }

  const mapped = mapPreference(data);

  return {
    ...mapped,
    invoiceNextNumber: await getPrefixNextNumber(
      mapped.companyId,
      mapped.invoicePrefix
    ),
  };
}

export async function upsertCompanyPreferences(
  preferences: CompanyPreferences
) {
  const cleanPrefix =
    preferences.invoicePrefix.trim() ||
    DEFAULT_COMPANY_PREFERENCES.invoicePrefix;

  const nextNumberForPrefix = await getPrefixNextNumber(
    preferences.companyId,
    cleanPrefix
  );

  await savePrefixCounter(
    preferences.companyId,
    cleanPrefix,
    nextNumberForPrefix
  );

  const { data, error } = await supabase
    .from("company_preferences")
    .upsert(
      {
        company_id: preferences.companyId,

        invoice_company_name: preferences.invoiceCompanyName,
        invoice_company_address: preferences.invoiceCompanyAddress,
        invoice_company_vat: preferences.invoiceCompanyVat,
        invoice_company_email: preferences.invoiceCompanyEmail,
        invoice_company_phone: preferences.invoiceCompanyPhone,

        invoice_footer: preferences.invoiceFooter,
        invoice_payment_terms: preferences.invoicePaymentTerms,

        invoice_prefix: cleanPrefix,
        invoice_next_number: nextNumberForPrefix,

        default_payment_methods: preferences.defaultPaymentMethods,
        default_vat_rate: preferences.defaultVatRate,

        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "company_id",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return mapPreference(data);
}

export async function incrementInvoiceNumber(companyId: string) {
  const preferences = await getCompanyPreferences(companyId);

  const cleanPrefix =
    preferences.invoicePrefix.trim() ||
    DEFAULT_COMPANY_PREFERENCES.invoicePrefix;

  const nextNumber = preferences.invoiceNextNumber + 1;

  await savePrefixCounter(companyId, cleanPrefix, nextNumber);

  return upsertCompanyPreferences({
    ...preferences,
    invoicePrefix: cleanPrefix,
    invoiceNextNumber: nextNumber,
  });
}