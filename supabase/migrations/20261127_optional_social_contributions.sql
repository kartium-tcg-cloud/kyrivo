-- Estimation facultative des cotisations sociales (indépendante de la TVA).
-- NULL = non activé ; les anciens enregistrements conservent NULL.
ALTER TABLE public.company_preferences
  ADD COLUMN IF NOT EXISTS default_social_contribution_rate numeric(5,2);
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS social_contribution_rate numeric(5,2);

-- Contraintes sur les deux valeurs sauvegardées ; aucun taux imposé par défaut.
DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint WHERE conname='company_preferences_default_social_rate_range'
     AND conrelid='public.company_preferences'::regclass
 ) THEN
   ALTER TABLE public.company_preferences ADD CONSTRAINT company_preferences_default_social_rate_range
     CHECK (default_social_contribution_rate IS NULL OR default_social_contribution_rate BETWEEN 0 AND 100);
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint WHERE conname='sales_social_rate_range'
     AND conrelid='public.sales'::regclass
 ) THEN
   ALTER TABLE public.sales ADD CONSTRAINT sales_social_rate_range
     CHECK (social_contribution_rate IS NULL OR social_contribution_rate BETWEEN 0 AND 100);
 END IF;
END $$;

COMMENT ON COLUMN public.company_preferences.default_social_contribution_rate
  IS 'Taux facultatif proposé à la création des nouvelles ventes ; NULL = désactivé.';
COMMENT ON COLUMN public.sales.social_contribution_rate
  IS 'Taux facultatif figé pour cette vente ; contribution estimée sur la base de chiffre d''affaires hors TVA. N''affecte ni la TVA ni les factures.';
