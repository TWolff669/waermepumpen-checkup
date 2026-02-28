
-- Create checks table for tracking efficiency checks over time
CREATE TABLE public.checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  check_date date NOT NULL DEFAULT CURRENT_DATE,
  heating_period text,
  input_data jsonb NOT NULL,
  result_data jsonb NOT NULL,
  is_advanced boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage checks of own projects
CREATE POLICY "Users can view checks of own projects"
ON public.checks FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert checks to own projects"
ON public.checks FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update checks of own projects"
ON public.checks FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete checks of own projects"
ON public.checks FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_checks_project_id ON public.checks(project_id);
CREATE INDEX idx_checks_check_date ON public.checks(check_date);
