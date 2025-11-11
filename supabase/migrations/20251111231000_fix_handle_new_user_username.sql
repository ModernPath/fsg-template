-- ============================================================================
-- Fix handle_new_user to set username and full_name defaults
-- Created: 2025-11-11 23:10:00
-- Description: Fixes user creation by providing defaults for NOT NULL fields
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
  _username TEXT;
  _full_name TEXT;
BEGIN
  -- Get role from metadata (default: buyer)
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'buyer'::user_role
  );

  -- Generate username from email (before @)
  _username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Get full name from metadata or generate from email
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1) -- Use email prefix as fallback
  );

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    role,
    email_verified,
    onboarding_completed,
    is_admin,
    company,
    newsletter_subscription,
    marketing_consent
  )
  VALUES (
    NEW.id,
    _username,
    _full_name,
    NEW.email,
    _role,
    NEW.email_confirmed_at IS NOT NULL,
    FALSE,
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, _role = 'admin'::user_role),
    NEW.raw_user_meta_data->>'company',
    COALESCE((NEW.raw_user_meta_data->>'newsletter_subscription')::BOOLEAN, FALSE),
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::BOOLEAN, FALSE)
  );

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile with defaults for username and full_name from email';

