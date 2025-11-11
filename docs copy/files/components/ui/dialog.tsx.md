# dialog.tsx Documentation

**Path**: `components/ui/dialog.tsx`
**Type**: TypeScript React Component
**Size**: 120 lines
**Last Modified**: Recent

## Purpose

A comprehensive modal dialog system built on Radix UI Dialog primitives. Provides accessible, customizable modal dialogs with overlay, animations, and proper focus management.

## Key Components

### Dialog (Root)
- **Purpose**: Root dialog component from Radix UI
- **Parameters**: DialogPrimitive.Root props
- **Returns**: Radix Dialog Root
- **Dependencies**: @radix-ui/react-dialog

### DialogTrigger
- **Purpose**: Element that opens the dialog
- **Parameters**: DialogPrimitive.Trigger props
- **Returns**: Radix Dialog Trigger
- **Dependencies**: @radix-ui/react-dialog

### DialogPortal
- **Purpose**: Renders dialog content in a portal
- **Parameters**: DialogPrimitive.Portal props
- **Returns**: Radix Dialog Portal
- **Dependencies**: @radix-ui/react-dialog

### DialogOverlay
- **Purpose**: Background overlay with blur/fade effects
- **Parameters**: DialogPrimitive.Overlay props
- **Returns**: Styled overlay with animations
- **Dependencies**: React.forwardRef, Radix Dialog Overlay

### DialogContent
- **Purpose**: Main dialog container with animations and close button
- **Parameters**: DialogPrimitive.Content props
- **Returns**: Styled dialog content with built-in close button
- **Dependencies**: React.forwardRef, Radix Dialog Content, Lucide X icon

### DialogHeader
- **Purpose**: Header section for dialog title and description
- **Parameters**: HTMLDivElement attributes
- **Returns**: Flex column container
- **Dependencies**: cn utility

### DialogFooter
- **Purpose**: Footer section for dialog actions
- **Parameters**: HTMLDivElement attributes
- **Returns**: Flex container for buttons/actions
- **Dependencies**: cn utility

### DialogTitle
- **Purpose**: Accessible dialog title
- **Parameters**: DialogPrimitive.Title props
- **Returns**: Styled title element
- **Dependencies**: React.forwardRef, Radix Dialog Title

### DialogDescription
- **Purpose**: Accessible dialog description
- **Parameters**: DialogPrimitive.Description props
- **Returns**: Styled description element
- **Dependencies**: React.forwardRef, Radix Dialog Description

## Dependencies

- `@radix-ui/react-dialog`: Core dialog primitives
- `lucide-react`: X icon for close button
- `@/utils/cn`: Utility for className merging
- `react`: Core React functionality

## Usage Examples

```tsx
// Basic dialog
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is a description of what the dialog contains.
      </DialogDescription>
    </DialogHeader>
    <div>Dialog content goes here</div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled dialog
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled Dialog</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## Notes

- Built on Radix UI for accessibility and keyboard navigation
- Includes smooth animations (fade, zoom, slide effects)
- Automatic focus management and focus trapping
- Built-in close button with proper ARIA labels
- Portal rendering prevents z-index issues
- Responsive design with mobile considerations
- Supports controlled and uncontrolled modes

## Related Files

- `@/utils/cn`: Provides className merging utility
- `components/ui/button.tsx`: Often used in dialog footers
- Theme configuration: Defines animation and color tokens
