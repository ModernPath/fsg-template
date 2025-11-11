# BizExit - AI-Powered M&A Platform

## Overview
BizExit is a comprehensive M&A (Mergers & Acquisitions) platform designed to automate and streamline the entire business sale process. Built with Next.js 15, React 19, TypeScript, and powered by advanced AI capabilities, BizExit serves sellers, brokers, buyers, and partners through intelligent automation, AI-powered content generation, and seamless integrations with major business sale portals.

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
- Direct communication channels
- Due diligence document management

## Development Tools

### AI Tools
- Gemini API Integration
  - Text generation and chat
  - Image analysis
  - Structured output
  - Safety settings

- Image Generation
  - Recraft V3 for digital illustrations
  - Flux for photorealistic images
  - Style transfer capabilities
  - Background removal

- Research Tools
  - Tavily API for web search
  - Context-aware research
  - Content enhancement
  - Structured data extraction

### Media Tools
- Image Optimization
  - Format conversion (PNG, JPEG, WebP)
  - Automatic resizing
  - Quality adjustment
  - Background removal
  - OG Images (1200x630 WebP)
    - Home page: /images/og/home.webp
    - Blog default: /images/og/blog-default.webp
    - Presentations: /images/og/presentations.webp

- Content Processing
  - HTML to Markdown conversion
  - File downloading utilities
  - Sitemap generation
  - Content scraping

### Development Utilities
- TypeScript configuration
- Environment management
- Testing helpers
- Development workflow tools

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
- Automated notifications

### 4. Buyer Management & NDA Workflow
- Buyer profile creation and qualification
- NDA template management
- E-signature integration
- Tiered information access
- Lead tracking and scoring

### 5. Listing & Portal Integration
- Multi-portal syndication (BizBuySell, Transfindo, Yritysporssi.fi)
- Lead capture and sync
- Performance metrics per portal
- Automated status updates

### 6. Payment & Billing
- Fixed fee collection (setup/onboarding)
- Success fee calculation and tracking
- Milestone-based payments
- Stripe integration
- Invoice generation

### 7. Document Management
- Secure document storage
- Virus scanning
- Version control
- Access control by NDA status
- OCR and text extraction
- Full-text search

### 8. Multi-Tenant Architecture
- Organization-scoped data isolation
- Role-based access control (RBAC)
- Multiple user roles (Admin, Broker, Seller, Buyer, Partner, Analyst)

## Technical Features
- Modern, responsive UI with Tailwind CSS
- Dark/light mode support
- Type-safe development
- Performance optimization
- Comprehensive testing (Jest/Cypress)
- Database with Row Level Security
- API route protection
- Real-time subscriptions
