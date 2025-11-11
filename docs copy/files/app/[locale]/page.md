# page.tsx Documentation

**Path**: `app/[locale]/page.tsx`
**Type**: Next.js Page Component (Server Component)
**Size**: ~32 lines
**Last Modified**: Active development file

## Purpose

Main homepage route for the internationalized application. Serves as the landing page for all locale variants (fi, en, sv) and handles SEO metadata generation with proper internationalization. Acts as a lightweight wrapper that delegates rendering to a dedicated HomePage component.

## Key Components

### Metadata Generation

#### `generateMetadata({ params })`
- **Purpose**: Generates localized SEO metadata for the homepage
- **Parameters**: Locale from dynamic route parameters
- **Returns**: Comprehensive Metadata object with i18n support
- **Features**:
  - Localized title and description from translations
  - Open Graph image configuration
  - Canonical URL setup for SEO
  - Website type specification for social sharing

### Page Component

#### `Page({ params })`
- **Purpose**: Main page component that renders the homepage
- **Type**: Server Component with dynamic rendering
- **Features**:
  - Locale parameter extraction and forwarding
  - Component delegation to HomePage
  - Automatic locale validation through layout

### SEO Configuration

#### Metadata Structure
- **Title**: Translated page title from 'Index.meta.title'
- **Description**: Translated description from 'Index.meta.description'
- **Type**: 'website' for proper Open Graph classification
- **Canonical URL**: Root path '/' for all locale variants
- **Image**: `/images/og/trusty-og.png` for social sharing

#### Internationalization Features
- **Translation Keys**: Uses 'Index' namespace for homepage translations
- **Locale Support**: Automatic locale detection from route parameters
- **Fallback**: Graceful fallback through translation system

## Dependencies

### External Libraries
- `next`: Metadata type definitions and server component support
- `next-intl/server`: Server-side translation utilities

### Internal Dependencies
- `@/utils/metadata`: Localized metadata generation utility
- `@/components/pages/home/index`: Main HomePage component
- `@/app/i18n/navigation`: Internationalized navigation utilities

### Translation Dependencies
- **Namespace**: 'Index' translation namespace
- **Keys**: 'meta.title', 'meta.description'
- **Locales**: Finnish (fi), English (en), Swedish (sv)

## Usage Examples

```typescript
// Route Examples:
// /fi -> Finnish homepage with Finnish SEO
// /en -> English homepage with English SEO  
// /sv -> Swedish homepage with Swedish SEO

// SEO Output Example:
// <title>TrustyFinance - Yritysten rahoitusratkaisut</title>
// <meta name="description" content="Löydä yrityksellesi parhaat rahoitusvaihtoehdot AI-pohjaisella analyysilla." />
// <meta property="og:image" content="/images/og/trusty-og.png" />
```

## Component Architecture

### Separation of Concerns
- **page.tsx**: Route handling, metadata, locale management
- **HomePage**: UI rendering, content display, user interactions
- **Layout**: Global providers, navigation, theme management

### Server Component Benefits
- **SEO Optimization**: Server-rendered metadata for search engines
- **Performance**: Reduced client-side JavaScript bundle
- **Translation Loading**: Server-side translation resolution

## SEO Optimization

### Search Engine Features
- **Localized Content**: Language-specific titles and descriptions
- **Open Graph**: Social media sharing optimization
- **Canonical URLs**: Proper URL structure for SEO
- **Meta Tags**: Complete meta tag setup for search engines

### Social Sharing
- **Open Graph Image**: Custom branded image for social platforms
- **Type Declaration**: Website type for proper platform recognition
- **Locale Support**: Language-appropriate sharing content

## Performance Considerations

### Server-Side Rendering
- **Dynamic Rendering**: `force-dynamic` ensures fresh content
- **Translation Loading**: Server-side translation resolution
- **Metadata Generation**: Pre-rendered for optimal SEO

### Client-Side Optimization
- **Component Delegation**: Lightweight page wrapper
- **Lazy Loading**: HomePage component handles its own optimizations
- **Bundle Size**: Minimal page-level JavaScript

## Error Handling

### Translation Errors
- **Missing Translations**: Graceful fallback through next-intl
- **Invalid Locales**: Handled by parent layout validation
- **API Failures**: Fallback to static translations

### Metadata Errors
- **Generation Failures**: Fallback to basic metadata structure
- **Invalid Parameters**: Default locale assumption
- **Missing Images**: Graceful degradation without breaking

## Notes

- **Internationalization**: Full i18n support for all content
- **SEO Optimized**: Comprehensive metadata for search engines
- **Performance**: Server-side rendering for optimal loading
- **Maintainable**: Clean separation between routing and rendering
- **Scalable**: Easy to extend with additional metadata or features

## Related Files

- `app/[locale]/layout.tsx`: Parent layout with providers and navigation
- `components/pages/home/index.tsx`: Main homepage component
- `utils/metadata.ts`: Metadata generation utilities
- `app/i18n/`: Translation configuration and loading
- `messages/[locale]/Index.json`: Homepage translations

## Translation Structure

### Required Translation Keys
```json
{
  "Index": {
    "meta": {
      "title": "Homepage title for SEO",
      "description": "Homepage description for SEO"
    }
  }
}
```

### Locale Variants
- **Finnish (fi)**: Primary market language
- **English (en)**: International market
- **Swedish (sv)**: Nordic market expansion

## Recent Changes

- Enhanced metadata generation with proper internationalization
- Added Open Graph image configuration for social sharing
- Implemented dynamic rendering for fresh content delivery
- Added canonical URL configuration for SEO optimization
- Improved error handling for translation loading