# RegisterForm.tsx Documentation

**Path**: `components/auth/RegisterForm.tsx`
**Type**: TypeScript React Component
**Size**: ~325 lines
**Last Modified**: Recent

## Purpose

A multi-step registration form component that handles user signup with company information. Features Turnstile CAPTCHA protection, passwordless authentication via magic link, and comprehensive form validation.

## Key Components

### FormData Type
- **Purpose**: Defines registration form structure
- **Parameters**:
  - `name: string` - User's full name
  - `email: string` - Email address
  - `company: string` - Company name
  - `companyCode: string` - Company registration code
  - `terms: boolean` - Terms acceptance (defaults to true)
  - `newsletter: boolean` - Newsletter subscription opt-in

### FormErrors Type
- **Purpose**: Type-safe error handling for form fields
- **Parameters**: Partial mapping of FormData keys to error strings

### RegisterForm Component
- **Purpose**: Multi-step registration with CAPTCHA and validation
- **Parameters**: None (uses router params)
- **Returns**: Multi-step form JSX with validation
- **Dependencies**: Supabase, Turnstile, Next.js

### State Management
- **currentStep**: Current form step (0-based index)
- **formData**: Form field values
- **errors**: Field validation errors
- **loading**: Submission loading state
- **turnstileToken**: CAPTCHA verification token

### Form Steps
1. **basicInfo**: Name and email collection
2. **companyInfo**: Company details and preferences

## Key Functions

### handleSubmit
- **Purpose**: Processes form submission with validation and CAPTCHA
- **Flow**: 
  1. Validate Turnstile token
  2. Call validation API
  3. Send magic link via Supabase
  4. Store user data via API
  5. Redirect to email verification

### Form Validation
- **Client-side**: Required field validation
- **Server-side**: Turnstile CAPTCHA validation
- **Email**: Magic link authentication

## Dependencies

- `@supabase/supabase-js`: Authentication services
- `next-intl`: Internationalization
- `next/navigation`: Routing and navigation
- `@/components/ui/turnstile`: CAPTCHA widget
- `@/app/components/LocaleSwitcher`: Language switching

## Security Features

### Turnstile CAPTCHA
```typescript
// CAPTCHA validation before registration
const validateResponse = await fetch('/api/auth/validate-turnstile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: turnstileToken }),
});
```

### Passwordless Authentication
```typescript
// Magic link instead of password
const { error: signInError } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${nextUrl}`,
    data: { name, company, companyCode, newsletter, marketing }
  }
});
```

## Usage Examples

```tsx
// Basic usage in registration page
<RegisterForm />

// The component handles its own state and routing
// No props required - reads locale from URL params

// Registration flow:
// 1. User fills basic info (step 1)
// 2. User fills company info (step 2) 
// 3. CAPTCHA validation
// 4. Magic link sent to email
// 5. User verification and account creation
```

## API Integration

### User Data Storage
```typescript
// Store user information after email verification
const userResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email, name, company, companyCode, 
    newsletter, marketing, locale
  }),
});
```

## Form Structure

### Step 1 - Basic Info
- Name input field
- Email input field
- Next button to proceed

### Step 2 - Company Info  
- Company name field
- Company code field
- Newsletter subscription checkbox
- Marketing consent checkbox
- Terms acceptance (automatic)
- Turnstile CAPTCHA widget
- Submit button

## Notes

- Uses multi-step form pattern for better UX
- CAPTCHA only appears on final step to reduce friction
- Magic link authentication eliminates password requirements
- Comprehensive error handling with user-friendly messages
- Supports internationalization with fallback text
- Terms acceptance is automatic (set to true by default)
- Responsive design for mobile and desktop

## Related Files

- `/api/auth/validate-turnstile`: CAPTCHA validation endpoint
- `/api/auth/register`: User registration endpoint
- `@/components/ui/turnstile`: CAPTCHA widget component
- `@/utils/supabase/client`: Supabase client configuration
- `messages/*/auth.json`: Translation files
