# BizExit Workflows

## Overview

This document describes the key business workflows and processes in the BizExit platform. Each workflow includes step-by-step procedures, automation triggers, user interactions, and integration points.

## Core Workflows

### 1. Company Onboarding Workflow

**Goal**: Transform raw company data into a sale-ready listing with professional materials.

#### Process Steps

**1.1 Company Creation** (Seller/Broker)
```
Input: Basic company information
Actions:
  1. Create company record (draft status)
  2. Assign to organization
  3. Set broker/owner
  4. Generate unique company ID
Output: Company profile (draft)
Automation: Email notification to broker
```

**1.2 Data Collection** (Seller with Broker assistance)
```
Required Data:
  - Basic Info: Name, industry, location, founded year
  - Financial: 3-5 years of financial statements
  - Operations: Employee count, key customers, contracts
  - Assets: IP, real estate, equipment
  - Legal: Corporate structure, pending litigation

Upload Methods:
  1. Manual form entry
  2. Document upload (PDF extraction via Gemini AI)
  3. YTJ/Business registry integration
  4. API import (accounting systems)

Automation:
  - OCR processing on uploaded documents
  - Data validation checks
  - Missing field notifications
  - Auto-save drafts
```

**1.3 Financial Analysis** (AI-Assisted)
```
Input: Financial statements (3-5 years)
Process:
  1. Extract data via Gemini AI PDF processing
  2. Calculate key metrics (EBITDA, margins, growth rates)
  3. Generate financial graphs
  4. Identify trends and anomalies
  5. Suggest asking price range

Automation:
  - Inngest job: process_financial_documents
  - Store in company_financials table
  - Flag inconsistencies for human review

Output: Financial summary + valuation suggestion
```

**1.4 Company Verification** (Broker)
```
Checklist:
  ☐ All required fields completed
  ☐ Financial data validated
  ☐ Documents uploaded and scanned
  ☐ Confidential info redacted
  ☐ Asking price reasonable
  ☐ Legal review completed (if required)

Actions:
  - Approve → Status: 'review'
  - Reject → Send back with notes

Automation:
  - Automated checklist validation
  - Email notifications on status change
```

**1.5 Status Transition**
```
draft → review → active → under_offer → sold → archived
        ↓
    (rejected) → draft
```

---

### 2. Material Generation Pipeline

**Goal**: Automatically generate professional sale materials using AI.

#### 2.1 Teaser Generation

**Input**: Company profile + financial summary
**Output**: 2-page executive summary PDF

```typescript
Process:
  1. Collect data from company + financials tables
  2. Apply teaser_prompt.md template
  3. Generate content (Gemini 2.0 Flash)
  4. Generate hero image (Imagen 3 or GPT-Image-1)
  5. Generate layout (React-PDF or Puppeteer)
  6. Human review & editing (TipTap editor)
  7. Approve & publish
  8. Store as company_asset (type: 'teaser')

Sections:
  - Executive Summary
  - Company Overview (1 paragraph)
  - Financial Highlights (key metrics)
  - Investment Opportunity
  - Next Steps (contact info)

Automation:
  - Inngest job: generate_teaser
  - Auto-populate template
  - Generate draft for review
  - Version control
```

**2.2 Information Memorandum (IM) Generation**

**Input**: Complete company data + financials + market research
**Output**: 20-50 page comprehensive document

```typescript
Process:
  1. Gather all company data
  2. Perform market research (web search via Tavily)
  3. Apply im_prompt.md template
  4. Generate each section independently
  5. Generate charts and visualizations
  6. Assemble full document
  7. Human review section by section
  8. Finalize and publish

Sections:
  1. Executive Summary (2 pages)
  2. Investment Highlights (1 page)
  3. Company Overview (3-5 pages)
     - History and milestones
     - Products/Services
     - Business model
  4. Market Analysis (5-7 pages)
     - Industry overview
     - Market size and growth
     - Competitive landscape
     - Market positioning
  5. Operations (5-7 pages)
     - Organizational structure
     - Key personnel
     - Facilities and equipment
     - Technology and IP
  6. Financial Performance (8-10 pages)
     - Historical financials (3-5 years)
     - Profitability analysis
     - Cash flow analysis
     - Balance sheet
     - Key financial ratios
  7. Growth Opportunities (2-3 pages)
  8. Transaction Structure (2-3 pages)
  9. Appendices
     - Detailed financials
     - Customer list (if non-confidential)
     - Contracts summary

Automation:
  - Inngest job: generate_im (long-running)
  - Parallel section generation
  - Progress tracking
  - Checkpoint saves
```

