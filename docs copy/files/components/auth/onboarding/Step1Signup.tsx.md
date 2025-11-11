# Step1Signup.tsx Documentation

**Path**: `components/auth/onboarding/Step1Signup.tsx`
**Type**: TypeScript React Component
**Size**: ~221 lines
**Last Modified**: Recent

## Purpose

The first step of the onboarding flow that collects basic user information including name, phone, email, and consent preferences. Features a split-screen design with form on the left and visual content on the right.

## Key Components

### Step1SignupProps Interface
- **Purpose**: Defines props for the signup step component
- **Parameters**:
  - `initialFormData`: Object with firstName, lastName, phone, email, and consent flags
  - `loading: boolean` - Form submission state
  - `error: string | null` - Error message display
  - `turnstileToken: string | null` - CAPTCHA token
  - `locale: string` - Current language locale
  - `handleInitialFormChange`: Form input change handler
  - `handleCheckboxChange`: Checkbox change handler
  - `handleStep1Submit`: Form submission handler
  - `setTurnstileToken`: CAPTCHA token setter
  - `setError`: Error setter

### Step1Signup Component
- **Purpose**: Renders the first onboarding step with user information form
- **Parameters**: Step1SignupProps interface
- **Returns**: Split-screen JSX with form and visual content
- **Dependencies**: Next-intl, Heroicons, UI components

### Form Fields
- **firstName/lastName**: Name input fields in grid layout
- **phone**: Phone number with country code selection
- **email**: Email address input
- **consentMarketing**: Marketing communications consent
- **consentAnalysis**: Data analysis consent

## Dependencies

- `next-intl`: Internationalization and translations
- `@heroicons/react/24/outline`: Icon components
- `@/components/ui/turnstile`: CAPTCHA widget
- `@/components/ui/spinner`: Loading indicator
- `@/components/ui/checkbox`: Custom checkbox component
- `next/navigation`: Navigation hooks

## UI Design

### Split-Screen Layout
```tsx
// Left side - Form (w-full md:w-1/2)
<div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16">
  {/* Form content */}
</div>

// Right side - Visual content (hidden on mobile)
<div className="hidden md:flex md:w-1/2 onboarding-right-panel">
  {/* Visual elements */}
</div>
```

### Form Structure
- **Grid Layout**: First/Last name in 2-column grid
- **Phone Field**: Dropdown for country code + input
- **Consent Checkboxes**: Marketing and analysis permissions
- **CAPTCHA**: Turnstile widget for bot protection

## Styling

### CSS Classes
- **onboarding-bg**: Background styling
- **onboarding-title**: Large title text
- **onboarding-description**: Subtitle text
- **onboarding-input**: Form input styling
- **onboarding-label**: Form label styling
- **onboarding-btn-primary**: Primary button styling

## Form Validation

### Required Fields
- First Name: Required text input
- Last Name: Required text input  
- Phone: Required with country code
- Email: Required email format

### Consent Management
```tsx
// Marketing consent checkbox
<Checkbox
  id="consentMarketing"
  checked={initialFormData.consentMarketing}
  onCheckedChange={(checked) => 
    handleCheckboxChange('consentMarketing', checked as boolean)
  }
/>

// Analysis consent checkbox  
<Checkbox
  id="consentAnalysis"
  checked={initialFormData.consentAnalysis}
  onCheckedChange={(checked) =>
    handleCheckboxChange('consentAnalysis', checked as boolean)
  }
/>
```

## Usage Examples

```tsx
// Used within OnboardingFlow component
<Step1Signup
  initialFormData={{
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    consentMarketing: false,
    consentAnalysis: false
  }}
  loading={false}
  error={null}
  turnstileToken={null}
  locale="en"
  handleInitialFormChange={handleChange}
  handleCheckboxChange={handleCheckboxChange}
  handleStep1Submit={handleSubmit}
  setTurnstileToken={setToken}
  setError={setError}
/>
```

## Internationalization

Uses translation keys from `Onboarding` namespace:
- `step1.title`: Main heading
- `step1.serviceDescription`: Service description
- `step1.firstNameLabel/Placeholder`: First name field
- `step1.lastNameLabel/Placeholder`: Last name field
- `step1.phoneLabel/Placeholder`: Phone field
- `step1.emailLabel/Placeholder`: Email field
- `step1.consentMarketing`: Marketing consent text
- `step1.consentAnalysis`: Analysis consent text
- `step1.nextButton`: Next button text

## Security Features

- **Turnstile CAPTCHA**: Bot protection
- **Consent Management**: GDPR compliance
- **Form Validation**: Client-side validation
- **Error Handling**: User-friendly error messages

## Notes

- Responsive design with mobile-first approach
- Right panel hidden on mobile devices
- Uses custom onboarding CSS classes for consistent styling
- Integrates with parent OnboardingFlow component
- Supports multiple locales with fallback text
- Checkbox components for consent management
- Country code selector for international phone numbers

## Related Files

- `components/auth/OnboardingFlow.tsx`: Parent component
- `components/ui/turnstile.tsx`: CAPTCHA widget
- `components/ui/checkbox.tsx`: Custom checkbox
- `styles/onboarding.css`: Onboarding-specific styles
- `messages/*/onboarding.json`: Translation files
