# financialAnalysisService.ts Documentation

**Path**: `lib/services/financialAnalysisService.ts`
**Type**: TypeScript Service Module
**Size**: ~1148 lines
**Last Modified**: Active development file

## Purpose

Core service for processing financial documents, calculating financial metrics, generating AI-powered funding recommendations using Google Gemini, and managing the complete financial analysis workflow. This is one of the most critical services in the application, handling the entire financial analysis pipeline from document data extraction to recommendation generation.

## Key Components

### Core Functions

#### `calculateFinancialMetrics(documentData, companyId, fiscalYear, fiscalPeriod, createdBy, documentIds)`
- **Purpose**: Extracts and calculates comprehensive financial metrics from document data
- **Parameters**: 
  - `documentData`: Raw extracted data from financial documents
  - `companyId`: Company identifier
  - `fiscalYear`: Fiscal year of the data
  - `fiscalPeriod`: Period type ('annual', 'q1', 'q2', etc.)
  - `createdBy`: User ID who triggered the analysis
  - `documentIds`: Array of source document IDs
- **Returns**: Complete FinancialMetrics object with calculated ratios and metrics
- **Key Features**:
  - Intelligent field mapping from various document structures
  - Automatic calculation of derived metrics (EBITDA, ROE, ratios)
  - Extensive logging for debugging and monitoring
  - Fallback handling for missing data

#### `generateFundingRecommendations(companyId, financingNeedsId, locale)`
- **Purpose**: Generates AI-powered funding recommendations using Google Gemini
- **Parameters**:
  - `companyId`: Company identifier
  - `financingNeedsId`: Associated financing needs record
  - `locale`: Language for recommendations ('en', 'fi', 'sv')
- **Returns**: FundingRecommendations object or null
- **Key Features**:
  - Multi-language support with locale-specific prompts
  - Comprehensive prompt engineering for financial analysis
  - Structured JSON output with detailed recommendations
  - Fallback recommendation system for API failures
  - Historical financial data integration

#### `updateFinancialMetrics(companyId?, fiscalYear?)`
- **Purpose**: Updates existing financial metrics by recalculating missing values
- **Parameters**: Optional filters for specific company/year
- **Returns**: Summary of processed and updated records
- **Key Features**:
  - Batch processing of existing records
  - Smart detection of missing calculated fields
  - Precision-based comparison for numeric updates
  - Detailed logging of all changes

#### `processFinancialDocument(documentData, companyId, documentId, userId)`
- **Purpose**: Complete workflow orchestrator for financial document processing
- **Parameters**: Document data and context information
- **Returns**: Void (orchestrates other functions)
- **Key Features**:
  - End-to-end document processing workflow
  - Email notification system integration
  - Event system integration with Inngest
  - Error handling and status tracking

### AI Integration

#### Google Gemini Integration
- **Model**: gemini-2.5-flash with thinking capabilities
- **Features**:
  - Advanced prompt engineering for financial analysis
  - Structured output with JSON schema validation
  - Multi-language support (Finnish, English, Swedish)
  - Timeout handling and error recovery
  - Safety settings configuration

#### Prompt Engineering
- **Approach**: Expert role-based prompting with specific financial context
- **Key Elements**:
  - Private financing institution preference
  - Business loan prioritization
  - Clear action plans with concrete tasks
  - Neutral language for existing loan assessments
  - Industry-specific terminology avoidance

### Financial Calculations

#### Supported Metrics
- **Cash Flow**: Operational and investment cash flow
- **Profitability**: ROE, operating profit, net profit, EBITDA
- **Liquidity**: Current ratio, quick ratio
- **Leverage**: Debt-to-equity ratio
- **Efficiency**: Fixed asset turnover, AR turnover days
- **Growth**: Revenue growth rate
- **Risk**: Bad debt ratio

#### Calculation Logic
- **Intelligent Field Mapping**: Handles multiple naming conventions
- **Derived Calculations**: Automatically computes missing ratios
- **Data Validation**: Prevents division by zero and invalid calculations
- **Fallback Values**: Graceful handling of missing data points

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations and admin access
- `@google/genai`: Google Gemini AI integration
- `@/lib/inngest/inngest.client`: Event system integration

### Internal Dependencies
- `@/types/financial`: Financial data type definitions
- `@/types/supabase`: Database schema types
- `./emailTemplateService`: Email notification system

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Admin access key
- `GOOGLE_AI_STUDIO_KEY`: Google AI API key

## Usage Examples

```typescript
// Calculate financial metrics from document data
const metrics = await calculateFinancialMetrics(
  extractedData,
  'company-123',
  2023,
  'annual',
  'user-456',
  ['doc-789']
);

// Generate AI recommendations
const recommendations = await generateFundingRecommendations(
  'company-123',
  'needs-456',
  'fi'
);

// Process complete document workflow
await processFinancialDocument(
  documentData,
  'company-123',
  'doc-789',
  'user-456'
);
```

## Notes

- **Performance**: Includes extensive logging for monitoring and debugging
- **Error Handling**: Comprehensive error recovery with fallback mechanisms
- **Scalability**: Designed for batch processing and concurrent operations
- **Security**: Uses service role for admin-level database access
- **Monitoring**: Integrated with event system for workflow tracking
- **Internationalization**: Multi-language support for global markets

## Related Files

- `lib/types/financial.ts`: Type definitions for financial data structures
- `lib/services/emailTemplateService.ts`: Email notification integration
- `lib/inngest/`: Background job processing
- `app/api/financial/`: API endpoints using this service
- `components/charts/`: Frontend visualization of calculated metrics

## Recent Changes

- Enhanced calculation logic for derived financial ratios
- Added comprehensive logging and monitoring
- Implemented fallback recommendation system
- Added email notification integration
- Improved error handling and recovery mechanisms
