# Architecture

## Technical Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Tailwind Animate
- **State Management**: React Context API + TanStack React Query (v5.63.0)
- **Form Management**: React Hook Form (v7.54.2) with Zod validation (v3.24.2)
- **Component Library**: Shadcn UI + Radix UI components
- **Icons**: Lucide React + Heroicons
- **Animations**: Framer Motion (v11.15.0)
- **Themes**: next-themes for dark/light mode
- **Internationalization**: next-intl (v3.3.1)

### Backend
- **API**: Next.js API Routes (TypeScript)
- **Language**: TypeScript (v5.3.3)
- **Runtime**: Node.js v22.13.1, npm v11.0.0
- **Authentication**: Supabase Auth (Google OAuth, email, SSO)
- **Background Jobs**: Inngest (v3.35.1) for task scheduling and polling
- **Email Services**: SendGrid + Resend
- **File Processing**: Sharp (v0.32.6) for image optimization
- **PDF Processing**: PDF.js (v5.0.375)
- **OpenAPI**: Swagger documentation for APIs

### Database & Storage
- **Primary Database**: PostgreSQL via Supabase
- **Database Client**: @supabase/supabase-js (v2.48.1)
- **Real-time Capabilities**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage
- **Migrations**: Supabase CLI migrations (not Prisma)
- **Security**: Row Level Security (RLS) policies

### AI/ML & External APIs
- **Text Models**: Google Gemini API (@google/genai v0.13.0)
- **Legacy AI**: OpenAI API support maintained
- **Image Generation**: Replicate API (Minimax, Imagen, Flux models)
- **Document Processing**: Custom extraction via Gemini + PDF.js
- **Search**: Tavily Search API for web search capabilities
- **Financial Data**: Qred API, Capital Box API integrations

### Testing
- **Unit Testing**: Jest (v29.7.0) + React Testing Library (v14.3.1) + Vitest
- **E2E Testing**: Cypress (v13.17.0)
- **Test Setup**: @testing-library/jest-dom, custom test utilities
- **Coverage**: Jest Coverage reporting

### DevOps & Monitoring
- **Hosting**: Vercel
- **CI/CD**: Vercel Pipelines + GitHub Actions
- **Database Hosting**: Supabase Cloud
- **Error Tracking**: Sentry (configured)
- **Analytics**: Vercel Analytics + Speed Insights
- **Performance**: Bundle analyzer (@next/bundle-analyzer)

### Security & Compliance
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Supabase RLS policies per table
- **Data Protection**: HTTPS, secure headers via middleware
- **Input Validation**: Zod schemas, server-side validation
- **Finnish Compliance**: finnish-ssn for Finnish social security numbers

## Current Folder Structure

```
/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (dashboard, auth, lenders, etc.)
│   ├── [locale]/          # Internationalized routes (fi, en, sv)
│   │   ├── admin/         # Admin panel pages
│   │   ├── dashboard/     # User dashboard
│   │   ├── onboarding/    # Multi-step onboarding flow
│   │   └── auth/          # Authentication pages
│   ├── components/        # App-specific components
│   └── i18n/              # Internationalization utilities
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn UI base components
│   ├── auth/             # Authentication components
│   ├── financial/        # Financial charts and analysis
│   ├── admin/            # Admin-specific components
│   ├── landing-page/     # Marketing page components
│   └── booking/          # Calendar booking components
├── lib/                   # Shared utilities and libraries
│   ├── supabase/         # Supabase clients and utilities
│   ├── ai/               # AI/ML utilities
│   └── utils/            # General utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── supabase/             # Database schema and migrations
│   ├── migrations/       # SQL migration files
│   └── config.toml       # Supabase configuration
├── tools/                 # CLI tools and scripts
│   ├── gemini.ts         # Gemini AI CLI tool
│   ├── image-optimizer.ts # Image processing tool
│   └── generate-video.ts # Video generation tool
├── scripts/              # Automation scripts
│   ├── seed-*.ts         # Database seeding scripts
│   └── import-*.ts       # Data import scripts
├── messages/             # i18n translation files
│   ├── fi.json          # Finnish translations
│   ├── en.json          # English translations
│   └── sv.json          # Swedish translations
├── public/               # Static assets
│   ├── images/          # Image assets
│   └── videos/          # Video assets
├── docs/                 # Documentation
├── __tests__/            # Test files
├── cypress/              # E2E test specifications
└── middleware.ts         # Next.js middleware for auth & i18n
```

## Key Architectural Patterns

### 1. App Router Architecture (Next.js 15)
- File-based routing with layout.tsx hierarchy
- Server and client components separation
- Streaming and Suspense for loading states
- Middleware for authentication and internationalization

### 2. Multi-tenant Company Architecture
- User profiles linked to companies
- Row Level Security for data isolation
- Company-scoped financial data and applications

### 3. AI-Driven Financial Analysis
- Document upload and processing pipeline
- Gemini AI for financial document extraction
- Automated risk assessment and recommendations
- Multi-step onboarding with AI guidance

### 4. Real-time Lender Integration
- Polling system for external lender APIs (Inngest)
- Asynchronous offer processing
- Real-time status updates via Supabase Realtime

### 5. Internationalization (i18n)
- Multi-language support (Finnish, English, Swedish)
- Locale-based routing with [locale] dynamic segments
- Translation management with next-intl

### 6. Progressive Web App (PWA) Ready
- Service worker support configured
- Responsive design with mobile-first approach
- Offline capabilities for core features

### 7. Type-Safe Development
- End-to-end TypeScript coverage
- Zod runtime validation
- Supabase generated types
- Strict TypeScript configuration

### 8. Modular Component System
- Shadcn UI for consistent design system
- Feature-based component organization
- Reusable hooks and utilities
- Composable UI patterns

### 9. Error Handling & Monitoring
- React Error Boundaries
- Sentry error tracking integration
- Toast notifications with Sonner
- Graceful fallbacks and loading states

### 10. Performance Optimization
- Image optimization with Sharp
- Bundle analysis and code splitting
- Vercel Speed Insights monitoring
- Efficient state management with React Query

## Development Workflow

### Environment Setup
- Node.js ≥18.17.0 (currently using v22.13.1)
- Supabase CLI for local development
- Multiple environment configurations (.env.local, .env.example)

### Data Flow
1. **User Authentication**: Supabase Auth → RLS policies
2. **Company Onboarding**: Multi-step form → AI analysis → Recommendations
3. **Document Processing**: Upload → Gemini extraction → Financial metrics
4. **Lender Applications**: Submit → Polling (Inngest) → Offers → Dashboard
5. **Real-time Updates**: Supabase Realtime → React Query → UI updates

### Deployment Pipeline
- Vercel automatic deployments
- Supabase database migrations
- Environment variable management
- Production monitoring and analytics
