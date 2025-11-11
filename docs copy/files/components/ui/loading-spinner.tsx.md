# loading-spinner.tsx Documentation

**Path**: `components/ui/loading-spinner.tsx`
**Type**: TypeScript React Component
**Size**: 22 lines
**Last Modified**: Recent

## Purpose

A simple, customizable loading spinner component with multiple sizes and optional text. Provides consistent loading states across the application with brand-colored animation.

## Key Components

### LoadingSpinnerProps Interface
- **Purpose**: Defines props for the spinner component
- **Parameters**:
  - `size?: 'sm' | 'md' | 'lg'` - Size variant (default: 'md')
  - `text?: string` - Optional loading text
  - `className?: string` - Additional CSS classes
- **Dependencies**: None

### LoadingSpinner Component
- **Purpose**: Animated circular loading indicator
- **Parameters**: LoadingSpinnerProps interface
- **Returns**: Div with spinning border animation and optional text
- **Dependencies**: cn utility

### Size Classes Configuration
- **Purpose**: Maps size variants to Tailwind classes
- **Variants**:
  - `sm`: 4x4 (h-4 w-4) - 16px
  - `md`: 8x8 (h-8 w-8) - 32px (default)
  - `lg`: 12x12 (h-12 w-12) - 48px

## Dependencies

- `@/lib/utils`: cn utility for className merging

## Usage Examples

```tsx
// Basic spinner
<LoadingSpinner />

// Small spinner
<LoadingSpinner size="sm" />

// Large spinner with text
<LoadingSpinner size="lg" text="Loading..." />

// Custom styling
<LoadingSpinner 
  className="my-4" 
  text="Please wait"
/>

// In button
<Button disabled>
  <LoadingSpinner size="sm" />
  Loading...
</Button>

// Centered on page
<div className="flex justify-center items-center h-screen">
  <LoadingSpinner text="Loading application..." />
</div>
```

## Notes

- Uses CSS animation (animate-spin) for smooth rotation
- Brand-colored border (border-gold-primary) for consistency
- Flexbox layout for proper centering
- Optional text with spacing (ml-2)
- No external dependencies beyond utility function
- Lightweight and performant
- Accessible with proper semantic structure

## Related Files

- `@/lib/utils`: Provides cn utility function
- Theme configuration: Defines gold-primary color
- Components that show loading states
- Button component for loading button states
