-- =============================================================
-- MÓDULO DE PROSPECÇÃO B2B — Santos MktPro
-- Migration: 20261003220000_b2b_prospecting_module
-- =============================================================

-- ---------- Extensão das tabelas existentes ----------

-- Empresas: campos adicionais de prospecção
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS facebook          text,
  ADD COLUMN IF NOT EXISTS linkedin          text,
  ADD COLUMN IF NOT EXISTS google_business   text,
  ADD COLUMN IF NOT EXISTS category          text,
  ADD COLUMN IF NOT EXISTS address_number    text,
  -- Prospecção
  ADD COLUMN IF NOT EXISTS prospecting_status     text NOT NULL DEFAULT 'Não prospectado',
  ADD COLUMN IF NOT EXISTS prospecting_priority   text NOT NULL DEFAULT 'Média',
  ADD COLUMN IF NOT EXISTS prospecting_potential  text NOT NULL DEFAULT 'Médio',
  ADD COLUMN IF NOT EXISTS prospecting_source     text,
  ADD COLUMN IF NOT EXISTS first_prospected_at    timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempted_at      timestamptz,
  ADD COLUMN IF NOT EXISTS next_contact_at        date,
  ADD COLUMN IF NOT EXISTS attempt_count          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_to            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sequence_id            uuid, -- FK adicionada depois
  ADD COLUMN IF NOT EXISTS interest_level         text,
  ADD COLUMN IF NOT EXISTS services_interest      text[], -- array de serviços
  ADD COLUMN IF NOT EXISTS estimated_contract_value numeric(12,2),
  -- Qualificação
  ADD COLUMN IF NOT EXISTS has_digital_presence   boolean,
  ADD COLUMN IF NOT EXISTS runs_ads               boolean,
  ADD COLUMN IF NOT EXISTS has_website            boolean,
  ADD COLUMN IF NOT EXISTS has_google_business    boolean,
  ADD COLUMN IF NOT EXISTS has_instagram          boolean,
  ADD COLUMN IF NOT EXISTS has_whatsapp           boolean,
  ADD COLUMN IF NOT EXISTS has_sales_team         boolean,
  ADD COLUMN IF NOT EXISTS works_with_agency      boolean,
  ADD COLUMN IF NOT EXISTS main_problem           text,
  ADD COLUMN IF NOT EXISTS main_goal              text,
  ADD COLUMN IF NOT EXISTS estimated_budget       text,
  ADD COLUMN IF NOT EXISTS urgency                text,
  ADD COLUMN IF NOT EXISTS decision_maker_identified boolean,
  ADD COLUMN IF NOT EXISTS decision_date          date,
  -- Contato principal
  ADD COLUMN IF NOT EXISTS contact_name          text,
  ADD COLUMN IF NOT EXISTS contact_role          text,
  ADD COLUMN IF NOT EXISTS contact_phone         text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp      text,
  ADD COLUMN IF NOT EXISTS contact_email         text,
  ADD COLUMN IF NOT EXISTS contact_channel       text,
  -- Controle
  ADD COLUMN IF NOT EXISTS last_attempt_result   text,
  ADD COLUMN IF NOT EXISTS last_message_used     text,
  ADD COLUMN IF NOT EXISTS temperature           text NOT NULL DEFAULT 'Frio';

-- ---------- Listas de prospecção ----------
CREATE TABLE IF NOT EXISTS public.prospecting_lists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  niche           text,
  sub_niche       text,
  region          text,
  city            text,
  state           text,
  description     text,
  status          text NOT NULL DEFAULT 'Rascunho',
  responsible_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_demo         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Relacionamento empresa → lista
CREATE TABLE IF NOT EXISTS public.prospecting_list_companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     uuid NOT NULL REFERENCES public.prospecting_lists(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(list_id, company_id)
);

