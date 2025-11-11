# CompanySelector.tsx Documentation

**Path**: `components/ui/CompanySelector.tsx`
**Type**: TypeScript React Component
**Size**: 75 lines
**Last Modified**: Recent

## Purpose

A specialized dropdown selector component for choosing companies. Features loading states, conditional rendering based on company count, and consistent styling with the application theme.

## Key Components

### CompanySelectorProps Interface
- **Purpose**: Defines props for the company selector
- **Parameters**:
  - `companies: CompanyRow[]` - Array of company objects
  - `selectedCompanyId: string | null` - Currently selected company ID
  - `onCompanyChange: (companyId: string) => void` - Selection handler
  - `isLoading: boolean` - Loading state flag
  - `label?: string` - Optional label (default: 'Select Company')
  - `className?: string` - Additional CSS classes
- **Dependencies**: CompanyRow type from OnboardingFlow

### CompanySelector Component
- **Purpose**: Renders company selection dropdown with conditional states
- **Parameters**: CompanySelectorProps interface
- **Returns**: Conditional JSX based on state (loading, empty, single, multiple)
- **Dependencies**: React, Spinner component, CompanyRow type

### selectClasses Constant
- **Purpose**: Pre-defined Tailwind classes for consistent select styling
- **Features**: Dark theme, gold accent colors, focus states, transitions

## Dependencies

- `react`: Core React functionality
- `@/components/auth/OnboardingFlow`: CompanyRow type definition
- `./spinner`: Loading spinner component

## Usage Examples

```tsx
// Basic usage
<CompanySelector
  companies={companies}
  selectedCompanyId={selectedId}
  onCompanyChange={setSelectedId}
  isLoading={false}
/>

// With custom label
<CompanySelector
  companies={companies}
  selectedCompanyId={selectedId}
  onCompanyChange={setSelectedId}
  isLoading={loading}
  label="Choose Your Company"
/>

// With loading state
<CompanySelector
  companies={[]}
  selectedCompanyId={null}
  onCompanyChange={handleChange}
  isLoading={true}
/>

// With custom styling
<CompanySelector
  companies={companies}
  selectedCompanyId={selectedId}
  onCompanyChange={setSelectedId}
  isLoading={false}
  className="mb-4"
/>
```

## Conditional Rendering Logic

1. **Loading State**: Shows spinner and "Loading companies..." text
2. **Empty State**: Shows "No companies available" message
3. **Single Company**: Returns null (no selection needed)
4. **Multiple Companies**: Renders dropdown selector

## Notes

- Client-side component ('use client' directive)
- Handles null selectedCompanyId gracefully
- Includes business_id in option display when available
- Custom dropdown arrow with Heroicon SVG
- Consistent dark theme styling with gold accents
- Accessibility features (labels, IDs, ARIA attributes)
- Conditional rendering optimizes UX for different scenarios

## Related Files

- `@/components/auth/OnboardingFlow`: Provides CompanyRow type
- `@/components/ui/spinner`: Loading indicator
- Company-related API endpoints and data fetching logic
