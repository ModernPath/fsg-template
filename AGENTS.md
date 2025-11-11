# AGENTS.md

## Essential Commands

### Development
```bash
npm run dev              # Start full dev environment (Next.js + Inngest)
npm run dev:next         # Next.js dev server only
npm run build            # Production build
npm run lint             # ESLint check
```

### Testing
```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Generate coverage report
npm run cypress          # Open Cypress E2E tests
npm run test:e2e:headless # Run E2E tests headlessly
```

### Single Test
```bash
npx vitest run path/to/test.test.tsx    # Run single test file
npx vitest path/to/test.test.tsx        # Watch single test
```

## Code Style Guidelines

### Imports & Formatting
- Use absolute imports with `@/` prefix (configured in tsconfig.json)
- Group imports: external libraries → internal modules → component imports
- Use `vi.fn()` for mocks in Vitest tests (not `jest.fn()`)
- Follow Next.js 15 App Router patterns

### TypeScript & Types
- Strict TypeScript enabled - all code must be properly typed
- Use generated Supabase types from `types/database.ts`
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation schemas

### Naming Conventions
- Components: PascalCase (e.g., `FinancialDashboard.tsx`)
- Files: kebab-case for utilities, PascalCase for components
- Functions: camelCase with descriptive names
- Constants: UPPER_SNAKE_CASE
- Test files: `*.test.tsx` or `*.test.ts` in `__tests__/` directories

### Error Handling
- Use React Error Boundaries for component errors
- API routes return proper HTTP status codes and error objects
- Use try-catch with proper error logging
- Validate inputs with Zod schemas

### Database Rules
**NEVER use `supabase db reset` without explicit user permission**
- Use incremental migrations via `supabase migration new`
- Test changes on separate branches
- Preserve carefully configured test data

### Testing Patterns
- Unit tests with Vitest + React Testing Library
- Mock external dependencies with `vi.mock()`
- Use semantic queries (`getByRole`) over test IDs
- Test happy path, error states, and edge cases

### Architecture Patterns
- Server Components by default, Client Components with 'use client'
- Supabase RLS for all database operations
- TanStack Query for server state management
- Shadcn UI + Tailwind CSS for styling