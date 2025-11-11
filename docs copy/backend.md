# Backend Architecture

## API Endpoints

### Authentication

#### `/api/auth`
- **POST /api/auth/login**: Authenticate a user
- **POST /api/auth/register**: Register a new user
- **POST /api/auth/forgot-password**: Request password reset
- **POST /api/auth/reset-password**: Reset password with token
- **GET /api/auth/providers**: Get available authentication providers
- **GET /api/auth/me**: Get current authenticated user
- **POST /api/auth/logout**: Log out current user

### User Management

#### `/api/users`
- **GET /api/users/me**: Get current user profile
- **PUT /api/users/me**: Update current user profile
- **GET /api/users/me/companies**: Get companies associated with current user
- **POST /api/users/me/preferences**: Update user preferences
- **GET /api/users/:id**: Get user by ID (admin only)
- **PUT /api/users/:id**: Update user by ID (admin only)
- **DELETE /api/users/:id**: Delete user by ID (admin only)

### Company Management

#### `/api/companies`
- **GET /api/companies**: Get companies for current user
- **POST /api/companies**: Create a new company
- **GET /api/companies/:id**: Get company by ID
- **PUT /api/companies/:id**: Update company by ID
- **DELETE /api/companies/:id**: Delete company by ID
- **GET /api/companies/:id/users**: Get users associated with company
- **POST /api/companies/:id/users**: Add user to company
- **DELETE /api/companies/:id/users/:userId**: Remove user from company
- **GET /api/companies/search/ytj**: Search company by business ID (YTJ)

### Financial Data

#### `/api/financial-data`
- **GET /api/financial-data/company/:companyId**: Get financial data for company
- **POST /api/financial-data/company/:companyId**: Add financial data for company
- **GET /api/financial-data/:id**: Get financial data by ID
- **PUT /api/financial-data/:id**: Update financial data by ID
- **DELETE /api/financial-data/:id**: Delete financial data by ID
- **POST /api/financial-data/analyze/company/:companyId**: Run AI analysis on company data

### Documents

#### `/api/documents`
- **GET /api/documents/company/:companyId**: Get documents for company
- **POST /api/documents/company/:companyId/upload**: Upload document for company
- **GET /api/documents/:id**: Get document by ID
- **DELETE /api/documents/:id**: Delete document by ID
- **POST /api/documents/:id/analyze**: Analyze document with AI
- **GET /api/documents/:id/download**: Download document

### Financing

#### `/api/financing`
- **GET /api/financing/needs/company/:companyId**: Get financing needs for company
- **POST /api/financing/needs/company/:companyId**: Create financing need for company
- **GET /api/financing/needs/:id**: Get financing need by ID
- **PUT /api/financing/needs/:id**: Update financing need by ID
- **DELETE /api/financing/needs/:id**: Delete financing need by ID
- **GET /api/financing/options**: Get available financing options
- **GET /api/financing/providers**: Get financing providers
- **GET /api/financing/providers/:id**: Get provider details by ID
- **GET /api/financing/providers/:id/options**: Get financing options for provider

#### `/api/applications`
- **GET /api/applications/company/:companyId**: Get applications for company
- **POST /api/applications/company/:companyId**: Create application for company
- **GET /api/applications/:id**: Get application by ID
- **PUT /api/applications/:id**: Update application by ID
- **DELETE /api/applications/:id**: Delete application by ID
- **POST /api/applications/:id/submit**: Submit application to provider
- **GET /api/applications/:id/status**: Check application status

#### `/api/offers`
- **GET /api/offers/company/:companyId**: Get offers for company
- **GET /api/offers/application/:applicationId**: Get offers for application
- **GET /api/offers/:id**: Get offer by ID
- **PUT /api/offers/:id/status**: Update offer status (accept/decline)
- **GET /api/offers/compare**: Compare multiple offers

### AI Analysis

#### `/api/ai`
- **POST /api/ai/analyze/financial-data**: Analyze financial data
- **POST /api/ai/analyze/document**: Extract data from document
- **POST /api/ai/generate/application**: Generate application content
- **POST /api/ai/recommend/financing**: Get financing recommendations
- **POST /api/ai/chat**: Chat with AI assistant about financial topics

### Financial Analysis

#### `/api/financial-metrics`
- **GET /api/financial-metrics/company/:companyId**: Get financial metrics for a company
  - Query params: fiscal_year, limit, order, direction
  - Returns detailed financial metrics with any associated funding recommendations

