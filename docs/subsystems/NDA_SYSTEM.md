# NDA System Documentation

## Overview

The NDA (Non-Disclosure Agreement) system provides comprehensive management of confidential agreements between companies and potential buyers in the M&A process.

## Features

### 1. **NDA Template Generation**
- Bilingual Finnish/English template
- Professional legal format with 10 sections
- Customizable fields (parties, purpose, term)
- Markdown-based for easy conversion to PDF

### 2. **NDA Lifecycle Management**
- **Draft**: Initial creation
- **Pending**: Sent to recipient, awaiting signature
- **Signed**: Fully executed agreement
- **Expired**: Past expiration date
- **Declined**: Rejected by recipient

### 3. **Digital Signature** (Optional)
- Simple click-to-sign functionality
- IP address tracking
- Timestamp recording
- Signature metadata storage

### 4. **Document Storage**
- Full NDA text stored in database
- Markdown format for flexibility
- PDF generation ready
- Version tracking

## Architecture

### Database Schema

```sql
CREATE TABLE ndas (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  -- Parties
  company_id UUID REFERENCES companies(id),
  buyer_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  signed_by UUID REFERENCES profiles(id),
  
  -- Recipient Information
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_company TEXT,
  recipient_address TEXT,
  
  -- NDA Details
  purpose TEXT,
  content TEXT, -- Full markdown content
  template_version TEXT,
  
  -- Status & Dates
  status TEXT, -- draft, pending, sent, viewed, signed, declined, expired
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Signature Metadata
  signature_data JSONB,
  signature_ip INET,
  signature_provider TEXT
);
```

### API Endpoints

#### List NDAs
```
GET /api/ndas?company_id={id}&status={status}
```

#### Create NDA
```
POST /api/ndas
Body: {
  company_id: string,
  buyer_id?: string,
  recipient_name: string,
  recipient_email: string,
  recipient_company?: string,
  recipient_address?: string,
  purpose: string,
  term_years?: number,
  effective_date?: string
}
```

#### Get NDA
```
GET /api/ndas/[id]
```

#### Update NDA
```
PUT /api/ndas/[id]
Body: {
  recipient_name?: string,
  recipient_email?: string,
  status?: string,
  content?: string
}
```

#### Sign NDA
```
POST /api/ndas/[id]/sign
Body: {
  signature_data?: any,
  ip_address?: string
}
```

#### Delete NDA
```
DELETE /api/ndas/[id]
```
*Note: Only unsigned NDAs can be deleted*

### Components

#### `NDACreationForm`
- Form for creating new NDAs
- Field validation
- Auto-generates content from template
- Props:
  - `companyId?: string`
  - `buyerId?: string`
  - `onSuccess?: (nda) => void`
  - `onCancel?: () => void`

#### `NDAViewer`
- Displays NDA content and metadata
- Status badge display
- Action buttons (sign, download, edit, delete)
- Markdown rendering
- Props:
  - `nda: any`
  - `canSign?: boolean`
  - `canEdit?: boolean`
  - `canDelete?: boolean`
  - `onUpdate?: () => void`

### Pages

#### `/dashboard/ndas`
- List all NDAs
- Stats overview (total, pending, signed)
- Filter and search
- Create new NDA button

#### `/dashboard/ndas/new`
- NDA creation form
- Company and buyer selection
- Custom terms configuration

#### `/dashboard/ndas/[id]`
- View full NDA document
- Sign, download, edit actions
- Status tracking

## NDA Template Structure

### Sections

1. **Parties** - Company and recipient details
2. **Purpose** - Reason for disclosure
3. **Confidential Information** - Definition and scope
4. **Obligations** - Duties and restrictions
5. **Exceptions** - What's not covered
6. **Return of Information** - End of term requirements
7. **Term** - Duration and validity period
8. **Breach** - Consequences and remedies
9. **General Terms** - Governing law, jurisdiction
10. **Signatures** - Signature blocks

### Customization

```typescript
import { generateNDATemplate, NDAData } from '@/lib/nda-template';

const ndaContent = generateNDATemplate({
  company_name: 'Tech Company Oy',
  company_business_id: '1234567-8',
  company_address: 'Helsinki, Finland',
  recipient_name: 'John Doe',
  recipient_email: 'john@example.com',
  recipient_company: 'Buyer Corp',
  recipient_address: 'Stockholm, Sweden',
  purpose: 'M&A Due Diligence',
  term_years: 3,
  effective_date: '2024-01-01'
});
```

