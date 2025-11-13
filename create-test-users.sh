#!/bin/bash

# Script to create test users via Supabase REST API
# This ensures passwords are hashed correctly

SUPABASE_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "🔐 Creating test users..."

# Function to create user
create_user() {
  local email=$1
  local password=$2
  local role=$3
  local is_admin=${4:-false}
  
  echo "Creating $email..."
  
  # Create user via API
  response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${email}\", \"password\": \"${password}\"}")
  
  user_id=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$user_id" ]; then
    echo "  ❌ Failed to create $email"
    return
  fi
  
  echo "  ✅ Created with ID: $user_id"
  
  # Update profile
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    UPDATE profiles SET 
      role = '$role', 
      email_verified = true, 
      onboarding_completed = true,
      is_admin = $is_admin
    WHERE id = '$user_id';
    
    UPDATE auth.users SET email_confirmed_at = NOW() 
    WHERE id = '$user_id';
  " > /dev/null 2>&1
  
  # Add to organization (seller org)
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    INSERT INTO user_organizations (user_id, organization_id, role, active)
    VALUES ('$user_id', '550e8400-e29b-41d4-a716-446655440004', 'admin', true)
    ON CONFLICT DO NOTHING;
  " > /dev/null 2>&1
  
  echo "  ✅ Profile updated"
}

# Delete old test users first
echo "🗑️  Deleting old test users..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
  DELETE FROM auth.users WHERE email IN (
    'newadmin@test.com', 
    'newbroker@test.com', 
    'newseller@test.com', 
    'newbuyer@test.com'
  );
" > /dev/null 2>&1

# Create new users
create_user "newadmin@test.com" "test123" "admin" "true"
create_user "newseller@test.com" "test123" "seller" "false"
create_user "newbroker@test.com" "test123" "broker" "false"
create_user "newbuyer@test.com" "test123" "buyer" "false"

echo ""
echo "✅ All test users created!"
echo ""
echo "📝 Login credentials:"
echo "   Admin:  newadmin@test.com  / test123"
echo "   Seller: newseller@test.com / test123"
echo "   Broker: newbroker@test.com / test123"
echo "   Buyer:  newbuyer@test.com  / test123"
echo ""

