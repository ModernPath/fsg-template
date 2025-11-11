# BizExit Integrations

## Overview

BizExit integrates with multiple external services to provide comprehensive M&A platform functionality. This document details all integration points, API specifications, configuration requirements, and implementation patterns.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       BizExit Platform                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   API Layer  │  │   Database   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │    Integration Layer (Adapters)    │             │
│         └──────────────────┬──────────────────┘             │
└────────────────────────────┼──────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼──────┐      ┌──────▼─────┐      ┌──────▼──────┐
   │  Portals  │      │   AI/ML    │      │  Payments   │
   └───────────┘      └────────────┘      └─────────────┘
```

## Portal Integrations

### Portal Adapter Interface

All portal integrations implement a common interface:

```typescript
interface PortalAdapter {
  // Metadata
  name: string;
  code: string;
  version: string;
  
  // Authentication
  authenticate(config: PortalConfig): Promise<AuthResult>;
  refreshAuth(): Promise<AuthResult>;
  
  // Listing Management
  createListing(listing: ListingData): Promise<CreateResult>;
  updateListing(externalId: string, updates: Partial<ListingData>): Promise<UpdateResult>;
  deleteListing(externalId: string): Promise<DeleteResult>;
  getListing(externalId: string): Promise<ListingDetail>;
  getListingStatus(externalId: string): Promise<ListingStatus>;
  
  // Lead Management
  getLeads(since?: Date): Promise<Lead[]>;
  getLead(leadId: string): Promise<LeadDetail>;
  respondToLead(leadId: string, message: string): Promise<ResponseResult>;
  
  // Metrics & Analytics
  getMetrics(externalId: string): Promise<ListingMetrics>;
  getPortalStats(): Promise<PortalStats>;
  
  // Utility
  validateConfig(config: PortalConfig): Promise<ValidationResult>;
  testConnection(): Promise<boolean>;
  getRequiredFields(): FieldDefinition[];
  mapFields(bizexitData: ListingData): PortalListingData;
}

interface ListingData {
  title: string;
  description: string;
  industry: string;
  location: {
    country: string;
    region?: string;
    city?: string;
  };
  asking_price?: number;
  currency: string;
  revenue?: number;
  ebitda?: number;
  employees?: number;
  founded_year?: number;
  assets?: string[];
  tags?: string[];
  contact_email?: string;
  metadata?: Record<string, any>;
}

interface Lead {
  id: string;
  created_at: Date;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

interface ListingMetrics {
  views: number;
  clicks: number;
  inquiries: number;
  favorites: number;
  last_updated: Date;
}
```

---

### 1. BizBuySell Integration

**Overview**: Leading US-based business-for-sale marketplace.

#### Configuration
```typescript
interface BizBuySellConfig {
  api_key: string;
  api_secret: string;
  account_id: string;
  environment: 'sandbox' | 'production';
}
```

#### Authentication
```typescript
// OAuth 2.0 Client Credentials Flow
POST https://api.bizbuysell.com/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "{api_key}",
  "client_secret": "{api_secret}"
}

Response:
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### Endpoints
```typescript
Base URL: https://api.bizbuysell.com/v1

// Listings
POST /listings                    // Create
GET /listings/:id                 // Read
PATCH /listings/:id               // Update
DELETE /listings/:id              // Delete
GET /listings/:id/analytics       // Metrics

// Leads
GET /listings/:id/leads           // Get leads
GET /leads/:id                    // Lead detail
POST /leads/:id/respond           // Respond to lead

// Account
GET /account                      // Account info
GET /account/credits              // Remaining credits
```

#### Field Mapping
```typescript
const fieldMapping = {
  'title': 'listing_title',
  'description': 'listing_description',
  'industry': 'business_category',
  'asking_price': 'asking_price',
  'revenue': 'annual_revenue',
  'ebitda': 'cash_flow',
  'location.country': 'country',
  'location.city': 'city',
  'location.region': 'state',
  'employees': 'number_of_employees',
  'founded_year': 'year_established'
};
```

