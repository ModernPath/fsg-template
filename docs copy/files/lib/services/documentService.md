# documentService.ts Documentation

**Path**: `lib/services/documentService.ts`
**Type**: TypeScript Service Class
**Size**: ~104 lines
**Last Modified**: Active development file

## Purpose

Service responsible for document retrieval and processing operations, specifically focused on preparing documents for lender submissions. Handles the conversion of stored documents into formats suitable for external API integrations and email attachments.

## Key Components

### Main Class: DocumentService

#### Constructor
- **Purpose**: Initializes service with Supabase client
- **Parameters**: `supabase: SupabaseClient` - Database client for document operations

### Core Methods

#### `fetchDocumentsForSubmission(companyId, maxDocuments?)`
- **Purpose**: Retrieves and prepares company documents for lender submission
- **Parameters**:
  - `companyId`: Company identifier
  - `maxDocuments`: Maximum number of documents to retrieve (default: 10)
- **Returns**: Array of formatted document objects with base64 content
- **Features**:
  - Document filtering and ordering
  - Base64 content conversion
  - Error handling for individual document failures
  - Metadata preservation for lender requirements

#### `fileToBase64(file)`
- **Purpose**: Converts Blob objects to base64 strings for API transmission
- **Parameters**: `file: Blob` - File blob from Supabase storage
- **Returns**: Base64 encoded string
- **Features**: 
  - ArrayBuffer to Buffer conversion
  - Error handling for conversion failures
  - Memory-efficient processing

### Document Processing Pipeline

#### Document Retrieval
1. **Database Query**: Fetches document metadata from `documents` table
2. **Filtering**: Orders by creation date (most recent first)
3. **Limit Application**: Respects maximum document count
4. **Status Checking**: Currently includes all documents (processed flag commented out)

#### File Processing
1. **Storage Download**: Retrieves file content from Supabase storage bucket
2. **Content Conversion**: Converts blob to base64 for API compatibility
3. **Metadata Mapping**: Formats document information for lender APIs
4. **Error Recovery**: Continues processing if individual documents fail

#### Output Format
```typescript
{
  id: string,           // Document database ID
  name: string,         // Original filename
  type: string,         // MIME type
  data: string,         // Base64 encoded content
  fiscal_year: number,  // Document fiscal year
  file_path: string     // Storage path for reference
}
```

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database and storage operations

### Supabase Integration
- **Storage Bucket**: `financial_documents`
- **Database Table**: `documents`
- **Required Fields**: `id`, `name`, `file_path`, `mime_type`, `fiscal_year`, `processed`

## Usage Examples

```typescript
// Initialize service
const docService = new DocumentService(supabaseClient);

// Fetch documents for lender submission
const documents = await docService.fetchDocumentsForSubmission(
  'company-123',
  5 // Maximum 5 documents
);

// Example output
[
  {
    id: 'doc-456',
    name: 'financial_statements_2023.pdf',
    type: 'application/pdf',
    data: 'JVBERi0xLjQKJcfs...',
    fiscal_year: 2023,
    file_path: 'company-123/financial_statements_2023.pdf'
  }
]
```

## Error Handling

### Document-Level Errors
- **Missing Files**: Logs error and excludes from results
- **Conversion Failures**: Continues processing other documents
- **Storage Access Issues**: Graceful degradation with logging

### Service-Level Errors
- **Database Connection**: Returns empty array on connection failure
- **Invalid Parameters**: Validates company ID presence
- **Permission Issues**: Handles Supabase RLS policy restrictions

## Notes

- **Performance**: Processes documents in parallel using Promise.all
- **Memory Efficiency**: Streams file content without storing in memory
- **Scalability**: Respects document limits to prevent oversized payloads
- **Security**: Relies on Supabase RLS policies for access control
- **Flexibility**: Easily extensible for different document formats and requirements

## Related Files

- `lib/services/lenderService.ts`: Primary consumer of this service
- `lib/services/secureDocumentService.ts`: Alternative secure document sharing
- `app/api/documents/`: Document management API endpoints
- `types/database.ts`: Document-related type definitions

## Storage Configuration

### Supabase Storage
- **Bucket**: `financial_documents`
- **Access**: Controlled by RLS policies
- **File Types**: PDF, images, spreadsheets
- **Organization**: Typically organized by company ID

### File Path Structure
```
financial_documents/
├── company-123/
│   ├── financial_statements_2023.pdf
│   ├── balance_sheet_2023.xlsx
│   └── income_statement_2023.pdf
└── company-456/
    └── ...
```

## Recent Changes

- Enhanced error handling for individual document failures
- Added parallel processing for better performance
- Improved logging for debugging document retrieval issues
- Added fiscal year metadata preservation
- Implemented graceful degradation for missing documents
