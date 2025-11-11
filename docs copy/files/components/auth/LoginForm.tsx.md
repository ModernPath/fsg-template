# LoginForm.tsx Documentation

**Path**: `components/auth/LoginForm.tsx`
**Type**: TypeScript React Component
**Size**: 362 lines
**Last Modified**: Recent

## Purpose

A comprehensive login form component supporting multiple authentication methods: password-based login, passwordless (magic link) login, and OAuth providers (Google, GitHub). Features form validation, internationalization, and admin route protection.

## Key Components

### Form Schemas
- **loginSchema**: Zod validation for email/password login
- **passwordlessSchema**: Zod validation for email-only login
- **Dependencies**: Zod validation library

### LoginForm Component
- **Purpose**: Multi-modal login form with authentication methods
- **Parameters**: None (uses router params and search params)
- **Returns**: JSX form with conditional rendering
- **Dependencies**: React Hook Form, Next.js router, Supabase

### State Management
- **error**: Error message display
- **isLoading**: Form submission loading state
- **isPasswordless**: Toggle between password and passwordless modes

### Authentication Methods

#### Password-based Login (onSubmit)
- **Purpose**: Standard email/password authentication
- **Parameters**: `LoginFormData` (email, password)
- **Features**: Admin route protection, credential validation
- **Flow**: Validate → Sign in → Check admin status → Redirect

#### Passwordless Login (onSubmitPasswordless)
- **Purpose**: Magic link authentication via email
- **Parameters**: `PasswordlessFormData` (email only)
- **Features**: Email redirect with callback URL
- **Flow**: Validate → Send OTP → Redirect to check-email page

#### OAuth Login (handleOAuthSignIn)
- **Purpose**: Third-party authentication (Google, GitHub)
- **Parameters**: `provider: 'google' | 'github'`
- **Features**: Callback URL with next parameter
- **Flow**: Initiate OAuth → Provider handles auth → Callback

## Dependencies

- `next-intl`: Internationalization and translations
- `next/navigation`: Router and navigation hooks
- `react-hook-form`: Form state and validation
- `@hookform/resolvers/zod`: Zod integration for validation
- `@supabase/supabase-js`: Authentication services
- `@/components/ui/*`: UI components (Button, Input, Label, Alert, Spinner)

## Form Features

### Validation
- Email format validation
- Password minimum length (8 characters)
- Real-time error display
- Internationalized error messages

### UI/UX
- Toggle between password and passwordless modes
- Loading states with spinners
- Gradient buttons with hover effects
- OAuth provider buttons with icons
- Remember me checkbox
- Forgot password link

### Accessibility
- Proper form labels and IDs
- ARIA attributes
- Keyboard navigation support
- Screen reader friendly

## Usage Examples

```tsx
// Basic usage in login page
<LoginForm />

// The component handles its own routing and state
// No props required - uses URL parameters

// URL parameters it reads:
// - locale: Current language
// - next: Redirect URL after login
// - searchParams: Additional routing info

// Example URLs:
// /en/auth/login?next=/dashboard
// /fi/auth/login?next=/admin/users
```

## Internationalization Keys

The component uses these translation keys:
- `Auth.email`, `Auth.password`
- `Auth.signIn`, `Auth.signingIn`
- `Auth.passwordlessLogin`, `Auth.passwordlessDescription`
- `Auth.invalidCredentials`, `Auth.unauthorized`
- `Auth.loginError`, `Auth.invalidEmail`, `Auth.invalidPassword`
- `Auth.rememberMe`, `Auth.forgotPassword`
- `Auth.orContinueWith`, `Auth.withPassword`

## Admin Route Protection

```typescript
// Checks admin status for admin routes
if (nextUrl.includes('/admin')) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    setError(t('unauthorized'));
    return;
  }
}
```

## OAuth Configuration

```typescript
// OAuth providers with callback URLs
const { error } = await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextUrl)}`
  }
});
```

## Notes

- Supports both dark and light themes
- Responsive design with mobile considerations
- Form validation prevents submission with invalid data
- Error handling with user-friendly messages
- Automatic redirect after successful authentication
- OAuth buttons include provider icons
- Passwordless mode shows helpful description text

## Related Files

- `@/utils/supabase/client`: Supabase authentication client
- `@/components/ui/*`: UI component library
- `messages/*/auth.json`: Translation files
- `app/[locale]/auth/callback/page.tsx`: OAuth callback handler
- `app/[locale]/auth/check-email/page.tsx`: Passwordless confirmation page
