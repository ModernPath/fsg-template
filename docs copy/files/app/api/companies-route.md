# companies/route.ts Documentation

**Path**: `app/api/companies/route.ts`
**Type**: Next.js API Route Handler
**Size**: 257 lines
**Last Modified**: Recently active

## Purpose

This API endpoint manages company creation and retrieval for authenticated users. It provides comprehensive company management with partner attribution tracking, conversion analytics, and proper user-company relationship management through junction tables.

## Key Components

### GET Handler (Fetch Companies)
- **Purpose**: Retrieves all companies associated with the authenticated user
- **Parameters**: 
  - Headers: `Authorization: Bearer <token>`
- **Returns**: Array of companies with user roles
- **Authentication**: Bearer token validation

### POST Handler (Create Company)
- **Purpose**: Creates new companies with attribution tracking and analytics
- **Parameters**:
  - Request body: Company data object
  - Headers: `Authorization: Bearer <token>`, `x-session-id` (optional)
- **Returns**: `{ company: Company }`
- **Authentication**: Bearer token validation

## Core Functionality

### Company Retrieval (GET)
- **User-Company Relationships**: Uses `user_companies` junction table
- **Role-Based Access**: Returns user's role for each company (owner, member, etc.)
- **Data Selection**: Fetches essential company fields:
  - `id`, `name`, `business_id`
  - `address`, `contact_info`
  - `created_at`, `updated_at`

### Company Creation (POST)
- **Company Record**: Creates new company with user as creator
- **User Association**: Automatically creates `user_companies` relationship
- **Default Role**: Sets creator as 'owner' of the company

### Partner Attribution System
- **Session Tracking**: Uses session ID for attribution lookup
- **Attribution Window**: Respects attribution expiration timestamps
- **Partner Linking**: Associates companies with referring partners
- **Attribution Data Storage**:
  - `partner_id` - Reference to referring partner
  - `referral_source` - Source type ('partner_referral')
  - `referral_click_id` - Specific click reference
  - `attribution_data` - Comprehensive attribution metadata

### Conversion Tracking
- **Event Type**: Tracks 'company_created' conversions
- **Metadata Capture**: Records company and user details
- **Partner Attribution**: Links conversions to referring partners
- **Session Correlation**: Maintains session-based tracking

## Database Operations

### Tables Involved
- **`companies`**: Main company records
- **`user_companies`**: User-company relationship junction
- **`partner_referral_clicks`**: Attribution tracking
- **`partners`**: Partner information for attribution

### Key Fields

#### Companies Table
- `id` - UUID primary key
- `name` - Company name
- `business_id` - Business registration number
- `address` - Company address
- `contact_info` - Contact details
- `created_by` - Reference to creating user
- `partner_id` - Attribution to partner (nullable)
- `referral_source` - Attribution source type
- `attribution_data` - JSON metadata

#### User Companies Junction
- `user_id` - Reference to user
- `company_id` - Reference to company
- `role` - User's role in company ('owner', 'member', etc.)

## Dependencies

- `next/server`: NextRequest, NextResponse
- `@/utils/supabase/server`: Supabase client creation
- Partner referral tracking system
- Conversion tracking RPC functions

## Usage Examples

### Fetching User's Companies
```javascript
const response = await fetch('/api/companies', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const companies = await response.json()
```

### Creating a New Company
```javascript
const response = await fetch('/api/companies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-session-id': sessionId // Optional for attribution
  },
  body: JSON.stringify({
    name: 'My Company Ltd',
    business_id: '1234567-8',
    address: 'Business Address',
    contact_info: { email: 'contact@company.com' }
  })
})
const { company } = await response.json()
```

## Notes

- **Attribution Resilience**: Attribution failures don't prevent company creation
- **Dual Client Pattern**: Uses both auth client and service role client appropriately
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Error Handling**: Graceful error responses with proper HTTP status codes
- **Security**: RLS bypass only where necessary with service role client
- **Upsert Pattern**: Uses upsert for user_companies to prevent duplicates

## Related Files

- `app/api/company/` - Individual company management endpoints
- `components/auth/onboarding/` - Company creation UI components
- `lib/services/` - Business logic services
- `utils/supabase/server.ts` - Supabase configuration
- Partner referral tracking system files

## Database Schema Dependencies

- `companies` table with proper RLS policies
- `user_companies` junction table with unique constraints
- `partner_referral_clicks` for attribution tracking
- `partners` table for partner information
- RPC function `track_conversion` for analytics
