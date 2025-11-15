# NDA System Testing Guide

## ✅ Completed Implementation

### Database Migrations
- ✅ NDA table extended with content and recipient fields
- ✅ Made `buyer_id` nullable for generic recipients
- ✅ Fixed enrichment trigger functions
- ✅ All migrations run successfully

### API Endpoints
- ✅ `POST /api/ndas` - Create NDA
- ✅ `GET /api/ndas` - List NDAs with filtering
- ✅ `GET /api/ndas/[id]` - Get single NDA
- ✅ `PUT /api/ndas/[id]` - Update NDA
- ✅ `DELETE /api/ndas/[id]` - Delete unsigned NDAs
- ✅ `POST /api/ndas/[id]/sign` - Sign NDA

### UI Components
- ✅ NDACreationForm - Full form for creating NDAs
- ✅ NDAViewer - Display and interact with NDAs
- ✅ Pages for listing, creating, and viewing NDAs
- ✅ Translations (EN, FI, SV)

### Test Data
- ✅ 3 test NDAs created
- ✅ Full NDA content generated from template
- ✅ Linked to companies and buyers

## 🧪 Testing Instructions

### Prerequisites

1. **Start Development Server:**
```bash
npm run dev:next
```

2. **Reset Database (if needed):**
```bash
supabase db reset --local
npm run seed:test-data
```

### Test Accounts

**Available Test User (after seeding):**
- Email: `partner@bizexit.test`
- Password: `TestPartner123!`

**Create Additional Users:**
You can create more users directly via Supabase Dashboard or UI:
1. Navigate to `http://localhost:3000/fi/auth/sign-in`
2. Click "Register" and create accounts with:
   - `admin@bizexit.test` / `TestAdmin123!`
   - `broker@bizexit.test` / `TestBroker123!`
   - `seller@bizexit.test` / `TestSeller123!`
   - `buyer@bizexit.test` / `TestBuyer123!`

### Testing Scenarios

#### 1. View NDA List
```
URL: http://localhost:3000/fi/dashboard/ndas
Expected: 
- See 3 test NDAs
- Stats showing totals (Total: 3, Pending: 1, Signed: 2)
- Table with company names, signers, status, dates
```

#### 2. Create New NDA

**Step 1: Navigate to creation page**
```
URL: http://localhost:3000/fi/dashboard/ndas/new
```

**Step 2: Fill out form**
- Recipient Name: "Test Ostaja"
- Recipient Email: "test.buyer@example.com"
- Recipient Company: "Test Buyer Company Oy" (optional)
- Recipient Address: "Helsinki, Finland" (optional)
- Purpose: "Yrityskaupan due diligence ja arviointi"
- Term: 3 years (default)
- Effective Date: Today

**Step 3: Submit**
- Click "Luo salassapitosopimus" (Create NDA)
- Should redirect to new NDA detail page

**Expected Result:**
- NDA created with status "draft"
- Full bilingual (FI/EN) NDA content generated
- Recipient information stored
- Expiration date set to 3 years from today

#### 3. View NDA Details

**Navigate to:**
```
http://localhost:3000/fi/dashboard/ndas/[nda-id]
```