#### Implementation
```typescript
export class BizBuySellAdapter implements PortalAdapter {
  name = 'BizBuySell';
  code = 'bizbuysell';
  version = '1.0.0';
  
  private accessToken?: string;
  private tokenExpiry?: Date;
  
  constructor(private config: BizBuySellConfig) {}
  
  async authenticate(): Promise<AuthResult> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.config.api_key,
        client_secret: this.config.api_secret
      })
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    
    return { success: true, token: data.access_token };
  }
  
  async createListing(listing: ListingData): Promise<CreateResult> {
    await this.ensureAuth();
    
    const portalData = this.mapFields(listing);
    
    const response = await fetch(`${this.baseUrl}/listings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(portalData)
    });
    
    if (!response.ok) {
      throw new Error(`BizBuySell API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      external_id: data.listing_id,
      external_url: data.listing_url
    };
  }
  
  async getLeads(since?: Date): Promise<Lead[]> {
    // Implementation
  }
  
  mapFields(data: ListingData): any {
    // Use fieldMapping to transform
  }
  
  private async ensureAuth(): Promise<void> {
    if (!this.accessToken || new Date() >= this.tokenExpiry!) {
      await this.authenticate();
    }
  }
  
  private get baseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.bizbuysell.com/v1'
      : 'https://sandbox-api.bizbuysell.com/v1';
  }
}
```

#### Rate Limits
- 100 requests per minute
- 10,000 requests per day
- Burst: 20 requests per second

#### Pricing
- Basic: $99/month (10 listings)
- Professional: $299/month (50 listings)
- Enterprise: Custom pricing

#### Webhooks
```typescript
POST {your_webhook_url}
Content-Type: application/json
X-BizBuySell-Signature: {hmac_signature}

{
  "event": "lead.created",
  "listing_id": "12345",
  "lead": {
    "id": "67890",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

---

### 2. Transfindo Integration

**Overview**: European B2B marketplace focused on SME acquisitions.

#### Configuration
```typescript
interface TransfindoConfig {
  api_key: string;
  user_id: string;
  company_id: string;
  webhook_secret?: string;
}
```

#### Authentication
```typescript
// API Key Authentication
GET https://api.transfindo.com/v2/listings
X-API-Key: {api_key}
X-User-ID: {user_id}
```

#### Endpoints
```typescript
Base URL: https://api.transfindo.com/v2

// Listings
POST /companies                    // Create listing
GET /companies/:id                 // Read
PUT /companies/:id                 // Update
DELETE /companies/:id              // Delete (soft delete)

// Inquiries (Leads)
GET /companies/:id/inquiries       // Get inquiries
POST /inquiries/:id/reply          // Reply to inquiry

// Documents
POST /companies/:id/documents      // Upload document
GET /documents/:id                 // Download document

// Analytics
GET /companies/:id/analytics       // Get metrics
```

#### Field Mapping
```typescript
const fieldMapping = {
  'title': 'company_name',
  'description': 'company_description',
  'industry': 'sector',
  'asking_price': 'price',
  'revenue': 'turnover',
  'ebitda': 'ebitda',
  'location.country': 'country_code',
  'location.city': 'city',
  'employees': 'employees',
  'founded_year': 'founded'
};
```

#### Special Features
- Multi-language support (EN, DE, FR, ES, IT)
- Document vault (encrypted storage)
- Built-in NDA workflow
- Buyer verification system

#### Implementation
```typescript
export class TransfindoAdapter implements PortalAdapter {
  name = 'Transfindo';
  code = 'transfindo';
  version = '1.0.0';
  
  constructor(private config: TransfindoConfig) {}
  
  async authenticate(): Promise<AuthResult> {
    // API key is used directly, validate it
    const response = await fetch(`${this.baseUrl}/auth/validate`, {
      headers: {
        'X-API-Key': this.config.api_key,
        'X-User-ID': this.config.user_id
      }
    });
    
    return { success: response.ok };
  }
  
  async createListing(listing: ListingData): Promise<CreateResult> {
    const portalData = this.mapFields(listing);
    
    const response = await fetch(`${this.baseUrl}/companies`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.api_key,
        'X-User-ID': this.config.user_id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(portalData)
    });
    
    const data = await response.json();
    return {
      success: true,
      external_id: data.company_id,
      external_url: `https://transfindo.com/companies/${data.company_id}`
    };
  }
  
  private get baseUrl(): string {
    return 'https://api.transfindo.com/v2';
  }
}
```

#### Rate Limits
- 60 requests per minute
- No daily limit

#### Pricing
- Pay-per-listing: €299 per listing (6 months)
- Subscription: €899/month (unlimited listings)

---

### 3. Yritysporssi.fi Integration

**Overview**: Finnish business-for-sale marketplace.

#### Configuration
```typescript
interface YritysporssiConfig {
  username: string;
  password: string;
  customer_id: string;
}
```

#### Authentication
```typescript
// Basic Authentication + Session
POST https://api.yritysporssi.fi/auth/login
Content-Type: application/json

{
  "username": "{username}",
  "password": "{password}",
  "customer_id": "{customer_id}"
}

Response:
{
  "session_token": "...",
  "expires_at": "2025-11-12T10:00:00Z"
}
```

#### Endpoints
```typescript
Base URL: https://api.yritysporssi.fi/v1

// Ilmoitukset (Listings)
POST /ilmoitukset                  // Luo ilmoitus
GET /ilmoitukset/:id               // Hae ilmoitus
PUT /ilmoitukset/:id               // Päivitä
DELETE /ilmoitukset/:id            // Poista

// Yhteydenotot (Leads)
GET /ilmoitukset/:id/yhteydenotot  // Hae yhteydenotot
GET /yhteydenotot/:id              // Yhteydenoton tiedot

// Tilastot
GET /ilmoitukset/:id/tilastot      // Näyttömäärät ym.
```

#### Field Mapping
```typescript
const fieldMapping = {
  'title': 'otsikko',
  'description': 'kuvaus',
  'industry': 'toimiala',
  'asking_price': 'hinta',
  'revenue': 'liikevaihto',
  'ebitda': 'kayttokate',
  'location.city': 'paikkakunta',
  'employees': 'henkilosto',
  'founded_year': 'perustettu'
};
```

#### Special Features
- YTJ integration (automatic company data lookup)
- Finnish business ID (Y-tunnus) validation
- Support for Finnish and Swedish languages
- Integrated payment gateway for listing fees

#### Implementation
```typescript
export class YritysporssiAdapter implements PortalAdapter {
  name = 'Yritysporssi.fi';
  code = 'yritysporssi';
  version = '1.0.0';
  
  private sessionToken?: string;
  private tokenExpiry?: Date;
  
  constructor(private config: YritysporssiConfig) {}
  
  async authenticate(): Promise<AuthResult> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
        customer_id: this.config.customer_id
      })
    });
    
    const data = await response.json();
    this.sessionToken = data.session_token;
    this.tokenExpiry = new Date(data.expires_at);
    
    return { success: true, token: data.session_token };
  }
  
  async createListing(listing: ListingData): Promise<CreateResult> {
    await this.ensureAuth();
    
    const portalData = this.mapFields(listing);
    
    const response = await fetch(`${this.baseUrl}/ilmoitukset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(portalData)
    });
    
    const data = await response.json();
    return {
      success: true,
      external_id: data.ilmoitus_id,
      external_url: `https://yritysporssi.fi/ilmoitukset/${data.ilmoitus_id}`
    };
  }
  
  private get baseUrl(): string {
    return 'https://api.yritysporssi.fi/v1';
  }
}
```

#### Rate Limits
- 30 requests per minute
- 1,000 requests per day

#### Pricing
- Per listing: €199 (3 months), €299 (6 months)
- Pro account: €599/month (unlimited, priority placement)

---

### 4. Mock Portal Adapter (Development)

```typescript
export class MockPortalAdapter implements PortalAdapter {
  name = 'Mock Portal';
  code = 'mock';
  version = '1.0.0';
  
