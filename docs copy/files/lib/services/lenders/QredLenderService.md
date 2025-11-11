# QredLenderService.ts Documentation

**Path**: `lib/services/lenders/QredLenderService.ts`
**Type**: TypeScript Service Class
**Size**: ~825+ lines (estimated from partial read)
**Last Modified**: Active development file

## Purpose

Specialized integration service for Qred lending API, handling OAuth2 authentication, pre-offer submissions, status polling, and bid management. Implements Qred's API workflow for business funding applications with comprehensive error handling and document filtering capabilities.

## Key Components

### Main Class: QredLenderService

#### Constructor & Configuration
- **API URL**: Configurable endpoint (sandbox: `https://sandbox.qred.com/webapi`)
- **Authentication**: OAuth2 client credentials flow via Auth0
- **Client Credentials**: Client ID and secret for API access
- **Token Management**: Automatic token refresh with expiry tracking

### Authentication System

#### `getAuthToken()`
- **Purpose**: Obtains and manages OAuth2 access tokens from Qred's Auth0 integration
- **Flow**: Client credentials grant type
- **Features**:
  - Automatic token refresh with 5-minute buffer
  - Token caching to prevent unnecessary requests
  - Comprehensive error handling for auth failures
  - Auth0 integration with proper audience specification

#### `hasRequiredCredentials()`
- **Purpose**: Validates availability of required API credentials
- **Validation**: Client ID, client secret, and API URL presence

### Application Management

#### `submitQuotation(companyId, applicationId, lenderData, attachments, finalEmail?)`
- **Purpose**: Submits funding application pre-offers to Qred
- **Returns**: LenderQuotationResponse with Qred reference and status
- **Features**:
  - Comprehensive data mapping from internal to Qred format
  - Financial document filtering (previous year focus)
  - Automatic attachment processing and base64 encoding
  - Error handling with detailed logging

#### Document Filtering Logic
- **Purpose**: Filters attachments to include only relevant financial documents
- **Criteria**: 
  - Document types: financial_statements, income_statement, balance_sheet
  - Fiscal year: Previous calendar year only
  - File validation: Size and type checking
- **Fallback**: Includes all attachments if filtering fails

### Status Management

#### `getPreOfferStatus(preOfferId)`
- **Purpose**: Retrieves current status of pre-offer applications
- **Features**: Status mapping from Qred to internal format

#### `getApplicationStatus(lenderReference)`
- **Purpose**: Enhanced status checking with final state detection
- **Features**:
  - Final status identification for polling termination
  - Comprehensive status mapping
  - Additional data extraction for offer details

### Offer Management

#### `acceptPreOfferBid(preOfferId)`
- **Purpose**: Accepts pre-offer bids from Qred
- **Features**: Bid acceptance with status confirmation

### Data Mapping & Transformation

#### Company Data Processing
- **Company Details**: Name, business ID, industry mapping
- **Financial Metrics**: Revenue, profit, cash flow extraction
- **Address Handling**: Street, city, postal code formatting
- **Contact Information**: Phone, email, website processing

#### Application Data Mapping
- **Funding Details**: Amount, term, purpose mapping
- **Applicant Information**: Name, contact details, national ID
- **Financial Context**: Previous year financial data emphasis
- **Document Metadata**: File names, types, and content preparation

#### Status Mapping System
```typescript
// Qred → Internal Status Mapping
'SUBMITTED' → 'processing'
'PRE_OFFER' → 'approved' (with offer details)
'REJECTED' → 'rejected'
'EXPIRED' → 'expired'
'ACCEPTED' → 'accepted'
'APPROVED' → 'completed'
```

### Error Handling

#### Authentication Errors
- **Token Failures**: Detailed Auth0 error logging
- **Credential Issues**: Missing or invalid credential detection
- **Network Problems**: Axios error handling with status codes

#### API Errors
- **Request Failures**: HTTP status code handling
- **Response Validation**: JSON parsing and structure validation
- **Rate Limiting**: Automatic backoff for rate limit responses

