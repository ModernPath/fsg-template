# layout.tsx Documentation

**Path**: `app/[locale]/layout.tsx`
**Type**: Next.js Layout Component (Server Component)
**Size**: ~101 lines
**Last Modified**: Active development file

## Purpose

Root layout component for internationalized routes that provides the foundational structure for all pages within the `[locale]` route group. Handles locale validation, internationalization setup, theme management, authentication context, and global UI components like navigation and tracking.

## Key Components

### Locale Validation System

#### `validateLocale(locale)`
- **Purpose**: Validates incoming locale against database-enabled languages
- **Features**:
  - Dynamic locale fetching from `/api/languages` endpoint
  - Fallback to static locale configuration
  - Automatic redirect to default locale for invalid locales
  - Error handling with graceful degradation

#### `generateStaticParams()`
- **Purpose**: Generates static parameters for all supported locales
- **Returns**: Array of locale objects for static generation

### Layout Structure

#### Provider Hierarchy
1. **NextIntlClientProvider**: Internationalization context with validated messages
2. **ThemeProvider**: Dark theme enforcement with system override disabled
3. **AuthProvider**: Authentication state management
4. **Navigation**: Sticky navigation component
5. **ReferralTracker**: Conversion and referral tracking

#### Theme Configuration
- **Default Theme**: Dark mode enforced
- **System Theme**: Disabled to maintain consistent branding
- **Storage Key**: `locale-theme` for locale-specific theme persistence
- **Attribute**: CSS class-based theme switching

### Internationalization Features

#### Message Loading
- **Dynamic Loading**: Uses `getI18nConfig()` for database-driven translations
- **Fallback Handling**: Graceful error handling for missing translations
- **Type Safety**: Proper TypeScript integration with AbstractIntlMessages

#### Locale Support
- **Static Locales**: Finnish (fi), English (en), Swedish (sv)
- **Dynamic Validation**: Database-driven locale enabling/disabling
- **Default Fallback**: Finnish as primary locale

### Global Components Integration

#### Navigation
- **Position**: Sticky header with z-index 50
- **Styling**: Background with shadow for visual separation
- **Responsive**: Adapts to different screen sizes

#### Main Content Area
- **Styling**: Full-screen height with color transitions
- **Background**: Theme-aware background colors
- **Padding**: Top padding to account for sticky navigation

#### Tracking Integration
- **Component**: ReferralTracker for conversion analytics
- **Configuration**: Auto-tracking enabled with development debug mode
- **Privacy**: Compliant tracking implementation

## Dependencies

### External Libraries
- `next`: App Router layout system and metadata
- `next/font/google`: Inter font optimization
- `next-intl`: Internationalization framework
- `next-themes`: Theme management system

### Internal Dependencies
- `../i18n/config`: Static locale configuration
- `@/app/components/Navigation`: Main navigation component
- `@/components/auth/AuthProvider`: Authentication context
- `@/app/i18n`: Dynamic i18n configuration
- `@/lib/utils/server-deduplication`: Server-side request optimization
- `@/components/tracking/ReferralTracker`: Analytics tracking

### Environment Integration
- **NEXT_PUBLIC_SITE_URL**: Base URL for API requests
- **NODE_ENV**: Environment detection for debug features

## Usage Examples

```typescript
// Automatic locale validation and message loading
// Layout automatically handles:
// - /fi/dashboard -> validated Finnish locale
// - /invalid/page -> redirected to /fi/page (default)
// - /en/about -> validated English locale with EN messages

// Theme enforcement
// All pages automatically get:
// - Dark theme by default
// - Consistent theme across locale switches
// - No system theme interference
```

## Error Handling

### Locale Validation Errors
- **API Failures**: Fallback to static locale configuration
- **Invalid Locales**: Automatic redirect to default locale
- **Network Issues**: Graceful degradation with console warnings

### Translation Loading Errors
- **Missing Translations**: Empty object fallback prevents crashes
- **API Errors**: Comprehensive error logging
- **Fallback Strategy**: Continues rendering with available translations

### Theme System Errors
- **Storage Issues**: Automatic fallback to default theme
- **Hydration Mismatches**: Prevented by forced theme configuration

## Security Considerations

### Locale Validation
- **Input Sanitization**: Validates locale against known safe values
- **XSS Prevention**: No direct locale interpolation in dangerous contexts
- **CSRF Protection**: Uses deduped server-side fetching

### Theme Management
- **XSS Prevention**: Class-based theme switching (safe)
- **Storage Security**: Client-side localStorage with safe key names

## Performance Optimizations

### Server-Side Deduplication
- **Purpose**: Prevents duplicate API requests during SSR
- **Implementation**: Custom deduping utility for language API
- **Benefits**: Reduced server load and faster page generation

### Font Optimization
- **Google Fonts**: Inter font with Latin subset optimization
- **Preloading**: Automatic font preloading by Next.js
- **Performance**: Reduced CLS and improved loading times

### Static Generation
- **generateStaticParams**: Pre-generates all locale variants
- **Build Optimization**: Reduces runtime locale processing
- **CDN Friendly**: Static paths for better caching

## Notes

- **Internationalization**: Full i18n support with database-driven translations
- **Theme Consistency**: Enforced dark theme for brand consistency
- **Authentication Ready**: Global auth context for all child pages
- **Analytics Integrated**: Comprehensive tracking setup
- **Performance Optimized**: Server-side optimizations and static generation
- **Error Resilient**: Comprehensive error handling and fallbacks

## Related Files

- `app/[locale]/page.tsx`: Homepage using this layout
- `app/[locale]/providers.tsx`: Additional client-side providers
- `app/components/Navigation.tsx`: Main navigation component
- `app/i18n/`: Internationalization configuration
- `components/auth/AuthProvider.tsx`: Authentication provider

## Recent Changes

- Enhanced locale validation with database integration
- Added server-side deduplication for API requests
- Improved error handling for translation loading
- Added referral tracking integration
- Enhanced theme management with forced dark mode