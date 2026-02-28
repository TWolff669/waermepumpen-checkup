
-- 1. Erweitere profiles um Tier-Management-Spalten
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS max_projects integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier_expires_at timestamptz;

-- 2. Erweitere projects um scenario_data
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS scenario_data jsonb;

-- 3. Erstelle custom_cost_overrides Tabelle
CREATE TABLE IF NOT EXISTS public.custom_cost_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  massnahme_key text NOT NULL,
  cost_min numeric NOT NULL,
  cost_max numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, massnahme_key)
);

-- RLS aktivieren
ALTER TABLE public.custom_cost_overrides ENABLE ROW LEVEL SECURITY;

-- RLS-Policies für custom_cost_overrides
CREATE POLICY "Users can view own cost overrides"
  ON public.custom_cost_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost overrides"
  ON public.custom_cost_overrides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost overrides"
  ON public.custom_cost_overrides FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost overrides"
  ON public.custom_cost_overrides FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE TRIGGER update_custom_cost_overrides_updated_at
  BEFORE UPDATE ON public.custom_cost_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Setze max_projects basierend auf bestehendem Tier
UPDATE public.profiles SET max_projects = CASE
  WHEN tier = 'einzel' THEN 1
  WHEN tier = 'starter' THEN 3
  WHEN tier = 'professional' THEN 15
  ELSE 0
END;
