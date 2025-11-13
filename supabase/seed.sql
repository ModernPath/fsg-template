-- ============================================================================
-- BizExit Platform - Seed Data
-- Created: 2025-11-11
-- Description: Realistic demo data for development and testing
-- ============================================================================

-- Clear existing BizExit data (keep old LastBot data for now)
TRUNCATE TABLE 
  audit_logs,
  payments,
  deal_activities,
  deal_stages,
  deals,
  ndas,
  buyer_profiles,
  listing_portals,
  listings,
  company_assets,
  company_financials,
  companies,
  partners,
  user_organizations,
  organizations
CASCADE;

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================

INSERT INTO organizations (id, name, slug, type, country, industry, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Nordic M&A Partners', 'nordic-ma-partners', 'broker', 'Finland', 'Financial Services', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Tech Ventures Advisors', 'tech-ventures', 'broker', 'Sweden', 'Technology', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'BizExit Platform', 'bizexit-platform', 'platform', 'Finland', 'Technology', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Direct Sellers Co', 'direct-sellers', 'seller', 'Finland', 'Various', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'European Business Brokers', 'european-brokers', 'broker', 'Germany', 'Financial Services', true);

-- ============================================================================
-- 2. TEST USERS
-- ============================================================================

-- Note: In production, users are created via Supabase Auth
-- For local development, we create test users directly

-- Test Admin User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  '$2a$10$SQDZNhWVEm/FaVJQsj/aLOtleFHBqWZgAVvxGvlHo4L8ew6xMpSiW', -- password: test123 (correct bcrypt hash)
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"full_name":"Admin User","is_admin":true}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Test Broker User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'broker@test.com',
  '$2a$10$SQDZNhWVEm/FaVJQsj/aLOtleFHBqWZgAVvxGvlHo4L8ew6xMpSiW', -- password: test123
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"],"role":"broker"}',
  '{"full_name":"Broker User"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Test Seller User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'seller@test.com',
  '$2a$10$SQDZNhWVEm/FaVJQsj/aLOtleFHBqWZgAVvxGvlHo4L8ew6xMpSiW', -- password: test123
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"],"role":"seller"}',
  '{"full_name":"Seller User"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Test Buyer User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'buyer@test.com',
  '$2a$10$SQDZNhWVEm/FaVJQsj/aLOtleFHBqWZgAVvxGvlHo4L8ew6xMpSiW', -- password: test123
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"],"role":"buyer"}',
  '{"full_name":"Buyer User"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create profiles for test users (via handle_new_user trigger)
