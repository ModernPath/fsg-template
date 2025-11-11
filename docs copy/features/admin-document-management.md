# Admin Document Management

## Overview

Admin users can view, download, and preview company documents through the admin panel. This feature provides comprehensive document management capabilities for financial documents and other company-related files.

## Features

### 1. Document Viewing

Admin users can see all documents associated with a company in the company detail page:
- **Document name**: Original filename
- **Document type**: Category (financial_statements, tax_return, etc.)
- **File size**: Size in MB
- **Fiscal year**: Year the document relates to
- **Fiscal period**: Period (annual, Q1, Q2, Q3, Q4)
- **Processing status**: Current processing state (pending, processing, completed, failed)
- **Upload date**: When the document was uploaded
- **MIME type**: File type (application/pdf, etc.)

### 2. Document Download

Admin users can download any company document:
- Click the "Lataa" (Download) button
- File is downloaded with original filename
- Supports all document types (PDF, Excel, Word, images, etc.)
- Shows loading state while downloading

### 3. Document Preview

Admin users can preview documents in a new tab:
- Click the "Esikatsele" (Preview) button
- Opens document in new browser tab
- Works best with PDF files
- Uses browser's built-in viewer

### 4. Extracted Financial Data

If documents have been processed, admin can view:
- Extracted financial metrics
- Structured data in JSON format
- Metadata about extraction process

## Technical Implementation

### API Endpoint

**GET** `/api/admin/documents/[documentId]/download`

#### Authentication
- Requires valid JWT token in Authorization header
- User must have `is_admin = true` in profile

#### Response
- Returns file as binary stream
- Sets appropriate Content-Type header
- Sets Content-Disposition for download
- Returns 404 if document not found
- Returns 403 if user is not admin

### Frontend Components

#### Admin Company Detail Page

Location: `app/[locale]/admin/companies/[companyId]/page.tsx`

Key functions:
```typescript
// Download document
const handleDownloadDocument = async (documentId: string, documentName: string)

// Preview document in new tab
const handlePreviewDocument = async (documentId: string)
```

#### Document Display

Each document card shows:
- File icon with primary color
- Document name and type
- Action buttons (Preview, Download)
- Detailed metadata grid
- Extracted financial data (if available)
- Processing metadata

### Security

1. **Authentication**: Only authenticated admin users can access
2. **Authorization**: Verified through profile.is_admin check
3. **Storage**: Files stored in Supabase Storage `financial_documents` bucket
4. **Path security**: File paths verified against database records
5. **No direct storage access**: All downloads go through API endpoint

### Storage Structure

Documents are stored in Supabase Storage with the following path structure:

```
financial_documents/
  └── {company_id}/
      ├── {document_id}/
      │   └── {filename}
      └── {random_id}_{filename}
```

### Database Schema

Documents table includes:
- `id`: UUID primary key
- `company_id`: Reference to company
- `document_type_id`: Reference to document type
- `name`: Original filename
- `file_path`: Path in storage
- `mime_type`: File type
- `file_size`: Size in bytes
- `fiscal_year`: Year (nullable)
- `fiscal_period`: Period (nullable)
- `uploaded_at`: Upload timestamp
- `processed`: Processing flag
- `processing_status`: Status (pending/processing/completed/failed)
- `extraction_data`: JSONB of extracted data
- `metadata`: JSONB of additional metadata

## Usage

### For Admin Users

1. **Navigate to company detail page**:
   - Go to Admin → Companies
   - Click on a company
   - Scroll to "Dokumentit" section

2. **View document details**:
   - See all document metadata
   - Check processing status
   - View extracted data if available

3. **Download document**:
   - Click "Lataa" button
   - File downloads to your computer
   - Keeps original filename

4. **Preview document**:
   - Click "Esikatsele" button
   - Opens in new browser tab
   - Use browser's viewer controls

### Error Handling

The system handles various error scenarios:

1. **Missing document**: Shows "Document not found" error
2. **Storage error**: Shows "Failed to download file" error
3. **Authentication error**: Redirects to login
4. **Permission error**: Shows "Admin access required" error
5. **Network error**: Shows user-friendly error message

## Future Enhancements

Potential improvements:
1. **Inline PDF viewer**: Embed PDF viewer in admin panel
2. **Document annotations**: Add notes/comments to documents
3. **Version history**: Track document versions
4. **Bulk download**: Download multiple documents as ZIP
5. **Document deletion**: Allow admins to delete documents
6. **Document upload**: Allow admins to upload documents for companies
7. **OCR integration**: Automatic text extraction from images
8. **Document search**: Search within document contents

## Related Documentation

- [Admin API Protection](mdc:.cursor/rules/@admin-api-protection.mdc)
- [Supabase Auth Implementation](mdc:.cursor/rules/@supabase-auth-implementation.mdc)
- [Backend Architecture](mdc:docs/backend.md)
- [Data Model - Documents](mdc:docs/datamodel.md#document)

