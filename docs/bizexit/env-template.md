# BizExit Environment Variables

This document describes all required environment variables for the BizExit platform.

## Setup Instructions

1. Copy this template to `.env.local` in project root
2. Fill in all required values
3. Never commit `.env.local` to version control
4. For production, use Vercel environment variables

## Environment Variables

```bash
# ============================================================================
# CORE APPLICATION
# ============================================================================

# Application URL (for redirects, emails, etc.)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development # development | production | test

# ============================================================================
# SUPABASE (Database, Auth, Storage)
# ============================================================================

# Project URL and keys from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key (server-side only, NEVER expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database connection string (for migrations)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# ============================================================================
# AUTHENTICATION
# ============================================================================

# JWT secret for session management
JWT_SECRET=your-random-secret-here-min-32-chars

# Session cookie domain
NEXT_PUBLIC_SESSION_COOKIE_DOMAIN=localhost

# ============================================================================
# AI SERVICES
# ============================================================================

# Google Gemini (Document extraction, content generation)
GOOGLE_AI_STUDIO_KEY=your-gemini-api-key
GEMINI_API_KEY=your-gemini-api-key # Alternative key name

# OpenAI (Embeddings, GPT-Image-1, advanced content)
OPENAI_API_KEY=sk-your-openai-key

# Anthropic Claude (Long-form content, analysis)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Replicate (Alternative image generation)
REPLICATE_API_KEY=your-replicate-key

# ============================================================================
# PAYMENT PROCESSING (Stripe)
# ============================================================================

# Stripe publishable key (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key

# Stripe secret key (server-side only)
STRIPE_SECRET_KEY=sk_test_your-key

# Stripe webhook secret for signature verification
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe API version
STRIPE_API_VERSION=2023-10-16

# ============================================================================
# PORTAL INTEGRATIONS
# ============================================================================

# BizBuySell
BIZBUYSELL_API_KEY=your-api-key
BIZBUYSELL_API_SECRET=your-api-secret
BIZBUYSELL_ACCOUNT_ID=your-account-id
BIZBUYSELL_ENV=sandbox # sandbox | production

# Transfindo
TRANSFINDO_API_KEY=your-api-key
TRANSFINDO_USER_ID=your-user-id
TRANSFINDO_COMPANY_ID=your-company-id
TRANSFINDO_WEBHOOK_SECRET=your-webhook-secret

# Yritysporssi.fi
YRITYSPORSSI_USERNAME=your-username
YRITYSPORSSI_PASSWORD=your-password
YRITYSPORSSI_CUSTOMER_ID=your-customer-id

# ============================================================================
# EMAIL SERVICES
# ============================================================================

# SendGrid (Primary email service)
SENDGRID_API_KEY=SG.your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@bizexit.fi
SENDGRID_FROM_NAME=BizExit

# Resend (Alternative email service)
RESEND_API_KEY=re_your-resend-key

# Email templates (SendGrid dynamic template IDs)
SENDGRID_TEMPLATE_NDA_REQUEST=d-xxx
SENDGRID_TEMPLATE_NDA_SIGNED=d-xxx
SENDGRID_TEMPLATE_DEAL_UPDATE=d-xxx
SENDGRID_TEMPLATE_PAYMENT_RECEIPT=d-xxx
SENDGRID_TEMPLATE_LEAD_NOTIFICATION=d-xxx

# ============================================================================
# E-SIGNATURE (Future)
# ============================================================================

# DocuSign
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_PRIVATE_KEY=your-private-key
DOCUSIGN_BASE_URL=https://demo.docusign.net # or account-d.docusign.com

# HelloSign / Dropbox Sign
HELLOSIGN_API_KEY=your-api-key
HELLOSIGN_CLIENT_ID=your-client-id

# ============================================================================
# BACKGROUND JOBS (Inngest)
# ============================================================================

# Inngest event key
INNGEST_EVENT_KEY=your-inngest-event-key

# Inngest signing key (for webhook verification)
INNGEST_SIGNING_KEY=your-signing-key

# Inngest environment
INNGEST_ENV=development # development | production

# ============================================================================
# FILE STORAGE
# ============================================================================

# Supabase Storage bucket names
NEXT_PUBLIC_STORAGE_BUCKET_DOCUMENTS=bizexit-documents
NEXT_PUBLIC_STORAGE_BUCKET_IMAGES=bizexit-images
NEXT_PUBLIC_STORAGE_BUCKET_VIDEOS=bizexit-videos

# Maximum file sizes (in bytes)
MAX_FILE_SIZE_DOCUMENT=52428800 # 50MB
MAX_FILE_SIZE_IMAGE=10485760 # 10MB
MAX_FILE_SIZE_VIDEO=524288000 # 500MB

# ============================================================================
# BUSINESS REGISTRIES
# ============================================================================

# YTJ (Finnish Business Information System) - Public API, no key needed
YTJ_API_BASE_URL=https://avoindata.prh.fi/bis/v1

# ============================================================================
# SECURITY
# ============================================================================

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# CORS allowed origins (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://bizexit.fi

# Rate limiting (requests per minute)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# ============================================================================
# MONITORING & OBSERVABILITY
# ============================================================================

# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=bizexit
SENTRY_ENVIRONMENT=development

# OpenTelemetry (Tracing)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=bizexit-web

# ============================================================================
# ANALYTICS
# ============================================================================

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# Google Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Enable/disable features
FEATURE_FLAG_PORTAL_SYNC=true
FEATURE_FLAG_AI_GENERATION=true
FEATURE_FLAG_E_SIGNATURE=false
FEATURE_FLAG_VIDEO_GENERATION=false

# ============================================================================
# DEVELOPMENT TOOLS
# ============================================================================

# Tavily API (Web search for research)
TAVILY_API_KEY=tvly-your-key

# Recraft API (Image generation)
RECRAFT_API_KEY=your-recraft-key

# ============================================================================
# LOCALIZATION
# ============================================================================

# Default locale
NEXT_PUBLIC_DEFAULT_LOCALE=fi

# Supported locales (comma-separated)
NEXT_PUBLIC_SUPPORTED_LOCALES=fi,en,sv

# ============================================================================
# CACHING
# ============================================================================

# Redis/Upstash (Optional, for caching)
REDIS_URL=redis://localhost:6379
REDIS_TOKEN=your-redis-token

# Cache TTL (in seconds)
CACHE_TTL_DEFAULT=3600
CACHE_TTL_PORTAL_DATA=1800
CACHE_TTL_COMPANY_DATA=300

# ============================================================================
# WEBHOOKS
# ============================================================================

# Webhook signing secrets
WEBHOOK_SECRET_PORTAL=your-portal-webhook-secret
WEBHOOK_SECRET_PAYMENT=your-payment-webhook-secret

# ============================================================================
# TESTING
# ============================================================================

# Test database URL
TEST_DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres_test

# Test Stripe key
TEST_STRIPE_SECRET_KEY=sk_test_your-test-key

# ============================================================================
# PRODUCTION ONLY
# ============================================================================

# Vercel (set automatically in Vercel environment)
VERCEL_URL=
VERCEL_ENV=

# ============================================================================
# OPTIONAL SERVICES
# ============================================================================

# Slack notifications (for alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# SMS notifications (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

```

