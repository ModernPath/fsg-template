-- Create a temporary function to sign up users
CREATE OR REPLACE FUNCTION create_test_user(
    email TEXT,
    password TEXT,
    user_role TEXT,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE
)
RETURNS uuid AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Use the auth.signup function to create the user
    SELECT auth.uid() INTO user_id FROM auth.signup(email, password);

    -- Update the user's profile with additional metadata
    INSERT INTO public.profiles (id, username, full_name, email, role, email_verified, is_admin, onboarding_completed)
    VALUES (user_id, split_part(email, '@', 1), full_name, email, user_role, TRUE, is_admin, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        is_admin = EXCLUDED.is_admin,
        onboarding_completed = EXCLUDED.onboarding_completed;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to create test users
SELECT create_test_user('admin@test.com', 'test123', 'admin', 'Admin User', TRUE);
SELECT create_test_user('broker@test.com', 'test123', 'broker', 'Broker User');
SELECT create_test_user('seller@test.com', 'test123', 'seller', 'Seller User');
SELECT create_test_user('buyer@test.com', 'test123', 'buyer', 'Buyer User');

-- Drop the temporary function
DROP FUNCTION create_test_user(TEXT, TEXT, TEXT, TEXT, BOOLEAN);

-- Link users to organizations (assuming organizations are already seeded)
INSERT INTO public.user_organizations (user_id, organization_id, role, active) VALUES
  ((SELECT id FROM auth.users WHERE email = 'admin@test.com'), '550e8400-e29b-41d4-a716-446655440003', 'admin', true),
  ((SELECT id FROM auth.users WHERE email = 'broker@test.com'), '550e8400-e29b-41d4-a716-446655440001', 'admin', true),
  ((SELECT id FROM auth.users WHERE email = 'seller@test.com'), '550e8400-e29b-41d4-a716-446655440004', 'admin', true),
  ((SELECT id FROM auth.users WHERE email = 'buyer@test.com'), '550e8400-e29b-41d4-a716-446655440001', 'analyst', true)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = EXCLUDED.role,
  active = EXCLUDED.active;
