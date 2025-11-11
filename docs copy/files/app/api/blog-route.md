# blog/route.ts Documentation

**Path**: `app/api/blog/route.ts`
**Type**: Next.js API Route Handler  
**Size**: 196 lines
**Last Modified**: Recently active

## Purpose

This API endpoint manages blog post creation and updates with automatic translation capabilities. It provides admin-only access for creating and editing blog posts, with built-in support for generating translations in multiple target languages using Gemini AI.

## Key Components

### POST Handler (Create Blog Post)
- **Purpose**: Creates new blog posts with optional automatic translations
- **Parameters**: 
  - Request body: Blog post data + `target_languages` array
  - Headers: `Authorization: Bearer <token>`
- **Returns**: `{ data: { original: Post, translations?: Post[] } }`
- **Authentication**: Bearer token + admin role verification

### PUT Handler (Update Blog Post)
- **Purpose**: Updates existing blog posts
- **Parameters**:
  - Request body: Updated blog post data + post `id`
  - Headers: `Authorization: Bearer <token>`
- **Returns**: `{ data: Post }`
- **Authentication**: Bearer token + admin role verification

## Core Functionality

### Authentication & Authorization
- **Bearer Token Validation**: Verifies JWT tokens using Supabase auth
- **Admin Role Check**: Ensures only admin users can create/update posts
- **Service Role Client**: Uses elevated permissions for database operations

### Blog Post Management
- **Post Creation**: Inserts new posts with author attribution
- **Post Updates**: Modifies existing posts with updated timestamps
- **Automatic Translation**: Generates translations for specified target languages

### Translation System
- **Gemini Integration**: Uses `generateTranslation()` from `@/lib/gemini`
- **Multi-language Support**: Creates separate post records for each target language
- **Translation Fields**:
  - `title` - Post title translation
  - `content` - Full post content translation
  - `excerpt` - Post excerpt translation
  - `meta_description` - SEO meta description translation
  - `slug` - URL-friendly slug translation

### Database Operations
- **Table**: `posts`
- **Key Fields**:
  - `title`, `content`, `excerpt` - Post content
  - `slug` - URL identifier
  - `locale` - Language code (en, fi, sv, etc.)
  - `author_id` - Reference to creating user
  - `meta_description` - SEO metadata
  - `created_at`, `updated_at` - Timestamps

## Dependencies

- `next/server`: NextResponse for API responses
- `@/utils/supabase/server`: Supabase client with service role
- `@/lib/gemini`: AI translation service integration

## Usage Examples

### Creating a Blog Post with Translations
```javascript
const response = await fetch('/api/blog', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Blog Post',
    content: 'Post content here...',
    excerpt: 'Brief summary',
    slug: 'my-blog-post',
    meta_description: 'SEO description',
    target_languages: ['fi', 'sv']
  })
})
```

### Updating a Blog Post
```javascript
const response = await fetch('/api/blog', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'post-uuid',
    title: 'Updated Title',
    content: 'Updated content...'
  })
})
```

## Notes

- **Admin Only**: Strict admin role enforcement for all operations
- **Translation Resilience**: Failed translations don't break post creation
- **Service Role Usage**: Bypasses RLS for administrative operations
- **Comprehensive Logging**: Detailed console logging for debugging
- **Error Handling**: Graceful error responses with appropriate HTTP status codes
- **Timestamp Management**: Automatic timestamp handling for updates

## Related Files

- `lib/gemini.ts` - AI translation service implementation
- `components/blog/` - Blog-related frontend components
- `app/[locale]/blog/` - Blog page implementations
- `app/api/blog/translate/` - Additional blog translation endpoints
- `utils/supabase/server.ts` - Supabase configuration

## Database Schema Dependencies

- `posts` table with proper indexes and RLS policies
- `profiles` table with `is_admin` field for authorization
- Foreign key relationships for `author_id` references
- Multi-language support through `locale` field