**2.3 Pitch Deck Generation**

**Input**: IM content (condensed)
**Output**: 10-15 slide presentation

```typescript
Slide Outline:
  1. Cover
  2. Executive Summary
  3. The Opportunity
  4. Company Overview
  5. Products/Services
  6. Market Overview
  7. Competitive Advantages
  8. Financial Highlights
  9. Growth Strategy
  10. Transaction Details
  11. Contact Information

Format: PowerPoint (PPTX) or PDF
Design: Professional template with brand colors
Automation: Semi-automated with human design review
```

**2.4 FAQ Document**

**Input**: Common questions database + company specifics
**Output**: Comprehensive FAQ document

```typescript
Categories:
  - Business Operations
  - Financial Questions
  - Legal & Compliance
  - Transaction Process
  - Due Diligence
  - Employees & Culture

Process:
  1. Generate standard questions
  2. AI generates answers based on company data
  3. Broker reviews and edits
  4. Publish versioned FAQ
  5. Update based on actual buyer questions
```

**2.5 Valuation Report**

**Input**: Financial data + market comparables
**Output**: Professional valuation analysis

```typescript
Methods:
  1. DCF (Discounted Cash Flow)
  2. Comparable Transactions
  3. Market Multiples (Revenue, EBITDA)
  4. Asset-Based Valuation

AI Assistance:
  - Find comparable companies
  - Calculate multiples
  - Suggest valuation range
  - Generate report text

Human Input:
  - Adjust assumptions
  - Select primary method
  - Final valuation figure
```

---

### 3. Listing Publication Workflow

**Goal**: Publish company listing to multiple portals simultaneously.

#### Process Steps

**3.1 Listing Preparation**
```
Preconditions:
  ☐ Company status: 'active'
  ☐ Teaser generated and approved
  ☐ IM completed (optional)
  ☐ Asking price set
  ☐ Materials access levels configured

Actions:
  1. Create listing record
  2. Link to teaser/IM
  3. Set visibility rules
  4. Configure portal settings
```

**3.2 Portal Selection**
```
Available Portals:
  - BizBuySell (US/International)
  - Transfindo (Europe)
  - Yritysporssi.fi (Finland)
  - Custom portals

Selection Criteria:
  - Target geography
  - Industry focus
  - Budget
  - Features needed

Configuration per Portal:
  - Pricing tier
  - Featured listing
  - Contact preferences
  - Auto-sync settings
```

**3.3 Listing Syndication**
```
Process:
  1. Select target portals
  2. Map BizExit fields → portal fields
  3. Generate portal-specific content
  4. Submit via portal adapter
  5. Receive external listing ID
  6. Create listing_portal record
  7. Monitor submission status

Automation:
  - Inngest job: sync_listing_to_portals
  - Retry failed submissions
  - Status polling
  - Error notifications

Portal Adapter Methods:
  - authenticate()
  - createListing(data)
  - updateListing(id, data)
  - deleteListing(id)
  - getListingStatus(id)
  - getMetrics(id)
```

**3.4 Lead Capture**
```
Sources:
  - Portal inquiries (via adapter)
  - Direct website contact
  - Email inquiries
  - Phone calls (manual entry)

Process:
  1. Capture lead data
  2. Create buyer_profile (if new)
  3. Link to listing
  4. Assign to broker
  5. Send NDA template
  6. Track engagement

Automation:
  - Inngest job: sync_portal_leads (hourly)
  - Auto-assign by rules
  - Immediate email response
  - CRM integration (future)
```

**3.5 Performance Tracking**
```
Metrics per Listing:
  - Views count
  - Click-through rate
  - Inquiries count
  - NDA requests
  - Time to first inquiry
  - Inquiry quality score

Metrics per Portal:
  - Best performing portal
  - Cost per lead
  - Lead quality by source
  - Conversion rates
```

