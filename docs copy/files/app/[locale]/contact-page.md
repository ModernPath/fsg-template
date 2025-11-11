# contact/page.tsx Documentation

**Path**: `app/[locale]/contact/page.tsx`
**Type**: Next.js Page Component (Server Component)
**Size**: 112 lines
**Last Modified**: Recently active

## Purpose

This is a comprehensive contact page component that provides a localized contact form, company information, and social media links. It features a dark-themed design with gold accents, SEO optimization, and full internationalization support for the contact experience.

## Key Components

### Page Component Function
- **Purpose**: Renders the complete contact page with multiple sections
- **Parameters**: 
  - `params`: { locale: string } - Locale parameter for internationalization
- **Returns**: Full contact page JSX structure
- **Type**: Server Component

### Metadata Generation Function
- **Purpose**: Generates localized SEO metadata for the contact page
- **Parameters**: 
  - `params`: { locale: string } - Locale for metadata localization
- **Returns**: Promise<Metadata> - SEO-optimized metadata object
- **Features**: OpenGraph support with contact-specific image

## Page Structure

### 1. Hero Section
- **Background**: Black with gradient overlay
- **Content**: Large title and description
- **Typography**: Responsive text sizing (5xl to 6xl)
- **Styling**: Gold primary color scheme

### 2. Contact Form Section
- **Container**: Centered 2xl max-width container
- **Form Card**: Dark gray card with gold accents
- **Component**: Uses ContactForm component for form logic
- **Design**: Rounded corners with shadow and border

### 3. Contact Information Section
- **Layout**: Two-column grid (responsive)
- **Address Block**: Company address with proper formatting
- **Logo Display**: Company logo with optimized sizing
- **Social Links**: LinkedIn and Twitter with SVG icons

## Styling & Design

### Color Scheme
- **Primary Background**: Black (`bg-black`)
- **Secondary Background**: Very dark gray (`bg-gray-very-dark`)
- **Text Color**: Gold primary (`text-gold-primary`)
- **Accent Color**: Gold highlight for hovers
- **Borders**: Dark gray borders for subtle separation

### Typography
- **Headings**: Bold font weights with hierarchical sizing
- **Body Text**: Gold primary with opacity variations
- **Responsive**: Mobile-first responsive text sizing

### Layout
- **Container**: Centered with horizontal padding
- **Max Width**: Constrained content areas for readability
- **Grid System**: CSS Grid for contact information layout
- **Spacing**: Consistent padding and margin system

## Internationalization

### Translation Namespaces
- **Contact**: Main namespace for contact page content
- **Meta**: SEO metadata translations

### Translation Keys Structure
```json
{
  "title": "Main page title",
  "description": "Page description",
  "form": {
    "title": "Contact form title",
    "description": "Form description"
  },
  "address": {
    "title": "Address section title",
    "street": "Street address",
    "postal": "Postal code and city",
    "country": "Country"
  },
  "social": {
    "title": "Social media section title"
  },
  "meta": {
    "title": "SEO page title",
    "description": "SEO meta description"
  }
}
```

## Dependencies

- `next/server`: Metadata type definitions
- `next-intl/server`: Server-side translation utilities
- `@/utils/metadata`: Metadata generation utilities
- `@/components/contact/ContactForm`: Contact form component
- `next/image`: Optimized image component

## SEO Features

### Metadata Configuration
- **Localized Titles**: Language-specific page titles
- **Meta Descriptions**: Translated descriptions for search engines
- **OpenGraph Image**: Contact-specific preview image
- **Canonical URLs**: Proper URL structure for `/contact`
- **Type Declaration**: Website type for social media

### Image Optimization
- **Logo**: Optimized WebP format with proper dimensions
- **OpenGraph**: Contact-specific social preview image
- **Alt Text**: Proper accessibility attributes

## Usage Examples

### Accessing the Contact Page
```
URL: /[locale]/contact
Examples: /en/contact, /fi/contact, /sv/contact
```

### Translation Usage
```typescript
const t = await getTranslations('Contact')
return (
  <h1>{t('title')}</h1>
  <p>{t('description')}</p>
)
```

## Notes

- **Server Component**: Pure server-side rendering for better SEO
- **Dark Theme**: Consistent with application's dark theme design
- **Accessibility**: Proper semantic HTML structure and alt attributes
- **Responsive Design**: Mobile-first responsive layout
- **Performance**: Optimized images and minimal client-side JavaScript
- **Social Integration**: Ready for social media sharing with proper metadata
- **Brand Consistency**: Uses company colors and typography

## Related Files

- `components/contact/ContactForm.tsx` - Contact form implementation
- `utils/metadata.ts` - SEO metadata generation utilities
- `messages/[locale]/Contact.json` - Translation files
- `public/images/og/contact.webp` - OpenGraph preview image
- `public/images/trusty-finance-logo-optimized.webp` - Company logo

## Design System Integration

- Uses application's color system (gold-primary, gray-very-dark)
- Follows responsive design patterns
- Maintains consistent spacing and typography
- Integrates with overall dark theme aesthetic
