# AI Changelog

## Recent Changes

### 2025-11-11 - BizExit Forms, Listings & Buyers Implementation

**Added CRUD functionality and management pages:**

#### Forms & Pages (6 new files)
- **CompanyForm** (`components/companies/CompanyForm.tsx`):
  - Full company creation/editing form
  - Basic info: name, legal name, business ID, location
  - Business details: industry, description, employees
  - Financial info: revenue, EBITDA, asking price
  - Currency and country selectors
  - Form validation and error handling
  
- **DealForm** (`components/deals/DealForm.tsx`):
  - Deal creation/editing form
  - Company and buyer selection
  - Stage selection (9 stages)
  - Estimated value input
  - Notes field
  
- **New Company Page** (`app/[locale]/dashboard/companies/new/page.tsx`):
  - Company creation page
  - Permission checks (seller, broker, admin)
  - Organization validation
  
- **New Deal Page** (`app/[locale]/dashboard/deals/new/page.tsx`):
  - Deal creation page
  - Pre-selected company support
  - Companies and buyers dropdowns
  
- **Listings Page** (`app/[locale]/dashboard/listings/page.tsx`):
  - View all company listings
  - Portal syndication status (BizBuySell, Transfindo, etc.)
  - Views and leads tracking per portal
  - Published/draft status badges
  - Empty state with CTA
  
- **Buyers Page** (`app/[locale]/dashboard/buyers/page.tsx`):
  - Buyer profile grid
  - Active deals count
  - NDA signing status
  - Contact info (email, phone)
  - Email verification badges
  - Quick actions (view, email)

#### Features:
- Responsive layouts for all screen sizes
- Dark mode support throughout
- Loading and error states
- Empty states with CTAs
- Permission-based access control
- Form validation
- TypeScript type safety

#### Files Added: 6
- 2 form components
- 4 page components
- 1181 lines of code

### 2025-11-11 - BizExit Frontend Implementation Complete

**Comprehensive frontend for BizExit M&A platform:**

#### Landing Page & Translations
- **BizExit Landing Page** (`components/pages/home/BizExitLanding.tsx`):
  - Hero section with social proof (500+ deals, €2.5B+ value)
  - Three target audiences: Sellers, Brokers, Buyers
  - Features showcase: AI materials, deal pipeline, documents, NDA, portals, analytics
  - How It Works: 5-step process visualization
  - Professional CTA sections
  - Responsive design with gradient backgrounds
  
- **Complete i18n Translations** (English, Finnish, Swedish):
  - `bizexit.json`: Landing page content for all 3 languages
  - `dashboard.json`: Dashboard UI strings
  - `companies.json`: Companies management
  - `deals.json`: Deals pipeline
  - Natural, culturally appropriate translations

#### Updated Main Page
- Changed from generic template to BizExit landing page
- Updated metadata for SEO
- New Open Graph image reference

#### Unit Tests
- **DealCard.test.tsx**: 8 tests for deal card rendering
- **DealsKanban.test.tsx**: 6 tests for kanban board functionality  
- **DashboardStats.test.tsx**: 8 tests for stats display
- All tests passing with proper mocking

#### Files Created (15 new files):
1. `components/pages/home/BizExitLanding.tsx`
2-4. `messages/en|fi|sv/bizexit.json`
5-7. `messages/en|fi|sv/dashboard.json`
8-10. `messages/en|fi|sv/companies.json`
11-13. `messages/en|fi|sv/deals.json`
14-16. `__tests__/components/deals/DealCard.test.tsx`
15. `__tests__/components/deals/DealsKanban.test.tsx`
16. `__tests__/components/dashboard/DashboardStats.test.tsx`

#### Files Modified:
- `app/[locale]/page.tsx`: Switch to BizExit landing page

### 2025-11-11 - BizExit M&A Platform - Complete Implementation

**Major architectural transformation:** Converted LastBot web app into BizExit - AI-Powered M&A Platform.

#### 1. Comprehensive Documentation (6000+ lines)
- **docs/bizexit/README.md**: Platform overview, architecture, features, tech stack
- **docs/bizexit/datamodel.md**: Complete database schema (18 tables, relationships, indexes)
- **docs/bizexit/workflows.md**: 7 business workflows with automation, triggers, KPIs
- **docs/bizexit/integrations.md**: Portal adapters, Stripe, AI services integration
- **docs/bizexit/env-template.md**: Environment variables and security guidelines
- **docs/bizexit/api.md**: Complete API documentation with examples
- **docs/description.md**: Updated platform description

