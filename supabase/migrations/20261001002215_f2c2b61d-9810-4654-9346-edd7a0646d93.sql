ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS sub_niche text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS diagnosis_notes text,
  ADD COLUMN IF NOT EXISTS consultant text NOT NULL DEFAULT 'Lucas Santos',
  ADD COLUMN IF NOT EXISTS content jsonb;