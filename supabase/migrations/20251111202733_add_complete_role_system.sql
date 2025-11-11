-- ============================================================================
-- BizExit Complete Role System and AI Ecosystem
-- ============================================================================
-- Version: 3.0 (Fixed)
-- Date: 2025-01-11
-- ============================================================================

-- ============================================================================
-- 1. CREATE USER_ROLE ENUM TYPE
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'visitor',    -- Non-registered user (public view)
    'buyer',      -- Registered user looking to buy companies
    'seller',     -- Company owner selling their business
    'broker',     -- Professional intermediary/agent
    'partner',    -- Banks, insurance, law firms, financial institutions
    'admin'       -- Platform administrator
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. UPDATE PROFILES TABLE - CAREFULLY
-- ============================================================================

-- Drop old constraint if exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_profile_role;

-- Step 1: Drop existing default
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Step 2: Update existing data to valid enum values (if any exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
    UPDATE profiles
    SET role = CASE
      WHEN role::text IN ('visitor', 'buyer', 'seller', 'broker', 'partner', 'admin') 
        THEN role::text
      ELSE 'buyer'
    END;
  END IF;
END $$;

-- Step 3: Change column type (separate ALTER statements)
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'buyer'::user_role;

-- Step 4: Add onboarding flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Step 5: Create index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- 3. CREATE ROLE PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  is_allowed BOOLEAN DEFAULT TRUE,
  conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- ============================================================================
-- 4. CREATE USER ROLES HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_role user_role,
  new_role user_role NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_history_user 
  ON user_roles_history(user_id, created_at DESC);

-- ============================================================================
-- 5. CREATE AI INTERACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id TEXT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB,
  model_used TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  feedback INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user 
  ON ai_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_conversation 
  ON ai_interactions(conversation_id);

-- ============================================================================
-- 6. CREATE AI GENERATED CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  model_used TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user 
  ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_resource 
  ON ai_generated_content(resource_type, resource_id);

-- ============================================================================
-- 7. INSERT DEFAULT ROLE PERMISSIONS
-- ============================================================================

-- Visitor permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('visitor', 'listings', 'view'),
  ('visitor', 'companies', 'search')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Buyer permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('buyer', 'listings', 'view'),
  ('buyer', 'companies', 'view'),
  ('buyer', 'companies', 'search'),
  ('buyer', 'deals', 'create'),
  ('buyer', 'deals', 'view'),
  ('buyer', 'deals', 'update'),
  ('buyer', 'ndas', 'sign'),
  ('buyer', 'ndas', 'view'),
  ('buyer', 'documents', 'view'),
  ('buyer', 'buyer_profiles', 'create'),
  ('buyer', 'buyer_profiles', 'view'),
  ('buyer', 'buyer_profiles', 'update'),
  ('buyer', 'buyer_profiles', 'delete')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Seller permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('seller', 'companies', 'create'),
  ('seller', 'companies', 'view'),
  ('seller', 'companies', 'update'),
  ('seller', 'companies', 'delete'),
  ('seller', 'listings', 'create'),
  ('seller', 'listings', 'view'),
  ('seller', 'listings', 'update'),
  ('seller', 'listings', 'delete'),
  ('seller', 'deals', 'view'),
  ('seller', 'deals', 'update'),
  ('seller', 'documents', 'create'),
  ('seller', 'documents', 'view'),
  ('seller', 'documents', 'update'),
  ('seller', 'documents', 'delete'),
  ('seller', 'ndas', 'view'),
  ('seller', 'buyer_profiles', 'view')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Broker permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('broker', 'companies', 'create'),
  ('broker', 'companies', 'view'),
  ('broker', 'companies', 'update'),
  ('broker', 'companies', 'delete'),
  ('broker', 'listings', 'create'),
  ('broker', 'listings', 'view'),
  ('broker', 'listings', 'update'),
  ('broker', 'listings', 'delete'),
  ('broker', 'deals', 'create'),
  ('broker', 'deals', 'view'),
  ('broker', 'deals', 'update'),
  ('broker', 'deals', 'delete'),
  ('broker', 'documents', 'create'),
  ('broker', 'documents', 'view'),
  ('broker', 'documents', 'update'),
  ('broker', 'documents', 'delete'),
  ('broker', 'ndas', 'create'),
  ('broker', 'ndas', 'view'),
  ('broker', 'ndas', 'update'),
  ('broker', 'buyer_profiles', 'view'),
  ('broker', 'buyer_profiles', 'search')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Partner permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('partner', 'companies', 'view'),
  ('partner', 'deals', 'view'),
  ('partner', 'documents', 'view'),
  ('partner', 'documents', 'create'),
  ('partner', 'ndas', 'view'),
  ('partner', 'payments', 'create'),
  ('partner', 'payments', 'view')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Admin permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('admin', 'companies', 'create'),
  ('admin', 'companies', 'view'),
  ('admin', 'companies', 'update'),
  ('admin', 'companies', 'delete'),
  ('admin', 'listings', 'create'),
  ('admin', 'listings', 'view'),
  ('admin', 'listings', 'update'),
  ('admin', 'listings', 'delete'),
  ('admin', 'deals', 'create'),
  ('admin', 'deals', 'view'),
  ('admin', 'deals', 'update'),
  ('admin', 'deals', 'delete'),
  ('admin', 'documents', 'create'),
  ('admin', 'documents', 'view'),
  ('admin', 'documents', 'update'),
  ('admin', 'documents', 'delete'),
  ('admin', 'ndas', 'create'),
  ('admin', 'ndas', 'view'),
  ('admin', 'ndas', 'update'),
  ('admin', 'ndas', 'delete'),
  ('admin', 'buyer_profiles', 'create'),
  ('admin', 'buyer_profiles', 'view'),
  ('admin', 'buyer_profiles', 'update'),
  ('admin', 'buyer_profiles', 'delete'),
  ('admin', 'payments', 'create'),
  ('admin', 'payments', 'view'),
  ('admin', 'payments', 'update'),
  ('admin', 'users', 'view'),
  ('admin', 'users', 'update'),
  ('admin', 'users', 'delete'),
  ('admin', 'audit', 'view')
ON CONFLICT (role, resource, action) DO NOTHING;

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role user_role;
  v_has_perm BOOLEAN;
BEGIN
  SELECT p.role INTO v_user_role
  FROM profiles p
  WHERE p.id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.role = v_user_role
      AND rp.resource = p_resource
      AND rp.action = p_action
      AND rp.is_allowed = TRUE
  ) INTO v_has_perm;
  
  RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change user role (admin only)
