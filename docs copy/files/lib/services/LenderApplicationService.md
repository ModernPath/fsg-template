# LenderApplicationService.ts Documentation

**Path**: `lib/services/LenderApplicationService.ts`
**Type**: TypeScript Service Class
**Size**: ~904 lines
**Last Modified**: Active development file

## Purpose

Comprehensive service for managing lender applications and their automated polling system. Handles the complete lifecycle of lender applications from creation to offer processing, including intelligent polling with exponential backoff, status management, and offer creation for multiple lender types.

## Key Components

### Main Class: LenderApplicationService

#### Constructor
- **Purpose**: Initializes service with Supabase client and lender service instances
- **Parameters**: Optional Supabase client and cookie store for server-side rendering
- **Features**: Automatic client creation for components without provided clients

### Application Management

#### `createLenderApplication(applicationId, lenderId, lenderReference, initialData?)`
- **Purpose**: Creates new lender application tracking records
- **Returns**: LenderApplication object or null
- **Features**:
  - Automatic polling schedule setup (5-minute initial delay)
  - Status initialization as 'submitted'
  - Initial data storage for lender-specific information

#### `getLenderApplication(id)`
- **Purpose**: Retrieves lender application by internal ID
- **Features**: Error handling with specific error code detection

#### `updateLenderApplicationStatus(id, status, rawResponseData)`
- **Purpose**: Updates application status and stores raw API response data
- **Features**: Focused status updates without poll counter manipulation

#### `updateNextPollTime(id, nextPollAt)`
- **Purpose**: Manages polling schedule for applications
- **Features**: Precise timestamp control for polling intervals

### Polling System

#### `pollLenderApplication(lenderApplicationId)`
- **Purpose**: Core polling logic for checking application status updates
- **Returns**: Object with status change information and offer details
- **Features**:
  - Lender type-specific polling methods
  - Final status detection to stop polling
  - Offer creation integration
  - Exponential backoff scheduling
  - Comprehensive error handling

#### `getLenderApplicationsDueForPolling()`
- **Purpose**: Retrieves applications that need status checking
- **Features**: Time-based filtering and status exclusion logic

#### `calculateNextPollDelay(attemptNumber)`
- **Purpose**: Implements intelligent polling intervals with exponential backoff
- **Features**:
  - Base delay scaling with attempt count
  - Maximum delay capping
  - Jitter addition for distributed polling
  - Minimum delay enforcement

### Lender-Specific Polling

#### Qred Integration
- **Method**: `checkQredStatus(preOfferId)`
- **Features**:
  - Pre-offer status checking
  - Offer detail extraction and mapping
  - Final status detection for polling termination
  - Bid validity period handling

#### CapitalBox Integration
- **Method**: `checkCapitalBoxStatus(lenderReference)`
- **Features**:
  - Dual status checking (application status + direct offers)
  - Offer detection and database deduplication
  - Final state handling (CLOSED status)
  - Error-based final state detection (400 responses)

### Offer Management

#### `createFinancingOffer(lenderApplicationId, offerDetails)`
- **Purpose**: Creates financing offer records from lender data
- **Parameters**: Lender application ID and structured offer details
- **Returns**: Created offer ID or null
- **Features**:
  - Automatic relationship mapping to applications and lenders
  - Comprehensive offer data storage
  - Error handling with detailed logging

#### `getFinancingOffers(applicationId)`
- **Purpose**: Retrieves all offers for a funding application
- **Features**: Complete offer data with relationships

### Administrative Functions

#### `getAllLenderApplications()`
- **Purpose**: Retrieves all lender applications with related data
- **Features**:
  - Complex join queries with company and lender names
  - Data transformation for frontend consumption
  - Comprehensive error handling

### Data Structures

#### `OfferDetails` Interface
```typescript
interface OfferDetails {
  amount: number;
  termMonths: number;
  interestRate?: number;
  monthlyPayment?: number;
  totalRepayment?: number;
  feeAmount?: number;
  feePercentage?: number;
  validUntil: Date;
  lenderOfferReference?: string;
  rawOfferData: any;
}
```

