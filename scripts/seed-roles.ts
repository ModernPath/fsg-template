/**
 * Seed Script: Demo Users for Each Role
 * 
 * Creates demo users with different roles for testing and demonstration
 * 
 * Usage: npm run seed:roles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Use local Supabase instance for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log(`📡 Using Supabase URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Demo user configurations
const demoUsers = [
  {
    email: 'visitor@bizexit.demo',
    password: 'DemoPassword123!',
    role: 'visitor',
    full_name: 'Vesa Vierailija',
    phone: '+358401234567',
  },
  {
    email: 'buyer@bizexit.demo',
    password: 'DemoPassword123!',
    role: 'buyer',
    full_name: 'Olli Ostaja',
    phone: '+358401234568',
  },
  {
    email: 'seller@bizexit.demo',
    password: 'DemoPassword123!',
    role: 'seller',
    full_name: 'Maija Myyjä',
    phone: '+358401234569',
  },
  {
    email: 'broker@bizexit.demo',
    password: 'DemoPassword123!',
    role: 'broker',
    full_name: 'Ville Välittäjä',
    phone: '+358401234570',
  },
  {
    email: 'partner@bizexit.demo',
    password: 'DemoPassword123!',
    role: 'partner',
    full_name: 'Kaisa Kumppani',
    phone: '+358401234571',
  },
  {
    email: 'admin@bizexit.demo',
    password: 'DemoPassword123!',
    role: 'admin',
    full_name: 'Aleksi Admin',
    phone: '+358401234572',
  },
];

async function seedRoles() {
  console.log('🌱 Starting role seed...\n');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const demoUser of demoUsers) {
    try {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', demoUser.email)
        .single();

      if (existingProfile) {
        console.log(`⏭️  User ${demoUser.email} (${demoUser.role}) already exists - skipping`);
        skippedCount++;
        continue;
      }

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: demoUser.full_name,
        },
      });

      if (authError) {
        console.error(`❌ Error creating auth user ${demoUser.email}:`, authError.message);
        console.error(`   Full error:`, JSON.stringify(authError, null, 2));
        errorCount++;
        continue;
      }

      if (!authData.user) {
        console.error(`❌ No user data returned for ${demoUser.email}`);
        errorCount++;
        continue;
      }

      // Update profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: demoUser.role,
          full_name: demoUser.full_name,
          phone: demoUser.phone,
          email_verified: true,
          onboarding_completed: demoUser.role !== 'visitor', // Visitors don't need onboarding
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`❌ Error updating profile for ${demoUser.email}:`, profileError.message);
        errorCount++;
        continue;
      }

      // Create organization for seller, broker, partner, admin
      if (['seller', 'broker', 'partner', 'admin'].includes(demoUser.role)) {
        // Determine organization type and name
        let orgType: string;
        let orgName: string;
        let orgSlug: string;
        let userOrgRole: string;

        switch (demoUser.role) {
          case 'admin':
            orgType = 'platform';
            orgName = `${demoUser.full_name} Platform`;
            orgSlug = `${demoUser.email.split('@')[0]}-platform`;
            userOrgRole = 'admin';
            break;
          case 'seller':
            orgType = 'seller';
            orgName = `${demoUser.full_name} Oy`;
            orgSlug = `${demoUser.email.split('@')[0]}-oy`;
            userOrgRole = 'seller';
            break;
          case 'broker':
            orgType = 'broker';
            orgName = `${demoUser.full_name} Oy`;
            orgSlug = `${demoUser.email.split('@')[0]}-oy`;
            userOrgRole = 'broker';
            break;
          case 'partner':
            orgType = 'broker'; // Partner uses broker type
            orgName = `${demoUser.full_name} Rahoitus`;
            orgSlug = `${demoUser.email.split('@')[0]}-rahoitus`;
            userOrgRole = 'broker'; // Partner uses broker role in user_organizations
            break;
          default:
            orgType = 'broker';
            orgName = `${demoUser.full_name} Oy`;
            orgSlug = `${demoUser.email.split('@')[0]}-oy`;
            userOrgRole = demoUser.role;
        }

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: orgSlug,
            type: orgType,
          })
          .select()
          .single();

        if (orgError) {
          console.error(`❌ Error creating organization for ${demoUser.email}:`, orgError.message);
        } else if (org) {
          // Link user to organization
          const { error: userOrgError } = await supabase
            .from('user_organizations')
            .insert({
              user_id: authData.user.id,
              organization_id: org.id,
              role: userOrgRole,
            });

          if (userOrgError) {
            console.error(`❌ Error linking user to organization:`, userOrgError.message);
          } else {
            console.log(`   📁 Created organization: ${orgName}`);
          }
        }
      }

      console.log(`✅ Created user ${demoUser.email} (${demoUser.role})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Unexpected error for ${demoUser.email}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n🎯 Demo Credentials:');
  console.log('   Email pattern: [role]@bizexit.demo');
  console.log('   Password (all): DemoPassword123!');
  console.log('\n   Roles:');
  demoUsers.forEach((user) => {
    console.log(`   - ${user.email} (${user.full_name})`);
  });
  console.log('\n✨ Done!\n');
}

// Run seed
seedRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