-- Profiles will be created automatically, but we ensure they exist with correct data
INSERT INTO profiles (id, username, full_name, email, role, email_verified, is_admin, onboarding_completed)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin', 'Admin User', 'admin@test.com', 'admin', true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'broker', 'Broker User', 'broker@test.com', 'broker', true, false, true),
  ('33333333-3333-3333-3333-333333333333', 'seller', 'Seller User', 'seller@test.com', 'seller', true, false, true),
  ('44444444-4444-4444-4444-444444444444', 'buyer', 'Buyer User', 'buyer@test.com', 'buyer', true, false, true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  is_admin = EXCLUDED.is_admin,
  onboarding_completed = EXCLUDED.onboarding_completed;

-- ============================================================================
-- 3. USER_ORGANIZATIONS
-- ============================================================================

-- Link users to organizations
INSERT INTO user_organizations (user_id, organization_id, role, active) VALUES
  -- Admin user - platform admin, member of BizExit Platform org
  ('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440003', 'admin', true),
  
  -- Broker user - admin of Nordic M&A Partners
  ('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'admin', true),
  
  -- Seller user - admin of Direct Sellers Co
  ('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440004', 'admin', true),
  
  -- Buyer user - analyst role in org (buyer not allowed in user_organizations)
  ('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440001', 'analyst', true)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- ============================================================================
-- 4. COMPANIES
-- ============================================================================

INSERT INTO companies (
  id, organization_id, name, legal_name, business_id, country, city,
  founded_year, website, industry, sub_industry, description,
  employees_count, legal_structure, annual_revenue, annual_ebitda,
  asking_price, currency, status, confidential
) VALUES
  -- Nordic M&A Partners portfolio
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Nordic SaaS Solutions',
    'Nordic SaaS Solutions Oy',
    '1234567-8',
    'Finland',
    'Helsinki',
    2015,
    'https://nordicsaas.example.com',
    'Technology',
    'Software',
    'Leading B2B SaaS platform for logistics management. Serving 200+ customers across Nordics with proven track record of growth.',
    45,
    'LLC',
    5200000,
    1300000,
    12000000,
    'EUR',
    'active',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'HealthTech Innovations',
    'HealthTech Innovations AB',
    '2345678-9',
    'Sweden',
    'Stockholm',
    2018,
    'https://healthtech.example.com',
    'Healthcare',
    'Digital Health',
    'Digital health platform connecting patients with healthcare providers. Strong growth trajectory and expanding market.',
    32,
    'Corporation',
    3800000,
    950000,
    8500000,
    'EUR',
    'active',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    'E-Commerce Pro',
    'E-Commerce Pro Oy',
    '3456789-0',
    'Finland',
    'Tampere',
    2016,
    'https://ecommercepro.example.com',
    'Retail',
    'E-commerce',
    'Full-service e-commerce platform for SMEs. Over 500 active stores powered by our technology.',
    28,
    'LLC',
    2900000,
    720000,
    6000000,
    'EUR',
    'active',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'Green Energy Systems',
    'Green Energy Systems AB',
    '4567890-1',
    'Sweden',
    'Gothenburg',
    2014,
    'https://greenenergy.example.com',
    'Energy',
    'Renewable Energy',
    'Smart energy management systems for commercial buildings. Patented technology with strong IP portfolio.',
    55,
    'Corporation',
    6700000,
    1680000,
    15000000,
    'EUR',
    'active',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440004',
    'Manufacturing Excellence',
    'Manufacturing Excellence Oy',
    '5678901-2',
    'Finland',
    'Oulu',
    2010,
    'https://mfgexcellence.example.com',
    'Manufacturing',
    'Industrial Equipment',
    'Precision manufacturing for automotive industry. Long-term contracts with major OEMs.',
    85,
    'LLC',
    12000000,
    2400000,
    20000000,
    'EUR',
    'review',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440001',
    'Digital Marketing Agency',
    'Digital Marketing Agency Oy',
    '6789012-3',
    'Finland',
    'Helsinki',
    2017,
    'https://digitalmarketing.example.com',
    'Marketing',
    'Digital Marketing',
    'Full-service digital marketing agency serving B2B clients. Strong client retention and recurring revenue model.',
    22,
    'LLC',
    1800000,
    450000,
    3500000,
    'EUR',
    'active',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440005',
    'Restaurant Chain Nordica',
    'Restaurant Chain Nordica GmbH',
    '7890123-4',
    'Germany',
    'Berlin',
    2012,
    'https://restaurantnordica.example.com',
    'Hospitality',
    'Restaurants',
    'Premium Nordic cuisine restaurant chain with 8 locations across Germany. Strong brand and loyal customer base.',
    120,
    'LLC',
    4500000,
    900000,
    7500000,
    'EUR',
    'active',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440002',
    'EdTech Platform',
    'EdTech Platform AB',
    '8901234-5',
    'Sweden',
    'Malmö',
    2019,
    'https://edtechplatform.example.com',
    'Education',
    'EdTech',
    'Online learning platform for professional development. Fast growing user base and SaaS revenue model.',
    18,
    'Corporation',
    1200000,
    240000,
    3000000,
    'EUR',
    'active',
    true
  );

-- ============================================================================
-- 5. COMPANY_FINANCIALS
-- ============================================================================

-- Nordic SaaS Solutions - 3 years of financials
INSERT INTO company_financials (
  company_id, fiscal_year, period_start, period_end,
  revenue, cost_of_goods_sold, gross_profit, operating_expenses,
  ebitda, net_income, total_assets, total_liabilities, equity,
  currency, audited
) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 2022, '2022-01-01', '2022-12-31',
   3800000, 760000, 3040000, 1840000, 900000, 720000,
   2100000, 800000, 1300000, 'EUR', true),
  ('660e8400-e29b-41d4-a716-446655440001', 2023, '2023-01-01', '2023-12-31',
   4600000, 920000, 3680000, 2180000, 1100000, 880000,
   2800000, 900000, 1900000, 'EUR', true),
  ('660e8400-e29b-41d4-a716-446655440001', 2024, '2024-01-01', '2024-12-31',
   5200000, 1040000, 4160000, 2460000, 1300000, 1040000,
   3600000, 1000000, 2600000, 'EUR', false);

