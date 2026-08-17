-- H1 follow-up: covering indexes for nullable foreign keys.
-- The unique partial indexes remain responsible for one-to-one linkage.

create index if not exists production_company_profiles_partner_fk_idx
  on public.production_company_profiles (partner_id);

create index if not exists production_company_profiles_candidate_fk_idx
  on public.production_company_profiles (discovery_candidate_id);
