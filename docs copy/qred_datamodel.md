# Qred API Data Model Mapping

This document maps the fields required by the Qred Pre-offer API (`POST /application/pre-offer`) to the internal data model. The mapping considers the current implementation in `lib/services/lenders/QredLenderService.ts`.

> **Important Security Note:** Sensitive personal data like national ID numbers and UBO information are collected in `Step7KycUbo.tsx` during the final submission step but are **NOT stored** in the database for security and privacy reasons. This data is held in memory only and forwarded directly to lenders during submission.

## Top-Level Fields

| Qred Field      | Qred Type | Required? | Internal Source                                        | Mapping Notes                                      |
|-----------------|-----------|-----------|--------------------------------------------------------|----------------------------------------------------|
| `amount`        | Number    | Yes       | `funding_applications.amount`                          | Must be > 0. Stored as string in DB but needs to be a number here. |
| `term`          | Number    | No        | `funding_applications.term_months`                     | Doc: Optional. Integer.                            |
| `purposeOfLoan` | String    | No        | `financing_needs.purpose` or service input `userData.purpose` | Doc: Optional. Max 2000 chars. The application may have a comma-separated list of purposes; use the first one or combine. |
| `promoCode`     | String    | No        | *Not Mapped*                                          | Doc: Optional                                      |

## `applicant` Object

| Qred Field                     | Qred Type | Required? | Internal Source                                                  | Mapping Notes                                                                 |
|--------------------------------|-----------|-----------|------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `nationalIdentificationNumber` | String    | Yes       | **Transient data** collected in `Step7KycUbo.tsx`, NOT stored in DB | FI Format: `[0-9]{6}[-A][0-9]{3}[0-9A-Y]`. Security-sensitive data not persisted. |
| `email`                        | String    | Yes       | `profiles.email` (fallback to `userData.email` if passed)       | Must match Qred regex. Stored in `profiles` table, linked via `user_id`.      |
| `familyName`                   | String    | No        | `profiles.full_name` (split) or `userData.lastName` if passed   | Doc: Optional. Split from `full_name` if needed (takes last part).           |
| `givenName`                    | String    | No        | `profiles.full_name` (split) or `userData.firstName` if passed  | Doc: Optional. Split from `full_name` if needed (takes first part).          |
| `phone`                        | String    | No        | `userData.phone` (if passed in service input)                   | Doc: Optional. FI Format: >= 6 digits. Not explicitly stored in `profiles`.   |
| `politicallyExposedPerson`     | Boolean   | No        | `userData.isPep` (if passed) or transient from `Step7KycUbo`    | Doc: Optional. Defaults to `false` if missing. Not persistently stored.       |
| `additionalName`               | String    | No        | *Not Mapped*                                                    | Doc: Optional                                                                 |
| `allow_person_report_fetch`    | Boolean   | No        | *Not Mapped*                                                    | Doc: Optional. Could potentially add consent checkbox.                         |
| `dateOfBirth`                  | String    | No        | *Not Mapped* / Could be extracted from Finnish national ID      | Doc: Optional. Format YYYY-MM-DD. Could be extracted from national ID.        |
| `placeOfBirth`                 | String    | No        | *Not Mapped*                                                    | Doc: Optional. Not currently collected.                                       |

## `files` Array

*Note: The entire `files` array is optional according to the "Request body with required parameters" section.*

| Qred Field                | Qred Type      | Required? | Internal Source                     | Mapping Notes                          |
|---------------------------|----------------|-----------|-------------------------------------|----------------------------------------|
| `files[].base64Content`   | String         | No        | `attachments[].data` if available   | Doc: Optional. Base64 encoded file data. |
| `files[].encodingFormat`  | Array[String]  | No        | `attachments[].type` if available   | Doc: Optional. Wrapped in an array.    |
| `files[].filename`        | String         | No        | `attachments[].name` if available   | Doc: Optional                          |

## `organization` Object

