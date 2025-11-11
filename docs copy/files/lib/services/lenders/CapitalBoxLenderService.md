# CapitalBoxLenderService.ts Documentation

**Path**: `lib/services/lenders/CapitalBoxLenderService.ts`
**Type**: TypeScript Service Class
**Size**: ~1200+ lines (estimated from partial read)
**Last Modified**: Active development file

## Purpose

Comprehensive integration service for CapitalBox lending API, handling application submissions, document uploads, status polling, offer retrieval, and webhook processing. Implements CapitalBox's V2 API with SHA256 signature authentication and provides complete lifecycle management for funding applications.

## Key Components

### Main Class: CapitalBoxLenderService

#### Constructor & Configuration
- **API URL**: Configurable endpoint (sandbox/production)
- **Authentication**: Username/password with SHA256 signature
- **Partner ID**: CapitalBox partner identifier
- **Private Key**: Used for request signature generation

### Authentication System

#### `_createSignature(requestBody, privateKey, fullUrl)`
- **Purpose**: Creates SHA256 signatures required for CapitalBox V2 API
- **Algorithm**: `sha256(KEY + URL + RAW_JSON_BODY)` for POST/PATCH, `sha256(KEY + URL)` for GET/DELETE
- **Security**: Cryptographic request validation to prevent tampering

### Application Management

#### `submitApplication(companyId, applicationId, lenderData, attachments?, finalEmail?)`
- **Purpose**: Submits complete funding applications to CapitalBox
- **Returns**: LenderResponse with CapitalBox application ID and status
- **Features**:
  - Comprehensive data mapping from internal to CapitalBox format
  - Automatic UBO (Ultimate Beneficial Owner) processing
  - Document attachment handling
  - Initial rejection detection and handling
  - Detailed error logging and recovery

#### `getApplicationStatus(lenderReference)`
- **Purpose**: Retrieves current application status from CapitalBox
- **Features**: Status mapping from CapitalBox to internal format

#### `getOffers(lenderReference)`
- **Purpose**: Fetches available funding offers for an application
- **Features**: 
  - Comprehensive offer data retrieval
  - Error handling for expired/invalid applications
  - Offer detail parsing and validation

### Document Management

#### `uploadDocument(capitalBoxApplicationId, document)`
- **Purpose**: Uploads additional documents to existing applications
- **Parameters**:
  - `capitalBoxApplicationId`: CapitalBox's application identifier
  - `document`: Document object with name, type, and base64 data
- **Returns**: LenderResponse with upload status and document ID
- **Features**:
  - Base64 document handling
  - MIME type validation
  - Upload progress tracking

### Data Mapping & Transformation

#### Company Data Mapping
- **Company Information**: Name, business ID, industry classification
- **Address Handling**: Street, city, postal code formatting
- **Contact Information**: Phone, email, website extraction

#### Applicant Data Processing
- **Profile Integration**: First name, last name from profile fields
- **Fallback Logic**: Full name splitting when individual fields unavailable
- **Contact Details**: Phone and email with multiple source fallbacks
- **National ID**: Secure handling of sensitive identification

#### UBO (Ultimate Beneficial Owner) Processing
- **Data Extraction**: From lenderData.ubo_list
- **Validation**: National ID and name validation
- **Formatting**: CapitalBox-specific format conversion

### Webhook System

#### Webhook Event Constants
```typescript
CAPITAL_BOX_WEBHOOK_EVENTS = {
  LOAN_DISBURSED: 'loanDisbursed',
  LOAN_SOLD: 'loanSold', 
  OFFERS_CREATED: 'offersCreated',
  OFFERS_UPDATED: 'offersUpdated'
}
```

#### Webhook Payload Interface
- **UUID**: Event identifier
- **Timestamp**: Event occurrence time
- **Payload**: Event-specific data (disbursement, offers, etc.)

### Error Handling