---

### 4. Buyer Qualification & NDA Workflow

**Goal**: Qualify buyers and protect confidential information.

#### 4.1 Buyer Registration
```
Public Page: /buyers/register

Required Info:
  - Name
  - Email (verified)
  - Phone
  - Buyer type (individual/company/firm)
  - Investment profile
    - Industries of interest
    - Geographic preferences
    - Budget range
    - Investment horizon

Optional:
  - Company name
  - LinkedIn profile
  - References
  - Proof of funds

Automation:
  - Email verification
  - Basic qualification check
  - Auto-create buyer_profile
```

**4.2 Initial Qualification**
```
Automatic Checks:
  ☐ Email verified
  ☐ Profile complete (>80%)
  ☐ Budget aligns with target companies
  ☐ No spam indicators

Manual Review (Broker):
  ☐ Serious buyer assessment
  ☐ Financial capacity verification
  ☐ Background check (optional)
  ☐ Reference check (optional)

Actions:
  - Approve → Full access
  - Request more info → Send email
  - Reject → Block access
```

**4.3 NDA Request & Generation**
```
Trigger: Buyer clicks "Request NDA" on listing

Process:
  1. Check if NDA already exists
     - Yes: Send existing NDA
     - No: Generate new NDA
  
  2. NDA Generation:
     - Select template based on jurisdiction
     - Populate buyer info
     - Populate company info (minimal, per teaser)
     - Generate PDF
     - Store as company_asset
  
  3. Create nda record (status: 'draft')
  
  4. Send NDA:
     - Email with e-signature link
     - Or manual download + upload signed copy
  
  5. Update nda status: 'sent'
  
Automation:
  - Inngest job: generate_and_send_nda
  - Template population
  - Email sending
  - Tracking pixel (for 'viewed' status)
```

**4.4 E-Signature Integration**
```
Provider Options:
  1. DocuSign
  2. HelloSign
  3. Manual (upload signed PDF)

DocuSign Flow:
  1. Create envelope via API
  2. Add NDA document
  3. Add signer (buyer)
  4. Set signature fields
  5. Send envelope
  6. Receive webhook on signature
  7. Update nda status: 'signed'
  8. Upgrade buyer access level
  9. Send IM automatically

Manual Flow:
  1. Buyer downloads NDA
  2. Signs physically
  3. Uploads signed copy
  4. Broker verifies signature
  5. Broker marks as 'signed'
  6. Buyer access upgraded
```

**4.5 Access Level Upgrade**
```
Access Levels:
  1. Public: Can see listing title, industry, location
  2. Teaser: Can download teaser after registration
  3. NDA Signed: Can access IM and basic financials
  4. Due Diligence: Can access full DD documents
  5. Under Offer: Can access deal room

Automatic Upgrade Triggers:
  - NDA signed → Level 3
  - Broker approval → Level 4
  - Offer submitted → Level 5

Document Access Control:
  - company_assets.access_level field
  - RLS policies check buyer's NDA status
  - S3 presigned URLs with expiration
```

---

### 5. Deal Progression Workflow

**Goal**: Manage the entire deal pipeline from lead to close.

#### 5.1 Deal Creation
```
Trigger: 
  - Manual by broker
  - Automatic on serious buyer engagement

Required Data:
  - Company
  - Buyer (can be anonymous initially)
  - Expected deal value
  - Fee structure (fixed + success %)

Actions:
  1. Create deal record (status: 'active')
  2. Set initial stage: 'sourcing' or 'nda_negotiation'
  3. Assign broker
  4. Create deal_stages record
  5. Notify stakeholders
```

**5.2 Stage Transitions**

**Sourcing → NDA Negotiation**
```
Triggers:
  - Buyer shows serious interest
  - Broker manually advances

Actions:
  - Generate and send NDA
  - Track negotiation progress
  - Set deadline
```

**NDA Negotiation → Initial Review**
```
Triggers:
  - NDA signed

Actions:
  - Grant IM access
  - Send welcome email to buyer
  - Schedule intro call (optional)
  - Track document views
```

