-- ============================================================================
-- Fix handle_new_user trigger for BizExit Platform
-- Created: 2025-11-11
-- Description: Updates handle_new_user to work with BizExit schema
-- ============================================================================

-- Drop existing trigger to update function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user function to include BizExit fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
  full_name_val TEXT;
  company_val TEXT;
  email_val TEXT;
  avatar_url_val TEXT;
BEGIN
  -- Extract email from auth.users
  email_val := NEW.email;
  
  -- Handle Google OAuth data
  IF NEW.raw_user_meta_data->>'iss' = 'https://accounts.google.com' THEN
    -- Extract username and full name from Google data
    username_val := COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'name',
      split_part(email_val, '@', 1)
    );
    full_name_val := COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(email_val, '@', 1)
    );
    avatar_url_val := NEW.raw_user_meta_data->>'avatar_url';
  ELSE
    -- For email/password signups, use raw_user_meta_data or generate from email
    username_val := COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'preferred_username',
      split_part(email_val, '@', 1)
    );
    full_name_val := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      username_val
    );
    avatar_url_val := NEW.raw_user_meta_data->>'avatar_url';
  END IF;

  -- Extract company
  company_val := NEW.raw_user_meta_data->>'company';

  -- Insert into profiles with all required fields
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    company,
    avatar_url,
    is_admin,
    newsletter_subscription,
    marketing_consent,
    role,  -- BizExit field
    email_verified,  -- BizExit field
    preferences,  -- BizExit field
    phone,  -- BizExit field
    linkedin_url,  -- BizExit field
    industry  -- BizExit field
  )
  VALUES (
    NEW.id,
    username_val,
    full_name_val,
    email_val,
    company_val,
    avatar_url_val,
    false,  -- is_admin (default)
    false,  -- newsletter_subscription (default)
    false,  -- marketing_consent (default)
    'buyer',  -- role (default - users can join organizations later)
    false,  -- email_verified (default)
    '{}'::jsonb,  -- preferences (default empty object)
    NULL,  -- phone (no default)
    NULL,  -- linkedin_url (no default)
    NULL  -- industry (no default)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new user with BizExit fields. Default role is buyer.';

