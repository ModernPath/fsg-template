# toast.tsx Documentation

**Path**: `components/ui/toast.tsx`
**Type**: TypeScript React Component
**Size**: 129 lines
**Last Modified**: Recent

## Purpose

A comprehensive toast notification system built on Radix UI Toast primitives. Provides accessible, animated toast notifications with multiple variants and swipe-to-dismiss functionality.

## Key Components

### ToastProvider
- **Purpose**: Root provider for toast context
- **Parameters**: ToastPrimitives.Provider props
- **Returns**: Radix Toast Provider
- **Dependencies**: @radix-ui/react-toast

### ToastViewport
- **Purpose**: Container where toasts are rendered
- **Parameters**: ToastPrimitives.Viewport props
- **Returns**: Fixed positioned viewport with responsive layout
- **Dependencies**: React.forwardRef, Radix Toast Viewport

### toastVariants (CVA Configuration)
- **Purpose**: Defines styling variants using class-variance-authority
- **Variants**:
  - `default`: Standard toast with background styling
  - `destructive`: Error toast with red styling
- **Features**: Animations, swipe gestures, responsive positioning

### Toast
- **Purpose**: Main toast component with variant support
- **Parameters**: ToastPrimitives.Root props + variant
- **Returns**: Styled toast with animations
- **Dependencies**: React.forwardRef, CVA, Radix Toast Root

### ToastAction
- **Purpose**: Action button within toast (e.g., "Undo", "Retry")
- **Parameters**: ToastPrimitives.Action props
- **Returns**: Styled button with focus states
- **Dependencies**: React.forwardRef, Radix Toast Action

### ToastClose
- **Purpose**: Close button with X icon
- **Parameters**: ToastPrimitives.Close props
- **Returns**: Close button with hover/focus states
- **Dependencies**: React.forwardRef, Radix Toast Close, Lucide X

### ToastTitle
- **Purpose**: Main title text of the toast
- **Parameters**: ToastPrimitives.Title props
- **Returns**: Styled title element
- **Dependencies**: React.forwardRef, Radix Toast Title

### ToastDescription
- **Purpose**: Secondary description text
- **Parameters**: ToastPrimitives.Description props
- **Returns**: Styled description with opacity
- **Dependencies**: React.forwardRef, Radix Toast Description

## Dependencies

- `@radix-ui/react-toast`: Core toast primitives
- `class-variance-authority`: Variant-based styling
- `lucide-react`: X icon for close button
- `@/lib/utils`: cn utility for className merging

## Usage Examples

```tsx
// Basic toast
<Toast>
  <ToastTitle>Success!</ToastTitle>
  <ToastDescription>Your changes have been saved.</ToastDescription>
  <ToastClose />
</Toast>

// Error toast with action
<Toast variant="destructive">
  <ToastTitle>Error</ToastTitle>
  <ToastDescription>Failed to save changes.</ToastDescription>
  <ToastAction altText="Try again">Retry</ToastAction>
  <ToastClose />
</Toast>

// With toast provider and viewport
<ToastProvider>
  <div>Your app content</div>
  <ToastViewport />
</ToastProvider>

// Programmatic usage (with useToast hook)
const { toast } = useToast()

toast({
  title: "Success",
  description: "Your message has been sent.",
})

toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong.",
  action: <ToastAction altText="Try again">Retry</ToastAction>,
})
```

## Notes

- Built on Radix UI for accessibility and keyboard navigation
- Supports swipe-to-dismiss on mobile devices
- Smooth animations for enter/exit states
- Responsive positioning (top on mobile, bottom-right on desktop)
- High z-index (100) to appear above other content
- Automatic focus management for actions
- ARIA compliance with proper roles and labels

## Related Files

- `@/components/ui/use-toast.ts`: Hook for programmatic toast usage
- `@/components/ui/toaster.tsx`: Toast container component
- `@/lib/utils`: Utility functions
- Theme configuration for color and animation tokens