**Initial Review → Due Diligence**
```
Triggers:
  - Buyer requests full DD access
  - Broker approves

Actions:
  - Create DD checklist
  - Grant access to DD documents
  - Set up virtual data room
  - Assign partners (legal, financial)
  - Track DD progress
```

**Due Diligence → Negotiation**
```
Triggers:
  - DD completed satisfactorily
  - Buyer submits Letter of Intent (LOI)

Actions:
  - Review LOI
  - Counter-offer (if needed)
  - Negotiate terms
  - Track negotiation rounds
```

**Negotiation → Term Sheet**
```
Triggers:
  - Agreement on key terms

Actions:
  - Generate term sheet
  - Both parties sign
  - Prepare final contracts
```

**Term Sheet → Signing**
```
Triggers:
  - Final contracts prepared

Actions:
  - Legal review
  - E-signature process
  - Track signatures
  - Manage conditions precedent
```

**Signing → Closed Won**
```
Triggers:
  - All signatures collected
  - Conditions met
  - Payment received

Actions:
  - Mark deal as 'closed_won'
  - Update company status: 'sold'
  - Archive listing
  - Calculate and collect success fee
  - Send closing notifications
  - Generate reports
```

**Any Stage → Closed Lost**
```
Triggers:
  - Buyer withdraws
  - Deal falls through
  - Terms cannot be agreed

Actions:
  - Mark deal as 'closed_lost'
  - Record reason
  - Close all related activities
  - Notify stakeholders
  - Archive deal (keep for analytics)
```

#### 5.3 Stage Automation

**Auto-Notifications**
```typescript
Stage Entry:
  - Email to broker
  - Email to buyer (if appropriate)
  - Slack notification (optional)
  
Stage Duration Alerts:
  - Warning if stage taking too long
  - Escalation to manager
  
Stage Exit:
  - Summary report
  - Next steps email
```

**Auto-Tasks**
```typescript
Stage-Specific Tasks:
  - NDA Negotiation: "Send NDA template"
  - Due Diligence: "Prepare DD checklist"
  - Negotiation: "Review LOI"
  - Signing: "Prepare final contracts"
  
Task Automation:
  - Create tasks on stage entry
  - Assign to role
  - Set due dates
  - Send reminders
```

#### 5.4 Deal Activity Timeline
```
All actions logged in deal_activities:
  - Stage changes
  - Document uploads
  - Notes added
  - Emails sent
  - Meetings scheduled
  - Payments made
  - Milestones achieved

Display:
  - Chronological timeline
  - Filter by type
  - Search functionality
  - Export capability
```

---

### 6. Payment Processing Workflow

**Goal**: Collect fixed fees and success fees efficiently.

#### 6.1 Fixed Fee Collection

**Trigger**: Company onboarding or listing activation

```typescript
Process:
  1. Deal created → Calculate fixed fee
  2. Generate invoice (Stripe Invoice API)
  3. Send payment link to seller
  4. Seller pays via Stripe Checkout
  5. Webhook received: payment.succeeded
  6. Update payment record: status = 'succeeded'
  7. Unlock materials generation
  8. Send receipt
  
Stripe Setup:
  - Create Product: "BizExit Onboarding Fee"
  - Create Price: Amount varies by package
  - Generate Payment Link
  - Track via payment_intent_id

Automation:
  - Inngest function: handle_stripe_webhook
  - Auto-retry failed payments
  - Dunning emails (reminders)
```

**6.2 Success Fee Collection**

**Trigger**: Deal status changes to 'closed_won'

```typescript
Process:
  1. Deal closed → Calculate success fee
     Formula: (deal_value * success_fee_percentage)
     Apply: minimum and maximum limits
  
  2. Generate success fee invoice
  3. Apply milestones (if configured)
     - 50% on signing
     - 50% on completion
  
  4. Send invoice to seller
  5. Track payment
  6. Webhook: payment received
  7. Update deal with payment info
  8. Distribute commissions (if partners involved)
  9. Send final receipt

Milestones:
  - signing: 50% of success fee
  - completion: 50% of success fee
  - custom: configurable per deal

Stripe Setup:
  - Dynamic pricing per deal
  - Installment payments (via Invoices)
  - Auto-charge on file (optional)
```

