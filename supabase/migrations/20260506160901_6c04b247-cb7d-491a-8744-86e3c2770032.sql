
-- 1) Prevent privilege escalation via profiles UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role        = (SELECT p.role        FROM public.profiles p WHERE p.id = auth.uid())
  AND tier        = (SELECT p.tier        FROM public.profiles p WHERE p.id = auth.uid())
  AND max_projects = (SELECT p.max_projects FROM public.profiles p WHERE p.id = auth.uid())
  AND tier_expires_at IS NOT DISTINCT FROM (SELECT p.tier_expires_at FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2) Restrict checks policies to authenticated
DROP POLICY IF EXISTS "Users can view checks of own projects" ON public.checks;
DROP POLICY IF EXISTS "Users can insert checks to own projects" ON public.checks;
DROP POLICY IF EXISTS "Users can update checks of own projects" ON public.checks;
DROP POLICY IF EXISTS "Users can delete checks of own projects" ON public.checks;

CREATE POLICY "Users can view checks of own projects"
ON public.checks FOR SELECT TO authenticated
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert checks to own projects"
ON public.checks FOR INSERT TO authenticated
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update checks of own projects"
ON public.checks FOR UPDATE TO authenticated
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete checks of own projects"
ON public.checks FOR DELETE TO authenticated
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- 3) Restrict custom_cost_overrides policies to authenticated
DROP POLICY IF EXISTS "Users can view own cost overrides" ON public.custom_cost_overrides;
DROP POLICY IF EXISTS "Users can insert own cost overrides" ON public.custom_cost_overrides;
DROP POLICY IF EXISTS "Users can update own cost overrides" ON public.custom_cost_overrides;
DROP POLICY IF EXISTS "Users can delete own cost overrides" ON public.custom_cost_overrides;

CREATE POLICY "Users can view own cost overrides"
ON public.custom_cost_overrides FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost overrides"
ON public.custom_cost_overrides FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost overrides"
ON public.custom_cost_overrides FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost overrides"
ON public.custom_cost_overrides FOR DELETE TO authenticated
USING (auth.uid() = user_id);