## Polling Strategy

### Exponential Backoff Algorithm
- **Base Delay**: 5 minutes
- **Growth Factor**: 1.5x per attempt
- **Maximum Delay**: 60 minutes
- **Jitter**: ±20% randomization
- **Minimum Delay**: 1 minute

### Final Status Detection
- **Qred**: Uses `isFinalStatus` flag from API responses
- **CapitalBox**: Detects CLOSED status and 400 error responses
- **Email**: No polling (manual processing)

### Status Mapping
- **Processing States**: 'submitted', 'processing', 'under_review'
- **Offer States**: 'approved', 'offers_received', 'contract_ready'
- **Final States**: 'rejected', 'completed', 'accepted', 'expired'

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations
- `axios`: HTTP requests (indirect through lender services)

### Internal Dependencies
- `./lenders/QredLenderService`: Qred API integration
- `./lenders/CapitalBoxLenderService`: CapitalBox API integration
- `@/utils/supabase/client`: Client-side Supabase utilities
- `@/lib/types/database`: Database type definitions

### Database Tables
- `lender_applications`: Application tracking and polling
- `financing_offers`: Offer storage and management
- `funding_applications`: Main application records
- `lenders`: Lender configuration
- `companies`: Company information

## Usage Examples

```typescript
// Create service instance
const service = new LenderApplicationService(supabaseClient);

// Create new lender application
const application = await service.createLenderApplication(
  'funding-app-123',
  'lender-456',
  'external-ref-789',
  { initialData: 'value' }
);

// Poll application for updates
const result = await service.pollLenderApplication(application.id);
if (result.statusChanged) {
  console.log(`Status changed to: ${result.currentStatus}`);
  if (result.hasNewOffer) {
    console.log(`New offer created: ${result.offerId}`);
  }
}

// Get applications due for polling
const dueApplications = await service.getLenderApplicationsDueForPolling();
```

## Error Handling

### Polling Errors
- **API Failures**: Status set to 'error' with polling termination
- **Network Issues**: Retry logic with exponential backoff
- **Invalid Responses**: Error logging with raw response storage
- **Timeout Handling**: Graceful degradation with status updates

### Database Errors
- **Connection Issues**: Comprehensive error logging
- **Constraint Violations**: Proper error propagation
- **Transaction Failures**: Rollback and recovery mechanisms

## Notes

- **Intelligent Polling**: Exponential backoff with jitter prevents API overload
- **Final State Detection**: Automatic polling termination for completed applications
- **Offer Integration**: Seamless offer creation from lender responses
- **Multi-Lender Support**: Extensible architecture for new lender types
- **Error Recovery**: Comprehensive error handling with detailed logging
- **Performance**: Optimized queries with proper indexing and relationships

## Related Files

- `lib/services/lenders/QredLenderService.ts`: Qred-specific polling logic
- `lib/services/lenders/CapitalBoxLenderService.ts`: CapitalBox integration
- `app/api/inngest/lender-polling/`: Background polling job implementation
- `components/admin/LenderApplicationManager.tsx`: Admin interface
- `types/database.ts`: Database schema and type definitions

## Polling Configuration

### Default Settings
- **Initial Delay**: 5 minutes
- **Maximum Attempts**: Unlimited (until final status)
- **Maximum Delay**: 60 minutes
- **Jitter Range**: ±20%

### Status-Based Exclusions
Polling stops for applications with status:
- `rejected`, `declined`, `expired`
- `accepted`, `completed`
- `error`, `approved`, `contract_ready`, `offered`

## Recent Changes

- Enhanced polling logic with final status detection
- Added comprehensive offer creation and management
- Improved error handling and recovery mechanisms
- Added exponential backoff with jitter for distributed polling
- Enhanced database relationship management and data transformation
