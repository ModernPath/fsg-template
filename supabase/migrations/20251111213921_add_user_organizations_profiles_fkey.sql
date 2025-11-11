-- Add foreign key constraint from user_organizations to profiles
-- This allows PostgREST to automatically join profiles with user_organizations
-- which is needed for the dashboard to fetch user's organization data

-- Drop existing constraint if it exists (shouldn't, but just in case)
ALTER TABLE user_organizations 
DROP CONSTRAINT IF EXISTS user_organizations_user_id_profiles_fkey;

-- Add the foreign key constraint
-- user_id in user_organizations now references profiles.id in addition to auth.users.id
-- Since profiles.id is the same as auth.users.id, this is safe
ALTER TABLE user_organizations 
ADD CONSTRAINT user_organizations_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- This enables queries like:
-- SELECT *, user_organizations(...) FROM profiles WHERE id = '...'
-- which PostgREST can now automatically resolve

