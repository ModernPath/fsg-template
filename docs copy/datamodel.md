# Data Model

This document outlines the database schema for the Financial Services Group AI application, detailing entities, attributes, and relationships.

## Core Entities

### User
Represents system users with authentication and profile information.

```
Table: users
- id: UUID (PK)
- email: String (unique)
- created_at: Timestamp
- updated_at: Timestamp
- last_login: Timestamp (nullable)
- is_admin: Boolean (default: false)
```

### Profile
Extended user information.

```
Table: profiles
- id: UUID (PK)
- user_id: UUID (FK -> users.id)
- first_name: String
- last_name: String
- phone: String (nullable)
- job_title: String (nullable)
- company_id: UUID (FK -> companies.id) (nullable)
- company: String (nullable)
- username: String (unique)
- full_name: String
- avatar_url: String (nullable)
- website: String (nullable)
- bio: Text (nullable)
- created_at: Timestamp
- updated_at: Timestamp
- preferences: JSONB (user preferences)
- is_admin: Boolean (default: false)
```

### Company
Business entity information.

```
Table: companies
- id: UUID (PK)
- business_id: String (unique, Finnish business ID/Y-tunnus)
- name: String
- type: String (business type)
- founded: Date (nullable)
- employees: Integer (nullable)
- industry: String (nullable)
- website: String (nullable)
- address: JSONB
- contact_info: JSONB
- created_at: Timestamp
- updated_at: Timestamp
- created_by: UUID (FK -> users.id)
```

### Document Type
Categories for different types of documents in the system.

```
Table: document_types
- id: UUID (PK)
- name: String (unique)
- description: String (nullable)
- is_system_generated: Boolean (default: false)
- required_for_analysis: Boolean (default: false)
- created_at: Timestamp
```

### Document
Uploaded financial documents and system-generated analyses.

```
Table: documents
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- document_type_id: UUID (FK -> document_types.id)
- name: String
- description: String (nullable)
- file_path: String
- mime_type: String
- file_size: Integer
- fiscal_year: Integer (nullable)
- fiscal_period: String (nullable)
- uploaded_at: Timestamp
- processed: Boolean (default: false)
- processing_status: String (enum: 'pending', 'processing', 'completed', 'failed')
- extraction_data: JSONB (extracted document data)
- metadata: JSONB (additional document metadata)
- uploaded_by: UUID (FK -> users.id)
```

### Financing Needs
Company's financing requirements and goals.

```
Table: financing_needs
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- amount: Decimal
- currency: String (default: 'EUR')
- purpose: String
- time_horizon: String (enum: 'short_term', 'medium_term', 'long_term')
- urgency: String (enum: 'low', 'medium', 'high')
- description: Text
- requirements: JSONB
- created_at: Timestamp
- updated_at: Timestamp
- created_by: UUID (FK -> users.id)
```

### Financing Analysis
AI-generated financial analysis.

```
Table: financing_analysis
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- financial_metrics_id: UUID (FK -> financial_metrics.id)
- financing_need_id: UUID (FK -> financing_needs.id)
- analysis_data: JSONB
- risk_assessment: JSONB
- recommendations: JSONB
- status: TEXT
- error_message: TEXT
- document_ids: UUID[]
- completed_at: Timestamp
- created_at: Timestamp
- updated_at: Timestamp
```

### Financing Option
Generic financing option types.

```
Table: financing_options
- id: UUID (PK)
- name: String
- type: String (enum: 'loan', 'credit_line', 'investment', 'grant', 'other')
- description: Text
- requirements: JSONB
- typical_terms: JSONB
- provider_types: String[]
- active: Boolean
```

### Financing Provider
Organizations providing financing.

```
Table: financing_providers
- id: UUID (PK)
- name: String
- type: String (enum: 'bank', 'investor', 'government', 'ngo', 'other')
- description: Text
- website: String (nullable)
- api_integration: Boolean (default: false)
- contact_info: JSONB
- available_options: String[] (FK references to financing_options)
- active: Boolean
- created_at: Timestamp
- updated_at: Timestamp
```

