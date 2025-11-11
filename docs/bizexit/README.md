# BizExit Platform

## Overview

BizExit is a comprehensive M&A (Mergers & Acquisitions) platform designed to automate and streamline the entire business sale process. The platform serves sellers, brokers, buyers, and partners through intelligent automation, AI-powered content generation, and seamless integrations with major business sale portals.

## Value Proposition

### For Sellers
- Automated creation of professional sale materials (Teasers, Information Memorandums, Pitch Decks)
- Managed sales process with qualified buyer access
- Secure document sharing with NDA management
- Transparent deal pipeline tracking
- Success fee model aligns our success with yours

### For Brokers
- AI-powered material generation reduces time from weeks to hours
- Multi-portal syndication from single platform
- Automated buyer qualification and NDA management
- Deal pipeline management with stage automation
- Commission tracking and payment automation

### For Buyers
- Access to curated business opportunities
- Structured information with consistent format
- Secure NDA signing with immediate access
- Direct communication channels with sellers/brokers
- Due diligence document management

### For Partners (Legal, Financial)
- Role-based access to relevant documents
- Collaboration tools for due diligence
- Audit trail for compliance
- Secure document sharing

## Core Features

### 1. Company Management
- Comprehensive company profile creation
- Financial data import and analysis
- Asset management (documents, images, videos)
- Public data integration (YTJ, business registries)
- RAG-based company intelligence

### 2. AI-Powered Material Generation
- **Teaser Generation**: 2-page executive summary
- **Information Memorandum (IM)**: 20-50 page detailed document
- **Pitch Deck**: Investor-ready presentation
- **Valuation Reports**: AI-assisted company valuation
- **FAQ Documents**: Common questions and answers
- **Due Diligence Lists**: Comprehensive DD checklists

### 3. Deal Pipeline Management
- Visual kanban-style deal board
- Stage-based workflow automation
- Activity timeline and audit trail
- Milestone tracking
- Automated notifications and reminders

### 4. Buyer Management & NDA Workflow
- Buyer profile creation and qualification
- NDA template management
- E-signature integration
- Tiered information access (public → teaser → IM → DD)
- Lead tracking and scoring

### 5. Listing & Portal Integration
- Multi-portal syndication
  - BizBuySell (US)
  - Transfindo (Europe)
  - Yritysporssi.fi (Finland)
  - Custom portal adapters
- Lead capture and sync
- Performance metrics per portal
- Automated status updates

### 6. Payment & Billing
- Fixed fee collection (setup/onboarding)
- Success fee calculation and tracking
- Milestone-based payments
- Stripe integration
- Invoice generation
- Commission tracking for brokers/partners

### 7. Document Management
- Secure document storage (Supabase Storage)
- Virus scanning (ClamAV)
- Version control
- Access control by NDA status
- OCR and text extraction (Gemini AI)
- Thumbnail generation
- Full-text search

### 8. Analytics & Reporting
- Deal pipeline metrics
- Portal performance analysis
- Buyer engagement tracking
- Material conversion rates
- Revenue and commission reporting
- Custom reports and exports

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth + Row Level Security (RLS)
- **Storage**: Supabase Storage (S3-compatible)
- **Background Jobs**: Inngest
- **AI/ML**: Google Gemini + OpenAI + Anthropic
- **Payments**: Stripe
- **Email**: SendGrid / Resend
- **Monitoring**: Sentry + OpenTelemetry
- **Testing**: Vitest + Playwright + Cypress
- **i18n**: next-intl (Finnish, English, Swedish)
- **Deployment**: Vercel

### Key Architectural Patterns

#### Multi-Tenant Architecture
- Organization-scoped data isolation
- Row Level Security (RLS) policies per organization
- Shared infrastructure with tenant isolation
- Role-based access control (RBAC) within organizations

#### AI Processing Pipeline
```
Document Upload → Virus Scan → OCR → Text Extraction → 
Chunking → Embedding → Vector Storage (pgvector) → 
RAG Query → Content Generation → Human Review → Publish
```

