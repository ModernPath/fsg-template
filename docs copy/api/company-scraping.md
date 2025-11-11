# Company Data Scraping API

## Overview
Universal company data scraping system that works across multiple countries.

## Endpoints

### POST `/api/companies/scrape-company-data`
Universal endpoint for scraping company data from any supported country.

#### Request Body
```json
{
  "businessId": "3361305-7",        // Optional: Business ID (Y-tunnus, Org number, etc.)
  "companyName": "LastBot",         // Optional: Company name
  "countryCode": "FI"               // Optional: Country code (auto-detected from businessId if not provided)
}
```

**Note:** Either `businessId` or `companyName` must be provided. If searching by name, `countryCode` is required.

#### Response (Success)
```json
{
  "success": true,
  "message": "Company data scraped successfully",
  "data": {
    "financials": [{
      "year": "2025",
      "revenue": "Not available",
      "operating_profit": "Not available",
      "ebitda": "Not available",
      "profit": "Not available",
      "net_result": "Not available",
      "equity": "Not available",
      "total_assets": "Not available",
      "current_assets": "Not available",
      "current_liabilities": "Not available",
      "solidity_ratio": "Not available",
      "liquidity_ratio": "Not available",
      "profit_margin": "Not available",
      "currency": "EUR",
      "source": "YTJ (Finnish Patent and Registration Office)"
    }],
    "personnel": {
      "count": null,
      "source": "YTJ (Finnish Patent and Registration Office)"
    },
    "industry": "Muu laitteisto- ja tietotekninen palvelutoiminta",
    "address": "Kimmeltie, 90630",
    "website": "www.lastbot.com",
    "currency": "EUR",
    "countryCode": "FI",
    "lastUpdated": "2025-10-13T17:01:14.900Z"
  },
  "metadata": {
    "businessId": "3361305-7",
    "companyName": "LastBot Europe Oy",
    "countryCode": "FI",
    "currency": "EUR",
    "source": "YTJ (Finnish Patent and Registration Office)",
    "lastUpdated": "2025-10-13T17:01:14.892Z"
  }
}
```

#### Response (Multiple Matches)
When searching by name returns multiple companies:
```json
{
  "success": true,
  "message": "Multiple companies found. Please select one.",
  "requiresSelection": true,
  "searchResults": [
    {
      "businessId": "3361305-7",
      "name": "LastBot Europe Oy"
    },
    {
      "businessId": "1234567-8",
      "name": "LastBot Finland Oy"
    }
  ]
}
```

#### Response (Not Found)
```json
{
  "success": false,
  "message": "No companies found with that name",
  "data": null,
  "searchResults": []
}
```

#### Response (No Financial Data)
```json
{
  "success": false,
  "message": "No financial data found from available sources",
  "data": null,
  "attemptedSources": [
    "Finder.fi",
    "Kauppalehti.fi",
    "Asiakastieto.fi"
  ]
}
```

### GET `/api/companies/scrape-company-data`
Check scraping availability for a country.

#### Query Parameters
- `businessId` (optional): Business ID to detect country
- `countryCode` (optional): Country code

#### Response
```json
{
  "available": true,
  "country": "Finland",
  "countryCode": "FI",
  "currency": "EUR",
  "sources": [
    "YTJ (Finnish Patent and Registration Office)",
    "Finder.fi",
    "Kauppalehti.fi",
    "Asiakastieto.fi"
  ],
  "supportedSearchTypes": ["businessId", "companyName"]
}
```

## Supported Countries

### Finland (FI)
- **Business ID Format:** `1234567-8` (7 digits, dash, 1 digit)
- **Official Registry:** YTJ (Patentti- ja rekisterihallitus)
- **Alternative Sources:** Finder.fi, Kauppalehti.fi, Asiakastieto.fi
- **Currency:** EUR

**What YTJ Provides (FREE):**
- ✅ Company name (FI/EN/SV)
- ✅ Business ID (Y-tunnus)
- ✅ Industry classification
- ✅ Company form (Osakeyhtiö, etc.)
- ✅ Address
- ✅ Website URL
- ✅ Registration date
- ✅ Company status

