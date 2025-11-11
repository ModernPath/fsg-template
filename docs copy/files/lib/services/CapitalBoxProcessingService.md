# CapitalBoxProcessingService.ts Documentation

**Path**: `lib/services/CapitalBoxProcessingService.ts`
**Type**: TypeScript Utility Functions
**Size**: ~129 lines
**Last Modified**: Active development file

## Purpose

Specialized utility functions for managing CapitalBox lender application database operations. Provides centralized functions for updating application statuses and processing offers received from CapitalBox API, ensuring consistent data handling and comprehensive error management.

## Key Functions

### `updateLenderApplicationStatusInDb(supabase, lenderReference, status)`
- **Purpose**: Updates the status of lender applications in the database
- **Parameters**:
  - `supabase`: Supabase client with service role permissions
  - `lenderReference`: CapitalBox's unique reference ID for the application
  - `status`: New status to set for the application
- **Returns**: Updated record data or null if not found
- **Features**:
  - Automatic timestamp updates
  - Comprehensive error logging
  - Single record validation
  - Database constraint handling

### `addOffersToDatabaseInDb(supabase, lenderReference, offersData)`
- **Purpose**: Processes and stores financing offers from CapitalBox in the database
- **Parameters**:
  - `supabase`: Supabase client with service role permissions
  - `lenderReference`: CapitalBox application reference
  - `offersData`: Map of offer UUIDs to offer detail objects
- **Returns**: Array of inserted/updated offer records
- **Features**:
  - UPSERT operations to prevent duplicates
  - Automatic data type conversion and validation
  - Comprehensive offer mapping from CapitalBox format
  - Fee calculation and aggregation

## Database Operations

### Status Updates
- **Table**: `lender_applications`
- **Key Fields**: `lender_reference`, `status`, `updated_at`
- **Validation**: Single record updates with existence verification
- **Error Handling**: Detailed error logging with context

### Offer Processing
- **Table**: `financing_offers`
- **Conflict Resolution**: UPSERT on `(funding_application_id, lender_id, lender_offer_reference)`
- **Data Mapping**: CapitalBox offer format to internal schema
- **Relationship Management**: Links to applications and lenders

## Data Transformation

### Offer Mapping
```typescript
// CapitalBox Format → Internal Format
{
  principalAmount → amount_offered
  term → loan_term_months  
  monthlyFee → fee_percentage
  monthlyCost → monthly_payment
  totalCost → total_repayment
  setupFee + adminFee → fee_amount
  offer_uuid → lender_offer_reference
}
```

### Safe Data Parsing
- **`safeParseFloat(value)`**: Converts various number formats to strings
- **Null Handling**: Graceful handling of undefined/null/empty values
- **Type Validation**: Ensures numeric fields are properly converted
- **Default Values**: Provides sensible defaults for missing data

## Error Handling

### Database Errors
- **Connection Issues**: Comprehensive error logging with context
- **Constraint Violations**: Foreign key and unique constraint handling
- **Transaction Safety**: Atomic operations with rollback capability
- **Not Found Scenarios**: Graceful handling of missing records

### Data Validation
- **Required Fields**: Validation of essential offer data
- **Type Conversion**: Safe conversion with error recovery
- **Relationship Integrity**: Verification of foreign key relationships
- **Duplicate Prevention**: UPSERT logic to handle existing offers

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations

### Database Tables
- `lender_applications`: Application tracking and status
- `financing_offers`: Offer storage and management
- `funding_applications`: Main application records
- `lenders`: Lender information

## Usage Examples

```typescript
// Update application status
await updateLenderApplicationStatusInDb(
  supabaseAdmin,
  'cb-app-uuid-123',
  'approved'
);

// Process offers from CapitalBox
const offersData = {
  'offer-uuid-1': {
    principalAmount: '50000',
    term: '24',
    monthlyFee: '2.5',
    monthlyCost: '2291.67',
    totalCost: '55000',
    setupFee: '500',
    adminFee: '200'
  }
};

await addOffersToDatabaseInDb(
  supabaseAdmin,
  'cb-app-uuid-123',
  offersData
);
```

## Database Schema Integration

### Lender Applications Table
- **Primary Key**: `id` (internal UUID)
- **External Reference**: `lender_reference` (CapitalBox UUID)
- **Status Tracking**: `status`, `updated_at`
- **Relationships**: Links to `funding_applications` and `lenders`

### Financing Offers Table
- **Unique Constraint**: `(funding_application_id, lender_id, lender_offer_reference)`
- **Financial Data**: Amount, terms, rates, fees, payments
- **Metadata**: Offer date, status, raw offer data
- **Relationships**: Links to applications and lenders

## Performance Considerations

### Batch Processing
- **Offer Processing**: Handles multiple offers in single transaction
- **UPSERT Operations**: Efficient conflict resolution
- **Bulk Inserts**: Optimized for multiple offer processing

### Query Optimization
- **Index Usage**: Leverages database indexes on reference fields
- **Single Record Operations**: Targeted updates with specific conditions
- **Relationship Queries**: Efficient foreign key lookups

## Notes

- **Atomic Operations**: All database operations are transactional
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Error Recovery**: Graceful handling of various error scenarios
- **Data Integrity**: Ensures referential integrity and data consistency
- **Scalability**: Designed for high-volume offer processing
- **Monitoring**: Extensive logging for operational visibility

## Related Files

- `lib/services/lenders/CapitalBoxLenderService.ts`: Primary consumer of these functions
- `lib/services/LenderApplicationService.ts`: Alternative application management
- `app/api/capitalbox/`: API endpoints using these utilities
- `types/database.ts`: Database schema definitions

## Recent Changes

- Enhanced error handling with detailed context logging
- Added comprehensive offer data mapping and validation
- Improved UPSERT logic for duplicate offer prevention
- Added safe data parsing utilities for robust type conversion
- Enhanced logging for better operational monitoring
