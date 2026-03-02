-- Confirm email for test user
UPDATE auth.users 
SET email_confirmed_at = now(),
    updated_at = now()
WHERE id = '6650d461-2a12-42df-a27a-9bcec2f45200';

-- Set tier to starter with 3 projects
UPDATE public.profiles 
SET tier = 'starter', 
    max_projects = 3, 
    full_name = 'Test Starter'
WHERE id = '6650d461-2a12-42df-a27a-9bcec2f45200';
