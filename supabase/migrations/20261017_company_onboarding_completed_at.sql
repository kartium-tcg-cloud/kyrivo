-- Ajouter un marqueur de fin d'assistant, sans toucher aux préférences existantes.
-- Toute société existant lors de cette migration est considérée déjà configurée :
-- l'assistant reste accessible manuellement dans Préférences.
-- Les futures sociétés conserveront NULL et verront l'assistant au premier accès.
alter table public.companies
  add column if not exists onboarding_completed_at timestamptz;

update public.companies
set onboarding_completed_at = now()
where onboarding_completed_at is null;

comment on column public.companies.onboarding_completed_at is
  'Date de finalisation de l assistant de configuration Kyrivo; NULL pour une nouvelle société non configurée.';
