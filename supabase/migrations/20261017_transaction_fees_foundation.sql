-- Foundation only: existing amounts, invoices, TVA and stock remain unchanged.
ALTER TABLE public.company_preferences
  ADD COLUMN IF NOT EXISTS enable_transaction_fees boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.company_preferences.enable_transaction_fees IS
  'Opt-in to transaction fee tracking; turning it off never deletes existing fees.';

-- Composite keys prevent a fee from being attached to another company's document.
CREATE UNIQUE INDEX IF NOT EXISTS purchases_company_id_fee_key
  ON public.purchases(company_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS sales_company_id_fee_key
  ON public.sales(company_id, id);

CREATE TABLE public.transaction_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  purchase_id uuid,
  sale_id uuid,
  kind text NOT NULL CHECK (kind IN ('expense', 'customer_charge')),
  category text NOT NULL CHECK (category IN
    ('shipping', 'marketplace', 'payment_processing', 'packaging',
     'insurance', 'customs', 'tax', 'other')),
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 120),
  amount_ht numeric(14,2) NOT NULL CHECK (amount_ht >= 0),
  vat_rate numeric(6,3) NOT NULL DEFAULT 0 CHECK (vat_rate BETWEEN 0 AND 100),
  vat_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  amount_ttc numeric(14,2) NOT NULL CHECK (amount_ttc > 0),
  recoverable_vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  -- TRUE = already included in the parent document total, never add it twice.
  included_in_parent_total boolean NOT NULL DEFAULT false,
  vat_treatment text NOT NULL DEFAULT 'pending_review'
    CHECK (vat_treatment IN ('pending_review', 'standard', 'margin_accessory', 'outside_scope')),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fee_one_parent CHECK (num_nonnulls(purchase_id, sale_id) = 1),
  CONSTRAINT fee_customer_charges_sale_only CHECK (kind = 'expense' OR sale_id IS NOT NULL),
  CONSTRAINT fee_amount_sum CHECK (amount_ht + vat_amount = amount_ttc),
  CONSTRAINT fee_tax_recovery_limit CHECK (
    recoverable_vat_amount >= 0
    AND recoverable_vat_amount <= vat_amount
    AND (kind = 'expense' OR recoverable_vat_amount = 0)
  ),
  CONSTRAINT fee_purchase_company_fk
    FOREIGN KEY(company_id, purchase_id)
    REFERENCES public.purchases(company_id, id) ON DELETE CASCADE,
  CONSTRAINT fee_sale_company_fk
    FOREIGN KEY(company_id, sale_id)
    REFERENCES public.sales(company_id, id) ON DELETE CASCADE
);

CREATE INDEX transaction_fees_company_idx ON public.transaction_fees(company_id);
CREATE INDEX transaction_fees_purchase_idx ON public.transaction_fees(purchase_id)
  WHERE purchase_id IS NOT NULL;
CREATE INDEX transaction_fees_sale_idx ON public.transaction_fees(sale_id)
  WHERE sale_id IS NOT NULL;

ALTER TABLE public.transaction_fees ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transaction_fees FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_fees TO authenticated;

CREATE POLICY "members can view transaction fees"
 ON public.transaction_fees FOR SELECT TO authenticated
 USING (EXISTS (
   SELECT 1 FROM public.memberships m
   WHERE m.company_id = transaction_fees.company_id AND m.user_id = (select auth.uid())
 ));

CREATE POLICY "members can create transaction fees"
 ON public.transaction_fees FOR INSERT TO authenticated
 WITH CHECK (EXISTS (
   SELECT 1 FROM public.memberships m
   WHERE m.company_id = transaction_fees.company_id AND m.user_id = (select auth.uid())
 ));

CREATE POLICY "members can update transaction fees"
 ON public.transaction_fees FOR UPDATE TO authenticated
 USING (EXISTS (
   SELECT 1 FROM public.memberships m
   WHERE m.company_id = transaction_fees.company_id AND m.user_id = (select auth.uid())
 ))
 WITH CHECK (EXISTS (
   SELECT 1 FROM public.memberships m
   WHERE m.company_id = transaction_fees.company_id AND m.user_id = (select auth.uid())
 ));

CREATE POLICY "members can delete transaction fees"
 ON public.transaction_fees FOR DELETE TO authenticated
 USING (EXISTS (
   SELECT 1 FROM public.memberships m
   WHERE m.company_id = transaction_fees.company_id AND m.user_id = (select auth.uid())
 ));
