# dashboard/route.ts Documentation

**Path**: `app/api/dashboard/route.ts`
**Type**: Next.js API Route Handler
**Size**: 213 lines
**Last Modified**: Recently active

## Purpose

This API endpoint provides comprehensive dashboard data for authenticated users, aggregating company information, documents, financial metrics, recommendations, and funding applications. It supports both basic and detailed data fetching modes.

## Key Components

### GET Handler
- **Purpose**: Retrieves dashboard data for the authenticated user's primary company
- **Parameters**: 
  - Headers: `Authorization: Bearer <token>`
  - Query params: `allMetrics=true` (optional) for detailed data
- **Returns**: Dashboard data object with user and company information
- **Authentication**: Bearer token validation

## Core Functionality

### Authentication & User Verification
- **Bearer Token Validation**: Verifies JWT tokens using Supabase auth
- **User Context**: Extracts user information for data filtering

### Company Selection Logic
- **Multi-Company Support**: Handles users with multiple companies
- **Primary Company**: Uses first company as active company for dashboard
- **No Company Handling**: Returns basic dashboard for users without companies

### Data Aggregation Modes

#### Basic Mode (allMetrics=false)
- Returns minimal company information
- Company count metrics only
- Fast response for initial page loads

#### Full Mode (allMetrics=true)
- **Recent Documents**: Last 5 documents with processing status
- **Financial Metrics**: Complete financial data ordered by fiscal year
- **Funding Recommendations**: Latest recommendations
- **Funding Applications**: All applications with nested lender data
- **User Companies**: Complete list with roles

### Database Operations

#### Documents Query
- **Table**: `documents`
- **Relations**: Joins with `document_types` for type names
- **Filtering**: Company-specific, recent-first ordering
- **Limit**: 5 most recent documents

#### Financial Metrics Query
- **Table**: `financial_metrics`
- **Ordering**: By fiscal year (descending)
- **Company Filtering**: Restricted to user's primary company

#### Recommendations Query
- **Table**: `funding_recommendations`
- **Selection**: Single most recent recommendation
- **Company Filtering**: Company-specific data only

#### Funding Applications Query
- **Table**: `funding_applications`
- **Relations**: Nested `lender_applications` and `financing_offers`
- **Ordering**: Most recent first

## Response Structure

### Basic Response
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "company_id": "uuid",
  "company_name": "Company Name",
  "company_business_id": "1234567-8",
  "metrics": { "companies": 1 }
}
```

### Full Response
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "company_id": "uuid",
  "company_name": "Company Name",
  "company_business_id": "1234567-8",
  "documents": [...],
  "metrics": [...],
  "recommendations": {...},
  "funding_applications": [...],
  "user_companies": [...]
}
```

## Dependencies

- `next/server`: NextRequest, NextResponse
- `@/utils/supabase/server`: Supabase client creation
- `url`: URL parsing for query parameters

## Usage Examples

### Basic Dashboard Data
```javascript
const response = await fetch('/api/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const dashboardData = await response.json()
```

### Full Dashboard Data
```javascript
const response = await fetch('/api/dashboard?allMetrics=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const fullDashboard = await response.json()
```

## Notes

- **Performance Optimization**: Two-tier loading (basic then full) for better UX
- **Multi-Company Support**: Designed for users with multiple company associations
- **Error Resilience**: Individual query failures don't break entire response
- **Service Role Usage**: Uses elevated permissions for comprehensive data access
- **Data Relationships**: Properly handles complex nested data structures
- **Company Access**: Respects user-company relationships through junction table

## Related Files

- `app/[locale]/dashboard/` - Dashboard page implementations
- `components/dashboard/` - Dashboard UI components
- `app/api/companies/` - Company management endpoints
- `app/api/financial/` - Financial data endpoints
- `app/api/documents/` - Document management endpoints

## Database Schema Dependencies

- `user_companies` junction table for access control
- `companies` table for company information
- `documents` table with `document_types` relation
- `financial_metrics` table for financial data
- `funding_recommendations` table for AI recommendations
- `funding_applications` with nested relations to lender data