CREATE OR REPLACE FUNCTION change_user_role(
  p_target_user_id UUID,
  p_new_user_role user_role,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_id UUID;
  v_current_user_role user_role;
  v_old_user_role user_role;
BEGIN
  v_current_user_id := auth.uid();
  
  SELECT p.role INTO v_current_user_role
  FROM profiles p
  WHERE p.id = v_current_user_id;
  
  IF v_current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  SELECT p.role INTO v_old_user_role
  FROM profiles p
  WHERE p.id = p_target_user_id;
  
  UPDATE profiles
  SET role = p_new_user_role
  WHERE id = p_target_user_id;
  
  INSERT INTO user_roles_history (user_id, old_role, new_role, changed_by, reason)
  VALUES (p_target_user_id, v_old_user_role, p_new_user_role, v_current_user_id, p_reason);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Role Permissions policies
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Everyone can read role permissions" ON role_permissions;
CREATE POLICY "Everyone can read role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- User Roles History policies
DROP POLICY IF EXISTS "Users can view own role history" ON user_roles_history;
CREATE POLICY "Users can view own role history"
  ON user_roles_history FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all role history" ON user_roles_history;
CREATE POLICY "Admins can view all role history"
  ON user_roles_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- AI Interactions policies
DROP POLICY IF EXISTS "Users can manage own AI interactions" ON ai_interactions;
CREATE POLICY "Users can manage own AI interactions"
  ON ai_interactions FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all AI interactions" ON ai_interactions;
CREATE POLICY "Admins can view all AI interactions"
  ON ai_interactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- AI Generated Content policies
DROP POLICY IF EXISTS "Users can manage own AI content" ON ai_generated_content;
CREATE POLICY "Users can manage own AI content"
  ON ai_generated_content FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all AI content" ON ai_generated_content;
CREATE POLICY "Admins can view all AI content"
  ON ai_generated_content FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 10. UPDATE handle_new_user TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    email_verified,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    'buyer'::user_role,
    NEW.email_confirmed_at IS NOT NULL,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TYPE user_role IS 'User role enum: visitor, buyer, seller, broker, partner, admin';
COMMENT ON TABLE role_permissions IS 'Role-based permissions for resources and actions';
COMMENT ON TABLE user_roles_history IS 'Audit log for user role changes';
COMMENT ON TABLE ai_interactions IS 'Tracks all AI chat interactions with users';
COMMENT ON TABLE ai_generated_content IS 'Stores AI-generated content (teasers, IMs, CIMs, etc.)';
COMMENT ON FUNCTION has_permission IS 'Check if user has permission for resource action';
COMMENT ON FUNCTION change_user_role IS 'Change user role (admin only) with audit logging';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