#### 2. Database Schema & Migrations (3 migration files)
- **Organization-scoped multi-tenancy**: 
  - `organizations` table with types (broker, seller, platform, service_provider)
  - `profiles` extended with `organization_id` and `role` fields
- **Core Business Entities**:
  - `companies`: Business listings with financials
  - `company_financials`: Multi-year financial data
  - `company_assets`: Documents, images, videos
  - `listings`: Published company offerings
  - `listing_portals`: External portal syndication
  - `deals`: M&A deal pipeline
  - `deal_stages`: Stage transitions with history
  - `deal_activities`: Activity timeline
  - `buyer_profiles`: KYC and NDA status
  - `ndas`: Legal agreements
  - `payments`: Fixed fees and success fees
  - `partners`: External service providers
  - `portal_adapters`: Integration configurations
  - `audit_logs`: Complete audit trail
- **50+ RLS Policies**: Organization-scoped data isolation
- **Automatic Triggers**: Timestamps, audit logs
- **Comprehensive Seed Data**: 5 orgs, 8 companies, 3 deals, financials, payments

#### 3. RBAC System (lib/rbac.ts)
- **6 User Roles**:
  - Seller: Company owners
  - Broker: M&A professionals
  - Buyer: Potential acquirers
  - Partner: External advisors
  - Admin: Platform administrators
  - Analyst: Data analysts
- **30+ Granular Permissions**:
  - Company: create, read, update, delete, publish
  - Deal: create, read, update, delete, advance_stage
  - Listing: create, read, update, delete, publish
  - NDA: create, read, sign, verify
  - Payment: create, read, process
  - Organization: read, update, invite_user, remove_user
  - Admin: read, write
  - Audit: read
- **Helper Functions**:
  - `getUserContext()`: Get user's organization and role
  - `hasPermission()`: Check single permission
  - `hasAnyPermission()`: Check any of multiple permissions
  - `hasAllPermissions()`: Check all permissions
  - `assertPermission()`: Throw if permission denied
  - `requireAuth()`: Enforce authentication
  - `requirePermission()`: Enforce permission
  - `requireAdmin()`: Enforce admin access
  - `isResourceInOrganization()`: Verify resource ownership
  - `createAuditLog()`: Create audit entries

#### 4. Middleware Enhancements (middleware.ts)
- **Organization Context Injection** for API routes:
  - `x-organization-id`: User's organization
  - `x-user-role`: User's role
  - `x-is-admin`: Admin flag
- Automatic profile lookup on authenticated requests
- Enables organization-scoped data access

#### 5. Organizations API
- **GET /api/organizations**: List user's organizations
- **POST /api/organizations**: Create organization (admin only)
- **GET /api/organizations/[id]**: Get organization details
- **PATCH /api/organizations/[id]**: Update organization
- **DELETE /api/organizations/[id]**: Delete organization (admin only)

#### 6. Companies API
- **GET /api/companies**: List with filters (status, pagination)
- **POST /api/companies**: Create company
- **GET /api/companies/[id]**: Get with relations (financials, assets, listings, deals)
- **PATCH /api/companies/[id]**: Update company
- **DELETE /api/companies/[id]**: Soft delete (archive)
- **GET /api/companies/[id]/financials**: Get financial records
- **POST /api/companies/[id]/financials**: Add financial record

#### 7. Deals API
- **GET /api/deals**: List with filters (stage, company, pagination)
- **POST /api/deals**: Create deal with stage history
- **GET /api/deals/[id]**: Get with relations (company, buyer, history, activities, payments)
- **PATCH /api/deals/[id]**: Update with automatic stage history
- **DELETE /api/deals/[id]**: Delete deal

#### 8. Security Features
- All endpoints enforce authentication and permissions
- Organization-scoped data isolation via RLS
- Automatic audit log creation for all write operations
- Input validation and error handling
- Resource ownership verification
- Secure error messages (no data leakage)

