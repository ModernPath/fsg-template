# AuthProvider.tsx Documentation

**Path**: `components/auth/AuthProvider.tsx`
**Type**: TypeScript React Context Provider
**Size**: 273 lines
**Last Modified**: Recent

## Purpose

A comprehensive authentication context provider that manages user session state, admin/partner permissions, and provides authentication status throughout the application. Built on Supabase Auth with robust error handling and loading states.

## Key Components

### AuthContextType Interface
- **Purpose**: Defines the shape of authentication context
- **Parameters**:
  - `session: Session | null` - Current Supabase session
  - `loading: boolean` - Authentication loading state
  - `isAuthenticated: boolean` - Derived authentication status
  - `user: User | null` - Current user object
  - `isAdmin: boolean` - Admin permission flag
  - `isPartner: boolean` - Partner permission flag
  - `partnerId: string | null` - Partner ID if applicable
  - `error: string | null` - Authentication error message
- **Dependencies**: Supabase types

### useAuth Hook
- **Purpose**: Provides access to authentication context
- **Parameters**: None
- **Returns**: AuthContextType object
- **Dependencies**: React.useContext, AuthContext
- **Error Handling**: Throws error if used outside AuthProvider

### AuthProvider Component
- **Purpose**: Root authentication provider with session management
- **Parameters**: `{ children: React.ReactNode }`
- **Returns**: Context provider with authentication state
- **Dependencies**: Supabase client, React hooks

### Key Functions

#### fetchAdminStatus
- **Purpose**: Fetches user's admin/partner status from profiles table
- **Parameters**: `userId: string`
- **Returns**: Promise<void>
- **Features**: Timeout handling (3s), graceful error fallback

#### handleAuthStateChange
- **Purpose**: Handles authentication state changes and updates context
- **Parameters**: `session: Session | null`, `event: AuthChangeEvent`
- **Returns**: Promise<void>
- **Features**: Debounced updates, admin status fetching

### Configuration Constants

```typescript
const DEBUG_AUTH = false;           // Debug logging toggle
const SESSION_STORAGE_KEY = 'sb-session-state'; // Storage key (disabled)

enum AuthErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK', 
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN'
}
```

## Dependencies

- `@supabase/supabase-js`: Authentication and session management
- `@/utils/supabase/client`: Supabase client configuration
- `react`: Core React functionality (Context, hooks)

## Usage Examples

```tsx
// Wrap app with provider
<AuthProvider>
  <App />
</AuthProvider>

// Use authentication in components
const { user, isAuthenticated, isAdmin, loading } = useAuth()

// Conditional rendering based on auth state
if (loading) return <LoadingSpinner />
if (!isAuthenticated) return <LoginForm />
if (isAdmin) return <AdminDashboard />

// Check specific permissions
const { isPartner, partnerId } = useAuth()
if (isPartner && partnerId) {
  // Partner-specific functionality
}

// Handle authentication errors
const { error } = useAuth()
if (error) {
  toast.error(error)
}
```

## Features

### Session Management
- Automatic session initialization and persistence
- Real-time authentication state changes
- Cleanup on component unmount

### Permission System
- Admin status checking with database lookup
- Partner role and ID management
- Graceful fallbacks for permission errors

### Error Handling
- Typed error categories (timeout, network, unauthorized)
- Safe defaults when profile fetching fails
- Debug logging for development

### Performance Optimizations
- Memoized context values to prevent unnecessary re-renders
- Debounced state updates
- Request cleanup and cancellation

## Notes

- Session storage is currently disabled for debugging purposes
- Uses 3-second timeout for profile fetching to prevent hanging
- Always sets loading to false even on errors to prevent infinite loading states
- Maintains component mount state to prevent memory leaks
- Admin status is fetched separately from authentication for better UX

## Related Files

- `@/utils/supabase/client`: Supabase client configuration
- `components/auth/LoginForm.tsx`: Login form that uses this context
- Admin and partner components that check permissions
- Database profiles table for user role management