  private listings: Map<string, any> = new Map();
  private leads: Lead[] = [];
  
  async authenticate(): Promise<AuthResult> {
    // Always succeeds
    return { success: true, token: 'mock-token' };
  }
  
  async createListing(listing: ListingData): Promise<CreateResult> {
    const id = `mock-${Date.now()}`;
    this.listings.set(id, { ...listing, created_at: new Date() });
    
    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      external_id: id,
      external_url: `https://mock-portal.example.com/listings/${id}`
    };
  }
  
  async getLeads(since?: Date): Promise<Lead[]> {
    // Generate mock leads
    if (this.leads.length === 0) {
      this.leads = this.generateMockLeads(5);
    }
    
    return since
      ? this.leads.filter(l => l.created_at > since)
      : this.leads;
  }
  
  async getMetrics(externalId: string): Promise<ListingMetrics> {
    return {
      views: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 100),
      inquiries: Math.floor(Math.random() * 10),
      favorites: Math.floor(Math.random() * 50),
      last_updated: new Date()
    };
  }
  
  private generateMockLeads(count: number): Lead[] {
    // Generate realistic mock data
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-lead-${i}`,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      name: `Buyer ${i + 1}`,
      email: `buyer${i + 1}@example.com`,
      phone: `+358 40 ${Math.floor(Math.random() * 10000000)}`,
      company: `Company ${i + 1}`,
      message: `I'm interested in learning more about this opportunity.`,
      source: 'mock',
      metadata: {}
    }));
  }
}
```

---

## Payment Integration (Stripe)

### Configuration
```typescript
interface StripeConfig {
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
  api_version: string;
}
```

### Setup
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
```

### Payment Flows