**6.3 Commission Distribution**

```typescript
Stakeholders:
  - BizExit Platform: Base commission
  - Broker: Percentage of success fee
  - Partners: Fixed or percentage fees
  - Referrers: Referral fees (future)

Process:
  1. Success fee received
  2. Calculate splits per agreement
  3. Create payment records for each party
  4. Stripe Connect payouts (future)
  5. Generate commission reports
  6. Tax documentation (1099, etc.)
```

**6.4 Refund Handling**

```typescript
Scenarios:
  - Deal falls through within grace period
  - Service not delivered as promised
  - Dispute resolution

Process:
  1. Refund request submitted
  2. Broker/admin reviews
  3. Approve or deny
  4. If approved:
     - Initiate Stripe refund
     - Update payment record: 'refunded'
     - Adjust commission splits
     - Send confirmation
```

---

### 7. Portal Synchronization Workflow

**Goal**: Keep listings synchronized across multiple portals.

#### 7.1 Initial Sync (Push)
```
Trigger: Listing published

Process:
  1. For each selected portal:
     a. Map BizExit listing → portal format
     b. Call portal adapter: createListing()
     c. Receive external_id
     d. Create listing_portal record
     e. Update status based on response
  
  2. Handle errors:
     - Retry with exponential backoff
     - Log error details
     - Notify broker
     - Mark portal as 'error'

Automation:
  - Inngest job: sync_listing_to_portal (per portal)
  - Parallel execution
  - Idempotency via external_id check
```

#### 7.2 Continuous Sync (Bidirectional)
```
Outbound (BizExit → Portal):
  Triggers:
    - Listing updated (price, description, status)
    - Automatic sync (daily)
  
  Process:
    - Call adapter: updateListing(external_id, changes)
    - Update listing_portal.last_sync_at
    - Log sync result

Inbound (Portal → BizExit):
  Triggers:
    - Scheduled job (hourly)
    - Webhook (if supported)
  
  Process:
    - Call adapter: getLeads()
    - For each new lead:
      - Create buyer_profile (if new)
      - Link to listing
      - Notify broker
    - Update listing_portal metrics
    - Update last_sync_at
```

#### 7.3 Lead Synchronization
```
Portal Lead Capture:
  1. Portal receives inquiry
  2. BizExit polls portal API (hourly)
     OR portal sends webhook
  3. Extract lead data:
     - Name
     - Email
     - Phone
     - Message
     - Source portal
  4. Match or create buyer_profile
  5. Create deal_activity: 'lead_received'
  6. Assign to broker
  7. Send auto-response to buyer
  8. Notify broker

Deduplication:
  - Check email against existing buyers
  - Merge if same person on multiple portals
  - Track lead source for attribution
```

#### 7.4 Metrics Synchronization
```
Portal Metrics to Track:
  - Views (impressions)
  - Clicks
  - Inquiries
  - Favorites/Saves

Sync Process:
  1. Scheduled job: every 4 hours
  2. Call adapter: getMetrics(external_id)
  3. Update listing_portals:
     - views_count
     - leads_count
     - metadata (detailed stats)
  4. Aggregate across all portals
  5. Update listing summary metrics

Analytics:
  - Compare portal performance
  - Calculate cost per lead
  - ROI per portal
  - Optimize portal selection
```

#### 7.5 Error Handling & Recovery
```
Error Types:
  1. Authentication failure
     - Re-authenticate
     - Update stored credentials
  
  2. Rate limiting
     - Backoff and retry
     - Queue requests
  
  3. Listing rejected
     - Parse rejection reason
     - Notify broker
     - Fix and resubmit
  
  4. Portal maintenance
     - Detect maintenance mode
     - Pause sync
     - Resume automatically

Monitoring:
  - Track sync success rate
  - Alert on repeated failures
  - Dashboard for portal health
```

---

## Role-Based Permissions Matrix