### Financing Application
Represents a user-submitted application for funding based on recommendations.

```
Table: funding_applications
- id: UUID (PK)
- company_id: UUID (FK -> companies.id, NOT NULL)
- funding_recommendation_id: UUID (FK -> funding_recommendations.id, nullable)
- user_id: UUID (FK -> auth.users.id, NOT NULL)
- amount: NUMERIC (NOT NULL)
- currency: VARCHAR (default: 'EUR')
- term_months: INTEGER (NOT NULL)
- applicant_details: JSONB (NOT NULL) -- Includes name, address, SSN etc.
- attachments: JSONB (nullable) -- Array of attachment objects {filename: string, path: string, type: string}
- status: String (enum: 'draft', 'submitted', 'processing', 'approved', 'rejected', 'withdrawn', default: 'draft')
- submitted_at: TIMESTAMPTZ (nullable)
- created_at: TIMESTAMPTZ (default: now())
- updated_at: TIMESTAMPTZ (default: now())
```

### Financing Offer
Offers received from financing providers.

```
Table: financing_offers
- id: UUID (PK)
- application_id: UUID (FK -> financing_applications.id)
- provider_id: UUID (FK -> financing_providers.id)
- status: String (enum: 'pending', 'offered', 'accepted', 'declined', 'expired')
- amount: Decimal
- currency: String (default: 'EUR')
- terms: JSONB (includes interest rate, term length, collateral, etc.)
- valid_until: Timestamp
- offer_document_path: String (nullable)
- received_at: Timestamp
- response_deadline: Timestamp
- notes: Text
- created_at: Timestamp
- updated_at: Timestamp
```

### AI Analysis Log
Tracks AI processing for auditing and improvement.

```
Table: ai_analysis_logs
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- analysis_type: String
- input_data: JSONB
- output_data: JSONB
- model_used: String
- processing_time: Integer (in milliseconds)
- success: Boolean
- error_message: Text (nullable)
- created_at: Timestamp
```

### Financial Metrics
Detailed financial metrics for companies extracted from financial documents. Now also includes fields formerly in `financial_data`.

```
Table: financial_metrics
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- fiscal_year: Integer
- fiscal_period: String (default: 'annual')

- operational_cash_flow: Decimal
- investment_cash_flow: Decimal
- financing_cash_flow: Decimal
- return_on_equity: Decimal (ROE %)
- debt_to_equity_ratio: Decimal (D/E)
- quick_ratio: Decimal
- current_ratio: Decimal
- asset_structure_percent: Decimal (% Fixed Assets)
- revenue_current: Decimal
- revenue_previous: Decimal
- revenue_growth_rate: Decimal (%)
- accounts_receivable_turnover_days: Integer
- bad_debt_ratio: Decimal (%)
- fixed_asset_turnover: Decimal
- total_fixed_assets: Decimal
- investment_allocation: JSONB (short-term vs long-term)

- data_source: String (enum: 'uploaded', 'api', 'manual')
- status: String (enum: 'draft', 'complete', 'verified')
- financial_statements: JSONB
- key_metrics: JSONB

- created_at: Timestamp
- updated_at: Timestamp
- created_by: UUID (FK -> users.id)
- source_document_ids: UUID[] (Array of document IDs used for analysis)
- funding_recommendations_id: UUID (FK -> funding_recommendations.id)
```

### Future Goals
Company's future growth plans and funding needs.

```
Table: future_goals
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- required_working_capital_increase: Decimal
- inventory_personnel_resource_needs: Text
- investment_priorities: Text
- estimated_investment_amounts: Decimal
- cost_structure_adaptation: Text
- created_at: Timestamp
- updated_at: Timestamp
- created_by: UUID (FK -> users.id)
```

### Funding Recommendations
AI-generated funding recommendations based on financial metrics and future goals.

