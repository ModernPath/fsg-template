# use-toast.ts Documentation

**Path**: `components/ui/use-toast.ts`
**Type**: TypeScript React Hook
**Size**: 183 lines
**Last Modified**: Recent

## Purpose

A comprehensive toast notification system hook inspired by react-hot-toast. Provides state management for toast notifications with programmatic API for showing, updating, and dismissing toasts.

## Key Components

### ToasterToast Type
- **Purpose**: Extended toast type with ID and content
- **Parameters**: ToastProps + id, title, description, action
- **Dependencies**: ToastProps, ToastActionElement from toast component

### Action Types
- **Purpose**: Redux-style actions for toast state management
- **Types**:
  - `ADD_TOAST`: Add new toast to queue
  - `UPDATE_TOAST`: Update existing toast
  - `DISMISS_TOAST`: Mark toast for dismissal
  - `REMOVE_TOAST`: Remove toast from state

### reducer Function
- **Purpose**: Pure function for toast state updates
- **Parameters**: State and Action
- **Returns**: New state
- **Features**: Limits toasts, handles updates, manages dismissal

### toast Function
- **Purpose**: Programmatic API for creating toasts
- **Parameters**: Toast configuration object
- **Returns**: Object with id, dismiss, and update methods
- **Dependencies**: genId, dispatch

### useToast Hook
- **Purpose**: React hook for toast state and API
- **Parameters**: None
- **Returns**: State, toast function, and dismiss function
- **Dependencies**: React.useState, React.useEffect

### Utility Functions
- **genId**: Generates unique toast IDs
- **addToRemoveQueue**: Manages toast removal timing
- **dispatch**: Updates global toast state

## Dependencies

- `react`: Core React functionality
- `@/components/ui/toast`: Toast component types

## Configuration

```typescript
const TOAST_LIMIT = 1          // Maximum concurrent toasts
const TOAST_REMOVE_DELAY = 1000000  // Very long delay (effectively manual)
```

## Usage Examples

```tsx
// Basic usage
const { toast } = useToast()

// Simple toast
toast({
  title: "Success",
  description: "Your changes have been saved."
})

// Error toast
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong."
})

// Toast with action
toast({
  title: "Undo available",
  description: "Your item was deleted.",
  action: (
    <ToastAction altText="Undo">
      Undo
    </ToastAction>
  )
})

// Programmatic control
const toastRef = toast({
  title: "Loading...",
  description: "Please wait"
})

// Update toast
toastRef.update({
  title: "Complete!",
  description: "Task finished successfully"
})

// Dismiss specific toast
toastRef.dismiss()

// Dismiss all toasts
const { dismiss } = useToast()
dismiss()
```

## Notes

- Global state management without external dependencies
- Memory-based state with listener pattern
- Automatic ID generation and management
- Support for toast updates and dismissal
- Queue management with configurable limits
- Long removal delay allows for manual dismissal control
- Inspired by react-hot-toast but integrated with Radix UI

## Related Files

- `@/components/ui/toast`: Toast component definitions
- `@/components/ui/toaster`: Toast container component
- Components that trigger toast notifications
