# lenderService.ts Documentation

**Path**: `lib/services/lenderService.ts`
**Type**: TypeScript Service Class
**Size**: ~617 lines
**Last Modified**: Active development file

## Purpose

Central orchestration service for managing funding application submissions to various lender types. Acts as a factory and router that handles different lender integrations (API-based, email-based) and provides a unified interface for submitting quotations, managing applications, and handling document uploads across multiple lending partners.

## Key Components

### Main Class: LenderService

#### Constructor & Factory Method
- **Purpose**: Creates service instances with proper Supabase client configuration
- **Factory Method**: `LenderService.create(isAdmin?: boolean)`
- **Dependencies**: QredLenderService, CapitalBoxLenderService, SecureDocumentService
- **Features**: Automatic service role client creation for admin operations

### Core Methods

#### `submitQuotation(lenderId, companyId, applicationId, lenderData, attachments, finalEmail?)`
- **Purpose**: Main entry point for submitting funding applications to lenders
- **Parameters**:
  - `lenderId`: Identifier for the target lender
  - `companyId`: Company making the application
  - `applicationId`: Internal application reference
  - `lenderData`: LenderDataPayload with application details
  - `attachments`: Document attachments as base64 data
  - `finalEmail`: Optional email override
- **Returns**: LenderQuotationResponse with success/error details
- **Features**: Automatic routing based on lender type

#### `updateApplicationStatus(applicationId, status, userId, companyId)`
- **Purpose**: Updates the status of funding applications in the database
- **Features**: Timestamp tracking and user/company validation

#### `uploadDocumentToLender(lenderApplicationId, capitalBoxApplicationId, document, lenderType?)`
- **Purpose**: Handles post-submission document uploads to specific lenders
- **Features**: Type-specific routing and error handling

### Lender Type Handlers

#### `submitToQred(lender, companyId, applicationId, lenderData, attachments, finalEmail?)`
- **Purpose**: Handles submissions to Qred API
- **Features**: Delegates to QredLenderService for API-specific logic

#### `submitToCapitalBox(lender, companyId, applicationId, lenderData, attachments, finalEmail?)`
- **Purpose**: Handles submissions to Capital Box API
- **Features**: 
  - Delegates to CapitalBoxLenderService
  - Handles rejection during initial checks
  - Manages polling configuration based on response

#### `submitViaEmail(lender, companyId, applicationId, lenderData, attachments, finalEmail?)`
- **Purpose**: Handles email-based submissions to lenders
- **Features**:
  - Secure document link generation
  - Multi-recipient email support (primary/secondary)
  - Template-based email generation
  - GDPR-compliant document sharing

### Database Operations

#### `createLenderApplication(applicationId, lenderId, reference, status, errorDetails?, additionalData?)`
- **Purpose**: Creates tracking records for lender applications
- **Features**:
  - Automatic polling schedule setup
  - Status-based polling configuration
  - Error detail storage

#### `findExistingLenderApplication(applicationId, lenderId)`
- **Purpose**: Prevents duplicate submissions by checking existing applications

#### `getAllLenders()`
- **Purpose**: Retrieves all available lenders for selection

### Interfaces and Types

#### `LenderDataPayload`
- **Purpose**: Standardized data structure for lender submissions
- **Key Fields**:
  - `amount`: Funding amount requested
  - `term_months`: Loan term
  - `purpose`: Funding purpose
  - `applicant_national_id`: Sensitive applicant ID
  - `ubo_list`: Ultimate beneficial owners list
  - Additional flexible fields for lender-specific data

#### `LenderResponse<T>`
- **Purpose**: Generic response wrapper for lender operations
- **Fields**: `success`, `data?`, `error?`, `additionalData?`

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations
- `axios`: HTTP requests (indirect through lender services)

### Internal Dependencies
- `./lenders/QredLenderService`: Qred API integration
- `./lenders/CapitalBoxLenderService`: Capital Box API integration
- `./documentService`: Document preparation
- `./secureDocumentService`: GDPR-compliant document sharing
- `../email`: Email sending functionality
- `@/utils/supabase/server`: Supabase client utilities

### Database Tables
- `lenders`: Lender configuration and contact information
- `funding_applications`: Application records
- `lender_applications`: Application tracking per lender
- `companies`: Company information
- `profiles`: User profile data

## Usage Examples

```typescript
// Create service instance
const lenderService = await LenderService.create(true); // Admin mode

// Submit application to a lender
const response = await lenderService.submitQuotation(
  'lender-123',
  'company-456',
  'app-789',
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

// Upload additional document
await lenderService.uploadDocumentToLender(
  'lender-app-123',
  'cb-app-456',
  { name: 'document.pdf', type: 'application/pdf', data: 'base64...' }
);
```

## Notes

- **Security**: Handles sensitive financial and personal data
- **GDPR Compliance**: Implements secure document sharing with access controls
- **Error Handling**: Comprehensive error recovery and status tracking
- **Scalability**: Designed for multiple concurrent lender submissions
- **Extensibility**: Easy to add new lender types through the factory pattern
- **Monitoring**: Extensive logging for debugging and audit trails

## Related Files

- `lib/services/lenders/QredLenderService.ts`: Qred-specific implementation
- `lib/services/lenders/CapitalBoxLenderService.ts`: Capital Box implementation
- `lib/services/secureDocumentService.ts`: Document sharing service
- `lib/types/lenders.ts`: Lender-related type definitions
- `app/api/lenders/`: API endpoints using this service

## Exported Functions

### `getLenderApplicationStatus(supabase, lenderType, lenderReferenceId)`
- **Purpose**: Retrieves current status of a lender application
- **Features**: Type-specific status checking

### `acceptLenderOffer(supabase, lenderType, lenderReferenceId, acceptanceData)`
- **Purpose**: Accepts offers from lenders
- **Features**: Type-specific acceptance handling

## Recent Changes

- Enhanced email submission with multi-recipient support
- Added document upload routing for post-submission uploads
- Improved error handling and status tracking
- Added GDPR-compliant secure document sharing
- Enhanced logging and monitoring capabilities
