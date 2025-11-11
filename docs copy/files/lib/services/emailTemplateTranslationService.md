# emailTemplateTranslationService.ts Documentation

**Path**: `lib/services/emailTemplateTranslationService.ts`
**Type**: TypeScript Service Class
**Size**: ~363 lines
**Last Modified**: Active development file

## Purpose

AI-powered email template translation service that automatically generates multi-language versions of email templates using Google Gemini. Provides intelligent translation that preserves Handlebars template syntax, HTML formatting, and business context while adapting content for different cultural markets.

## Key Components

### Main Class: EmailTemplateTranslationService

#### Configuration
- **AI Model**: `gemini-2.0-flash-001`
- **Generation Config**: Low temperature (0.3) for consistent translations
- **Max Tokens**: 4096 for comprehensive template content

### Core Translation Methods

#### `generateLanguageVersions(masterTemplateId, targetLanguages?)`
- **Purpose**: Creates language versions for a master template
- **Parameters**:
  - `masterTemplateId`: ID of the Finnish master template
  - `targetLanguages`: Array of target language codes (default: ['en', 'sv'])
- **Returns**: Array of TranslationResult objects with success/error status
- **Features**:
  - Automatic detection of existing translations
  - Smart update vs. create logic
  - Error handling per language
  - Database integration with template versioning

#### `translateTemplate(sourceSubject, sourceBody, sourceLanguage, targetLanguage, templateType, description)`
- **Purpose**: Core AI translation functionality
- **Parameters**: Complete template content and context information
- **Returns**: Translated subject and body in structured format
- **Features**:
  - Context-aware translation with business domain knowledge
  - Handlebars syntax preservation
  - HTML structure maintenance
  - Cultural adaptation for target markets

### Template Management

#### `getTemplateByLanguage(templateType, language?, fallbackToFinnish?)`
- **Purpose**: Retrieves templates with language fallback logic
- **Features**:
  - Primary language selection
  - Automatic fallback to Finnish master templates
  - Active template filtering
  - Error handling with graceful degradation

#### `translateAllMasterTemplates(targetLanguages?)`
- **Purpose**: Batch translation of all master templates
- **Features**:
  - Automatic master template discovery
  - Parallel processing capability
  - Progress tracking and logging
  - Error isolation per template

### AI Translation Engine

#### Prompt Engineering
- **Context**: Finnish fintech company specializing in business funding
- **Requirements**:
  - Professional business tone
  - Technical financial term accuracy
  - Cultural market adaptation
  - Brand consistency (TrustyFinance unchanged)
  - Template syntax preservation

#### Syntax Preservation
- **Handlebars Variables**: `{{variable_name}}` maintained exactly
- **Conditionals**: `{{#if condition}}...{{/if}}` structure preserved
- **Loops**: `{{#each items}}...{{/each}}` syntax maintained
- **HTML**: All HTML tags and attributes preserved

#### Language Support
- **Source**: Finnish (fi) - Master templates
- **Targets**: English (en), Swedish (sv)
- **Extensible**: Easy addition of new languages

### Translation Quality Features

#### Context Preservation
- **Business Domain**: Fintech and funding solutions
- **Company Context**: TrustyFinance platform capabilities
- **Market Adaptation**: Cultural norms for Finnish, Swedish, English markets
- **Technical Accuracy**: Financial terminology and regulatory compliance

#### Template Integrity
- **Variable Matching**: All template variables preserved exactly
- **HTML Structure**: Complete HTML formatting maintained
- **Link Preservation**: URLs and email addresses unchanged
- **Formatting**: Line breaks, spacing, and styling preserved

## Dependencies

### External Libraries
- `@google/genai`: Google Gemini AI integration
- `@supabase/supabase-js`: Database operations

### Internal Dependencies
- `@/utils/supabase/server`: Supabase client utilities

### Environment Variables
- `GOOGLE_AI_STUDIO_KEY`: Google AI API key for Gemini access

### Database Tables
- `email_templates`: Template storage with language and master template relationships

## Usage Examples

```typescript
// Initialize service
const translationService = new EmailTemplateTranslationService();

// Translate specific template
const results = await translationService.generateLanguageVersions(
  'master-template-123',
  ['en', 'sv']
);

// Batch translate all templates
await translationService.translateAllMasterTemplates(['en', 'sv']);

// Get template with fallback
const template = await translationService.getTemplateByLanguage(
  'customer_welcome',
  'sv',
  true // Enable fallback to Finnish
);
```

## Translation Workflow

### Master Template Processing
1. **Template Retrieval**: Fetch Finnish master template
2. **Language Check**: Verify existing translations
3. **AI Translation**: Generate new translations if needed
4. **Database Update**: Create or update language versions
5. **Relationship Maintenance**: Link translations to master template

### Quality Assurance
1. **Syntax Validation**: Verify Handlebars syntax preservation
2. **HTML Validation**: Ensure HTML structure integrity
3. **Variable Matching**: Confirm all variables translated correctly
4. **Content Review**: Business context and tone verification

## Error Handling

### Translation Errors
- **AI Failures**: Graceful handling with error logging
- **Syntax Errors**: JSON parsing error recovery
- **API Timeouts**: Retry logic and fallback mechanisms
- **Invalid Responses**: Response format validation

### Database Errors
- **Connection Issues**: Automatic retry with exponential backoff
- **Constraint Violations**: Duplicate prevention and resolution
- **Permission Errors**: Service role access verification

## Notes

- **AI-Powered**: Leverages Google Gemini for contextually accurate translations
- **Syntax Safe**: Preserves all template functionality during translation
- **Culturally Aware**: Adapts content for different market expectations
- **Scalable**: Handles batch processing of multiple templates
- **Maintainable**: Automatic detection and updating of existing translations
- **Quality Focused**: Low temperature AI settings for consistency

## Related Files

- `lib/services/emailTemplateService.ts`: Core template management service
- `app/api/email-templates/translate/`: Translation API endpoints
- `types/email.ts`: Email template type definitions
- `components/admin/EmailTemplateTranslator.tsx`: Admin translation interface

## Translation Results Interface

```typescript
interface TranslationResult {
  template_id: string;    // Created/updated template ID
  language: string;       // Target language code
  subject: string;        // Translated subject line
  body: string;          // Translated email body
  status: 'success' | 'error';
  error?: string;        // Error message if failed
}
```

## Recent Changes

- Enhanced prompt engineering for better financial context
- Added batch translation capabilities for all master templates
- Improved error handling and recovery mechanisms
- Added intelligent existing translation detection
- Enhanced logging for translation monitoring and debugging