#### 9. Testing
- **12 RBAC unit tests** (all passing):
  - Permission validation for all 6 roles
  - Permission check functions
  - Error handling
- **API test stubs** for integration testing
- Test coverage for:
  - hasPermission, hasAnyPermission, hasAllPermissions
  - assertPermission error handling
  - Role-specific permissions

#### 10. Git Workflow
- **Feature Branch**: `feature/bizexit-platform`
- **6 Commits**:
  1. feat(docs): Add comprehensive BizExit documentation
  2. feat(database): Create BizExit database schema phase 1
  3. feat(database): Create BizExit database schema phase 2 + RLS policies
  4. fix(config): Remove postgis from Supabase extra_search_path
  5. feat(database): Add comprehensive BizExit seed data
  6. feat(api): Implement BizExit RBAC and core API endpoints
  7. docs(api): Add complete BizExit API documentation (pending)

#### Technical Stack Confirmed
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (not tRPC)
- **Database**: PostgreSQL via Supabase (not Prisma ORM)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe (to be integrated)
- **Jobs**: Inngest (to be integrated)
- **Testing**: Vitest, Playwright

#### Next Steps
- Frontend UI implementation (Dashboard, Companies, Deals)
- Stripe payment integration
- AI content generation (Gemini)
- Portal adapter implementations
- E2E tests
- Production deployment

---

### 2025-01-10 - LastBot Chat Widget Integration
- **Added LastBot chat widget support** to the application
- **Created LastBotWidget component** (`components/lastbot/LastBotWidget.tsx`) with configurable environment variables
- **Updated Content Security Policy** in `next.config.js` to allow LastBot domains:
  - Added `https://*.lastbot.com` and `https://assets.lastbot.com` to script-src
  - Added `https://*.lastbot.com` and `wss://*.lastbot.com` to connect-src
  - Added `https://*.lastbot.com` to frame-src and child-src
- **Environment variables added**:
  - `NEXT_PUBLIC_ENABLE_LASTBOT_ONE` - Boolean to enable/disable widget
  - `NEXT_PUBLIC_LASTBOT_BASE_URL` - Base URL for LastBot widgets
  - `NEXT_PUBLIC_LASTBOT_WIDGET_ID` - Unique widget identifier
- **Integrated widget into root layout** for global availability on public pages
- **Added comprehensive unit tests** for the LastBot widget component
- **Widget features**:
  - Conditional rendering based on environment variables
  - Automatic script loading with error handling
  - Configurable widget properties (auto-open, fullscreen, etc.)
  - Development-only debug logging

## 2025-01-10 - Comprehensive User Agent Analytics Implementation

### Added
- **User Agent Parser Library** (`lib/user-agent-parser.ts`):
  - Comprehensive user agent string parsing using `ua-parser-js`
  - Browser, OS, device type, and engine detection
  - Bot/crawler detection with 15+ indicators
  - Device type classification (mobile, tablet, desktop)
  - Browser version analysis and "modern browser" detection
  - Geographic and architecture information extraction
  - Diversity index calculations for analytics insights

- **User Agent Analytics API** (`app/api/analytics/user-agents/route.ts`):
  - GET endpoint for user agent analytics with date range filtering
  - POST endpoint for individual user agent parsing
  - Batch parsing and database update functionality
  - Chart-ready data formatting for browsers, OS, devices, and versions
  - Time series analysis for browser/device diversity trends
  - Comprehensive insights calculation (diversity, modern browser %, etc.)

- **User Agent Analytics Dashboard** (`app/[locale]/admin/analytics/user-agents.tsx`):
  - Complete analytics dashboard with 8 different chart types
  - Pie chart for browser distribution
  - Bar chart for operating systems
  - Custom device type visualization with progress bars
  - Horizontal bar chart for browser versions
  - Time series chart for diversity trends over time
  - Key metrics cards with real-time data
  - Parse user agents button for database updates
  - Loading states and empty state handling
  - Responsive design with grid layouts

- **Analytics Dashboard Integration**:
  - Added "User Agents" tab to main analytics dashboard
  - Integrated with existing date range selection
  - Consistent styling with other analytics components
  - Real-time refresh capabilities

- **Comprehensive Translations**:
  - English, Finnish, and Swedish translations for all UI elements
  - Culturally appropriate terminology for each language
  - Technical terms properly localized

