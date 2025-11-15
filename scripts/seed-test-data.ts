/**
 * Seed Test Data Script
 * 
 * Creates comprehensive test data for all database tables
 * Run with: npm run seed-test-data
 * 
 * USAGE:
 * - Creates test users with different roles
 * - Creates test companies, deals, materials, etc.
 * - Safe to run multiple times (uses upsert where possible)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

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

// Test user credentials
export const TEST_USERS = {
  admin: {
    email: 'admin@bizexit.test',
    password: 'TestAdmin123!',
    full_name: 'Admin User',
    username: 'admin',
    role: 'admin',
    is_admin: true
  },
  broker: {
    email: 'broker@bizexit.test',
    password: 'TestBroker123!',
    full_name: 'Matti Meikäläinen',
    username: 'matti',
    role: 'broker'
  },
  seller: {
    email: 'seller@bizexit.test',
    password: 'TestSeller123!',
    full_name: 'Liisa Myyjä',
    username: 'liisa',
    role: 'seller'
  },
  buyer: {
    email: 'buyer@bizexit.test',
    password: 'TestBuyer123!',
    full_name: 'Kalle Ostaja',
    username: 'kalle',
    role: 'buyer'
  },
  partner: {
    email: 'partner@bizexit.test',
    password: 'TestPartner123!',
    full_name: 'Maria Kumppani',
    username: 'maria',
    role: 'partner'
  }
};

async function createTestUsers() {
  console.log('\n📝 Creating test users...');

  const createdUsers: Record<string, any> = {};

  for (const [key, userData] of Object.entries(TEST_USERS)) {
    try {
      // Check if profile already exists by email OR username
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, username')
        .or(`email.eq.${userData.email},username.eq.${userData.username}`)
        .maybeSingle();

      let userId: string | undefined;

      if (existingProfile) {
        console.log(`  ℹ️  ${key} already exists (${userData.email})`);
        userId = existingProfile.id;
        createdUsers[key] = { id: userId, email: userData.email };
        
        // Update profile to ensure correct role
        await supabase
          .from('profiles')
          .update({
            username: userData.username,
            full_name: userData.full_name,
            role: userData.role,
            is_admin: userData.is_admin || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        console.log(`  ✅ Updated ${key} profile`);
      } else {
        // Create user via admin API
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role,
            username: userData.username
          }
        });

        if (createError) {
          console.error(`  ❌ Auth error for ${key}:`, createError.message);
          console.log(`  ⚠️  Attempting direct profile insert...`);
          
          // Fallback: Create profile directly with valid UUID
          const crypto = await import('crypto');
          const fallbackId = crypto.randomUUID();
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: fallbackId,
              email: userData.email,
              username: userData.username,
              full_name: userData.full_name,
              role: userData.role,
              is_admin: userData.is_admin || false,
              email_verified: false,
              onboarding_completed: true
            });
            
          if (!profileError) {
            userId = fallbackId;
            createdUsers[key] = { id: userId, email: userData.email };
            console.log(`  ⚠️  Created ${key} profile (auth failed, but profile exists)`);
          } else {
            console.error(`  ❌ Complete failure for ${key}:`, profileError.message);
            console.error(`     Code:`, profileError.code);
            console.error(`     Details:`, JSON.stringify(profileError.details, null, 2));
            continue;
          }
        } else if (authData?.user) {
          userId = authData.user.id;
          createdUsers[key] = authData.user;
          console.log(`  ✅ Created ${key} (${userData.email})`);
          
          // Ensure profile has correct data
          await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userData.email,
              username: userData.username,
              full_name: userData.full_name,
              role: userData.role,
              is_admin: userData.is_admin || false,
              email_verified: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
        }
      }

      if (!userId) {
        console.error(`  ❌ No user ID for ${key}`);
        continue;
      }

    } catch (error: any) {
      console.error(`  ❌ Error with ${key}:`, error.message);
    }
  }

  return createdUsers;
}

async function createTestOrganizations(users: Record<string, any>) {
  console.log('\n🏢 Creating test organizations...');

  const organizations = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'BizExit Demo Oy',
      slug: 'bizexit-demo',
      business_id: '1234567-8',
      type: 'broker',
      country: 'Finland'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Test Seller Company Oy',
      slug: 'test-seller',
      business_id: '8765432-1',
      type: 'seller',
      country: 'Finland'
    }
  ];

  for (const org of organizations) {
    const { error } = await supabase
      .from('organizations')
      .upsert(org, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error creating ${org.name}:`, error.message);
    } else {
      console.log(`  ✅ ${org.name}`);
    }
  }

  // Link users to organizations
  console.log('\n👥 Linking users to organizations...');

  const userOrgLinks = [
    { user_id: users.broker?.id, organization_id: organizations[0].id, role: 'broker' },
    { user_id: users.seller?.id, organization_id: organizations[1].id, role: 'seller' },
    { user_id: users.partner?.id, organization_id: organizations[0].id, role: 'viewer' },
  ];

  for (const link of userOrgLinks) {
    if (!link.user_id) continue;

    const { error } = await supabase
      .from('user_organizations')
      .upsert({
        ...link,
        active: true
      }, { 
        onConflict: 'user_id,organization_id' 
      });

    if (error) {
      console.error(`  ❌ Error linking user:`, error.message);
    } else {
      console.log(`  ✅ User linked to organization`);
    }
  }

  return organizations;
}

async function createTestCompanies(organizations: any[]) {
  console.log('\n🏭 Creating test companies...');

  const companies = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      organization_id: organizations[1].id,
      name: 'TechStart Oy',
      legal_name: 'TechStart Innovations Oy',
      business_id: '2345678-9',
      industry: 'Technology',
      description: 'Innovative SaaS company specializing in business automation',
      country: 'Finland',
      city: 'Helsinki',
      founded_year: 2018,
      employees_count: 25,
      website: 'https://techstart.example.com',
      asking_price: 2500000,
      currency: 'EUR',
      legal_structure: 'oy'
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      organization_id: organizations[1].id,
      name: 'Nordic Retail Solutions',
      legal_name: 'Nordic Retail Solutions Oy',
      business_id: '3456789-0',
      industry: 'Retail',
      description: 'E-commerce platform for Nordic market',
      country: 'Finland',
      city: 'Tampere',
      founded_year: 2015,
      employees_count: 45,
      website: 'https://nordicretail.example.com',
      asking_price: 4200000,
      currency: 'EUR',
      legal_structure: 'oy'
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      organization_id: organizations[1].id,
      name: 'CleanTech Industries',
      legal_name: 'CleanTech Industries Oy',
      business_id: '4567890-1',
      industry: 'Manufacturing',
      description: 'Sustainable manufacturing solutions',
      country: 'Finland',
      city: 'Oulu',
      founded_year: 2012,
      employees_count: 120,
      website: 'https://cleantech.example.com',
      asking_price: 8500000,
      currency: 'EUR',
      legal_structure: 'oy'
    }
  ];

  for (const company of companies) {
    const { error } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error creating ${company.name}:`, error.message);
    } else {
      console.log(`  ✅ ${company.name}`);
    }
  }

  return companies;
}

async function createTestFinancials(companies: any[]) {
  console.log('\n💰 Creating test financial data...');

  const financials = [
    {
      company_id: companies[0].id,
      fiscal_year: 2023,
      revenue: 850000,
      ebitda: 210000,
      net_income: 145000,
      total_assets: 450000,
      total_liabilities: 180000,
      currency: 'EUR'
    },
    {
      company_id: companies[1].id,
      fiscal_year: 2023,
      revenue: 2100000,
      ebitda: 480000,
      net_income: 320000,
      total_assets: 1200000,
      total_liabilities: 420000,
      currency: 'EUR'
    },
    {
      company_id: companies[2].id,
      fiscal_year: 2023,
      revenue: 5200000,
      ebitda: 980000,
      net_income: 620000,
      total_assets: 3800000,
      total_liabilities: 1200000,
      currency: 'EUR'
    }
  ];

  for (const financial of financials) {
    const { error } = await supabase
      .from('company_financials')
      .upsert(financial, { 
        onConflict: 'company_id,fiscal_year' 
      });

    if (error) {
      console.error(`  ❌ Error creating financials:`, error.message);
    } else {
      console.log(`  ✅ Financials for ${financial.fiscal_year}`);
    }
  }
}

async function createTestDeals(companies: any[], users: Record<string, any>) {
  console.log('\n🤝 Creating test deals...');

  const deals = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      company_id: companies[0].id,
      organization_id: companies[0].organization_id,
      buyer_id: users.buyer?.id,
      name: 'TechStart Acquisition',
      current_stage: 'due_diligence',
      deal_value: 2500000,
      currency: 'EUR'
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      company_id: companies[1].id,
      organization_id: companies[1].organization_id,
      buyer_id: users.buyer?.id,
      name: 'Nordic Retail Deal',
      current_stage: 'negotiation',
      deal_value: 4200000,
      currency: 'EUR'
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      company_id: companies[2].id,
      organization_id: companies[2].organization_id,
      name: 'CleanTech Investment',
      current_stage: 'signing',
      deal_value: 8500000,
      currency: 'EUR'
    }
  ];

  for (const deal of deals) {
    const { error } = await supabase
      .from('deals')
      .upsert(deal, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error creating ${deal.name}:`, error.message);
    } else {
      console.log(`  ✅ ${deal.name}`);
    }
  }

  return deals;
}

async function createTestNDAs(companies: any[], users: Record<string, any>) {
  console.log('\n📄 Creating test NDAs...');

  const { generateNDATemplate } = await import('../lib/nda-template');

  const ndas = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      company_id: companies[0].id,
      buyer_id: users.buyer?.id,
      recipient_name: users.buyer?.full_name || 'Kalle Ostaja',
      recipient_email: users.buyer?.email || 'buyer@bizexit.test',
      recipient_company: 'Buyer Corporation Oy',
      recipient_address: 'Ostajantie 10, 00100 Helsinki, Finland',
      purpose: 'M&A Due Diligence and Business Evaluation for potential acquisition of TechStart Oy',
      status: 'signed',
      template_version: 'v1.0',
      signed_at: new Date('2024-01-15').toISOString(),
      signed_by: users.buyer?.id,
      expires_at: new Date('2027-01-15').toISOString(),
      created_by: users.seller?.id,
      content: generateNDATemplate({
        company_name: companies[0].legal_name || companies[0].name,
        company_business_id: companies[0].business_id,
        company_address: `${companies[0].city}, Finland`,
        recipient_name: 'Kalle Ostaja',
        recipient_email: 'buyer@bizexit.test',
        recipient_company: 'Buyer Corporation Oy',
        recipient_address: 'Ostajantie 10, 00100 Helsinki, Finland',
        purpose: 'M&A Due Diligence and Business Evaluation for potential acquisition',
        term_years: 3,
        effective_date: '2024-01-15'
      })
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      company_id: companies[1].id,
      buyer_id: users.buyer?.id,
      recipient_name: users.buyer?.full_name || 'Kalle Ostaja',
      recipient_email: users.buyer?.email || 'buyer@bizexit.test',
      purpose: 'Initial discussion and evaluation of Nordic Retail Solutions',
      status: 'pending',
      template_version: 'v1.0',
      expires_at: new Date('2027-06-01').toISOString(),
      created_by: users.seller?.id,
      content: generateNDATemplate({
        company_name: companies[1].legal_name || companies[1].name,
        company_business_id: companies[1].business_id,
        company_address: `${companies[1].city}, Finland`,
        recipient_name: 'Kalle Ostaja',
        recipient_email: 'buyer@bizexit.test',
        purpose: 'Initial discussion and evaluation',
        term_years: 3,
        effective_date: new Date().toISOString()
      })
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      company_id: companies[2].id,
      buyer_id: users.buyer?.id,
      recipient_name: users.buyer?.full_name || 'Kalle Ostaja',
      recipient_email: users.buyer?.email || 'buyer@bizexit.test',
      recipient_company: 'Industrial Holdings AB',
      purpose: 'Strategic acquisition evaluation of CleanTech Industries',
      status: 'signed',
      template_version: 'v1.0',
      signed_at: new Date('2024-03-20').toISOString(),
      signed_by: users.buyer?.id,
      expires_at: new Date('2027-03-20').toISOString(),
      created_by: users.seller?.id,
      content: generateNDATemplate({
        company_name: companies[2].legal_name || companies[2].name,
        company_business_id: companies[2].business_id,
        company_address: `${companies[2].city}, Finland`,
        recipient_name: 'Kalle Ostaja',
        recipient_email: 'buyer@bizexit.test',
        recipient_company: 'Industrial Holdings AB',
        purpose: 'Strategic acquisition evaluation',
        term_years: 3,
        effective_date: '2024-03-20'
      })
    }
  ];

  for (const nda of ndas) {
    const { error } = await supabase
      .from('ndas')
      .upsert(nda, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error creating NDA:`, error.message);
    } else {
      console.log(`  ✅ NDA for company ${nda.company_id.substring(0, 8)}...`);
    }
  }
}

async function createTestListings(companies: any[]) {
  console.log('\n📋 Creating test listings...');

  const listings = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      company_id: companies[0].id,
      title: 'Innovative SaaS Company for Sale',
      short_description: 'Profitable SaaS business with recurring revenue and strong growth',
      status: 'active',
      asking_price: 2500000,
      currency: 'EUR',
      published_at: new Date().toISOString()
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      company_id: companies[1].id,
      title: 'Established E-commerce Platform',
      short_description: 'Nordic market leader with 45 employees and proven track record',
      status: 'active',
      asking_price: 4200000,
      currency: 'EUR',
      published_at: new Date().toISOString()
    }
  ];

  for (const listing of listings) {
    const { error } = await supabase
      .from('listings')
      .upsert(listing, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error creating listing:`, error.message);
    } else {
      console.log(`  ✅ ${listing.title}`);
    }
  }
}

async function createTestMaterials(companies: any[]) {
  console.log('\n📊 Creating test materials...');

  const materials = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      company_id: companies[0].id,
      name: 'TechStart Teaser',
      description: 'Investment opportunity teaser for TechStart Oy',
      type: 'document',
      mime_type: 'application/pdf',
      file_size: 1024000,
      storage_path: '/materials/techstart-teaser.pdf',
      gamma_presentation_url: 'https://gamma.app/docs/techstart-teaser',
      generated: true,
      access_level: 'teaser',
      generation_status: 'ai_generated'
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      company_id: companies[1].id,
      name: 'Nordic Retail IM',
      description: 'Information Memorandum for Nordic Retail Solutions',
      type: 'document',
      mime_type: 'application/pdf',
      file_size: 2048000,
      storage_path: '/materials/nordic-retail-im.pdf',
      generated: true,
      access_level: 'nda_signed',
      generation_status: 'ai_generated'
    }
  ];

  for (const material of materials) {
    const { error } = await supabase
      .from('company_assets')
      .upsert(material, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Error creating material:`, error.message);
    } else {
      console.log(`  ✅ ${material.name}`);
    }
  }
}

async function main() {
  console.log('🌱 Starting test data seeding...');
  console.log('==================================');

  try {
    const users = await createTestUsers();
    const organizations = await createTestOrganizations(users);
    const companies = await createTestCompanies(organizations);
    await createTestFinancials(companies);
    const deals = await createTestDeals(companies, users);
    await createTestNDAs(companies, users);
    await createTestListings(companies);
    await createTestMaterials(companies);

    console.log('\n==================================');
    console.log('✅ Test data seeding completed!');
    console.log('\n📝 Test user credentials:');
    console.log('==================================');
    Object.entries(TEST_USERS).forEach(([role, data]) => {
      console.log(`${role.toUpperCase()}:`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Password: ${data.password}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('\n❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