#### 1. Fixed Fee (One-time)
```typescript
// Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 50000, // $500.00
  currency: 'eur',
  metadata: {
    deal_id: 'deal_123',
    payment_type: 'fixed_fee'
  }
});

// Frontend: Confirm payment
const {error} = await stripe.confirmCardPayment(
  paymentIntent.client_secret,
  {payment_method: 'pm_xxx'}
);
```

#### 2. Success Fee (Invoice)
```typescript
// Create Invoice
const invoice = await stripe.invoices.create({
  customer: 'cus_xxx',
  collection_method: 'send_invoice',
  days_until_due: 30,
  metadata: {
    deal_id: 'deal_123',
    payment_type: 'success_fee'
  }
});

// Add line items
await stripe.invoiceItems.create({
  customer: 'cus_xxx',
  invoice: invoice.id,
  amount: 5000000, // €50,000
  currency: 'eur',
  description: 'Success Fee - Company XYZ Acquisition'
});

// Finalize and send
await stripe.invoices.finalizeInvoice(invoice.id);
await stripe.invoices.sendInvoice(invoice.id);
```

#### 3. Installment Payments
```typescript
// Create multiple invoices with scheduled send dates
const milestones = [
  { date: '2025-12-01', amount: 25000, description: 'Signing milestone' },
  { date: '2026-01-15', amount: 25000, description: 'Completion milestone' }
];

for (const milestone of milestones) {
  const invoice = await stripe.invoices.create({
    customer: 'cus_xxx',
    collection_method: 'send_invoice',
    days_until_due: 15,
    metadata: {
      deal_id: 'deal_123',
      milestone: milestone.description
    }
  });
  
  await stripe.invoiceItems.create({
    customer: 'cus_xxx',
    invoice: invoice.id,
    amount: milestone.amount * 100,
    currency: 'eur',
    description: milestone.description
  });
  
  // Schedule send
  await stripe.invoices.schedule({
    invoice: invoice.id,
    scheduled_date: new Date(milestone.date).getTime() / 1000
  });
}
```

### Webhook Handling
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const dealId = paymentIntent.metadata.deal_id;
  
  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      paid_at: new Date().toISOString(),
      stripe_charge_id: paymentIntent.latest_charge
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
  
  // Trigger follow-up actions (Inngest)
  await inngest.send({
    name: 'payment/succeeded',
    data: { deal_id: dealId, payment_intent_id: paymentIntent.id }
  });
  
  // Send receipt email
  await sendReceiptEmail(dealId);
}
```

---

## AI/ML Integrations

### 1. Google Gemini

**Use Cases**: Document extraction, content generation, analysis

```typescript
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY!);

// PDF Document Extraction
async function extractFinancialData(pdfBuffer: Buffer) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBuffer.toString('base64')
      }
    },
    {
      text: `Extract financial data from this document and return as JSON:
      {
        "fiscal_year": number,
        "revenue": number,
        "ebitda": number,
        "net_income": number,
        "total_assets": number,
        "total_liabilities": number
      }`
    }
  ]);
  
  return JSON.parse(result.response.text());
}

// Teaser Generation
async function generateTeaser(companyData: CompanyData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = await loadPromptTemplate('teaser_prompt.md');
  const populatedPrompt = populateTemplate(prompt, companyData);
  
  const result = await model.generateContent(populatedPrompt);
  return result.response.text();
}
```

### 2. OpenAI

**Use Cases**: Embeddings, advanced content generation, image generation

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate Embeddings for RAG
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });
  
  return response.data[0].embedding;
}

// Image Generation for Materials
async function generateCompanyImage(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: prompt,
    size: '1024x1024',
    quality: 'hd'
  });
  
  return response.data[0].url!;
}

// Advanced Content Generation
async function generateExecutiveSummary(companyData: CompanyData) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'You are a professional M&A advisor.' },
      { role: 'user', content: `Generate an executive summary for: ${JSON.stringify(companyData)}` }
    ]
  });
  
  return completion.choices[0].message.content;
}
```

### 3. Anthropic Claude

**Use Cases**: Long-form content, analysis, due diligence review

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Generate Information Memorandum
async function generateIM(companyData: CompanyData) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `Generate a comprehensive Information Memorandum for: ${JSON.stringify(companyData)}`
    }]
  });
  
  return message.content[0].text;
}
```

---

## E-Signature Integration (Future)

### DocuSign
```typescript
// Placeholder for future implementation
interface DocuSignConfig {
  integration_key: string;
  user_id: string;
  account_id: string;
  private_key: string;
}

