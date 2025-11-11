# CapitalBox API Data Model Mapping

This document maps the fields required by the CapitalBox API (`POST /applications/`) to the internal data model. The mapping considers the current implementation in `lib/services/lenders/CapitalBoxLenderService.ts`.

> **Important Security Note:** Sensitive personal data like national ID numbers and UBO information are collected in `Step7KycUbo.tsx` during the final submission step but are **NOT stored** in the database for security and privacy reasons. This data is held in memory only and forwarded directly to lenders during submission.

## Application Object

| CapitalBox Field         | Type   | Required? | Internal Source                         | Mapping Notes                                       |
|--------------------------|--------|-----------|----------------------------------------|-----------------------------------------------------|
| `loanAmount`             | Number | Yes       | `funding_applications.amount`          | Must be > 0.                                        |
| `desiredTerm`            | Number | No        | `funding_applications.term_months`     | Optional. In months.                                |
| `currency`               | String | Yes       | `lenderData.currency` or default "EUR" | ISO currency code.                                  |
| `loanPurpose`            | String | Yes       | `lenderData.purpose` or default "WORKING_CAPITAL" | Purpose of the loan.                    |
| `product`                | String | Yes       | Hardcoded "IL"                         | Type of loan product.                               |

## Business (Company) Object

| CapitalBox Field    | Type   | Required? | Internal Source                                           | Mapping Notes                                            |
|---------------------|--------|-----------|-----------------------------------------------------------|----------------------------------------------------------|
| `business_id`       | String | Yes       | `companies.business_id`                                  | Finnish business ID.                                     |
| `groupName`         | String | Yes       | `companies.name`                                         | Company name.                                            |
| `emailAddress`      | String | Yes       | `companies.contact_info.email` or fallback to applicant  | Company email, with fallback.                            |
| `mobilePhone`       | String | No        | `companies.contact_info.phone` or fallback to applicant  | Company phone, with fallback.                            |
| `businessAddress`   | String | No        | `companies.address.street` or empty string               | Street address.                                          |
| `city`              | String | No        | `companies.address.city` or empty string                 | City name.                                               |
| `country`           | String | No        | `companies.address.country` or default "FI"              | ISO country code.                                        |
| `postcode`          | String | No        | `companies.address.postal_code` or empty string          | Postal code.                                             |
| `revenue`           | Number | No        | `companies.metadata.financial_data.latest.revenue / 12`  | Monthly revenue (calculated from annual).                |
| `entityType`        | String | No        | `company.company_form`                                  | Legal form of the company.                               |

## Individual (Contact Person) Object

| CapitalBox Field   | Type   | Required? | Internal Source                                     | Mapping Notes                                               |
|--------------------|--------|-----------|-----------------------------------------------------|-------------------------------------------------------------|
| `personal_id`      | String | Yes       | **Transient data** from `Step7KycUbo.tsx`          | National ID number. Security-sensitive, not persisted to DB.|
| `firstName`        | String | Yes       | **Transient data** from `Step7KycUbo.tsx` or fallback to `lenderData.applicant_first_name` | First name of applicant.   |
| `lastName`         | String | Yes       | **Transient data** from `Step7KycUbo.tsx` or fallback to `lenderData.applicant_last_name`  | Last name of applicant.    |
| `email`            | String | Yes       | `lenderData.email` or fallback to `companies.contact_info.email` | Email address of applicant.            |
| `clientAddress`    | String | No        | `lenderData.address?.street` or empty string       | Street address of the applicant.                            |

## UBOs Array (Beneficial Owners)

UBO data is collected in `Step7KycUbo.tsx` at submission time but is not stored in the database for security and privacy reasons.

| CapitalBox Field | Type   | Required? | Internal Source                     | Mapping Notes                               |
|------------------|--------|-----------|-------------------------------------|--------------------------------------------|
| `personal_id`    | String | Yes*      | `Step7KycUbo` UBO form `nationalId` | National ID. Security-sensitive, transient. |
| `firstName`      | String | Yes*      | `Step7KycUbo` UBO form `firstName`  | First name of the UBO.                     |
| `lastName`       | String | Yes*      | `Step7KycUbo` UBO form `lastName`   | Last name of the UBO.                      |

*Required for each UBO entry if UBOs are provided, but the UBO array itself is optional.

## Documents Array

| CapitalBox Field | Type   | Required? | Internal Source         | Mapping Notes                          |
|------------------|--------|-----------|-------------------------|----------------------------------------|
| `name`           | String | Yes*      | `attachments[].name`    | Filename of the document.              |
| `contentType`    | String | Yes*      | `attachments[].type`    | MIME type of the document.             |
| `content`        | String | Yes*      | `attachments[].data`    | Base64 encoded document content.       |

*Required for each document entry if documents are provided, but the documents array itself is optional.

## Mapping Implementation

Current implementation in `CapitalBoxLenderService.ts`:

1. Extracts basic application fields from `lenderData` (passed by parent service)
2. Gets company details from Supabase using `companyId`
3. Extracts applicant details from `lenderData` (which includes data collected in Step7KycUbo)
4. Formats UBO list from `lenderData.ubo_list`
5. Formats attachments if available
6. Builds the request payload with all required and available optional fields
7. Adds signature for authentication
8. Makes the API request

## Required Data Elements for a Minimal Viable Application

Based on the CapitalBox API's requirements, these are the essential data elements:

### Application Data
* `loanAmount` - From `funding_applications.amount`
* `currency` - Default "EUR" or from `lenderData`
* `loanPurpose` - Default "WORKING_CAPITAL" or from `lenderData`
* `product` - Hardcoded "IL"

### Company Data
* `business_id` - From `companies.business_id`
* `groupName` - From `companies.name`
* `emailAddress` - From `companies.contact_info.email` or fallback

### Applicant Data
* `personal_id` - From `Step7KycUbo` form (transient, not stored)
* `firstName` - From `Step7KycUbo` form or `lenderData`
* `lastName` - From `Step7KycUbo` form or `lenderData`
* `email` - From `lenderData.email` or fallback

### Optional but Included If Available
* UBO data - From `Step7KycUbo` form (transient)
* Documents - From attachments array
* Company address details, revenue, entity type 