#### Business Logic Errors
- **Document Processing**: Individual document failure isolation
- **Data Validation**: Required field validation and error reporting
- **Status Conflicts**: Handling of unexpected status transitions

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations
- `axios`: HTTP requests to Qred API

### Internal Dependencies
- `../../types/lenders`: Lender response type definitions
- `../lenderService`: LenderDataPayload interface

### Environment Variables
- `QRED_API_URL`: Qred API endpoint (defaults to sandbox)
- `QRED_CLIENT_ID`: OAuth2 client identifier
- `QRED_CLIENT_SECRET`: OAuth2 client secret
- `QRED_API_KEY`: Additional API key (if required)

### Database Integration
- `document_types`: Document type classification for filtering
- `documents`: Document metadata and fiscal year information

## Usage Examples

```typescript
// Initialize service
const qredService = new QredLenderService(supabaseClient);

// Check credentials
if (!qredService.hasRequiredCredentials()) {
  console.error('Missing Qred credentials');
  return;
}

// Submit pre-offer application
const response = await qredService.submitQuotation(
  'company-123',
  'app-456',
  {
    amount: 50000,
    term_months: 24,
    purpose: 'working_capital',
    applicant_national_id: 'sensitive-id'
  },
  attachments,
  'contact@company.com'
);

// Check application status
const status = await qredService.getApplicationStatus('qred-ref-123');

// Accept pre-offer bid
if (status.data?.status === 'PRE_OFFER') {
  await qredService.acceptPreOfferBid('qred-ref-123');
}
```

## OAuth2 Authentication Flow

### Token Acquisition
1. **Endpoint**: `https://qredab.eu.auth0.com/oauth/token`
2. **Grant Type**: `client_credentials`
3. **Audience**: `https://api.qred.com`
4. **Credentials**: Client ID and secret

### Token Management
- **Caching**: In-memory token storage
- **Expiry Handling**: 5-minute buffer before expiration
- **Refresh Logic**: Automatic renewal on API calls
- **Error Recovery**: Fallback authentication on token failures

## Document Processing Pipeline

### Filtering Strategy
1. **Document Type Query**: Fetch financial document type IDs
2. **Attachment Analysis**: Match attachments to document types
3. **Fiscal Year Filtering**: Include only previous year documents
4. **Fallback Processing**: Use all attachments if filtering fails

### File Processing
1. **Base64 Encoding**: Convert document content for API transmission
2. **Metadata Extraction**: File name, type, and size information
3. **Validation**: File size and format validation
4. **Error Isolation**: Continue processing if individual files fail

## Notes

- **OAuth2 Compliant**: Proper Auth0 integration with audience specification
- **Document Intelligence**: Smart filtering for relevant financial documents
- **Error Resilience**: Comprehensive error handling with graceful degradation
- **Logging**: Timestamped logging for debugging and monitoring
- **Status Intelligence**: Final status detection for polling optimization
- **Scalability**: Designed for high-volume application processing

## Related Files

- `lib/services/lenderService.ts`: Parent service orchestrating Qred integration
- `lib/services/LenderApplicationService.ts`: Polling and status management
- `app/api/qred/`: API endpoints for Qred operations
- `types/lenders.ts`: Qred-specific type definitions

## API Workflow

### Pre-Offer Process
1. **Authentication**: Obtain OAuth2 token
2. **Data Preparation**: Map internal data to Qred format
3. **Document Processing**: Filter and encode attachments
4. **Submission**: POST to Qred pre-offer endpoint
5. **Response Processing**: Extract reference ID and status

### Status Polling
1. **Token Validation**: Ensure valid authentication
2. **Status Request**: GET application status from Qred
3. **Response Mapping**: Convert Qred status to internal format
4. **Final State Detection**: Identify when polling should stop

## Recent Changes

- Enhanced document filtering for financial statements focus
- Improved OAuth2 token management with better error handling
- Added final status detection for polling optimization
- Enhanced logging with timestamps for better debugging
- Improved error isolation in document processing pipeline
