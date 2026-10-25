-- Private import idempotency metadata. The receipt key must never appear in customer-facing invoice notes.
-- Existing sales and application flows remain unchanged.
alter table public.sales add column if not exists source_details jsonb;
comment on column public.sales.source_details is 'Optional source metadata for manually reviewed imports; never printed on customer invoices.';
create index if not exists sales_vinted_import_key_idx
  on public.sales (company_id, (source_details->>'importKey'))
  where source_details ? 'importKey';