### Technical Features
- **Advanced User Agent Analysis**:
  - Simpson's Diversity Index for browser ecosystem measurement
  - Modern browser percentage calculation
  - Bot traffic detection and filtering
  - Device vendor and model identification
  - CPU architecture detection
  - Screen resolution and connection type analysis

- **Performance Optimizations**:
  - Batch processing for database updates
  - Efficient chart data formatting
  - Loading skeletons for better UX
  - Lazy loading for large datasets

- **Data Insights**:
  - Browser market share analysis
  - Operating system distribution
  - Device type trends
  - Version fragmentation analysis
  - Geographic technology adoption patterns

### Database Integration
- Seamless integration with existing `analytics_events` table
- Automatic parsing of existing user agent strings
- Real-time data updates and visualization
- Support for historical trend analysis

### Dependencies Added
- `ua-parser-js`: User agent string parsing
- `@types/ua-parser-js`: TypeScript definitions
- Enhanced Recharts usage for specialized charts

This implementation provides comprehensive user agent analytics comparable to Google Analytics, with detailed browser, OS, and device insights, trend analysis, and actionable business intelligence for understanding your website's audience technology preferences.

## 2025-01-10 - Enhanced Analytics Dashboard with Charts and Date Selection

### Added
- **Interactive Charts**: Added comprehensive chart visualizations using Recharts library
  - Area chart for page views over time with gradient fills
  - Horizontal bar chart for top pages performance
  - Pie chart for traffic sources distribution
  - Donut chart for device types breakdown
  - Line chart for engagement metrics trends
- **Enhanced Date Selection**: Added comprehensive date range selector with options:
  - Last Hour, Last 24 Hours, Last 7 Days, Last 30 Days, Last 90 Days, Last Year
- **Empty State Handling**: Added proper empty states for all charts when no data is available
- **Real Data Integration**: Fixed all charts to use only real database data instead of mock data

### Fixed
- **Removed Mock Data**: Eliminated all random/fake data generation from charts
- **Proper Loading States**: Added skeleton loading for better UX
- **Metric Cards**: Removed fake percentage changes, showing only real metrics
- **Translation Updates**: Added comprehensive translations for analytics features

### Enhanced
- **Chart Interactions**: Added tooltips, legends, and responsive containers
- **Visual Design**: Consistent color schemes and professional styling
- **Performance**: Optimized chart rendering and data processing
- **Accessibility**: Proper ARIA labels and keyboard navigation

The analytics dashboard now provides accurate, real-time insights with professional-grade visualizations and comprehensive user agent analysis capabilities.

## 2025-01-10 - Analytics System Phase 1 Implementation

### Database Schema Enhancement
- **Extended analytics_events table** with 20+ new columns for comprehensive tracking:
  - Event categorization (event_category, event_action, event_label)
  - Page metadata (page_title, page_load_time)
  - Device information (browser, os, device_type, screen_resolution)
  - Geographic data (region, timezone)
  - Engagement metrics (scroll_depth, time_on_page)
  - E-commerce tracking (revenue, currency, items)
  - Custom dimensions and metrics support
- **Enhanced analytics_sessions table** with engagement scoring
- **Real-time views** (analytics_realtime, analytics_active_sessions)
- **Materialized view** (analytics_hourly_stats) for performance
- **Database functions** for engagement scoring and automated triggers
- **Comprehensive indexes** for query performance optimization

### Analytics Library Rewrite
- **Complete rewrite** of `lib/analytics.ts` with Google Analytics 4-like capabilities
- **Enhanced event tracking** with categories, actions, labels, and custom dimensions
- **Scroll depth tracking** with milestone events (25%, 50%, 75%, 100%)
- **Time-on-page measurements** using Page Visibility API for accuracy
- **Advanced device detection** (browser, OS, screen resolution, connection type)
- **Geographic tracking** with timezone and region detection
- **Specialized tracking functions**:
  - `trackClick()` - Link and button interactions
  - `trackFormSubmit()` - Form completion tracking
  - `trackDownload()` - File download events
  - `trackVideoPlay()` - Media engagement
  - `trackSearch()` - Search query tracking
  - `trackPurchase()` - E-commerce transactions
  - `trackCustomEvent()` - Flexible custom events
