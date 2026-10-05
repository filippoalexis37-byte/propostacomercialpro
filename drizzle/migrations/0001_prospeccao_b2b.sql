ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS gbp_url text,
  ADD COLUMN IF NOT EXISTS contact_role text,
  ADD COLUMN IF NOT EXISTS preferred_channel text,
  ADD COLUMN IF NOT EXISTS prospect_status text NOT NULL DEFAULT 'Não prospectado',
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Média',
  ADD COLUMN IF NOT EXISTS potential text NOT NULL DEFAULT 'Médio',
  ADD COLUMN IF NOT EXISTS temperature text NOT NULL DEFAULT 'Frio',
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_prospect_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_contact_at date,
  ADD COLUMN IF NOT EXISTS last_result text,
  ADD COLUMN IF NOT EXISTS services_interest text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS potential_value numeric,
  ADD COLUMN IF NOT EXISTS closed_value numeric,
  ADD COLUMN IF NOT EXISTS qualification jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS list_id uuid,
  ADD COLUMN IF NOT EXISTS cadence_id uuid,
  ADD COLUMN IF NOT EXISTS cadence_step integer NOT NULL DEFAULT 0;

CREATE TABLE public.prospect_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, niche text, region text, city text, owner text,
  status text NOT NULL DEFAULT 'Rascunho',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_lists TO authenticated;
GRANT ALL ON public.prospect_lists TO service_role;
ALTER TABLE public.prospect_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON public.prospect_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.cadences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text, objective text, channel text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadences TO authenticated;
GRANT ALL ON public.cadences TO service_role;
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON public.cadences FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.companies ADD CONSTRAINT companies_list_fk FOREIGN KEY (list_id) REFERENCES public.prospect_lists(id) ON DELETE SET NULL;
ALTER TABLE public.companies ADD CONSTRAINT companies_cadence_fk FOREIGN KEY (cadence_id) REFERENCES public.cadences(id) ON DELETE SET NULL;

CREATE TABLE public.prospect_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  happened_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL, contact_type text, owner text, message text,
  result text NOT NULL, notes text, next_contact_at date, value numeric,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.prospect_attempts TO authenticated;
GRANT ALL ON public.prospect_attempts TO service_role;
ALTER TABLE public.prospect_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read" ON public.prospect_attempts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert" ON public.prospect_attempts FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX prospect_attempts_company_idx ON public.prospect_attempts(company_id, happened_at);

CREATE TRIGGER trg_prospect_lists_updated BEFORE UPDATE ON public.prospect_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cadences_updated BEFORE UPDATE ON public.cadences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cadences (name, description, objective, channel, steps) VALUES
('Cadência B2B — 7 dias', 'Sequência padrão de prospecção', 'Agendar diagnóstico', 'WhatsApp',
 '[{"day":1,"action":"Primeiro contato"},{"day":2,"action":"Follow-up"},{"day":4,"action":"Segundo follow-up"},{"day":7,"action":"Último contato"}]');