#### `/api/future-goals`
- **GET /api/future-goals**: Get future goals for a company
  - Query params: company_id (required)
  - Returns list of future business goals
- **POST /api/future-goals**: Create a new future goals entry
  - Request body: company_id, and various goal metrics
  - Creates and returns the new future goals entry

#### `/api/funding-recommendations`
- **GET /api/funding-recommendations/company/:companyId**: Get funding recommendations for a company
  - Returns recommendations with related financial metrics and future goals data
- **POST /api/funding-recommendations/company/:companyId**: Generate new funding recommendations
  - Optional request body: financial_metrics_id, future_goals_id
  - Generates and returns new funding recommendations

#### `/api/financial-analysis`
- **GET /api/financial-analysis/documents**: Get status of document analysis processes
  - Query params: company_id (required), document_id (optional)
  - Returns document status and any related financial metrics
- **POST /api/financial-analysis/documents**: Trigger analysis of a financial document
  - Request body: document_id, company_id, optional manual_data
  - Returns immediate success and processes the document asynchronously

### Integrations

#### `/api/integrations`
- **GET /api/integrations/ytj/search**: Search Finnish Business Information System
- **GET /api/integrations/ytj/company/:businessId**: Get company details from YTJ
- **POST /api/integrations/banking/connect**: Connect banking API
- **GET /api/integrations/banking/accounts**: Get connected bank accounts
- **GET /api/integrations/banking/transactions**: Get bank transactions

### `/api/financing-needs`