- **Auto-tracking setup** for common user interactions
- **Enhanced session management** with 30-minute expiration
- **Reliable page unload tracking** using sendBeacon API
- **SPA route change detection** for Next.js navigation

### API Endpoints Enhancement
- **Updated event tracking API** (`app/api/analytics/events/route.ts`) to handle enhanced properties
- **Enhanced session API** (`app/api/analytics/sessions/route.ts`) for new session data
- **New real-time API** (`app/api/analytics/realtime/route.ts`) for live analytics
- **Comprehensive error handling** and validation
- **TypeScript type safety** throughout the API layer

### Component Updates
- **Enhanced AnalyticsInitializer** with new tracking capabilities
- **Auto-tracking setup** for common interactions
- **SPA navigation detection** for accurate page view tracking
- **Updated analytics services** with comprehensive data fetching

### Database Type Generation
- **Generated updated TypeScript types** from enhanced schema using Supabase CLI
- **Type-safe database operations** throughout the application

This implementation establishes a robust foundation for advanced analytics comparable to Google Analytics 4, with comprehensive event tracking, real-time capabilities, and extensive customization options.

## 2025-05-03
- **Feat:** Updated translations admin page namespace mappings:
  - Cleaned up namespace mappings in the translations admin page to only include existing namespaces
  - Updated `utils/i18n-helpers.ts` to only return namespaces that actually exist in the messages directory
  - Removed 26 non-existent namespaces (Billing, Campaigns, Calculators, etc.) from the namespace list
  - Simplified namespace mapping labels to use English names for better clarity
  - Removed path filter that was limiting available namespaces in the UI
  - All 16 actual namespaces are now properly mapped and available for editing

- **Feat:** Implemented namespace-based localization structure:
  - Created a script (`scripts/split-locales.js`) to split monolithic locale files into separate namespace files
  - Organized translations by feature/component under locale-specific folders (en/, fi/, sv/)
  - Added backup mechanism to preserve original locale files
  - Generated comprehensive localization report showing namespace coverage across all locales
  - Added npm script `split-locales` to package.json
  - Created detailed README.md in the messages directory documenting the new structure
  - Updated documentation in architecture.md, frontend.md, and .cursorrules
  - Added new `<localize>` action to .cursorrules with language-specific guidance for translations

## 2025-03-25
- Enhanced the Gemini AI tool with advanced capabilities:
  - Added document processing support for PDF, DOCX, and other file types
  - Implemented Google Search grounding feature for real-time information
  - Added structured JSON output functionality with predefined schemas
  - Fixed API compatibility with the latest @google/genai library (v0.7.0)
  - Updated documentation in .cursorrules with examples

## 2024-03-21
- Rescoped project from LastBot website to "AI-Powered Next.js Template for Cursor IDE"
- Updated project documentation:
  - Revised project description and core features
  - Restructured frontend documentation to focus on template features
  - Updated backend documentation to emphasize AI integration
  - Removed company-specific content and features
  - Added comprehensive AI service integration documentation

## 2023-07-27
- **Fix Build Errors:** Resolved `Dynamic server usage` errors during `npm run build` by adding `export const dynamic = 'force-dynamic';` to necessary page files (admin layout, privacy, root locale page, test, account pages, profile settings, most auth pages). Ignored build-time i18n database errors as requested. Build now completes successfully despite some remaining dynamic usage warnings.

## [Current Session]
- **Fix:** Resolved synchronous access errors for `searchParams` and `params` in multiple page components (`/admin/landing-pages`, `/blog`, `/[slug]`).
- **Fix:** Replaced insecure `getSession`/`onAuthStateChange` usage with `getUser()` in `AuthProvider` and `middleware` as per Supabase recommendations.
- **Fix:** Addressed authentication flow issues caused by the `getUser` refactor by refining middleware cookie handling.
- **Fix:** Removed extraneous Supabase auth debug logs by removing `DEBUG_AUTH` env variable.
- **Fix:** Resolved `supabase.from is not a function` error on public landing pages by using `createServerClient` with anon key.
- **Fix:** Addressed RLS permission errors on public landing pages (guided user to fix policy, code already correct).
- **Feat:** Added a 'Published' switch to the landing page admin form (`LandingPageForm.tsx`).
- **Fix:** Corrected the landing page editor (`[id]/page.tsx`) to use PATCH for updates and POST for creates.
- **Docs:** Updated the `Available Scripts` section in `README.md` to accurately reflect the command-line tools defined in `.cursorrules`.
- **Chore:** Added `NODE_ENV=production` prefix to production-related npm scripts in `package.json`.