#### API Error Management
- **HTTP Status Codes**: Comprehensive status code handling
- **Timeout Handling**: Request timeout with retry logic
- **Rate Limiting**: Automatic backoff for rate limit responses
- **Authentication Failures**: Credential validation and refresh

#### Business Logic Errors
- **Initial Rejection**: Detection and handling of applications rejected during submission
- **Invalid Data**: Validation error processing and user feedback
- **Missing Requirements**: Identification of missing required fields

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations
- `crypto`: SHA256 signature generation
- `axios` (implied): HTTP requests to CapitalBox API

### Internal Dependencies
- `../../types/lenders`: Lender response type definitions
- `../lenderService`: LenderDataPayload interface
- `../../types/supabase`: Database type definitions

### Environment Variables
- `CAPITAL_BOX_API_URL`: CapitalBox API endpoint
- `CAPITAL_BOX_API_USERNAME`: API authentication username
- `CAPITAL_BOX_API_PASSWORD`: API authentication password
- `CAPITAL_BOX_PRIVATE_KEY`: Private key for signature generation
- `CAPITALBOX_PARTNER_ID`: Partner identifier

## Usage Examples

```typescript
// Initialize service
const cbService = new CapitalBoxLenderService(supabaseClient);

// Submit application
const response = await cbService.submitApplication(
  'company-123',
  'app-456', 
  {
    amount: 50000,
    term_months: 24,
    purpose: 'working_capital',
    applicant_national_id: 'sensitive-id',
    ubo_list: [{ nationalId: 'id1', firstName: 'John', lastName: 'Doe' }]
  },
  attachments,
  'contact@company.com'
);

// Check application status
const status = await cbService.getApplicationStatus('cb-app-uuid');

// Get available offers
const offers = await cbService.getOffers('cb-app-uuid');

// Upload additional document
const uploadResult = await cbService.uploadDocument(
  'cb-app-uuid',
  { name: 'doc.pdf', type: 'application/pdf', data: 'base64...' }
);
```

## API Integration Details

### Request Authentication
1. **Basic Auth**: Username/password for initial authentication
2. **Signature**: SHA256 hash of private key + URL + request body
3. **Headers**: Content-Type, Authorization, and custom signature headers

### Response Handling
- **Success Responses**: Application ID extraction and status mapping
- **Error Responses**: Detailed error parsing and user-friendly messages
- **Timeout Handling**: Automatic retry with exponential backoff

### Status Mapping
```typescript
// CapitalBox → Internal Status
'SUBMITTED' → 'processing'
'APPROVED' → 'approved' 
'REJECTED' → 'rejected'
'CLOSED' → 'rejected'
'CONTRACT_READY' → 'contract_ready'
```

## Security Considerations

### Sensitive Data Handling
- **National IDs**: Secure transmission and temporary storage only
- **UBO Information**: GDPR-compliant processing
- **API Credentials**: Environment variable storage with validation

### Request Security
- **Signature Validation**: Prevents request tampering
- **HTTPS Only**: All API communications encrypted
- **Credential Validation**: Runtime credential availability checking

## Notes

- **Production Ready**: Handles both sandbox and production environments
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Error Recovery**: Robust error handling with meaningful user feedback
- **Webhook Support**: Complete webhook processing for real-time updates
- **Document Handling**: Support for multiple document types and sizes
- **Scalability**: Designed for high-volume application processing

## Related Files

- `lib/services/lenderService.ts`: Parent service orchestrating CapitalBox integration
- `lib/services/CapitalBoxProcessingService.ts`: Database utility functions
- `app/api/capitalbox/`: API endpoints for CapitalBox operations
- `types/lenders.ts`: CapitalBox-specific type definitions

## Recent Changes

- Enhanced profile field integration for applicant names
- Improved UBO processing with validation
- Added comprehensive document upload capabilities
- Enhanced error handling and user feedback
- Added webhook support for real-time status updates