-- HealthTech Innovations - 3 years
INSERT INTO company_financials (
  company_id, fiscal_year, period_start, period_end,
  revenue, ebitda, net_income, currency, audited
) VALUES
  ('660e8400-e29b-41d4-a716-446655440002', 2022, '2022-01-01', '2022-12-31',
   2400000, 600000, 480000, 'EUR', true),
  ('660e8400-e29b-41d4-a716-446655440002', 2023, '2023-01-01', '2023-12-31',
   3100000, 775000, 620000, 'EUR', true),
  ('660e8400-e29b-41d4-a716-446655440002', 2024, '2024-01-01', '2024-12-31',
   3800000, 950000, 760000, 'EUR', false);

-- E-Commerce Pro - 3 years
INSERT INTO company_financials (
  company_id, fiscal_year, revenue, ebitda, currency, audited
) VALUES
  ('660e8400-e29b-41d4-a716-446655440003', 2022, 2100000, 525000, 'EUR', true),
  ('660e8400-e29b-41d4-a716-446655440003', 2023, 2500000, 625000, 'EUR', true),
  ('660e8400-e29b-41d4-a716-446655440003', 2024, 2900000, 720000, 'EUR', false);

-- ============================================================================
-- 6. LISTINGS
-- ============================================================================

INSERT INTO listings (
  id, company_id, title, short_description, asking_price,
  price_negotiable, currency, status, published_at,
  show_financials, show_location, allow_contact, views_count, inquiries_count
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'Leading Nordic B2B SaaS Platform - Logistics Management',
    'Profitable SaaS company with 200+ customers, strong growth, and proven business model.',
    12000000,
    true,
    'EUR',
    'active',
    NOW() - INTERVAL '30 days',
    true,
    false,
    true,
    245,
    12
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    'Fast-Growing Digital Health Platform',
    'Connecting patients with healthcare providers. Strong growth and expanding market opportunity.',
    8500000,
    true,
    'EUR',
    'active',
    NOW() - INTERVAL '45 days',
    true,
    false,
    true,
    189,
    8
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    'Profitable E-Commerce Platform for SMEs',
    'Turn-key e-commerce solution powering 500+ online stores.',
    6000000,
    true,
    'EUR',
    'active',
    NOW() - INTERVAL '20 days',
    true,
    false,
    true,
    156,
    15
  );

-- ============================================================================
-- 7. LISTING_PORTALS
-- ============================================================================

INSERT INTO listing_portals (
  listing_id, portal_code, external_id, external_url, status,
  last_sync_at, views_count, leads_count, auto_sync
) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'mock', 'MOCK-001', 'https://mock-portal.com/listings/1', 'active', NOW(), 180, 10, true),
  ('770e8400-e29b-41d4-a716-446655440001', 'bizbuysell', 'BBS-12345', 'https://bizbuysell.com/listings/12345', 'active', NOW(), 65, 2, true),
  ('770e8400-e29b-41d4-a716-446655440002', 'mock', 'MOCK-002', 'https://mock-portal.com/listings/2', 'active', NOW(), 145, 6, true),
  ('770e8400-e29b-41d4-a716-446655440003', 'mock', 'MOCK-003', 'https://mock-portal.com/listings/3', 'active', NOW(), 120, 12, true),
  ('770e8400-e29b-41d4-a716-446655440003', 'yritysporssi', 'YP-789', 'https://yritysporssi.fi/ilmoitukset/789', 'active', NOW(), 36, 3, true);

-- ============================================================================
-- 8. DEALS
-- ============================================================================

INSERT INTO deals (
  id, organization_id, company_id, name, deal_value, currency,
  status, current_stage, fixed_fee, success_fee_percentage,
  expected_close_date, tags
) VALUES
  (
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'Nordic SaaS Solutions Acquisition',
    12000000,
    'EUR',
    'active',
    'due_diligence',
    5000,
    5.0,
    (NOW() + INTERVAL '60 days')::date,
    ARRAY['saas', 'logistics', 'hot']
  ),
  (
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440002',
    'HealthTech Platform Acquisition',
    8500000,
    'EUR',
    'active',
    'initial_review',
    5000,
    5.5,
    (NOW() + INTERVAL '90 days')::date,
    ARRAY['healthtech', 'saas']
  ),
  (
    '880e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440003',
    'E-Commerce Pro Deal',
    6000000,
    'EUR',
    'active',
    'negotiation',
    4000,
    6.0,
    (NOW() + INTERVAL '45 days')::date,
    ARRAY['ecommerce', 'b2b']
  );