```
Table: funding_recommendations
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- financial_metrics_id: UUID (FK -> financial_metrics.id)
- future_goals_id: UUID (FK -> future_goals.id)
- optimal_funding_types: funding_type[] (Enum array: 'short_term', 'medium_term', 'long_term', 'leasing', 'factoring', 'equity')
- funding_justification: Text
- risk_mitigation_measures: Text
- liquidity_optimization_recommendations: JSONB
- created_at: Timestamp
- updated_at: Timestamp
- model_version: String
- confidence_score: Decimal (AI confidence in recommendations, 0-1)
```

### Analysis Jobs
Tracks background analysis jobs triggered via API or other processes.

```
Table: analysis_jobs
- id: UUID (PK)
- company_id: UUID (FK -> companies.id)
- status: TEXT (e.g., 'pending', 'processing', 'completed', 'failed')
- requested_by: TEXT (e.g., 'API Trigger', User ID string)
- document_count: INTEGER
- processing_count: INTEGER
- details: jsonb (e.g., { "documentIds": [...] })
- error_message: TEXT
- created_at: Timestamp
- updated_at: Timestamp
```

## Relationships

1. **Users & Profiles**: One-to-one relationship
   - A user has exactly one profile
   - A profile belongs to one user

2. **Users & Companies**: Many-to-many relationship through Profiles
   - A user can be associated with multiple companies (for consultants/advisors)
   - A company can have multiple users

3. **Companies & Documents**: One-to-many relationship
   - A company has multiple documents
   - Each document belongs to one company

4. **Document Types & Documents**: One-to-many relationship
   - A document type can be associated with multiple documents
   - Each document is of one specific document type

5. **Companies & Financial Metrics**: One-to-many relationship
   - A company has multiple financial metrics entries (different years/periods)
   - Each financial metrics entry belongs to one company

6. **Companies & Financing Needs**: One-to-many relationship
   - A company can have multiple financing needs
   - Each financing need belongs to one company

7. **Financing Needs & Applications**: One-to-many relationship
   - A financing need can have multiple applications (to different providers)
   - Each application is tied to one financing need

8. **Financing Applications & Offers**: One-to-many relationship
   - An application can receive multiple offers (e.g., counter-offers)
   - Each offer is tied to one application

9. **Companies & Financial Metrics**: One-to-many relationship
   - A company has multiple financial metrics entries (different years/periods)
   - Each financial metrics entry belongs to one company

10. **Companies & Future Goals**: One-to-many relationship
   - A company can have multiple future goals entries over time
   - Each future goals entry belongs to one company

11. **Financial Metrics & Funding Recommendations**: One-to-many relationship
   - A financial metrics entry can be associated with multiple funding recommendations
   - Each funding recommendation is based on a specific financial metrics entry

12. **Future Goals & Funding Recommendations**: One-to-many relationship
   - A future goals entry can be associated with multiple funding recommendations
   - Each funding recommendation takes into account a specific future goals entry

13. **Documents & Financial Metrics**: Many-to-many relationship
   - Multiple documents can be used to generate a financial metrics entry
   - A financial metrics entry can reference multiple source documents

14. **Financial Metrics & Financing Analysis**: One-to-many relationship
   - A financial metrics entry can be the basis for multiple financing analyses.
   - Each financing analysis references one financial metrics entry (nullable).

15. **Financing Needs & Financing Analysis**: One-to-many relationship
    - A financing need can be analyzed multiple times.
    - Each financing analysis references one financing need (nullable).

16. **Companies & Analysis Jobs**: One-to-many relationship
    - A company can have multiple analysis jobs tracked over time.
    - Each analysis job belongs to one company.

17. **Companies & Funding Application**: One-to-many relationship
    - A company can have multiple funding applications.
    - Each funding application belongs to one company.

18. **Funding Recommendations & Funding Application**: One-to-many relationship
    - A funding recommendation can lead to multiple applications (potentially variations).
    - Each funding application is linked to one specific recommendation (if applicable).

19. **Users & Funding Application**: One-to-many relationship
    - A user can create multiple funding applications.
    - Each funding application belongs to one user.

