# Materials Generation System - Deployment Guide

## 📋 Overview

This guide covers the complete deployment and configuration of the Materials Generation System, including database setup, API configuration, and testing procedures.

## 🗄️ Database Setup

### 1. Run Migrations

```bash
# Option A: Using Supabase CLI (if linked to project)
supabase migration up

# Option B: Using db push
supabase db push

# Option C: Manually apply migration
# Copy the SQL from: supabase/migrations/20250114120000_create_materials_generation_system.sql
# Run it in Supabase SQL Editor
```

### 2. Verify Tables Created

Check that the following tables exist:

- ✅ `material_generation_jobs`
- ✅ `generation_data_cache`
- ✅ `material_questionnaire_responses`
- ✅ `extracted_financial_data`
- ✅ `material_content_versions`
- ✅ `material_access_log`

```sql
-- Quick verification query
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'material%';
```

### 3. Create Storage Bucket

```bash
# Create 'documents' bucket if it doesn't exist
supabase storage create documents
```

Or via Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `documents`
3. Set as Public (or configure RLS policies)

## 🔑 Environment Variables

Add the following to your `.env.local`:

```bash
# Required - Google AI (Gemini)
GOOGLE_AI_STUDIO_KEY=your_gemini_api_key_here

# Optional - Tavily (Public Data Search)
TAVILY_API_KEY=your_tavily_api_key_here

# Optional - Gamma.app (Presentation Generation)
GAMMA_API_KEY=your_gamma_api_key_here

# Optional - Email Notifications (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Company Name

# Required - Site URL for email links
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Getting API Keys

#### Google AI Studio (Required)
1. Go to https://aistudio.google.com/
2. Create new API key
3. Copy to `GOOGLE_AI_STUDIO_KEY`

#### Tavily (Optional but Recommended)
1. Go to https://tavily.com/
2. Sign up for API access
3. Copy API key to `TAVILY_API_KEY`

#### Gamma.app (Optional - for presentations)
1. Go to https://gamma.app/
2. Request API access
3. Copy API key to `GAMMA_API_KEY`

#### SendGrid (Optional - for emails)
1. Go to https://sendgrid.com/
2. Create account and verify sender email
3. Create API key (Settings → API Keys)
4. Copy to `SENDGRID_API_KEY`
5. Set `EMAIL_FROM` to your verified sender email

## 🚀 Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migrations

```bash
# If using Supabase locally
supabase db reset  # WARNING: This resets all data!

# Or apply migration only
supabase migration up
```

### 3. Start Development Server

```bash
npm run dev
```

This starts:
- Next.js dev server (port 3000)
- Inngest dev server (background jobs)

### 4. Verify Inngest Functions

Visit: http://localhost:3000/api/inngest

You should see:
- ✅ 13 Materials Generation functions
- ✅ 4 Notification functions

## 🧪 Testing

### Manual Testing Checklist

#### 1. Start Generation Flow

1. Navigate to `/dashboard/materials`
2. Click "Generate New Materials"
3. Select a company
4. Select material types (Teaser, IM, Pitch Deck)
5. Click "Start Generation"

**Expected Result**: 
- ✅ Job created
- ✅ Redirected to progress view
- ✅ Status shows "Collecting Data"

#### 2. Public Data Collection

Wait 5-10 seconds, then verify:

```sql
-- Check if data was collected
SELECT * FROM generation_data_cache 
WHERE job_id = 'YOUR_JOB_ID';
```

**Expected Result**:
- ✅ At least 1 row with `data_source = 'ytj'` or `'tavily'`

#### 3. Document Upload (if IM/Pitch Deck selected)

1. UI should show "Upload Documents"
2. Select PDF/Excel files
3. Click "Upload Files"

**Expected Result**:
- ✅ Files uploaded to Supabase Storage
- ✅ Records in `company_assets` table
- ✅ Processing starts (check `extracted_financial_data` table)

#### 4. Questionnaire

1. UI should show questionnaire
2. Answer required questions
3. Submit

**Expected Result**:
- ✅ Answers saved to `material_questionnaire_responses`
- ✅ Job status changes to "consolidating"

#### 5. Material Generation

Wait for generation to complete (check job status API).

**Expected Result**:
- ✅ Job status = "completed"
- ✅ Asset IDs populated (`teaser_asset_id`, `im_asset_id`, `pitch_deck_asset_id`)
- ✅ Records in `company_assets` table

### API Testing

#### Test Initiate Endpoint

```bash
curl -X POST http://localhost:3000/api/bizexit/materials/generate/initiate \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "company_id": "YOUR_COMPANY_ID",
    "generate_teaser": true,
    "generate_im": false,
    "generate_pitch_deck": false
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "job": {
    "id": "job-uuid",
    "status": "initiated",
    "progress": 0,
    ...
  }
}
```

#### Test Status Endpoint

```bash
curl http://localhost:3000/api/bizexit/materials/generate/JOB_ID/status \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected Response**:
```json
{
  "job": {
    "id": "job-uuid",
    "status": "collecting_data",
    "progress": 10,
    "current_step": "Collecting public data...",
    ...
  }
}
```

#### Test Questionnaire Endpoints

```bash
# GET - Fetch questions
curl http://localhost:3000/api/bizexit/materials/generate/JOB_ID/questionnaire \
  -H "Cookie: YOUR_SESSION_COOKIE"

# POST - Submit answers
curl -X POST http://localhost:3000/api/bizexit/materials/generate/JOB_ID/questionnaire \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "answers": {
      "question-id-1": "Answer text here",
      "question-id-2": "Another answer"
    }
  }'
```

#### Test Upload Endpoint