## Test Data

### Test Users
All test users have access to NDA functionality:
- `admin@bizexit.test` - Full access
- `broker@bizexit.test` - Create and manage
- `seller@bizexit.test` - Create for own companies
- `buyer@bizexit.test` - View and sign assigned NDAs

### Test NDAs
Three test NDAs are created:
1. **TechStart NDA** - Signed, with Buyer Corporation Oy
2. **Nordic Retail NDA** - Pending signature
3. **CleanTech NDA** - Signed, with Industrial Holdings AB

### Seeding Test Data

```bash
# Seed all test data (including NDAs)
npm run seed:test-data

# Reset and reseed all test data
npm run reset:test-data
```

## Permissions & Security

### Row Level Security (RLS)
NDAs are protected by Supabase RLS policies:
- Users can only see NDAs for companies in their organization
- Buyers can see NDAs assigned to them
- Admins have full access

### Permission Checks
- **Can Sign**: `buyer_id === user.id && status !== 'signed'`
- **Can Edit**: `(is_admin || created_by === user.id) && status !== 'signed'`
- **Can Delete**: `(is_admin || created_by === user.id) && status !== 'signed'`

### Audit Trail
All actions are tracked:
- `created_by` - Who created the NDA
- `signed_by` - Who signed the NDA
- `signature_ip` - IP address of signer
- `created_at` / `updated_at` - Timestamps
- `signed_at` - Signature timestamp

## Future Enhancements

### Planned Features
1. **PDF Generation**
   - Convert Markdown to professional PDF
   - Custom letterhead and branding
   - Digital certificate attachment

2. **E-Signature Integration**
   - DocuSign integration
   - HelloSign integration
   - Electronic signature canvas

3. **Email Notifications**
   - Send NDA to recipient email
   - Signature reminders
   - Expiration alerts

4. **Advanced Templates**
   - Multiple template types
   - Custom clauses
   - Conditional sections
   - Multi-party NDAs

5. **Compliance**
   - GDPR compliance tools
   - Audit log export
   - Retention policies
   - Legal archive

6. **Analytics**
   - Signature rates
   - Time to signature
   - Most common terms
   - Expiration tracking

## Localization

### Supported Languages
- English (`en`)
- Finnish (`fi`)
- Swedish (`sv`)

### Translation Files
- `messages/en/ndas.json`
- `messages/fi/ndas.json`
- `messages/sv/ndas.json`

### Key Translation Sections
- Form labels and placeholders
- Status labels
- Action buttons
- Error messages
- Success notifications

## Development Guide

### Adding New NDA Fields

1. **Update Database Schema**
```sql
ALTER TABLE ndas ADD COLUMN new_field TEXT;
```

2. **Update TypeScript Types**
```typescript
// lib/nda-template.ts
export interface NDAData {
  // ... existing fields
  new_field?: string;
}
```

3. **Update Template Generator**
```typescript
// lib/nda-template.ts
export function generateNDATemplate(data: NDAData): string {
  // Use data.new_field in template
}
```

4. **Update Form Component**
```tsx
// components/ndas/NDACreationForm.tsx
// Add form field for new_field
```

5. **Update API**
```typescript
// app/api/ndas/route.ts
const { new_field } = body;
// Handle new_field in create/update
```

### Testing

```bash
# Create test NDAs
npm run seed:test-data

# Test NDA creation
curl -X POST http://localhost:3000/api/ndas \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "...",
    "recipient_name": "Test User",
    "recipient_email": "test@example.com",
    "purpose": "Testing"
  }'

# Reset test data
npm run reset:test-data
```

## Troubleshooting

### Common Issues

**NDA not appearing in list**
- Check organization membership
- Verify company association
- Check RLS policies

**Cannot sign NDA**
- Verify buyer_id matches current user
- Check status is not already 'signed'
- Confirm permissions

**Content not generating**
- Check company data is complete
- Verify all required fields present
- Check template function imports

**Migration errors**
- Run migrations in order
- Check for duplicate columns
- Verify foreign key relationships

## References

- [Database Schema](/docs/bizexit/datamodel.md)
- [API Documentation](/app/api/ndas/)
- [Component Library](/components/ndas/)
- [Test Data Script](/scripts/seed-test-data.ts)

