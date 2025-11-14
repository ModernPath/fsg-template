# Materials Generation - Quick Start Guide ⚡

Get the Materials Generation System up and running in **5 minutes**.

---

## 🚀 5-Minute Setup

### Step 1: Run Migration (1 min)

```bash
cd /Users/dimbba/DEVELOPMENT/timo_dev/fsg-template
supabase db push
```

**Expected output**:
```
Applying migration 20250114120000_create_materials_generation_system.sql...
✅ Migration applied successfully
```

---

### Step 2: Add Environment Variables (2 min)

Open `.env.local` and add:

```bash
# REQUIRED
GOOGLE_AI_STUDIO_KEY=your_key_here

# OPTIONAL (but recommended)
TAVILY_API_KEY=your_key_here
SENDGRID_API_KEY=your_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Company Name
```

**Get Google AI Key**:
1. Visit: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy and paste above

---

### Step 3: Create Storage Bucket (30 sec)

```bash
# Via CLI
supabase storage create documents --public

# OR via Dashboard:
# 1. Go to Supabase Dashboard → Storage
# 2. Create bucket: "documents"
# 3. Set as Public
```

---

### Step 4: Start Server (30 sec)

```bash
npm run dev
```

Wait for:
```
✓ Ready in 3.5s
✓ Local: http://localhost:3000
✓ Inngest: http://localhost:3000/api/inngest
```

---

### Step 5: Test It! (1 min)

1. Open: http://localhost:3000/dashboard/materials
2. Click: "Generate New Materials"
3. Select a company
4. Choose: Teaser
5. Click: "Start Generation"

**✅ You should see:**
- Job created
- Status: "Collecting Data"
- Progress: 5%

---

## ✅ Verification

### Check Inngest Functions

Visit: http://localhost:3000/api/inngest

You should see **17 functions**:

#### Generation (13)
- ✅ materials-generate-initiated
- ✅ materials-collect-public-data
- ✅ materials-require-uploads
- ✅ materials-process-uploads
- ✅ materials-generate-questionnaire
- ✅ materials-questionnaire-completed
- ✅ materials-consolidate-data
- ✅ materials-start-generation
- ✅ materials-generate-teaser
- ✅ materials-generate-im
- ✅ materials-generate-pitch-deck
- ✅ materials-generation-complete
- ✅ materials-generation-cancelled

#### Notifications (4)
- ✅ materials-notify-documents-required
- ✅ materials-notify-questionnaire-ready
- ✅ materials-notify-generation-complete
- ✅ materials-notify-generation-failed

---

### Check Database Tables

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'material%';
```

**Expected output** (6 tables):
```
material_generation_jobs
generation_data_cache
material_questionnaire_responses
extracted_financial_data
material_content_versions
material_access_log
```

---

## 🎯 First Test Workflow

### Create Your First Material

1. **Navigate**: `/dashboard/materials`
2. **Click**: "Generate New Materials"
3. **Select**: A company from dropdown
4. **Choose**: Teaser only (fastest - 15 min)
5. **Click**: "Start Generation"

### Watch Progress

The wizard shows 4 phases:

1. **Public Data Collection** (30 sec - 2 min)
   - ✅ YTJ data collected
   - ✅ Tavily web search (if API key set)

2. **Questionnaire** (5-10 min)
   - Answer 3-5 questions about your business
   - Click "Submit Questionnaire"

3. **Consolidation** (1-2 min)
   - AI consolidates all data
   - Structures information

4. **Generation** (3-5 min)
   - AI writes teaser content
   - Creates presentation (if Gamma API available)

### Result

✅ **Teaser generated!**
- View online (Gamma link)
- Download PDF
- Share with buyers

---

## 🧪 Test Individual Components

### Test API: Initiate Job

```bash
# Replace TOKEN with your auth token
curl -X POST http://localhost:3000/api/bizexit/materials/generate/initiate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "company_id": "YOUR_COMPANY_ID",
    "generate_teaser": true,
    "generate_im": false,
    "generate_pitch_deck": false
  }'
```

**Expected**:
```json
{
  "success": true,
  "job": {
    "id": "uuid-here",
    "status": "initiated",
    "progress": 0
  }
}
```

### Test API: Check Status

```bash
curl http://localhost:3000/api/bizexit/materials/generate/JOB_ID/status \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

---

## 🔧 Troubleshooting

### Issue: "Organization not found"

**Fix:**
```sql
-- Check user's organization
SELECT * FROM user_organizations WHERE user_id = 'YOUR_USER_ID';

-- If missing, add:
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES ('YOUR_USER_ID', 'YOUR_ORG_ID', 'admin');
```

### Issue: Jobs stuck at "initiated"

**Check Inngest Dashboard:**
1. Visit: http://localhost:3000/api/inngest
2. Click on "materials-generate-initiated"
3. View recent runs
4. Check for errors

**Manual trigger if needed:**
- Click "Test" on function
- Provide test data
- Check execution

### Issue: No API key error

**Add to `.env.local`:**
```bash
GOOGLE_AI_STUDIO_KEY=your_key_here
```

**Restart server:**
```bash
# Stop (Ctrl+C) and restart
npm run dev
```

---

## 📚 Next Steps

Now that it works:

1. **Test with IM/Pitch Deck**: Try full workflow with document upload
2. **Test Email Notifications**: Add `RESEND_API_KEY`
3. **Customize Questions**: Modify questionnaire generation in Inngest function
4. **Add Gamma API**: When available, integrate for presentations
5. **Test with Real Data**: Use actual financial documents

---

## 📖 Full Documentation

- **Master Plan**: `MATERIALS_GENERATION_SYSTEM.md` (65 pages)
- **Deployment**: `MATERIALS_GENERATION_DEPLOYMENT.md` (testing, production)
- **Summary**: `MATERIALS_GENERATION_SUMMARY.md` (overview)
- **This Guide**: `MATERIALS_QUICK_START.md` (you are here)

---

## 🆘 Still Having Issues?

1. Check Inngest logs: http://localhost:3000/api/inngest
2. Check Supabase logs: Dashboard → Logs
3. Check console: Browser DevTools → Console
4. Check terminal: npm run dev output

---

**🎉 Ready to generate your first business material!**

Visit: http://localhost:3000/dashboard/materials

---

**Last Updated**: January 14, 2025  
**Time to Complete**: ~5 minutes  
**Difficulty**: ⭐ Easy