## Database Security

### Row Level Security Policies

1. **User Data Protection**
   - Users can only access their own profile information
   - Admins can access all user profiles

2. **Company Data Protection**
   - Users can only access companies they're associated with
   - Users can only create, update, and delete companies they created
   - Admins can access all company data

3. **Document Security**
   - Documents are only accessible to users associated with the company
   - Upload and edit actions limited to company users
   - Document types are viewable by all authenticated users

4. **Financial Metrics, Analysis & Recommendations Security**
   - Users can only view financial metrics, analyses, and recommendations for their companies
   - Financial metrics can only be inserted/updated by authenticated users (or service role) for their companies
   - Service role can manage all financial metrics, analyses, and recommendations
   - Added policies for `analysis_jobs` (view for users, manage for service role)

### Column Encryption
Sensitive data is encrypted at rest using Supabase Column Encryption:

- Personal information in profiles
- Financial statements data
- Application details
- Offer terms

## Enums

The system uses the following custom enum types:

1. **cash_flow_type**: 'operational', 'investment', 'financing'
2. **funding_type**: 'short_term', 'medium_term', 'long_term', 'leasing', 'factoring', 'equity'

### Table: `financing_needs`

Stores user-provided descriptions of their company's financing needs and the LLM-parsed structured data derived from it.

**Columns:**

*   `id`: UUID (Primary Key)
*   `company_id`: UUID (Foreign Key -> `companies.id`, NOT NULL)
*   `created_by`: UUID (Foreign Key -> `auth.users.id`, nullable) - User who submitted the needs.
*   `amount`: NUMERIC (nullable) - Estimated amount needed (parsed by LLM).
*   `currency`: VARCHAR (nullable) - Currency code (e.g., 'EUR') (parsed by LLM).
*   `purpose`: TEXT (nullable) - Summary of the purpose (parsed by LLM).
*   `time_horizon`: TEXT (nullable) - Estimated timeframe (e.g., '0-6 months') (parsed by LLM).
*   `urgency`: TEXT (nullable) - Urgency level (e.g., 'High', 'Medium', 'Low') (parsed by LLM).
*   `description`: TEXT (nullable) - Raw description text entered by the user.
*   `requirements`: JSONB (nullable) - Structured key requirements/points (parsed by LLM).
*   `created_at`: TIMESTAMPTZ (default: `now()`)
*   `updated_at`: TIMESTAMPTZ (default: `now()`)

---

### Table: `funding_recommendations`

Stores AI-generated funding recommendations based on financial metrics and financing needs.

**Columns:**

*   `id`: UUID (Primary Key)
*   `company_id`: UUID (Foreign Key -> `companies.id`, NOT NULL)
*   `financing_needs_id`: UUID (Foreign Key -> `financing_needs.id`, nullable) - Links to the specific needs that triggered this recommendation.
*   `future_goals_id`: UUID (Foreign Key -> `future_goals.id`, nullable) - (Potentially legacy, review if needed).
*   `metrics_snapshot`: JSONB (nullable) - Snapshot of `financial_metrics` used for generation.
*   `recommendation_details`: JSONB (nullable) - Structured array of recommendations (type, rationale, details).
*   `summary`: TEXT (nullable) - LLM-generated summary of the company's financial situation.
*   `analysis`: TEXT (nullable) - LLM-generated analysis of financing needs.
*   `action_plan`: TEXT (nullable) - LLM-generated action plan.
*   `outlook`: TEXT (nullable) - LLM-generated future outlook and advice.
*   `raw_llm_response`: TEXT (nullable) - Raw response from the LLM for debugging.
*   `model_version`: TEXT (nullable) - Identifier for the LLM version used.
*   `confidence_score`: NUMERIC (nullable) - Model's confidence score (if available).
*   `created_at`: TIMESTAMPTZ (default: `now()`)
*   `updated_at`: TIMESTAMPTZ (default: `now()`)

---

### Table: `analysis_jobs`
