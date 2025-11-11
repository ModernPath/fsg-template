# form.tsx Documentation

**Path**: `components/ui/form.tsx`
**Type**: TypeScript React Component
**Size**: 176 lines
**Last Modified**: Recent

## Purpose

A comprehensive form system built on React Hook Form with Radix UI integration. Provides accessible form components with automatic validation, error handling, and proper ARIA attributes.

## Key Components

### Form (FormProvider)
- **Purpose**: Root form context provider from React Hook Form
- **Parameters**: FormProvider props
- **Returns**: React Hook Form context
- **Dependencies**: react-hook-form

### FormField
- **Purpose**: Generic field component with validation and context
- **Parameters**: ControllerProps from React Hook Form
- **Returns**: Controller with field context
- **Dependencies**: react-hook-form Controller, FormFieldContext

### useFormField Hook
- **Purpose**: Access form field state and IDs for accessibility
- **Parameters**: None (uses context)
- **Returns**: Field state, IDs, and validation info
- **Dependencies**: FormFieldContext, FormItemContext, useFormContext

### FormItem
- **Purpose**: Container for individual form fields with spacing
- **Parameters**: HTMLDivElement attributes
- **Returns**: Div with unique ID context
- **Dependencies**: React.forwardRef, useId, FormItemContext

### FormLabel
- **Purpose**: Accessible label with error state styling
- **Parameters**: LabelPrimitive.Root props
- **Returns**: Label component with proper htmlFor and error styling
- **Dependencies**: Radix Label, useFormField

### FormControl
- **Purpose**: Wrapper for form input elements with accessibility
- **Parameters**: Slot props
- **Returns**: Slot with ARIA attributes and IDs
- **Dependencies**: Radix Slot, useFormField

### FormDescription
- **Purpose**: Helper text for form fields
- **Parameters**: HTMLParagraphElement attributes
- **Returns**: Paragraph with muted styling and proper ID
- **Dependencies**: useFormField

### FormMessage
- **Purpose**: Error message display with validation state
- **Parameters**: HTMLParagraphElement attributes
- **Returns**: Paragraph with error message or null
- **Dependencies**: useFormField

## Dependencies

- `react-hook-form`: Form state management and validation
- `@radix-ui/react-label`: Accessible label primitive
- `@radix-ui/react-slot`: Polymorphic component wrapper
- `@/lib/utils`: cn utility for className merging
- `@/components/ui/label`: Label component

## Usage Examples

```tsx
// Complete form with validation
const form = useForm<FormData>({
  resolver: zodResolver(schema)
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="Enter email" {...field} />
          </FormControl>
          <FormDescription>
            We'll never share your email.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>

// Simple field without description
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Notes

- Full accessibility support with proper ARIA attributes
- Automatic error state management and display
- Integration with React Hook Form for validation
- Unique ID generation for form field associations
- Error styling propagation to labels and controls
- Context-based architecture for clean component composition
- TypeScript support with generic field types

## Related Files

- `@/components/ui/label`: Base label component
- `@/components/ui/input`: Input component used with forms
- `@/lib/utils`: Utility functions
- React Hook Form documentation for validation schemas