*   Fixed landing page editor form showing empty fields due to missing API route for fetching single page by ID. Added `app/api/landing-pages/[id]/route.ts`.
*   Fixed Supabase RLS policy preventing anonymous users from viewing published landing pages. Refined RLS policies in migration `20250407180210`.
*   Fixed Next.js 15 warning by awaiting `params` in API route and `generateMetadata`.
*   Redesigned public landing page (`/[slug]`) styling using Tailwind CSS, added hero section with generated background, and improved typography.
*   Added dynamic CTA fields (`cta_headline`, `cta_description`, etc.) to `landing_pages` table (migration `20250407182326`).
*   Added "CTA" tab and fields to landing page editor.
*   Updated public landing page to display CTA content from the database.
*   Fixed missing translation keys for editor tabs/buttons.
*   Fixed Tiptap editor hydration error by setting `immediatelyRender: false`.
*   Removed unused preload link from `app/layout.tsx`.
*   Adjusted prose font sizes and colors for better readability on landing page.
*   Fixed i18n-ally translation detection issue by standardizing translation key paths in analytics components. Added missing translation keys for analytics fields (gaMeasurementId, gtmContainerId, fbPixelId, linkedinPixelId) to all language files.

## AI Changes Log

### 2025-06-04: Enhanced Video Generation Tool with Integrated Image Generation

- Enhanced the generate-video tool to support integrated image-to-video workflow
- Added `--image-prompt` parameter to generate an image with OpenAI GPT-image-1 before video creation
- Added support for image style and size parameters for generated images
- Improved URL handling for Replicate models that require image URLs
- Fixed compatibility issues between different model image input requirements
- Added warning for local image files which may not be supported by all models
- Added OpenAI dependency for image generation functionality

### 2025-06-03: Enhanced Video Generation Tool with Kling AI Models

- Updated the generate-video tool to support more Replicate video generation models
- Added support for Kling v1.6 standard and Kling v2.0 models
- Made Kling v1.6 the default model (previously minimax)
- Added support for aspect ratio selection (16:9, 9:16, 1:1) for supported models
- Enhanced image-to-video capabilities with proper parameter handling per model
- Added negative prompt and cfg_scale parameters for finer control
- Improved TypeScript typing with a ModelConfig interface
- Fixed module import issues for better compatibility

### 2025-04-20: Added OpenAI GPT-image-1 and DALL-E Image Generation Tool

- Created a new command-line tool for both image generation and editing using OpenAI's latest models
- Added support for GPT-image-1 and DALL-E 3 models
- Implemented advanced prompt optimization using GPT-4 Vision
- Added reference image support for GPT-image-1
- Configured various options for customization (size, style, quality)
- Updated package.json with necessary dependencies
- Added documentation in .cursorrules

### 2025-04-14: Enhanced GitHub CLI Tool with Task Management

- Installed inngest library for background task/event support.
- Added inngest client in lib/inngest-client.ts.
- Added sample background function in lib/inngest-functions.ts.
- Added API route handler in app/api/inngest/route.ts for Inngest event/function execution.

## 2025-06-05: Enhanced Homepage with AI-Generated Video Background

- Added the AI-generated video as a dynamic background on the homepage
- Implemented a fallback mechanism that shows a static image until the video loads
- Added graceful error handling to try multiple paths for video loading
- Improved loading experience with smooth opacity transitions
- Ensured the video is responsive across all device sizes
- Enhanced code with proper TypeScript typing and useRef for video control

## 2025-06-05: Fixed Homepage Hero Layout with Static Image

- Replaced video hero with static image solution due to persistent video loading issues
- Created separate StaticHero component for better maintainability
- Preserved the split-screen layout with text on left and visual element on right
- Optimized image loading with proper sizing attributes
- Added fallback gradient overlays for improved text readability
- Made the solution compatible with both local development and production deployment

