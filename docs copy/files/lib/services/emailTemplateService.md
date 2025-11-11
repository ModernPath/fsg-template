# emailTemplateService.ts Documentation

**Path**: `lib/services/emailTemplateService.ts`
**Type**: TypeScript Service Class
**Size**: ~338 lines
**Last Modified**: Active development file

## Purpose

Comprehensive email template management service that provides template retrieval, rendering, and sending capabilities for various business scenarios. Supports multi-language templates, variable substitution, conditional rendering, and integrates with the database-driven email template system.

## Key Components

### Main Class: EmailTemplateService

#### Constructor
- **Purpose**: Initializes service with admin Supabase client
- **Features**: Automatically creates service role client for full database access

### Template Management

#### `getDefaultTemplate(type, options?)`
- **Purpose**: Retrieves default templates for specific email types
- **Parameters**:
  - `type`: EmailTemplateType (e.g., 'customer_welcome', 'document_upload')
  - `options`: Language preferences and fallback settings
- **Returns**: EmailTemplate object or null
- **Features**:
  - Language-specific template selection
  - Fallback to active templates if no default found
  - Comprehensive logging for debugging

#### `renderTemplate(template, variables)`
- **Purpose**: Processes template content with variable substitution
- **Parameters**:
  - `template`: Template string with Handlebars-style variables
  - `variables`: Key-value pairs for substitution
- **Returns**: Rendered template string
- **Features**:
  - Simple variable substitution (`{{variable_name}}`)
  - Conditional blocks (`{{#if condition}}...{{/if}}`)
  - Automatic cleanup of unmatched variables

#### `getRenderedEmail(type, variables, options?)`
- **Purpose**: Complete template processing pipeline
- **Returns**: Object with rendered subject, body, and template metadata
- **Features**: End-to-end template processing with error handling

### Pre-built Email Methods

#### Customer Communication
- **`sendWelcomeEmail(companyName, recipientEmail, recipientName?)`**
  - Welcome emails for new customers
  - Includes analysis information and next steps

#### Document Management
- **`sendDocumentUploadConfirmation(companyId, companyName, recipientEmail, recipientName?)`**
  - Confirmation emails for document uploads
  - Includes company-specific information

#### Funding Process
- **`sendFundingOptionsEmail(companyName, recipientEmail, optionsCount, fundingOptionsSummary?, recipientName?)`**
  - Presents funding options to customers
  - Includes partner portal links and option summaries

#### Progress Updates
- **`sendProgressUpdate(companyName, recipientEmail, currentStatusTitle, currentStatusDescription?, nextSteps?, recipientName?)`**
  - Status updates throughout the funding process
  - Includes next steps and timeline information

#### System Notifications
- **`sendNotification(recipientEmail, notificationType, notificationTitle, notificationMessage, actionRequired?, recipientName?)`**
  - General system notifications
  - Supports action requirements and categorization

#### Booking Management
- **`sendBookingConfirmation(recipientEmail, meetingDate, meetingTime, meetingDuration, advisorName, meetingType?, meetingLink?, recipientName?)`**
  - Meeting and consultation confirmations
  - Includes calendar information and advisor details

#### Partner Management
- **`sendPartnerWelcomeEmail(partnerName, partnerEmail, recipientName, signupCode, signupUrl, commissionPercent, partnerTier?, adminContactEmail?, adminContactName?)`**
  - Partner onboarding emails
  - Includes signup codes, commission details, and training resources

### Administrative Functions

#### `getAllTemplates(options?)`
- **Purpose**: Retrieves all available templates for management
- **Features**: Language filtering and active template selection

#### `getTemplateStats()`
- **Purpose**: Provides template usage and distribution statistics
- **Returns**: Template counts by type, version information, and activity status

### Template Rendering Engine

#### Variable Substitution
- **Pattern**: `{{variable_name}}`
- **Features**: Simple string replacement with null/undefined handling

#### Conditional Rendering
- **Pattern**: `{{#if variable}}content{{/if}}`
- **Features**: Boolean evaluation and content inclusion/exclusion

#### Variable Cleanup
- **Purpose**: Removes unmatched template variables from final output
- **Pattern**: Removes any remaining `{{...}}` patterns

## Dependencies

### External Libraries
- `@supabase/supabase-js`: Database operations

### Internal Dependencies
- `@/utils/supabase/server`: Supabase client utilities
- `@/types/email`: Email template type definitions

### Database Tables
- `email_templates`: Template storage and metadata
- **Required Fields**: `type`, `language`, `is_default`, `is_active`, `subject`, `body`, `variables`

## Usage Examples

```typescript
// Initialize service
const emailService = new EmailTemplateService();

// Send welcome email
await emailService.sendWelcomeEmail(
  'ACME Corp',
  'customer@example.com',
  'John Doe'
);

// Get and render custom template
const renderedEmail = await emailService.getRenderedEmail(
  'funding_options',
  {
    company_name: 'ACME Corp',
    options_count: 3,
    recipient_name: 'John Doe'
  },
  { preferredLanguage: 'fi' }
);

// Get template statistics
const stats = await emailService.getTemplateStats();
```

## Template Variables

### Common Variables
- `recipient_name`: Recipient's full name
- `company_name`: Company name
- `sender_name`: Sender identification
- `current_date`: Formatted current date
- `support_url`: Support portal URL

### Scenario-Specific Variables
- **Funding**: `options_count`, `funding_options_summary`, `partner_portal_url`
- **Progress**: `current_status_title`, `current_status_description`, `next_steps`
- **Booking**: `meeting_date`, `meeting_time`, `advisor_name`, `meeting_link`
- **Partner**: `signup_code`, `commission_percent`, `partner_tier`, `training_resources`

## Notes

- **Multi-language Support**: Finnish (fi), English (en), Swedish (sv)
- **Fallback Strategy**: Automatic fallback to Finnish templates if requested language unavailable
- **Template Versioning**: Supports template versions for A/B testing and updates
- **Error Handling**: Graceful degradation with comprehensive logging
- **Security**: Uses service role for admin-level template access
- **Extensibility**: Easy to add new template types and variables

## Related Files

- `lib/services/emailTemplateTranslationService.ts`: AI-powered template translation
- `types/email.ts`: Email template type definitions
- `app/api/email-templates/`: Template management API endpoints
- `components/admin/EmailTemplateManager.tsx`: Admin interface for template management

## Email Integration

### Current Implementation
- **Development**: Logs email content to console
- **Production Ready**: Structured for integration with SendGrid, AWS SES, or similar services

### Integration Points
```typescript
// Production email sending would replace console.log with:
// await this.emailProvider.send({
//   to: recipientEmail,
//   subject: renderedEmail.subject,
//   html: renderedEmail.body,
//   from: process.env.FROM_EMAIL
// })
```

## Recent Changes

- Enhanced template rendering with conditional blocks
- Added comprehensive partner onboarding email templates
- Improved error handling and logging
- Added template statistics and management functions
- Enhanced variable substitution with null handling