```bash
curl -X POST http://localhost:3000/api/bizexit/materials/generate/JOB_ID/upload \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -F "files=@/path/to/document.pdf" \
  -F "files=@/path/to/spreadsheet.xlsx"
```

### Database Verification Queries

```sql
-- Check job status
SELECT 
  id,
  status,
  progress_percentage,
  current_step,
  created_at
FROM material_generation_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Check collected public data
SELECT 
  job_id,
  data_source,
  data_type,
  collected_at
FROM generation_data_cache
WHERE job_id = 'YOUR_JOB_ID';

-- Check questionnaire responses
SELECT 
  question_text,
  answer_text,
  is_required,
  answered_at
FROM material_questionnaire_responses
WHERE job_id = 'YOUR_JOB_ID'
ORDER BY display_order;

-- Check extracted financial data
SELECT 
  document_id,
  extraction_method,
  confidence_score,
  extracted_data
FROM extracted_financial_data
WHERE job_id = 'YOUR_JOB_ID';

-- Check generated assets
SELECT 
  ca.name,
  ca.type,
  ca.created_at,
  ca.gamma_presentation_url
FROM company_assets ca
JOIN material_generation_jobs mgj ON (
  mgj.teaser_asset_id = ca.id OR
  mgj.im_asset_id = ca.id OR
  mgj.pitch_deck_asset_id = ca.id
)
WHERE mgj.id = 'YOUR_JOB_ID';
```

## 🔧 Troubleshooting

### Issue: Jobs stuck in "initiated"

**Cause**: Inngest not running or events not triggering

**Solution**:
```bash
# Check Inngest dashboard
# Visit: http://localhost:3000/api/inngest

# Verify functions are registered
# Should see 17 total functions (13 generation + 4 notifications)

# Manually trigger if needed via Inngest dashboard
```

### Issue: "Organization not found" error

**Cause**: User not linked to organization via `user_organizations` table

**Solution**:
```sql
-- Check user's organizations
SELECT * FROM user_organizations WHERE user_id = 'USER_ID';

-- If missing, add:
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES ('USER_ID', 'ORG_ID', 'admin');
```

### Issue: Document extraction fails

**Cause**: Missing Gemini API key or invalid file format

**Solution**:
1. Verify `GOOGLE_AI_STUDIO_KEY` is set
2. Check file format (PDF, Excel, CSV, Images only)
3. Check file size (Gemini has limits)
4. View logs: Check Inngest dashboard for error details

### Issue: Email notifications not sent

**Cause**: Missing SendGrid API key or unverified sender

**Solution**:
1. Add `SENDGRID_API_KEY` to `.env.local`
2. Verify sender email in SendGrid dashboard
   - Go to Settings → Sender Authentication
   - Complete Single Sender Verification for `EMAIL_FROM`
3. Check Inngest logs for email sending errors
4. Verify API key has "Mail Send" permissions

### Issue: Gamma presentations not created

**Cause**: Missing Gamma API key (currently not available to public)

**Solution**:
1. System will work without Gamma - materials are still generated as text/data
2. When Gamma API key is available, add to `.env.local`
3. Re-run generation or manually create presentations from generated content

## 📊 Monitoring

### Check Job Progress

```sql
-- Active jobs
SELECT 
  id,
  status,
  progress_percentage,
  current_step,
  estimated_completion_at
FROM material_generation_jobs
WHERE status NOT IN ('completed', 'failed', 'cancelled')
ORDER BY created_at DESC;

-- Completion rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM material_generation_jobs
GROUP BY status;
```

### Performance Metrics

```sql
-- Average generation time
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) as avg_minutes
FROM material_generation_jobs
WHERE status = 'completed'
  AND completed_at IS NOT NULL;

-- Success rate by material type
SELECT 
  CASE 
    WHEN generate_teaser THEN 'Teaser'
    WHEN generate_im THEN 'IM'
    WHEN generate_pitch_deck THEN 'Pitch Deck'
  END as material_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM material_generation_jobs
GROUP BY material_type;
```

## 🔐 Security Considerations

### RLS Policies

Ensure these RLS policies are in place:

```sql
-- Jobs: Users can only see their organization's jobs
CREATE POLICY "Users can view own organization jobs"
ON material_generation_jobs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Assets: Users can only see their organization's assets
CREATE POLICY "Users can view own organization assets"
ON company_assets FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);
```

### API Rate Limiting

Consider adding rate limiting for:
- Generation initiation (1 per company per hour)
- Document uploads (10 per hour per user)
- Questionnaire submissions (prevent spam)

## 📝 Production Checklist

Before going to production:

- [ ] Run migrations on production database
- [ ] Set all environment variables
- [ ] Test generation flow end-to-end
- [ ] Configure RLS policies
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure email domain in Resend
- [ ] Test email notifications
- [ ] Set up Inngest production environment
- [ ] Review Supabase Storage limits
- [ ] Set up backup strategy
- [ ] Configure CORS for Gamma.app (when available)
- [ ] Test with real financial documents
- [ ] Load test with multiple concurrent jobs
- [ ] Document user workflows
- [ ] Train support team on system

## 🎯 Next Steps

After successful deployment:

1. **Monitor First Jobs**: Watch first production jobs closely
2. **Collect Feedback**: Gather user feedback on generated materials
3. **Improve AI Prompts**: Refine prompts based on output quality
4. **Add Analytics**: Track usage and completion rates
5. **Optimize Performance**: Identify bottlenecks
6. **Expand Material Types**: Add new template types
7. **Integrate Gamma**: When API becomes available
8. **Add Versioning**: Allow material regeneration with improvements

## 🆘 Support

For issues or questions:
1. Check Inngest dashboard for job status
2. Review Supabase logs for errors
3. Check this documentation
4. Contact development team

---

**Last Updated**: January 14, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for Deployment