-- ============================================================================
-- 9. DEAL_STAGES
-- ============================================================================

-- Deal 1 progression
INSERT INTO deal_stages (deal_id, stage, entered_at, exited_at, duration_days) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'sourcing', NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days', 5),
  ('880e8400-e29b-41d4-a716-446655440001', 'nda_negotiation', NOW() - INTERVAL '55 days', NOW() - INTERVAL '50 days', 5),
  ('880e8400-e29b-41d4-a716-446655440001', 'initial_review', NOW() - INTERVAL '50 days', NOW() - INTERVAL '30 days', 20),
  ('880e8400-e29b-41d4-a716-446655440001', 'due_diligence', NOW() - INTERVAL '30 days', NULL, NULL);

-- Deal 2 progression
INSERT INTO deal_stages (deal_id, stage, entered_at, exited_at, duration_days) VALUES
  ('880e8400-e29b-41d4-a716-446655440002', 'sourcing', NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days', 5),
  ('880e8400-e29b-41d4-a716-446655440002', 'nda_negotiation', NOW() - INTERVAL '40 days', NOW() - INTERVAL '35 days', 5),
  ('880e8400-e29b-41d4-a716-446655440002', 'initial_review', NOW() - INTERVAL '35 days', NULL, NULL);

-- ============================================================================
-- 10. DEAL_ACTIVITIES
-- ============================================================================

INSERT INTO deal_activities (deal_id, activity_type, title, description) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'stage_change', 'Deal moved to Due Diligence', 'Buyer completed initial review and moved to full DD'),
  ('880e8400-e29b-41d4-a716-446655440001', 'document_uploaded', 'Financial documents uploaded', 'Last 3 years of audited financials provided'),
  ('880e8400-e29b-41d4-a716-446655440001', 'meeting_scheduled', 'Management meeting scheduled', 'Meeting with CEO and CFO set for next week'),
  ('880e8400-e29b-41d4-a716-446655440002', 'nda_signed', 'NDA signed by buyer', 'Buyer completed NDA, granted access to IM'),
  ('880e8400-e29b-41d4-a716-446655440003', 'offer_submitted', 'Initial offer received', 'Buyer submitted LOI at €5.8M');

-- ============================================================================
-- 11. PAYMENTS
-- ============================================================================

INSERT INTO payments (
  organization_id, deal_id, payment_type, amount, currency,
  status, invoice_number, paid_at, description
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440001',
    'fixed_fee',
    5000,
    'EUR',
    'succeeded',
    'INV-2024-001',
    NOW() - INTERVAL '55 days',
    'Fixed onboarding fee - Nordic SaaS Solutions'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440002',
    'fixed_fee',
    5000,
    'EUR',
    'succeeded',
    'INV-2024-002',
    NOW() - INTERVAL '40 days',
    'Fixed onboarding fee - HealthTech Innovations'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '880e8400-e29b-41d4-a716-446655440003',
    'fixed_fee',
    4000,
    'EUR',
    'pending',
    'INV-2024-003',
    NULL,
    'Fixed onboarding fee - E-Commerce Pro'
  );

-- ============================================================================
-- 12. AUDIT_LOGS (Sample entries)
-- ============================================================================

INSERT INTO audit_logs (
  organization_id, action, resource_type, resource_id,
  ip_address, request_path, request_method
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'create',
    'company',
    '660e8400-e29b-41d4-a716-446655440001',
    '192.168.1.100'::inet,
    '/api/companies',
    'POST'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'update',
    'deal',
    '880e8400-e29b-41d4-a716-446655440001',
    '192.168.1.100'::inet,
    '/api/deals/880e8400-e29b-41d4-a716-446655440001',
    'PATCH'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'create',
    'listing',
    '770e8400-e29b-41d4-a716-446655440003',
    '192.168.1.101'::inet,
    '/api/listings',
    'POST'
  );

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

-- Print summary
DO $$
DECLARE
  org_count INT;
  company_count INT;
  listing_count INT;
  deal_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO company_count FROM companies;
  SELECT COUNT(*) INTO listing_count FROM listings;
  SELECT COUNT(*) INTO deal_count FROM deals;
  
  RAISE NOTICE 'BizExit Seed Data Complete:';
  RAISE NOTICE '  - Organizations: %', org_count;
  RAISE NOTICE '  - Companies: %', company_count;
  RAISE NOTICE '  - Listings: %', listing_count;
  RAISE NOTICE '  - Deals: %', deal_count;
END $$;