| Qred Field                   | Qred Type      | Required? | Internal Source                                                       | Mapping Notes                                                                 |
|------------------------------|----------------|-----------|-----------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `nationalOrganizationNumber` | String         | Yes       | `companies.business_id`                                              | FI Format: `[0-9]{7}-[0-9]`. From query example: "2697826-9".               |
| `email`                      | String         | Yes       | `companies.contact_info.email` → `profiles.email` (fallback) → `userData.email` | Fallback logic for missing company contact info.                              |
| `currentMonthlyTurnover`     | String         | No        | 1. `companies.metadata.financial_data.latest.revenue / 12` (annual → monthly) <br>2. `financial_metrics.revenue / 12` <br>3. `userData.monthlyTurnover` | Doc: Optional. Max 50 chars. Need to convert annual figures to monthly. From sample data, annual revenue was "483500". |
| `phone`                      | String         | No        | `companies.contact_info.phone` → `userData.phone` (fallback)         | Doc: Optional. Fallback needed as company phone might be null.               |
| `iban`                       | String         | No        | *Not Mapped* / Not currently stored                                  | Doc: Optional. No dedicated field in company data.                            |
| `numberOfEmployees`          | String         | No        | `companies.employees` / `companies.metadata.enriched_data.personnel.count` | Doc: Optional. Sample shows `companies.employees` = 4.                        |
| `owners`                     | Array[Object]  | No        | **Transient data** collected in `Step7KycUbo.tsx`                    | Doc: Optional. Collected at submission time but NOT persisted to database.    |
| `url`                        | String         | No        | `companies.website` / `companies.metadata.enriched_data.website` / `companies.metadata.ytj_data.website` | Doc: Optional. Multiple potential sources in company data.                    |

## `owners` Array (within `organization`)

*Note: The entire `owners` array is optional according to the Qred API documentation.*

Owners data is collected in `Step7KycUbo.tsx` at submission time and passed to the lender service, but is not stored in the database for security and privacy reasons. The Qred service can pass this data if collected but it's optional.

| Qred Field                      | Qred Type | Source                                  | Notes                                               |
|---------------------------------|-----------|----------------------------------------|-----------------------------------------------------|
| `additionalName`                | String    | *Not collected*                         | Optional. Not currently in UBO form.                |
| `dateOfBirth`                   | String    | *Not collected*                         | Optional. Not currently in UBO form.                |
| `familyName`                    | String    | `Step7KycUbo` UBO form `lastName`       | Optional. Collected transiently.                    |
| `givenName`                     | String    | `Step7KycUbo` UBO form `firstName`      | Optional. Collected transiently.                    |
| `nationalIdentificationNumber`  | String    | `Step7KycUbo` UBO form `nationalId`     | Optional. Collected transiently.                    |
| `ownerShipPercent`              | Number    | *Not collected*                         | Optional. Not currently in UBO form.                |
| `placeOfBirth`                  | String    | *Not collected*                         | Optional. Not currently in UBO form.                |

## `politicallyExposedPersons` Array

*Note: The entire `politicallyExposedPersons` array is optional according to the Qred API documentation.*

This is not currently implemented in the Qred lender service. The form collects the applicant's PEP status but doesn't have a dedicated collection for PEP details or PEP relationships.

## Mapping Implementation

Current implementation in `QredLenderService.ts`:

1. Extracts basic application fields from `lenderData` (passed by parent service)
2. Gets company details from Supabase using `companyId`
3. Constructs the payload using a mix of:
   - Data passed in `lenderData` (which includes applicant details like nationalId)
   - Company data from the database
   - Financial data from metrics or metadata
4. Defaults or omits optional fields if not available

## Required Data Elements

Based on the Qred API's *explicitly required* fields for `POST /application/pre-offer`, these are the essential data elements:

*   `amount` - From `funding_applications.amount`
*   `applicant.nationalIdentificationNumber` - From `Step7KycUbo` form (transient, not stored)
*   `applicant.email` - From `profiles.email`
*   `organization.nationalOrganizationNumber` - From `companies.business_id`
*   `organization.email` - From `companies.contact_info.email` or fallback

Optional fields will be included if available but are not strictly required by the Qred API. 