#### Deal Workflow Automation
```
Company Created → Materials Generated → Listing Published → 
Lead Captured → NDA Signed → IM Shared → Due Diligence → 
Negotiation → Term Sheet → Closing → Success Fee
```

## Data Model

See [datamodel.md](./datamodel.md) for complete schema documentation.

### Core Entities
- **Organizations**: Multi-tenant container
- **Users & Profiles**: User accounts with roles
- **Companies**: Businesses being sold
- **Financial Metrics**: Company financial data
- **Assets**: Documents, images, videos
- **Listings**: Sale listings on portals
- **Deals**: Sales pipeline instances
- **Buyers**: Buyer profiles and preferences
- **NDAs**: Non-disclosure agreements
- **Payments**: Transactions and invoices
- **Audit Logs**: Complete activity trail

## User Roles & Permissions

### Role Hierarchy
1. **Admin**: System administrator, full access
2. **Analyst**: Read-only access to analytics and reports
3. **Broker**: Can manage companies, deals, and materials
4. **Seller**: Can manage their own companies
5. **Buyer**: Can view listings and express interest
6. **Partner**: Limited access to specific deals/documents

### Permission Matrix
See [workflows.md](./workflows.md) for detailed permission mappings.

## Workflows

See [workflows.md](./workflows.md) for detailed process flows.

### Key Workflows
1. **Company Onboarding**
2. **Material Generation Pipeline**
3. **Listing Publication**
4. **Buyer Qualification & NDA**
5. **Deal Progression**
6. **Payment Processing**
7. **Portal Synchronization**

## Integration Ecosystem

See [integrations.md](./integrations.md) for detailed integration documentation.

### Portal Integrations
- BizBuySell
- Transfindo
- Yritysporssi.fi
- Custom adapters

### External Services
- YTJ (Finnish Business Registry)
- Stripe (Payments)
- SendGrid/Resend (Email)
- DocuSign/HelloSign (E-signatures)
- Google Gemini (AI)
- OpenAI (AI)

## Security & Compliance

### Data Security
- Field-level encryption for sensitive data
- TLS/HTTPS for all communications
- Secure token storage
- Regular security audits
- Penetration testing

### Compliance
- GDPR compliant
- Audit logging for all actions
- Data retention policies
- Right to erasure
- Data export capabilities

### Access Control
- Row Level Security (RLS)
- Multi-factor authentication (MFA)
- IP whitelisting (optional)
- Session management
- Rate limiting

## Development

### Local Development Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Start development server
npm run dev
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npm run cypress

# Test coverage
npm run test:coverage
```

### Database Migrations
```bash
# Create new migration
npm run supabase:migration:new -- migration_name

# Apply migrations
npm run supabase:db:push

# Reset database (WARNING: deletes data)
npm run supabase:db:reset
```

## Deployment

### Environments
- **Development**: Local Supabase + Mock integrations
- **Staging**: Supabase dev + Stripe test mode
- **Production**: Supabase prod + Live integrations

### Deployment Checklist
See [deployment.md](./deployment.md) for complete deployment guide.

## Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- Core database schema
- Authentication & multi-tenancy
- Company management
- Document storage

### Phase 2: Core Features (Weeks 3-4) ⏳
- AI material generation
- Basic deal pipeline
- Buyer onboarding
- Mock portal adapter

### Phase 3: Integration (Weeks 5-6) 📋
- Stripe integration
- NDA workflow
- Email automation
- Real portal adapter

### Phase 4: Polish & Launch (Weeks 7-8) 📋
- UI/UX refinement
- E2E testing
- Documentation
- Production deployment

### Future Enhancements
- Video generation for company profiles
- Advanced analytics dashboard
- Mobile app (React Native)
- White-label solution for brokers
- API for third-party integrations
- Marketplace for additional services

## Support & Contact

- **Documentation**: https://docs.bizexit.fi
- **Support Email**: support@bizexit.fi
- **Developer Slack**: #bizexit-dev
- **Issue Tracker**: GitHub Issues

## License

Proprietary - All rights reserved
© 2025 BizExit Oy

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
**Authors**: BizExit Development Team