| Action | Admin | Broker | Seller | Buyer | Partner | Analyst |
|--------|-------|--------|--------|-------|---------|---------|
| **Companies** |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Own | ✅ | ✅ | ✅ | NDA | ❌ | ✅ |
| View All | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Edit Own | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit All | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ✅ | Owner | ❌ | ❌ | ❌ |
| **Materials** |
| Generate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit | ✅ | ✅ | Review | ❌ | ❌ | ❌ |
| Approve | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Download | ✅ | ✅ | ✅ | NDA | Role | ✅ |
| **Listings** |
| Create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Public | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Deals** |
| Create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Own | ✅ | ✅ | ✅ | ✅ | Role | ✅ |
| View All | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Advance Stage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Close | ✅ | ✅ | Approve | ❌ | ❌ | ❌ |
| **Payments** |
| View Own | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| View All | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Process | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Refund | ✅ | ✅ | Request | ❌ | ❌ | ❌ |
| **NDAs** |
| Generate | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sign | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Verify | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Analytics** |
| View Basic | ✅ | ✅ | Own | ❌ | ❌ | ✅ |
| View Advanced | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Export | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ = Full access
- ❌ = No access
- Own = Only their own records
- Owner = Only if they own the record
- NDA = Only if NDA signed
- Role = Only for deals they're assigned to
- Review = Can view and comment, not edit
- Request = Can request, admin approves
- Approve = Can approve but not initiate

---

## Background Jobs (Inngest)

### Job Schedule

| Job Name | Trigger | Frequency | Purpose |
|----------|---------|-----------|---------|
| `sync-portal-leads` | Cron | Hourly | Pull new leads from portals |
| `sync-portal-metrics` | Cron | 4 hours | Update listing metrics |
| `sync-listings-to-portals` | Cron | Daily | Push listing updates |
| `check-nda-expirations` | Cron | Daily | Warn about expiring NDAs |
| `send-stage-reminders` | Cron | Daily | Remind about stale deals |
| `process-financial-documents` | Event | On upload | Extract financial data |
| `generate-teaser` | Event | On request | Generate teaser material |
| `generate-im` | Event | On request | Generate IM (long-running) |
| `generate-and-send-nda` | Event | On request | NDA workflow |
| `handle-stripe-webhook` | Webhook | Real-time | Process payments |
| `calculate-embeddings` | Event | On content change | Update vector embeddings |
| `send-email-notifications` | Event | Various | Email dispatch |

### Job Error Handling
```typescript
Retry Strategy:
  - Max attempts: 3
  - Backoff: exponential (1m, 5m, 30m)
  - Alert on final failure

Monitoring:
  - Job success rate dashboard
  - Failed job queue
  - Alert on anomalies (high failure rate)
```

---

## Integration Patterns

### REST API Integration
```typescript
// Example: BizBuySell Adapter
class BizBuySellAdapter implements PortalAdapter {
  async authenticate(): Promise<AuthToken> {
    // OAuth2 or API key
  }
  
  async createListing(listing: Listing): Promise<string> {
    // Map to portal format
    // POST to portal API
    // Return external_id
  }
  
  async getLeads(): Promise<Lead[]> {
    // GET leads from portal
    // Map to BizExit format
  }
}
```

### Webhook Integration
```typescript
// Example: Stripe Webhooks
POST /api/webhooks/stripe
{
  type: 'payment_intent.succeeded',
  data: { ... }
}

Handler:
  1. Verify signature
  2. Parse event type
  3. Update payment record
  4. Trigger follow-up actions
  5. Return 200 OK
```

---

## Workflow Metrics & KPIs

### Company Onboarding
- Time from creation to active status
- Data completion rate
- Documents uploaded per company
- Verification pass rate

### Material Generation
- Generation time per material type
- Human edit ratio (AI vs human edits)
- Approval rate (first attempt)
- Quality score (manual review)

### Listing Performance
- Time to first inquiry
- Inquiry-to-NDA conversion rate
- NDA-to-offer conversion rate
- Best performing portals

### Deal Pipeline
- Average time per stage
- Stage conversion rates
- Drop-off points
- Close rate by deal value
- Average deal size

### Financial
- Fixed fee collection rate
- Success fee collection time
- Average success fee amount
- Commission distribution accuracy

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0

