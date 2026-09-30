ALTER TABLE public.niches ADD COLUMN IF NOT EXISTS solution text;

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial,
  client_name text NOT NULL,
  company text,
  niche_id uuid REFERENCES public.niches(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  bottlenecks text,
  solution text,
  discount_percent numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposals_authenticated_all ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial,
  client_name text NOT NULL,
  client_document text,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  payment_method text NOT NULL DEFAULT 'PIX',
  paid_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_authenticated_all ON public.receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_receipts_updated BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.niches n SET solution = COALESCE(n.recommended_services, '') WHERE solution IS NULL;