**What YTJ DOES NOT Provide:**
- ❌ Revenue (Liikevaihto)
- ❌ Profit (Liikevoitto/Tulos)
- ❌ Balance sheet (Tase)
- ❌ Number of employees
- ❌ Financial ratios
- ❌ Credit ratings

### Sweden (SE)
- **Business ID Format:** `123456-7890` (6 digits, dash, 4 digits)
- **Official Registry:** Bolagsverket
- **Alternative Sources:** Allabolag.se, Ratsit.se
- **Currency:** SEK

### Norway (NO)
- **Business ID Format:** `123456789` (9 digits)
- **Official Registry:** Brønnøysundregistrene
- **Currency:** NOK

### Denmark (DK)
- **Business ID Format:** `12345678` (8 digits)
- **Official Registry:** CVR (Erhvervsstyrelsen)
- **Currency:** DKK

## Integration

### In Company Creation Flow
The universal scraper is automatically called when creating a new company:

```typescript
// app/api/companies/create/route.ts
const scrapeResponse = await fetch(`/api/companies/scrape-company-data`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    businessId: body.business_id,
    countryCode: body.countryCode || locale.toUpperCase()
  })
});
```

### From Frontend
```typescript
const response = await fetch('/api/companies/scrape-company-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    businessId: '3361305-7',
    // OR
    companyName: 'LastBot',
    countryCode: 'FI'
  })
});

const result = await response.json();

if (result.requiresSelection) {
  // Show user selection UI
  console.log('Multiple companies found:', result.searchResults);
} else if (result.success) {
  // Use the scraped data
  console.log('Company data:', result.data);
  console.log('Company name:', result.metadata.companyName);
}
```

## Rate Limiting
- **YTJ API:** No strict rate limit, but respect fair use
- **Alternative Sources:** 2-3 second delays between requests
- **Retries:** 3 attempts with exponential backoff

## Error Handling
- **Authentication:** Returns 401 if token is missing/invalid (in production)
- **Not Found:** Returns 404-like success:false response
- **Multiple Matches:** Returns success:true with requiresSelection flag
- **Server Error:** Returns 500 with error details

## Future Enhancements
1. **Paid API Integration:**
   - Asiakastieto.fi for Finnish financial data
   - UC.se for Swedish financial data
   - Bisnode for Nordic financial data

2. **Headless Browser Scraping:**
   - Use Puppeteer/Playwright for JavaScript-rendered sites
   - Scrape Finder.fi, Kauppalehti.fi with proper rendering

3. **Caching:**
   - Cache scraped data for 24 hours
   - Redis for fast lookups
   - Background refresh for stale data

4. **Machine Learning:**
   - Predict missing financial data based on industry/size
   - Anomaly detection for data validation
   - Automatic categorization improvement

## Testing

### Test Search by Business ID
```bash
curl -X POST "http://localhost:3001/api/companies/scrape-company-data" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "3361305-7"}'
```

### Test Search by Company Name
```bash
curl -X POST "http://localhost:3001/api/companies/scrape-company-data" \
  -H "Content-Type: application/json" \
  -d '{"companyName": "LastBot", "countryCode": "FI"}'
```

### Test Availability Check
```bash
curl "http://localhost:3001/api/companies/scrape-company-data?countryCode=FI"
```

## Troubleshooting

### "No financial data found"
- **Cause:** YTJ doesn't provide financial metrics
- **Solution:** Allow manual entry or integrate paid API

### "No companies found with that name"
- **Cause:** Company name doesn't match exactly
- **Solution:** Try partial name or business ID instead

### "Rate limit exceeded"
- **Cause:** Too many requests to the same source
- **Solution:** Wait a few seconds and retry

### "Could not determine country"
- **Cause:** Business ID format doesn't match any known pattern
- **Solution:** Provide `countryCode` explicitly