async function sendNDAForSignature(nda: NDA, buyer: BuyerProfile) {
  // Create envelope
  // Add document
  // Add signer
  // Send
  // Listen for webhook
}
```

### HelloSign (Dropbox Sign)
```typescript
// Placeholder for future implementation
```

---

## Business Registry Integrations

### YTJ (Finnish Business Information System)
```typescript
async function fetchCompanyFromYTJ(businessId: string) {
  const response = await fetch(
    `https://avoindata.prh.fi/bis/v1/${businessId}`,
    { headers: { 'Accept': 'application/json' } }
  );
  
  const data = await response.json();
  
  return {
    name: data.name,
    legal_name: data.registeredOffice,
    business_id: data.businessId,
    founded_year: new Date(data.registrationDate).getFullYear(),
    industry: data.businessLines[0]?.name,
    address: data.addresses[0]
  };
}
```

---

## Email Integration

### SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendNDAEmail(to: string, ndaUrl: string) {
  await sgMail.send({
    to,
    from: 'noreply@bizexit.fi',
    templateId: 'd-xxxxxxxxxxxx',
    dynamicTemplateData: {
      nda_url: ndaUrl,
      company_name: 'Example Corp'
    }
  });
}
```

### Resend
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendDealNotification(deal: Deal) {
  await resend.emails.send({
    from: 'BizExit <notifications@bizexit.fi>',
    to: deal.broker_email,
    subject: `Deal Update: ${deal.name}`,
    react: DealNotificationEmail({ deal })
  });
}
```

---

## Monitoring & Observability

### Sentry (Error Tracking)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1
});

// Capture integration errors
try {
  await portalAdapter.createListing(listing);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      integration: 'portal',
      portal_code: 'bizbuysell'
    },
    extra: {
      listing_id: listing.id
    }
  });
  throw error;
}
```

### OpenTelemetry (Tracing)
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('bizexit-portal-sync');

async function syncListing(listing: Listing) {
  const span = tracer.startSpan('sync_listing');
  
  try {
    await portalAdapter.createListing(listing);
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

---

## Integration Testing

### Mock Server (MSW)
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('https://api.bizbuysell.com/oauth/token', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock-token',
        token_type: 'Bearer',
        expires_in: 3600
      })
    );
  }),
  
  rest.post('https://api.bizbuysell.com/v1/listings', (req, res, ctx) => {
    return res(
      ctx.json({
        listing_id: 'mock-123',
        listing_url: 'https://bizbuysell.com/listings/mock-123'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Integration Test Example
```typescript
describe('BizBuySellAdapter', () => {
  let adapter: BizBuySellAdapter;
  
  beforeEach(() => {
    adapter = new BizBuySellAdapter({
      api_key: 'test-key',
      api_secret: 'test-secret',
      account_id: 'test-account',
      environment: 'sandbox'
    });
  });
  
  it('should create listing successfully', async () => {
    const result = await adapter.createListing({
      title: 'Test Company',
      description: 'A test company',
      industry: 'Technology',
      location: { country: 'US', city: 'San Francisco' },
      asking_price: 1000000,
      currency: 'USD'
    });
    
    expect(result.success).toBe(true);
    expect(result.external_id).toBeDefined();
  });
});
```

---

## Configuration Management

### Environment Variables
```bash
# .env.example

# Portal Integrations
BIZBUYSELL_API_KEY=
BIZBUYSELL_API_SECRET=
BIZBUYSELL_ACCOUNT_ID=
BIZBUYSELL_ENV=sandbox

TRANSFINDO_API_KEY=
TRANSFINDO_USER_ID=
TRANSFINDO_COMPANY_ID=

YRITYSPORSSI_USERNAME=
YRITYSPORSSI_PASSWORD=
YRITYSPORSSI_CUSTOMER_ID=

# AI Services
GOOGLE_AI_STUDIO_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Payments
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
SENDGRID_API_KEY=
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Adapter Registry
```typescript
// lib/adapters/registry.ts
import { PortalAdapter } from './types';
import { BizBuySellAdapter } from './bizbuysell';
import { TransfindoAdapter } from './transfindo';
import { YritysporssiAdapter } from './yritysporssi';
import { MockPortalAdapter } from './mock';

export const PORTAL_ADAPTERS: Record<string, typeof PortalAdapter> = {
  bizbuysell: BizBuySellAdapter,
  transfindo: TransfindoAdapter,
  yritysporssi: YritysporssiAdapter,
  mock: MockPortalAdapter
};

export function createAdapter(code: string, config: any): PortalAdapter {
  const AdapterClass = PORTAL_ADAPTERS[code];
  if (!AdapterClass) {
    throw new Error(`Unknown portal adapter: ${code}`);
  }
  return new AdapterClass(config);
}
```

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0