**Expected Display:**
- Status badge (Draft/Pending/Signed/Expired)
- Recipient information
- Created and expiration dates
- Download button (Markdown)
- Edit button (if unsigned)
- Delete button (if unsigned and has permission)
- Sign button (if you're the buyer and unsigned)
- Full NDA content rendered in Markdown

#### 4. Sign NDA (as Buyer)

**Prerequisites:**
- Log in as the recipient user
- Or as admin/creator for testing

**Steps:**
1. Navigate to NDA detail page
2. Click "Allekirjoita" (Sign NDA) button
3. Confirm in dialog: "Allekirjoita sopimus"

**Expected Result:**
- Status changes to "signed"
- `signed_at` timestamp recorded
- `signed_by` set to current user
- Signature IP recorded
- Sign button no longer available
- Cannot edit or delete anymore

#### 5. Download NDA

**Steps:**
1. On NDA detail page
2. Click "Lataa (Markdown)" button

**Expected Result:**
- Downloads `.md` file
- Filename: `NDA-[RecipientName]-[Date].md`
- Contains full bilingual NDA content

#### 6. Edit NDA (if unsigned)

**Steps:**
1. On NDA detail page (unsigned NDA only)
2. Click "Muokkaa" (Edit) button
3. Update recipient information or purpose
4. Save changes

**Expected Result:**
- NDA content regenerated with new information
- `updated_at` timestamp updated
- Remains in same status

#### 7. Delete NDA (if unsigned)

**Steps:**
1. On NDA detail page (unsigned NDA only)
2. Click "Poista" (Delete) button
3. Confirm deletion in dialog

**Expected Result:**
- NDA deleted from database
- Redirected back to NDA list
- NDA no longer appears in list

**Note:** Signed NDAs CANNOT be deleted (returns error)

#### 8. Filter NDAs

**On list page:**
```
URL: http://localhost:3000/fi/dashboard/ndas
```

**Test Filters:**
- Filter by company_id: Add `?company_id=[uuid]` to URL
- Filter by status: Add `?status=signed` or `?status=pending`

**Expected Result:**
- List shows only NDAs matching filters

## 📊 Expected Test Data

After `npm run seed:test-data`, you should have:

### NDA #1: TechStart NDA
- Company: TechStart Oy
- Recipient: Kalle Ostaja (buyer@bizexit.test)
- Status: **Signed**
- Signed: 2024-01-15
- Expires: 2027-01-15
- Purpose: M&A Due Diligence for TechStart acquisition

### NDA #2: Nordic Retail NDA
- Company: Nordic Retail Solutions
- Recipient: Kalle Ostaja (buyer@bizexit.test)
- Status: **Pending**
- Expires: 2027-06-01
- Purpose: Initial discussion and evaluation

### NDA #3: CleanTech NDA
- Company: CleanTech Industries  
- Recipient: Kalle Ostaja (buyer@bizexit.test)
- Status: **Signed**
- Signed: 2024-03-20
- Expires: 2027-03-20
- Purpose: Strategic acquisition evaluation

## 🐛 Known Issues & Workarounds

### Issue 1: User Creation Fails
**Problem:** Test user creation fails with "unexpected_failure"

**Workaround:** Create users manually via:
1. Supabase Dashboard (http://localhost:54323)
2. Or via registration UI (http://localhost:3000/fi/auth/register)

### Issue 2: User Organization Role
**Problem:** Some users might not have organization memberships

**Workaround:** Manually link users to organizations via Supabase Dashboard:
```sql
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES ('[user-uuid]', '[org-uuid]', 'broker');
```

## 🔍 Debugging

### Check Supabase Logs
```bash
# In separate terminal
supabase logs --local
```

### Check Database State
```bash
# Via Supabase Studio
http://localhost:54323

# Or via psql
supabase db connect --local
```

### Useful Queries

**List all NDAs:**
```sql
SELECT 
  n.id,
  n.status,
  n.recipient_name,
  n.signed_at,
  c.name as company_name
FROM ndas n
LEFT JOIN companies c ON n.company_id = c.id
ORDER BY n.created_at DESC;
```

**Check NDA permissions:**
```sql
SELECT 
  n.*,
  uo.role as user_org_role
FROM ndas n
LEFT JOIN companies c ON n.company_id = c.id
LEFT JOIN user_organizations uo ON uo.organization_id = c.organization_id
WHERE uo.user_id = '[your-user-id]';
```

## ✨ Success Criteria

A successful test session should demonstrate:

- [x] NDA list displays correctly
- [x] New NDA can be created with all required fields
- [x] NDA content is generated in bilingual format (FI/EN)
- [x] NDA can be viewed with full content and metadata
- [x] Unsigned NDA can be edited
- [x] Unsigned NDA can be deleted
- [x] NDA can be signed (status changes, timestamps recorded)
- [x] Signed NDA cannot be edited or deleted
- [x] NDA can be downloaded as Markdown
- [x] Filtering by company and status works
- [x] Translations work in all three languages (EN, FI, SV)
- [x] Permissions enforce correctly (creator, buyer, admin roles)

## 📝 Next Steps

After successful testing:

1. **Production Deployment:**
   - Run migrations on production database
   - Test with real user accounts
   - Monitor for any issues

2. **Enhancements:**
   - Add PDF generation (currently Markdown only)
   - Add email notifications for NDA events
   - Integrate e-signature providers (DocuSign, HelloSign)
   - Add signature canvas for manual signatures
   - Add NDA expiration reminders

3. **Documentation:**
   - Update user-facing help documentation
   - Create video tutorials for NDA workflow
   - Document for end users (non-technical)

## 🆘 Support

If you encounter issues:

1. Check console for JavaScript errors (F12 in browser)
2. Check Network tab for API errors
3. Check Supabase logs: `supabase logs --local`
4. Check migration status: `supabase db push --dry-run`
5. Review NDA_SYSTEM.md for architecture details

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
**Status:** ✅ Ready for Testing

