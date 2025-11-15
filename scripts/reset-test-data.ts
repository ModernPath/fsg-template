/**
 * Reset and Reseed Test Data Script
 * 
 * Removes all test data and recreates it
 * Run with: npm run reset-test-data
 * 
 * WARNING: This will DELETE all test users and their related data!
 * Use only in development environments.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { TEST_USERS } from './seed-test-data';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteTestUsers() {
  console.log('\n🗑️  Deleting test users...');

  for (const [key, userData] of Object.entries(TEST_USERS)) {
    try {
      // Get user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === userData.email);

      if (user) {
        // Delete user (cascade will handle related data)
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          console.error(`  ❌ Error deleting ${key}:`, error.message);
        } else {
          console.log(`  ✅ Deleted ${key} (${userData.email})`);
        }
      } else {
        console.log(`  ℹ️  ${key} not found (${userData.email})`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error with ${key}:`, error.message);
    }
  }
}

async function deleteTestOrganizations() {
  console.log('\n🗑️  Deleting test organizations...');

  const testOrgIds = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  ];

  for (const orgId of testOrgIds) {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) {
      console.error(`  ❌ Error deleting org ${orgId}:`, error.message);
    } else {
      console.log(`  ✅ Deleted organization ${orgId}`);
    }
  }
}

async function deleteTestCompanies() {
  console.log('\n🗑️  Deleting test companies...');

  const testCompanyIds = [
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003'
  ];

  for (const companyId of testCompanyIds) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      console.error(`  ❌ Error deleting company ${companyId}:`, error.message);
    } else {
      console.log(`  ✅ Deleted company ${companyId}`);
    }
  }
}

async function deleteTestDeals() {
  console.log('\n🗑️  Deleting test deals...');

  const testDealIds = [
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003'
  ];

  for (const dealId of testDealIds) {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) {
      console.error(`  ❌ Error deleting deal ${dealId}:`, error.message);
    } else {
      console.log(`  ✅ Deleted deal ${dealId}`);
    }
  }
}

async function deleteTestNDAs() {
  console.log('\n🗑️  Deleting test NDAs...');

  const testNDAIds = [
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003'
  ];

  for (const ndaId of testNDAIds) {
    const { error } = await supabase
      .from('ndas')
      .delete()
      .eq('id', ndaId);

    if (error) {
      console.error(`  ❌ Error deleting NDA ${ndaId}:`, error.message);
    } else {
      console.log(`  ✅ Deleted NDA ${ndaId}`);
    }
  }
}

async function deleteTestListings() {
  console.log('\n🗑️  Deleting test listings...');

  const testListingIds = [
    '40000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002'
  ];

  for (const listingId of testListingIds) {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error(`  ❌ Error deleting listing ${listingId}:`, error.message);
    } else {
      console.log(`  ✅ Deleted listing ${listingId}`);
    }
  }
}

async function deleteTestMaterials() {
  console.log('\n🗑️  Deleting test materials...');

  const testMaterialIds = [
    '50000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002'
  ];

  for (const materialId of testMaterialIds) {
    const { error } = await supabase
      .from('company_assets')
      .delete()
      .eq('id', materialId);

    if (error) {
      console.error(`  ❌ Error deleting material ${materialId}:`, error.message);
    } else {
      console.log(`  ✅ Deleted material ${materialId}`);
    }
  }
}

async function reseedTestData() {
  console.log('\n🌱 Reseeding test data...');
  
  // Import and run the seed script
  const { default: seedMain } = await import('./seed-test-data');
  // Note: The seed-test-data exports a main() function that we can't easily import
  // So we'll execute it via a child process instead
  const { execSync } = await import('child_process');
  
  try {
    execSync('npm run seed:test-data', { stdio: 'inherit' });
  } catch (error: any) {
    console.error('❌ Error reseeding data:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🔄 Starting test data reset...');
  console.log('==================================');
  console.log('⚠️  WARNING: This will delete ALL test data!');
  console.log('==================================\n');

  try {
    // Delete in reverse dependency order
    await deleteTestMaterials();
    await deleteTestListings();
    await deleteTestNDAs();
    await deleteTestDeals();
    await deleteTestCompanies();
    await deleteTestOrganizations();
    await deleteTestUsers();

    console.log('\n==================================');
    console.log('✅ Test data deletion completed!');
    console.log('==================================');

    // Reseed the data
    await reseedTestData();

    console.log('\n==================================');
    console.log('✅ Test data reset completed!');
    console.log('==================================');

  } catch (error: any) {
    console.error('\n❌ Error resetting data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

