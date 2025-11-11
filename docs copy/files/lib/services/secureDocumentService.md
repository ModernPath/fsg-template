# secureDocumentService.ts Documentation

**Path**: `lib/services/secureDocumentService.ts`
**Type**: TypeScript Service Class
**Size**: ~472 lines
**Last Modified**: Active development file

## Purpose

GDPR-compliant secure document sharing service that creates time-limited, access-controlled links for sharing financial documents with lenders and partners. Implements comprehensive access controls, audit logging, and data minimization principles to ensure regulatory compliance while enabling secure business document sharing.

## Key Components

### Main Class: SecureDocumentService

#### Factory Method: `create(supabaseClient?)`
- **Purpose**: Creates service instances with proper admin client configuration
- **Features**: Automatic admin client creation with service role access

### Access Control System

#### `createSecureAccess(request)`
- **Purpose**: Generates secure, time-limited access links for document sharing
- **Parameters**: `DocumentAccessRequest` with lender, application, and access details
- **Returns**: Secure URL with embedded access token
- **Features**:
  - Cryptographically secure token generation (32-byte hex)
  - Partnership type-based access level enforcement
  - Configurable expiration times and download limits
  - IP restriction support
  - Comprehensive audit logging

#### `verifyAccess(token, ipAddress, userAgent)`
- **Purpose**: Validates access tokens and enforces security policies
- **Returns**: Access record with permissions and metadata
- **Features**:
  - Token expiration validation
  - Download limit enforcement
  - IP address restriction checking
  - Failed access attempt logging
  - Automatic audit trail creation

### Data Access Levels

#### Full Access ('full')
- **Target**: Verified funding partners
- **Includes**:
  - Complete application details
  - All financial documents
  - Company contact information
  - Existing financing offers
- **Use Case**: Active lender evaluation and decision-making

#### Basic Access ('basic')
- **Target**: Preliminary partner review
- **Includes**:
  - Basic application information (amount, term, industry)
  - Approximate company location
  - No sensitive personal data
- **Use Case**: Initial partner assessment and routing

#### Teaser Access ('teaser')
- **Target**: Marketing partners and lead generation
- **Includes**:
  - Industry category only
  - Funding range (not exact amount)
  - Regional location (not specific address)
  - Funding type classification
- **Use Case**: Lead qualification and market analysis

### Document Management

#### `getApplicationData(applicationId, accessLevel)`
- **Purpose**: Retrieves application data filtered by access level
- **Features**:
  - Data minimization based on access level
  - Automatic data masking for sensitive information
  - Related data aggregation (company, documents, offers)

#### `trackDownload(token, ipAddress)`
- **Purpose**: Records document download events and updates counters
- **Features**:
  - Download count increment
  - Access timestamp logging
  - IP address tracking

### Security Features

#### Token Management
- **Generation**: Crypto.randomBytes(32) for cryptographic security
- **Format**: 64-character hexadecimal string
- **Uniqueness**: Collision-resistant with 256-bit entropy

#### Access Logging
- **Events**: Creation, access granted/denied, downloads, revocation
- **Data**: Timestamp, IP address, user agent, action type, success status
- **Retention**: Configurable with automatic cleanup

#### IP Restrictions
- **Configuration**: Optional whitelist of allowed IP addresses
- **Enforcement**: Automatic denial for non-whitelisted IPs
- **Logging**: Failed access attempts from restricted IPs

### GDPR Compliance

#### `revokeAccess(token, reason)`
- **Purpose**: Implements right to withdraw consent
- **Features**:
  - Immediate access termination
  - Reason logging for audit compliance
  - Automatic cleanup triggering

#### `cleanupExpiredAccess()`
- **Purpose**: Implements storage limitation principle
- **Features**:
  - Automatic deletion of expired access records
  - Audit log preservation according to retention policies
  - Scheduled cleanup capability

### Helper Methods

#### Data Masking Functions
- **`getApproximateLocation(address)`**: Returns city/region without specific address
- **`getFundingRange(amount)`**: Provides amount range instead of exact figure
- **`getRegion(address)`**: Returns regional information only

#### Document Retrieval
- **`getApplicationDocuments(applicationId)`**: Fetches document metadata with access controls
- **`getApplicationOffers(applicationId)`**: Retrieves offer information with lender details

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations
- `crypto`: Cryptographic token generation

### Internal Dependencies
- `@/utils/supabase/server`: Supabase client utilities

### Database Tables
- `secure_document_access`: Access token and permission storage
- `funding_applications`: Application data
- `companies`: Company information
- `documents`: Document metadata
- `financing_offers`: Offer information
- `lenders`: Lender details

## Usage Examples

```typescript
// Create service instance
const secureService = await SecureDocumentService.create();

// Create secure access link
const secureLink = await secureService.createSecureAccess({
  lenderId: 'lender-123',
  applicationId: 'app-456',
  recipientEmail: 'lender@example.com',
  accessLevel: 'full',
  expirationHours: 24,
  maxDownloads: 3
});

// Verify access
const access = await secureService.verifyAccess(
  token,
  '192.168.1.1',
  'Mozilla/5.0...'
);

// Get filtered application data
const applicationData = await secureService.getApplicationData(
  'app-456',
  'basic'
);
```

## Security Considerations

### Token Security
- **Entropy**: 256-bit cryptographic randomness
- **Transmission**: HTTPS-only URLs
- **Storage**: Hashed tokens in database (consideration for future enhancement)
- **Expiration**: Automatic expiration with configurable timeouts

### Access Control
- **Principle of Least Privilege**: Minimum necessary data exposure
- **Partnership-Based Restrictions**: Automatic access level downgrading
- **Time-Based Limits**: Automatic expiration of access rights
- **Usage-Based Limits**: Download count restrictions

### Audit and Monitoring
- **Comprehensive Logging**: All access attempts and outcomes
- **Failed Access Tracking**: Security incident detection
- **IP-Based Monitoring**: Geographic and network-based analysis
- **Retention Policies**: GDPR-compliant data retention

## Notes

- **GDPR Compliance**: Implements data minimization, purpose limitation, and storage limitation
- **Security First**: Cryptographic tokens with comprehensive access controls
- **Audit Trail**: Complete logging for regulatory compliance and security monitoring
- **Scalability**: Designed for high-volume document sharing operations
- **Flexibility**: Configurable access levels and restrictions
- **Integration**: Seamless integration with lender workflow systems

## Related Files

- `lib/services/lenderService.ts`: Primary consumer for email-based submissions
- `app/[locale]/secure-access/[token]/page.tsx`: Frontend access interface
- `app/api/secure-access/`: API endpoints for access verification
- `types/database.ts`: Database schema definitions

## Environment Variables

- `DOCUMENT_ENCRYPTION_KEY`: Encryption key for sensitive data (required)
- `NEXT_PUBLIC_APP_URL`: Base URL for secure link generation

## Recent Changes

- Enhanced access level enforcement based on partnership types
- Added comprehensive audit logging system
- Implemented IP restriction capabilities
- Added automatic cleanup for expired access records
- Enhanced data minimization features for GDPR compliance
