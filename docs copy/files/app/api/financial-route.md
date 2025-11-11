# financial/route.ts Documentation

**Path**: `app/api/financial/route.ts`
**Type**: Next.js API Route Handler
**Size**: 344 lines
**Last Modified**: Recently active

## Purpose

This API endpoint manages financial data operations including retrieving financial metrics, future goals, funding recommendations, and creating new future goals with automatic recommendation generation. It provides comprehensive financial data management with proper access control.

## Key Components

### GET Handler (Retrieve Financial Data)
- **Purpose**: Fetches complete financial data for a company
- **Parameters**: 
  - Query params: `companyId` (required)
  - Headers: `Authorization: Bearer <token>`
- **Returns**: `{ financialMetrics, futureGoals, fundingRecommendations }`
- **Authentication**: Bearer token + company access verification

### POST Handler (Create Future Goals)
- **Purpose**: Creates future goals and generates new funding recommendations
- **Parameters**:
  - Request body: `{ companyId, futureGoalsData }`
  - Headers: `Authorization: Bearer <token>`
- **Returns**: `{ success, futureGoals, fundingRecommendations }`
- **Authentication**: Bearer token + company access verification

## Core Functionality

### Access Control System
- **Company Access Verification**: Checks user association with company via profiles
- **Admin Override**: Allows admin users to access any company's financial data
- **Dual Verification**: Uses both company association and admin status checks

### Financial Data Retrieval (GET)
- **Financial Metrics**: Latest metrics by fiscal year and creation date
- **Future Goals**: Most recent future goals record
- **Funding Recommendations**: Latest AI-generated recommendations
- **Single Record Policy**: Returns only the most recent record of each type

### Future Goals Creation (POST)
- **Data Validation**: Ensures required fields are present
- **Goal Recording**: Creates comprehensive future goals record
- **Automatic Recommendations**: Triggers AI recommendation generation
- **Error Resilience**: Returns goals even if recommendation generation fails

### AI Integration
- **Service Import**: Dynamically imports `financialAnalysisService`
- **Recommendation Generation**: Calls `generateFundingRecommendations()`
- **Context Aware**: Uses latest metrics and new goals for AI analysis

## Database Operations

### Tables Involved
- **`financial_metrics`**: Company financial performance data
- **`future_goals`**: Company growth and investment plans
- **`funding_recommendations`**: AI-generated funding suggestions
- **`profiles`**: User access control and admin status

### Future Goals Schema
```typescript
{
  company_id: string,
  required_working_capital_increase: number,
  inventory_personnel_resource_needs: object,
  investment_priorities: array,
  estimated_investment_amounts: object,
  cost_structure_adaptation: object,
  created_by: string
}
```

## Dependencies

- `next/server`: NextResponse for API responses
- `@supabase/supabase-js`: Direct Supabase client creation
- `@/lib/services/financialAnalysisService`: AI recommendation generation
- `url`: URL parsing for query parameters

## Usage Examples

### Retrieving Financial Data
```javascript
const response = await fetch(`/api/financial?companyId=${companyId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { financialMetrics, futureGoals, fundingRecommendations } = await response.json()
```

### Creating Future Goals
```javascript
const response = await fetch('/api/financial', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyId: 'company-uuid',
    futureGoalsData: {
      required_working_capital_increase: 100000,
      inventory_personnel_resource_needs: {
        inventory: 50000,
        personnel: 3
      },
      investment_priorities: ['equipment', 'marketing'],
      estimated_investment_amounts: {
        equipment: 75000,
        marketing: 25000
      },
      cost_structure_adaptation: {
        strategy: 'optimization'
      }
    }
  })
})
```

## Notes

- **Access Control**: Strict company access verification with admin override
- **Direct Supabase**: Uses direct Supabase client instead of utility wrapper
- **AI Integration**: Seamlessly integrates with financial analysis AI service
- **Error Handling**: Graceful degradation when AI services fail
- **Data Freshness**: Always fetches most recent records for analysis
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Response Flexibility**: Different response formats based on operation success

## Related Files

- `lib/services/financialAnalysisService.ts` - AI recommendation engine
- `app/[locale]/dashboard/` - Financial data display components
- `components/financial/` - Financial form components
- `app/api/financial-metrics/` - Detailed financial metrics endpoints
- `app/api/funding-recommendations/` - Recommendation-specific endpoints

## Database Schema Dependencies

- `financial_metrics` table with fiscal year indexing
- `future_goals` table with company relationship
- `funding_recommendations` table for AI outputs
- `profiles` table with company_id and is_admin fields
- Proper RLS policies for data access control