*   **Method:** `POST`
*   **Authentication:** Required (Implicitly via frontend session/user context)
*   **Request Body:** 
    *   `companyId` (string)
    *   `userId` (string)
    *   `description` (string - User's input from Step 4)
*   **Description:** 
    1.  Receives the user's description of their financing needs from the onboarding flow (Step 4).
    2.  Creates an initial record in the `financing_needs` table.
    3.  Calls the Gemini API to parse the `description` and extract structured details (amount, currency, purpose, time horizon, urgency, requirements).
    4.  Updates the `financing_needs` record with the parsed data.
    5.  Triggers the `generateFundingRecommendations` service function (`lib/services/financialAnalysisService.ts`) to generate AI-based funding recommendations using the parsed needs and company metrics.
*   **Response:**
    *   Success (200): `{ message: string, needsRecordId: string }`
    *   Error (400/500): `{ error: string }`

### Onboarding Endpoints

*   **`POST /api/auth/validate-turnstile`**: Validates Cloudflare Turnstile token.
*   **`POST /api/companies/create`**: Creates a new company record, potentially enriching data from YTJ.
*   **`PUT /api/companies/update/{id}`**: Updates an existing company record.
*   **`GET /api/companies/search`**: Searches for companies using the YTJ API.
*   **`POST /api/documents/upload`**: Handles document uploads, stores them in Supabase Storage, and creates `documents` records.
*   **`POST /api/documents/analyze`**: Triggers financial data extraction and analysis for documents linked to a company.
*   **`POST /api/financial-metrics/create`**: Saves extracted or manually entered financial metrics.
*   **`GET /api/financial-metrics/list`**: Retrieves financial metrics for a company.
*   **`POST /api/financing-needs`**: Saves the user's answers to the financing needs questionnaire.
*   **`POST /api/funding-applications`**: Saves a draft funding application (used in Step 6).
*   **`POST /api/onboarding/submit-final-application`**: Handles the final application submission from Step 7. It receives the complete application data (including temporary KYC/UBO info), saves the non-sensitive `funding_applications` record, fetches active lenders, and dispatches the application (with temporary sensitive data) to each lender via the `LenderService`.

### `/api/send-document-request`
*   **Method:** `POST`
*   **Authentication:** Required (User must be logged in, verified via Supabase server client).
*   **Request Body:**
    *   `bookkeeperEmail` (string, required, valid email format)
    *   `personalMessage` (string, optional)
    *   `companyId` (string, required, UUID format)
*   **Description:**
    1.  Authenticates the user making the request.
    2.  Validates the request body.
    3.  Fetches the user's name (from `profiles`) and the company name (from `companies`, verifying ownership) associated with the `companyId`.
    4.  Constructs an email subject and HTML body using the fetched user/company details and the provided `bookkeeperEmail` and `personalMessage`.
    5.  Sends the email to the `bookkeeperEmail` using SendGrid (`@sendgrid/mail`). The email contains the user's request, the optional message, and a placeholder link (`/secure-upload/placeholder-token`) for the bookkeeper to upload documents. The template content is defined inline within the API route code.
    6.  Requires `SENDGRID_API_KEY` and optionally `SENDER_EMAIL` environment variables.
*   **Response:**
    *   Success (200): `{ message: 'Email request sent successfully' }`
    *   Error (400): Invalid input (e.g., missing/invalid email, missing companyId).
    *   Error (401): Unauthorized.
    *   Error (500): Failed to fetch user/company details or SendGrid API error.
    *   Error (503): SendGrid API key not configured.

## Authentication & Authorization

### Authentication Methods
- Email/Password authentication via Supabase Auth
- Google OAuth 2.0 integration
- JWT-based authentication with secure cookies
- CSRF protection for all API routes

### Role-Based Access Control
- **User Roles**:
  - `admin`: Full system access
  - `manager`: Company management access
  - `user`: Basic user access
  - `guest`: Limited read-only access

- **Permission Levels**:
  - `create`: Can create new resources
  - `read`: Can view resources
  - `update`: Can modify existing resources
  - `delete`: Can remove resources

### Security Measures
- Row Level Security in Supabase
- API route middleware for authorization
- Encrypted data transmission
- Rate limiting for sensitive operations
- Audit logging for all significant actions

## Service Architecture

### Core Services

#### UserService
- User authentication
- Profile management
- Role and permission handling
- User preferences

#### CompanyService
- Company data management
- Team member handling
- Business registration validation
- Company profile management

#### FinancialService
- Financial data processing
- Document analysis and extraction
- Key metrics calculation
- Historical data tracking

#### AnalysisService
- AI-powered financial analysis
- Risk assessment
- Credit scoring
- Trend identification
- Anomaly detection

#### FinancingService
- Financing needs management
- Provider matching
- Application preparation
- Offer comparison and evaluation

#### DocumentService
- Document storage and retrieval
- Format validation and normalization
- Data extraction
- Version control

#### IntegrationService
- External API connections
- Data import/export
- Webhook handling
- Third-party service communication

### Middleware Components

#### Authentication Middleware
- Validates JWT tokens
- Ensures proper authorization
- Handles session management
- Protects against common security threats

#### Validation Middleware
- Input sanitization
- Schema validation using Zod
- Error formatting
- Type checking

#### Logging Middleware
- Request/response logging
- Error tracking
- Performance monitoring
- Audit trail creation

#### Rate Limiting Middleware
- Protects against brute force attacks
- Limits API usage
- Prevents abuse
- IP-based tracking

## Data Processing

### Document Processing Pipeline
1. **Document Upload**: Secure handling of financial documents
2. **Validation**: Format checking and virus scanning
3. **Data Extraction**: Using AI to extract structured data
4. **Normalization**: Standardizing data format
5. **Analysis**: Financial metrics calculation
6. **Storage**: Secure document storage with encryption

### Financial Analysis Flow
1. **Data Collection**: From uploaded documents and manual input
2. **Preprocessing**: Data cleaning and normalization
3. **Feature Engineering**: Calculating financial ratios and metrics
4. **Model Application**: AI analysis models for financial health
5. **Result Generation**: Creating human-readable insights
6. **Recommendation Engine**: Suggesting financing options

### AI-Powered Processing
- **OpenAI Integration**: For financial text analysis and recommendations
- **Form Recognition**: For extracting data from financial statements
- **Semantic Analysis**: Understanding financing needs and requirements
- **Predictive Models**: For risk assessment and credit scoring
- **Embeddings**: For document search and similarity matching

## Error Handling

### Error Types
- **ValidationError**: Input validation issues
- **AuthenticationError**: Login or permission issues
- **ResourceNotFoundError**: Requested data not available
- **ProcessingError**: AI or integration processing failures
- **ExternalServiceError**: Issues with third-party services

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field with error",
      "reason": "Detailed explanation"
    },
    "requestId": "unique-request-id"
  }
}
```

### Monitoring and Alerts
- Error logging to Sentry
- Critical error notifications
- Trend analysis for recurring issues
- Automatic recovery for certain error types

## Performance Optimization

- API response caching
- Database query optimization
- Efficient AI model usage
- Background processing for heavy tasks
- CDN for static assets
- Serverless function scaling
