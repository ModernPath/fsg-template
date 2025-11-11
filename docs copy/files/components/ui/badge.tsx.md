# badge.tsx Documentation

**Path**: `components/ui/badge.tsx`
**Type**: TypeScript React Component
**Size**: 29 lines
**Last Modified**: Recent

## Purpose

A simple badge component for displaying status indicators, tags, or labels with multiple color variants and dark mode support.

## Key Components

### BadgeProps Interface
- **Purpose**: Defines props for the badge component
- **Parameters**:
  - `children: React.ReactNode` - Content to display
  - `variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary'` - Color variant
  - `className?: string` - Additional CSS classes
- **Dependencies**: React.ReactNode

### Badge Component
- **Purpose**: Displays content in a styled badge format
- **Parameters**: BadgeProps interface
- **Returns**: Span element with rounded styling and variant colors
- **Dependencies**: cn utility

### variantClasses Configuration
- **Purpose**: Maps variant names to Tailwind color classes
- **Variants**:
  - `default`: Gray colors
  - `success`: Green colors
  - `warning`: Yellow colors
  - `error`: Red colors
  - `secondary`: Blue colors
- **Features**: Dark mode support for all variants

## Dependencies

- `@/utils/cn`: Utility for className merging

## Usage Examples

```tsx
// Basic badge
<Badge>New</Badge>

// Success status
<Badge variant="success">Active</Badge>

// Warning status
<Badge variant="warning">Pending</Badge>

// Error status
<Badge variant="error">Failed</Badge>

// Secondary variant
<Badge variant="secondary">Draft</Badge>

// With custom styling
<Badge className="ml-2" variant="success">
  Verified
</Badge>

// In lists
<div className="flex gap-2">
  <Badge variant="success">Approved</Badge>
  <Badge variant="warning">Review</Badge>
  <Badge variant="error">Rejected</Badge>
</div>
```

## Notes

- Simple, lightweight component with minimal dependencies
- Full dark mode support across all variants
- Rounded pill design with consistent padding
- Small text size (text-xs) for compact display
- Inline-flex layout for proper alignment
- Font-medium for better readability
- Uses semantic color mapping (success=green, error=red, etc.)

## Related Files

- `@/utils/cn`: Provides className merging utility
- Theme configuration: Defines color tokens
- Components that display status or tags