## Environment-Specific Configuration

### Development (`.env.local`)
- Use sandbox/test API keys
- Set `NODE_ENV=development`
- Use local Supabase instance
- Enable all feature flags for testing

### Staging (Vercel)
- Use test API keys
- Set `NODE_ENV=production`
- Use Supabase dev project
- Enable feature flags selectively

### Production (Vercel)
- Use production API keys
- Set `NODE_ENV=production`
- Use Supabase prod project
- Enable only stable features

## Security Best Practices

1. **Never commit** `.env.local` or `.env.production` to version control
2. **Rotate secrets** regularly (every 90 days minimum)
3. **Use service role key** only on server-side code
4. **Validate webhook signatures** for all incoming webhooks
5. **Use HTTPS** in production for all external API calls
6. **Limit API key permissions** to minimum required scope
7. **Monitor API usage** to detect anomalies
8. **Use Vercel environment variables** for production (encrypted at rest)

## Vercel Environment Variable Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add SENDGRID_API_KEY production

# Pull environment variables locally
vercel env pull .env.local
```

## Required vs Optional Variables

### Absolutely Required (App won't start without these)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### Required for Core Features
- `GOOGLE_AI_STUDIO_KEY` (AI generation)
- `STRIPE_SECRET_KEY` (payments)
- `SENDGRID_API_KEY` (emails)
- `INNGEST_EVENT_KEY` (background jobs)

### Optional (Enhance functionality)
- `OPENAI_API_KEY` (alternative AI)
- `ANTHROPIC_API_KEY` (advanced content)
- `DOCUSIGN_INTEGRATION_KEY` (e-signatures)
- Portal API keys (for syndication)
- `SENTRY_DSN` (error tracking)

## Troubleshooting

### "Invalid Supabase URL"
- Check that URL starts with `https://` and ends with `.supabase.co`
- Verify project is not paused in Supabase dashboard

### "Authentication Error"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check key hasn't been revoked in Supabase dashboard

### "Stripe Webhook Signature Invalid"
- Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Verify webhook endpoint is configured correctly

### "AI API Rate Limit"
- Check API usage in respective dashboards
- Consider implementing request queuing
- Upgrade API tier if needed

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0

