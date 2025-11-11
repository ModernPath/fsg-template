# button.tsx Documentation

**Path**: `components/ui/button.tsx`
**Type**: TypeScript React Component
**Size**: 56 lines
**Last Modified**: Recent

## Purpose

A highly customizable button component built on top of Radix UI's Slot component with class-variance-authority (CVA) for variant management. Provides consistent button styling across the application with multiple variants and sizes.

## Key Components

### ButtonProps Interface
- **Purpose**: Extends HTML button attributes with variant props and asChild option
- **Parameters**: 
  - `variant`: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  - `size`: "default" | "sm" | "lg" | "icon"
  - `asChild`: boolean - renders as Slot component when true
- **Dependencies**: React.ButtonHTMLAttributes, VariantProps from CVA

### buttonVariants (CVA Configuration)
- **Purpose**: Defines styling variants using class-variance-authority
- **Variants**:
  - `default`: Primary button with blue background
  - `destructive`: Red button for dangerous actions
  - `outline`: Border-only button
  - `secondary`: Secondary styling
  - `ghost`: Transparent button with hover effects
  - `link`: Text button with underline
- **Sizes**: default (h-10), sm (h-9), lg (h-11), icon (h-10 w-10)

### Button Component
- **Purpose**: Main button component with forwardRef for proper ref handling
- **Parameters**: ButtonProps interface
- **Returns**: JSX.Element (either button or Slot)
- **Dependencies**: React.forwardRef, Radix UI Slot, CVA, cn utility

## Dependencies

- `@radix-ui/react-slot`: For polymorphic component behavior
- `class-variance-authority`: For variant-based styling
- `@/lib/utils`: cn utility for className merging
- `react`: Core React functionality

## Usage Examples

```tsx
// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small outline</Button>

// As child component (polymorphic)
<Button asChild>
  <Link href="/home">Navigate</Link>
</Button>

// With custom className
<Button className="w-full" variant="secondary">
  Full width button
</Button>
```

## Notes

- Uses forwardRef for proper ref forwarding to underlying DOM element
- Supports polymorphic behavior through asChild prop and Radix Slot
- Includes comprehensive accessibility features (focus-visible, disabled states)
- Tailwind CSS classes for consistent theming
- Default variants ensure consistent appearance when no props provided

## Related Files

- `@/lib/utils`: Provides cn utility function
- `components/ui/`: Other UI components that may use this button
- Theme configuration files for color definitions
