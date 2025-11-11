# card.tsx Documentation

**Path**: `components/ui/card.tsx`
**Type**: TypeScript React Component
**Size**: 80 lines
**Last Modified**: Recent

## Purpose

A comprehensive card component system providing structured content containers with consistent styling. Includes multiple sub-components for different sections of a card (header, content, footer, etc.).

## Key Components

### Card (Main Container)
- **Purpose**: Root card container with border, shadow, and rounded corners
- **Parameters**: Standard HTMLDivElement attributes
- **Returns**: Styled div element
- **Dependencies**: React.forwardRef, cn utility

### CardHeader
- **Purpose**: Top section of card, typically for titles and descriptions
- **Parameters**: HTMLDivElement attributes
- **Returns**: Flex column container with spacing
- **Dependencies**: React.forwardRef, cn utility

### CardTitle
- **Purpose**: Main heading within card header
- **Parameters**: HTMLHeadingElement attributes
- **Returns**: h3 element with semibold styling
- **Dependencies**: React.forwardRef, cn utility

### CardDescription
- **Purpose**: Subtitle or description text in muted color
- **Parameters**: HTMLParagraphElement attributes
- **Returns**: p element with muted foreground color
- **Dependencies**: React.forwardRef, cn utility

### CardContent
- **Purpose**: Main content area of the card
- **Parameters**: HTMLDivElement attributes
- **Returns**: Padded div container
- **Dependencies**: React.forwardRef, cn utility

### CardFooter
- **Purpose**: Bottom section for actions or additional info
- **Parameters**: HTMLDivElement attributes
- **Returns**: Flex container for footer content
- **Dependencies**: React.forwardRef, cn utility

## Dependencies

- `react`: Core React functionality
- `@/lib/utils`: cn utility for className merging

## Usage Examples

```tsx
// Complete card structure
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>
      This is a description of the card content.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Minimal card
<Card>
  <CardContent>
    <p>Simple card with just content.</p>
  </CardContent>
</Card>

// Custom styling
<Card className="max-w-md">
  <CardHeader className="text-center">
    <CardTitle className="text-xl">Custom Card</CardTitle>
  </CardHeader>
</Card>
```

## Notes

- All components use forwardRef for proper ref handling
- Consistent padding and spacing throughout components
- Uses semantic HTML elements (h3 for title, p for description)
- Responsive design considerations built into styling
- Supports dark mode through CSS custom properties
- 'use client' directive indicates client-side rendering requirement

## Related Files

- `@/lib/utils`: Provides cn utility function
- Theme configuration: Defines border, shadow, and color tokens
- Other card-using components throughout the application