-- ---------- Tentativas de prospecção ----------
CREATE TABLE IF NOT EXISTS public.prospecting_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  attempt_date    timestamptz NOT NULL DEFAULT now(),
  channel         text NOT NULL DEFAULT 'WhatsApp',
  attempt_type    text NOT NULL DEFAULT 'Primeiro contato',
  message_used    text,
  result          text NOT NULL DEFAULT 'Não respondeu',
  notes           text,
  next_contact_at date,
  responsible_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sequence_step   integer,
  is_demo         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------- Cadências de prospecção ----------
CREATE TABLE IF NOT EXISTS public.prospecting_sequences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  objective   text,
  channel     text NOT NULL DEFAULT 'WhatsApp',
  total_steps integer NOT NULL DEFAULT 1,
  active      boolean NOT NULL DEFAULT true,
  is_demo     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prospecting_sequence_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     uuid NOT NULL REFERENCES public.prospecting_sequences(id) ON DELETE CASCADE,
  step_number     integer NOT NULL,
  day_offset      integer NOT NULL DEFAULT 0,
  channel         text NOT NULL DEFAULT 'WhatsApp',
  message_template text,
  objective       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- FK retroativa: empresa → cadência
ALTER TABLE public.companies
  ADD CONSTRAINT IF NOT EXISTS companies_sequence_id_fkey
  FOREIGN KEY (sequence_id) REFERENCES public.prospecting_sequences(id) ON DELETE SET NULL;

-- ---------- Metas de prospecção ----------
CREATE TABLE IF NOT EXISTS public.prospecting_goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period          text NOT NULL DEFAULT 'Mensal',
  target_count    integer NOT NULL DEFAULT 0,
  reference_date  date NOT NULL DEFAULT CURRENT_DATE,
  responsible_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           text,
  is_demo         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------- Origens de lead personalizáveis ----------
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  is_demo    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Origens padrão
INSERT INTO public.lead_sources (name) VALUES
  ('Google Maps'), ('Google'), ('Instagram'), ('Facebook'),
  ('Indicação'), ('Site'), ('Formulário'), ('Prospecção manual'),
  ('Lista importada'), ('Evento'), ('Networking'), ('Outro')
ON CONFLICT (name) DO NOTHING;

-- ---------- Sub-nichos ----------
CREATE TABLE IF NOT EXISTS public.sub_niches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche      text NOT NULL,
  name       text NOT NULL,
  is_demo    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(niche, name)
);

-- ---------- Cidades / regiões ----------
CREATE TABLE IF NOT EXISTS public.prospecting_cities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city       text NOT NULL,
  state      text,
  region     text,
  is_demo    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city, state)
);

-- =============================================================
-- RLS + GRANTS
-- =============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'prospecting_lists','prospecting_list_companies','prospecting_attempts',
    'prospecting_sequences','prospecting_sequence_steps','prospecting_goals',
    'lead_sources','sub_niches','prospecting_cities'
  ]
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY "%s_authenticated_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      t, t
    );
  END LOOP;
END $$;

-- Triggers de updated_at
CREATE OR REPLACE TRIGGER trg_prospecting_lists_updated
  BEFORE UPDATE ON public.prospecting_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_prospecting_sequences_updated
  BEFORE UPDATE ON public.prospecting_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_prospecting_goals_updated
  BEFORE UPDATE ON public.prospecting_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- VIEW: resumo de prospecção por empresa
-- =============================================================
CREATE OR REPLACE VIEW public.v_company_prospecting AS
SELECT
  c.id,
  c.name,
  c.trade_name,
  c.niche,
  c.sub_niche,
  c.city,
  c.state,
  c.district,
  c.phone,
  c.whatsapp,
  c.email,
  c.instagram,
  c.prospecting_status,
  c.prospecting_priority,
  c.prospecting_potential,
  c.prospecting_source,
  c.first_prospected_at,
  c.last_attempted_at,
  c.next_contact_at,
  c.attempt_count,
  c.assigned_to,
  c.interest_level,
  c.services_interest,
  c.estimated_contract_value,
  c.temperature,
  c.last_attempt_result,
  c.contact_name,
  c.contact_whatsapp,
  c.created_at
FROM public.companies c;

GRANT SELECT ON public.v_company_prospecting TO authenticated;
