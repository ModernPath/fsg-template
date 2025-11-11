# BizExit API Documentation

Complete API reference for the BizExit M&A Platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Organizations API](#organizations-api)
3. [Companies API](#companies-api)
4. [Deals API](#deals-api)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication via Supabase Auth. Include the session token in your requests.

### Headers

```
Authorization: Bearer <supabase_access_token>
```

### User Context

Authenticated requests automatically include:
- `x-organization-id`: User's organization ID
- `x-user-role`: User's role (seller, broker, buyer, partner, admin, analyst)
- `x-is-admin`: Whether user is admin (true/false)

---

## Organizations API

### List Organizations

```http
GET /api/organizations
```

Returns organizations the authenticated user has access to.

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Nordic M&A Partners",
      "type": "broker",
      "country": "FI",
      "city": "Helsinki",
      "postal_code": "00100",
      "settings": {},
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### Get Organization

```http
GET /api/organizations/{id}
```

**Path Parameters:**
- `id` (string, required): Organization ID

**Response:**
```json
{
  "organization": {
    "id": "uuid",
    "name": "Nordic M&A Partners",
    "type": "broker",
    "country": "FI",
    "city": "Helsinki",
    "postal_code": "00100",
    "settings": {},
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Access denied (not your organization)
- `404`: Organization not found

---

### Create Organization

```http
POST /api/organizations
```

**Permissions:** Admin only

**Request Body:**
```json
{
  "name": "New Business Brokers",
  "type": "broker",
  "country": "SE",
  "city": "Stockholm",
  "postal_code": "11122",
  "settings": {}
}
```

**Response:**
```json
{
  "organization": {
    "id": "uuid",
    "name": "New Business Brokers",
    "type": "broker",
    "country": "SE",
    "created_at": "2025-01-15T11:00:00Z"
  },
  "message": "Organization created successfully"
}
```

---

### Update Organization

```http
PATCH /api/organizations/{id}
```

**Permissions:** `org:update`

**Request Body:**
```json
{
  "name": "Updated Name",
  "city": "Tampere",
  "settings": {
    "timezone": "Europe/Helsinki"
  }
}
```

**Response:**
```json
{
  "organization": { ... },
  "message": "Organization updated successfully"
}
```

---

### Delete Organization

```http
DELETE /api/organizations/{id}
```

**Permissions:** Admin only

**Response:**
```json
{
  "message": "Organization deleted successfully"
}
```

---

## Companies API

### List Companies

```http
GET /api/companies?status=active&limit=50&offset=0
```

**Query Parameters:**
- `status` (string, optional): Filter by status (draft, active, under_review, sold, archived)
- `limit` (number, optional): Results per page (default: 50, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "name": "Nordic SaaS Solutions",
      "business_id": "1234567-8",
      "country": "FI",
      "industry": "Technology / SaaS",
      "employees": 45,
      "asking_price": 12000000,
      "annual_revenue": 8500000,
      "annual_ebitda": 2100000,
      "status": "active",
      "created_at": "2025-01-10T10:00:00Z",
      "company_financials": [...],
      "listings": [...]
    }
  ],
  "count": 8,
  "limit": 50,
  "offset": 0
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Permission denied (lacks `company:read`)

---

### Get Company

```http
GET /api/companies/{id}
```

**Path Parameters:**
- `id` (string, required): Company ID

**Response:**
```json
{
  "company": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Nordic SaaS Solutions",
    "business_id": "1234567-8",
    "country": "FI",
    "city": "Helsinki",
    "industry": "Technology / SaaS",
    "employees": 45,
    "founded_year": 2018,
    "website": "https://nordicsaas.example",
    "description": "Leading B2B SaaS platform...",
    "asking_price": 12000000,
    "annual_revenue": 8500000,
    "annual_ebitda": 2100000,
    "total_assets": 5000000,
    "total_liabilities": 1200000,
    "reason_for_sale": "Founder retirement",
    "status": "active",
    "company_financials": [
      {
        "id": "uuid",
        "year": 2024,
        "period": "q4",
        "revenue": 2200000,
        "ebitda": 550000,
        "is_audited": true
      }
    ],
    "company_assets": [...],
    "listings": [...],
    "deals": [...]
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Access denied (not in your organization)
- `404`: Company not found

---

### Create Company

```http
POST /api/companies
```

**Permissions:** `company:create`

**Request Body:**
```json
{
  "name": "Tech Startup AB",
  "business_id": "9876543-2",
  "country": "SE",
  "city": "Stockholm",
  "postal_code": "11122",
  "industry": "Technology",
  "employees": 25,
  "founded_year": 2020,
  "website": "https://techstartup.example",
  "description": "Innovative tech solutions...",
  "asking_price": 5000000,
  "annual_revenue": 3000000,
  "annual_ebitda": 800000,
  "total_assets": 2000000,
  "total_liabilities": 500000,
  "reason_for_sale": "New opportunity",
  "status": "draft"
}
```

**Response:**
```json
{
  "company": { ... },
  "message": "Company created successfully"
}
```

**Errors:**
- `400`: Validation error (missing name or country)
- `401`: Unauthorized
- `403`: Permission denied

---

### Update Company

```http
PATCH /api/companies/{id}
```

**Permissions:** `company:update`

**Request Body:**
```json
{
  "asking_price": 5500000,
  "status": "active",
  "description": "Updated description..."
}
```

**Response:**
```json
{
  "company": { ... },
  "message": "Company updated successfully"
}
```

---

### Delete Company

```http
DELETE /api/companies/{id}
```

**Permissions:** `company:delete`

Performs soft delete by setting status to 'archived'.

**Response:**
```json
{
  "message": "Company archived successfully"
}
```

---

### Get Company Financials

```http
GET /api/companies/{id}/financials
```

**Permissions:** `company:read`

**Response:**
```json
{
  "financials": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "year": 2024,
      "period": "annual",
      "revenue": 8500000,
      "ebitda": 2100000,
      "net_profit": 1500000,
      "total_assets": 5000000,
      "total_liabilities": 1200000,
      "is_audited": true,
      "currency": "EUR",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### Add Financial Record

```http
POST /api/companies/{id}/financials
```

**Permissions:** `company:update`

**Request Body:**
```json
{
  "year": 2024,
  "period": "q4",
  "revenue": 2200000,
  "ebitda": 550000,
  "net_profit": 400000,
  "total_assets": 5000000,
  "total_liabilities": 1200000,
  "is_audited": false,
  "currency": "EUR"
}
```

**Response:**
```json
{
  "financial": { ... },
  "message": "Financial record created successfully"
}
```

---

## Deals API

### List Deals

```http
GET /api/deals?stage=due_diligence&limit=50&offset=0
```

**Query Parameters:**
- `stage` (string, optional): Filter by stage
- `company_id` (string, optional): Filter by company
- `limit` (number, optional): Results per page (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "deals": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "company_id": "uuid",
      "buyer_id": "uuid",
      "current_stage": "due_diligence",
      "fixed_fee": 15000,
      "success_fee_percentage": 3.5,
      "estimated_value": 12000000,
      "actual_value": null,
      "expected_close_date": "2025-06-30",
      "created_at": "2025-01-15T10:00:00Z",
      "companies": { ... },
      "buyer": { ... },
      "deal_stage_history": [...],
      "deal_activities": [...]
    }
  ],
  "count": 3,
  "limit": 50,
  "offset": 0
}
```

---

### Get Deal

```http
GET /api/deals/{id}
```

**Path Parameters:**
- `id` (string, required): Deal ID

**Response:**
```json
{
  "deal": {
    "id": "uuid",
    "organization_id": "uuid",
    "company_id": "uuid",
    "buyer_id": "uuid",
    "current_stage": "due_diligence",
    "fixed_fee": 15000,
    "success_fee_percentage": 3.5,
    "estimated_value": 12000000,
    "notes": "Private notes...",
    "companies": { ... },
    "buyer": { ... },
    "deal_stage_history": [
      {
        "id": "uuid",
        "deal_id": "uuid",
        "stage": "due_diligence",
        "changed_by": "uuid",
        "changed_at": "2025-01-20T14:30:00Z",
        "notes": "DD package sent"
      }
    ],
    "deal_activities": [...],
    "payments": [...]
  }
}
```

---

### Create Deal

```http
POST /api/deals
```

**Permissions:** `deal:create`

**Request Body:**
```json
{
  "company_id": "uuid",
  "buyer_id": "uuid",
  "current_stage": "initial_contact",
  "fixed_fee": 15000,
  "success_fee_percentage": 3.5,
  "estimated_value": 12000000,
  "notes": "Interested buyer from Sweden"
}
```

**Response:**
```json
{
  "deal": { ... },
  "message": "Deal created successfully"
}
```

---

### Update Deal

```http
PATCH /api/deals/{id}
```

**Permissions:** `deal:update`

**Request Body:**
```json
{
  "current_stage": "negotiation",
  "estimated_value": 11500000,
  "expected_close_date": "2025-07-15",
  "stage_notes": "Price negotiation in progress"
}
```

**Response:**
```json
{
  "deal": { ... },
  "message": "Deal updated successfully"
}
```

**Note:** Stage changes automatically create history entries.

---

### Delete Deal

```http
DELETE /api/deals/{id}
```

**Permissions:** `deal:delete`

**Response:**
```json
{
  "message": "Deal deleted successfully"
}
```

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Error Messages

- `"Authentication required"`: No valid session
- `"Permission denied"`: User lacks required permission
- `"Access denied"`: Resource not in user's organization
- `"Resource not found"`: Invalid ID or deleted resource
- `"Validation error"`: Missing or invalid request data

---

## Rate Limiting

**Current Limits:**
- 100 requests per minute per user
- 1000 requests per hour per organization

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704127200
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

Status Code: `429 Too Many Requests`

---

## Audit Logging

All write operations (POST, PATCH, DELETE) automatically create audit log entries:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "organization_id": "uuid",
  "action": "company.update",
  "resource_type": "company",
  "resource_id": "uuid",
  "metadata": {
    "asking_price": 5500000,
    "status": "active"
  },
  "created_at": "2025-01-15T11:00:00Z"
}
```

---

## RBAC Permissions

### User Roles

1. **Seller**: Company owners
   - Can create and manage their companies
   - View deals and listings
   - Limited write permissions

2. **Broker**: M&A professionals
   - Full company and deal management
   - Can publish listings
   - Process payments
   - Advance deal stages

3. **Buyer**: Potential acquirers
   - View companies and listings
   - Sign NDAs
   - View deals they're involved in

4. **Partner**: External advisors (lawyers, accountants)
   - Read-only access to specific deals
   - View company data
   - Cannot modify data

5. **Admin**: Platform administrators
   - Full system access
   - Manage organizations
   - Cross-organization visibility

6. **Analyst**: Data analysts
   - Read-only access
   - View audit logs
   - Generate reports

### Permission Matrix

| Permission | Seller | Broker | Buyer | Partner | Admin | Analyst |
|------------|--------|--------|-------|---------|-------|---------|
| company:create | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| company:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| company:update | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| company:delete | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| company:publish | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| deal:create | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| deal:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| deal:update | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| deal:advance_stage | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| nda:sign | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ |
| nda:verify | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| payment:process | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ |
| admin:write | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| audit:read | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## Example Usage

### TypeScript/JavaScript

```typescript
// Fetch companies
const response = await fetch('/api/companies?status=active&limit=10', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const { companies, count } = await response.json();

// Create company
const newCompany = await fetch('/api/companies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Tech Startup AB',
    country: 'SE',
    industry: 'Technology',
    asking_price: 5000000,
  }),
});

// Update deal stage
const updatedDeal = await fetch(`/api/deals/${dealId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    current_stage: 'negotiation',
    stage_notes: 'Entered negotiation phase',
  }),
});
```

---

## Changelog

### v1.0.0 (2025-01-15)

**Added:**
- Organizations API (list, get, create, update, delete)
- Companies API (CRUD + financials)
- Deals API (CRUD + stage management)
- RBAC system with 6 roles and 30+ permissions
- Organization-scoped data isolation
- Automatic audit logging
- Rate limiting
- Comprehensive error handling

---

## Support

For API support, contact: [support@bizexit.example](mailto:support@bizexit.example)

Documentation: [https://docs.bizexit.example](https://docs.bizexit.example)

