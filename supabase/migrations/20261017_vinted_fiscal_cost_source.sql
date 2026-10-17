-- Priorité #11 : provenance traçable des achats Vinted.
-- Mode Vinted OFF par défaut ; pas de réécriture des coûts historiques.
ALTER TABLE public.company_preferences
 ADD COLUMN IF NOT EXISTS enable_vinted boolean NOT NULL DEFAULT false;
-- AUCUN ancien coût, stock, montant, facture ou prix de vente n'est modifié.
ALTER TABLE public.purchases
 ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
 ADD COLUMN IF NOT EXISTS source_details jsonb;

ALTER TABLE public.purchases
 ADD CONSTRAINT purchases_source_kind_chk
 CHECK (source IN ('manual', 'vinted_import'));

ALTER TABLE public.purchases
 ADD CONSTRAINT purchases_vinted_details_chk
 CHECK (
   source <> 'vinted_import'
   OR (
     source_details IS NOT NULL
     AND jsonb_typeof(source_details) = 'object'
     AND (source_details->>'amountsConfirmed') = 'true'
     AND (source_details->>'sellerPrice') IS NOT NULL
     AND (source_details->>'paidTotal') IS NOT NULL
   )
 );

COMMENT ON COLUMN public.purchases.source IS
  'Provenance déclarée : manual ou vinted_import. Les anciennes lignes restent manual faute de preuve fiable.';
COMMENT ON COLUMN public.purchases.source_details IS
  'Détail d import Vinted : sellerPrice, shippingFee, buyerProtectionFee, otherFees, paidTotal, orderReference, amountsConfirmed. Les frais ne sont pas du prix fournisseur fiscal.';

ALTER TABLE public.purchase_items
 ADD COLUMN IF NOT EXISTS fiscal_unit_cost numeric(14,2),
 ADD COLUMN IF NOT EXISTS economic_unit_cost numeric(14,2),
 ADD COLUMN IF NOT EXISTS fiscal_cost_review_required boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS fiscal_cost_reviewed_at timestamptz,
 ADD COLUMN IF NOT EXISTS fiscal_cost_reviewed_by uuid REFERENCES auth.users(id);

ALTER TABLE public.purchase_items
 ADD CONSTRAINT purchase_items_fiscal_cost_nonnegative_chk
 CHECK (fiscal_unit_cost IS NULL OR fiscal_unit_cost >= 0);

ALTER TABLE public.purchase_items
 ADD CONSTRAINT purchase_items_economic_cost_nonnegative_chk
 CHECK (economic_unit_cost IS NULL OR economic_unit_cost >= 0);

-- Lignes déjà facturées/émises restent inchangées : ce champ ne se renseigne
-- que sur les nouvelles ventes, sans recalculer les ventes historiques.
ALTER TABLE public.sale_lines
 ADD COLUMN IF NOT EXISTS economic_purchase_cost numeric(14,2);


COMMENT ON COLUMN public.purchase_items.fiscal_unit_cost IS
  'Prix fiscal vendeur par unité confirmé pour calcul de TVA sur marge. NULL sur ancien stock non vérifié.';
COMMENT ON COLUMN public.purchase_items.economic_unit_cost IS
  'Coût économique unitaire (prix fiscal + frais acquis non récupérables affectés). Pour Vinted initial : total payé, distinct du prix fiscal.';
COMMENT ON COLUMN public.sale_lines.economic_purchase_cost IS
  'Coût économique à date de vente, conservé comme instantané ; jamais utilisé comme prix d achat fiscal pour TVA sur marge.';

COMMENT ON COLUMN public.purchase_items.fiscal_cost_review_required IS
  'Vérification du justificatif et de la ventilation des frais nécessaire AVANT utilisation en TVA sur marge.';

-- Les anciens achats réglés sur Vinted sont des CANDIDATS à audit et non
-- des imports formellement identifiés. Ne présume pas que leur coût est faux.
-- Ne modifie aucun prix et ne touche pas aux lignes déjà vendues.
UPDATE public.purchase_items pi
 SET fiscal_cost_review_required = true
 FROM public.purchases p
 WHERE p.id = pi.purchase_document_id
   AND lower(p.payment_method) = 'vinted'
   AND pi.stock_quantity > 0
   AND pi.fiscal_unit_cost IS NULL;

CREATE INDEX IF NOT EXISTS purchase_items_fiscal_review_idx
 ON public.purchase_items(company_id)
 WHERE fiscal_cost_review_required = true;
