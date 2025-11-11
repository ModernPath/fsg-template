# input.tsx Documentation

**Path**: `components/ui/input.tsx`
**Type**: TypeScript React Component
**Size**: 31 lines
**Last Modified**: Recent

## Purpose

A customizable input component that extends HTML input functionality with error state handling, dark mode support, and consistent styling across the application.

## Key Components

### InputProps Interface
- **Purpose**: Extends HTML input attributes with custom error prop
- **Parameters**: 
  - All standard HTML input attributes
  - `error?: string` - Optional error message for validation
- **Dependencies**: React.InputHTMLAttributes

### Input Component
- **Purpose**: Styled input field with error state and accessibility features
- **Parameters**: InputProps interface
- **Returns**: Styled input element with forwardRef
- **Dependencies**: React.forwardRef, cn utility

## Dependencies

- `react`: Core React functionality (forwardRef)
- `@/lib/utils`: cn utility for className merging

## Usage Examples

```tsx
// Basic input
<Input placeholder="Enter your name" />

// With type specification
<Input type="email" placeholder="Enter your email" />

// With error state
<Input 
  type="password" 
  placeholder="Password"
  error="Password is required"
/>

// With custom styling
<Input 
  className="mb-4" 
  placeholder="Custom input"
/>

// Controlled input
const [value, setValue] = useState('')
<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Controlled input"
/>
```

## Notes

- Uses forwardRef for proper ref forwarding to DOM element
- Supports both light and dark mode styling
- Error state changes border color to destructive (red)
- Includes focus states with blue ring
- Disabled state with reduced opacity and cursor changes
- Responsive design considerations built in
- Placeholder text with muted color for better UX

## Related Files

- `@/lib/utils`: Provides cn utility function
- Theme configuration: Defines color tokens for borders, focus, etc.
- Form components that utilize this input
- Validation utilities that provide error messages
