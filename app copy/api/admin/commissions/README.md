# Admin Commission Management API

**Base Path:** `/api/admin/commissions`  
**Authentication:** Admin only (Bearer token required)

---

## Endpoints

### 1. GET `/api/admin/commissions/pending`
Get list of pending commissions ready for payment.

**Query Parameters:**
- `status` (default: 'calculated') - Filter by commission status
- `partner_id` (optional) - Filter by specific partner
- `limit` (default: 100) - Number of records to return
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "commissions": [...],
  "summary": {
    "total_amount": 15000.50,
    "total_count": 25,
    "currency": "EUR",
    "by_partner": [
      {
        "partner": { "id": "...", "name": "Partner Name", "email": "..." },
        "commissions": [...],
        "total": 5000.00,
        "count": 10
      }
    ]
  },
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 25,
    "has_more": false
  }
}
```

**Example:**
```bash
curl -X GET "https://your-app.com/api/admin/commissions/pending?status=calculated&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 2. POST `/api/admin/commissions/mark-paid`
Mark multiple commissions as paid in bulk.

**Request Body:**
```json
{
  "commission_ids": ["uuid1", "uuid2", "uuid3"],
  "payment_reference": "SEPA-2025-01-15",
  "payment_date": "2025-01-15T00:00:00Z",
  "notes": "Processed via Nordea bank transfer"
}
```

**Response:**
```json
{
  "success": true,
  "updated_count": 3,
  "total_amount_paid": 12500.00,
  "payment_reference": "SEPA-2025-01-15",
  "payment_date": "2025-01-15T00:00:00Z",
  "commissions": [...]
}
```

**Example:**
```bash
curl -X POST https://your-app.com/api/admin/commissions/mark-paid \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commission_ids": ["uuid1", "uuid2"],
    "payment_reference": "BANK-REF-12345",
    "notes": "Paid on 2025-01-15"
  }'
```

---

### 3. POST `/api/admin/commissions/export-payment`
Export commission payment data for bank processing.

**Request Body:**
```json
{
  "commission_ids": ["uuid1", "uuid2"],
  "format": "csv"  // or "sepa_xml"
}
```

**Formats:**
- `csv` - Excel-compatible CSV with UTF-8 BOM
- `sepa_xml` - SEPA Credit Transfer XML (pain.001 format)

**Response:** File download (CSV or XML)

**CSV Columns:**
- Commission ID
- Partner Name
- Partner Email
- Bank Account Name
- IBAN
- BIC
- Tax ID
- Amount
- Currency
- Reference
- Company Name
- Company Business ID
- Generated Date
- Status

**Example:**
```bash
# Export as CSV
curl -X POST https://your-app.com/api/admin/commissions/export-payment \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commission_ids": ["uuid1", "uuid2"],
    "format": "csv"
  }' \
  --output commissions.csv

# Export as SEPA XML
curl -X POST https://your-app.com/api/admin/commissions/export-payment \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commission_ids": ["uuid1", "uuid2"],
    "format": "sepa_xml"
  }' \
  --output commissions.xml
```

---

## Workflow

### Typical Payment Processing Flow

1. **Get Pending Commissions**
   ```
   GET /api/admin/commissions/pending?status=calculated
   ```
   → Returns list of commissions ready for payment

2. **Review & Approve**
   → Admin reviews total amounts, partner details, IBANs

3. **Export Payment Data**
   ```
   POST /api/admin/commissions/export-payment
   ```
   → Download CSV or SEPA XML for bank processing

4. **Process Payment in Bank**
   → Upload file to bank's payment system
   → Get payment reference from bank

5. **Mark as Paid**
   ```
   POST /api/admin/commissions/mark-paid
   ```
   → Updates commission status to 'paid'
   → Records payment reference
   → Creates audit log entry

---

## Security

### Authentication
All endpoints require:
- Valid Bearer token in `Authorization` header
- Token must belong to user with `is_admin = true` in profiles table
- Uses two-client pattern:
  1. Auth client for token verification
  2. Service role client for database operations

### Authorization Flow
```
1. Extract Bearer token from header
2. Verify token with auth client
3. Check user's is_admin flag
4. If admin: use service role client for operations
5. If not admin: return 403 Forbidden
```

### Audit Logging
All payment operations are logged in `partner_audit_log` table with:
- Action performed
- User who performed it
- Timestamp
- Affected commission IDs
- Total amounts

---

## Error Handling

### HTTP Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Error message here",
  "details": { /* optional additional details */ }
}
```

---

## Testing

### Get Admin Token (Development)
```javascript
// In browser console on your app
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session.access_token);
```

### Test Endpoints
```bash
# Set your token
export ADMIN_TOKEN="your_token_here"

# Test pending commissions
curl -X GET "http://localhost:3000/api/admin/commissions/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test mark-paid (safe - use rollback in dev)
curl -X POST http://localhost:3000/api/admin/commissions/mark-paid \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commission_ids": ["test-uuid"],
    "payment_reference": "TEST-001"
  }'
```

---

## Related Documentation
- **System Analysis:** `docs/analysis/PARTNER_REFERRAL_SYSTEM_ANALYSIS.md`
- **Implementation Guide:** `docs/analysis/PARTNER_COMMISSION_IMPLEMENTATION_COMPLETE.md`
- **Database Migrations:** `supabase/migrations/20250111120000_*.sql`
- **Deployment Guide:** `supabase/migrations/20250111120000_auto_commission_generation_DEPLOYMENT.md`

---

**Version:** 1.0  
**Last Updated:** 2025-01-11

