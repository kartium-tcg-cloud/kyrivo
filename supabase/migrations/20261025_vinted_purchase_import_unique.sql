-- Prevent two concurrent browser tabs from recording the same Vinted purchase.
-- Existing imported Vinted purchases: 0 on audit date 2026-10-25.
-- No alterations or deletions of historical purchase data.
create unique index if not exists purchases_vinted_import_key_idx
  on public.purchases (company_id, (source_details->>'importKey'))
  where source = 'vinted_import' and source_details ? 'importKey';
