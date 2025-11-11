openapi: 3.1.0
info:
  title: CapitalBox Sales API
  x-logo:
    url: https://www.capitalbox.com/sites/default/files/cb_logo%20%281%29.png
    backgroundColor: '#00208B'
    altText: CapitalBox AB
    href: https://api.capitalbox.com/
  description: |-
    This API allows Users to post customer applications and receive Loan offers in a fully automated processes.

    Documentation is based on the OpenAPI 3.0 specification standard for ease of implementation in any language.

    # About

    This is a technical document describing the CapitalBox Sales API.
    Purpose of the Sales API service is to receive and handle data from external source (outside CapitalBox network).
    The service has a set of strict rules and data validation, provides Users with possible errors or mistakes for debugging on failed attempts.
    Live event tracking is performed using Webhooks which are mandatory to use in fully integrated sales process.

    Communication and data requirements are stated on the next chapters. Testing and production credentials are given by our personnel.

    # Changelog

    | Version | Description                     | Date       |
    |---------|---------------------------------|------------|
    | 2.00.1  | Stable v2 release to Production | 2024-02-26 |
    | 1.xx.x  | Development of v1 discontinued  | 2024-01-08 |
  version: 2.0.1
servers:
  - url: https://{HOSTNAME}/api/sales/v2
    variables:
      HOSTNAME:
        default: www
        description: country-specific host name URL
security:
  - BasicAuth: []
    Signature: []
tags:
  - name: Introduction
    description: |
      As depicted in the sequence diagram below, there are multiple types of allowed requests depending on the level of integration and used process flow.

      *POST* loan application data to which the system responds with a success message and provides the created application *UUID* or an error message with reason. 
        Application resource field `returnOffers` controls if API User is expecting a fully integrated sales process (i.e. broker comparison websites, etc.).
        If `returnOffers` is set to:
        - `true`, then CapitalBox will send a Webhook to your Listener when Offers are available, to present to your Customers;
        - `false`, then your job is already completed with submitting the application, no additional actions needed. 

      Additional documentation on customer can be provided using *Files* resource, uploading Bank Account statements, etc. 

      In fully integrated scenario, **after receiving webhook notification** API user must select one of provided Offers, 
      confirmation sent to API with *offer UUID* and that action provides permission to us to directly contact the Customer and complete Sales process (AML, KYC, Contracts, etc.)

      ![Financing application sequence](../assets/img/application_sequence.png)

      ## Basic integration flow

      Basic integration flow expects only initial application data submission over API. 

      Once the data is submitted, CapitalBox handles all further steps of the loan application, contract signing and loan disbursement by contacting the client directly.

      API user's actions consists of the following steps:
      1. **POST** [financing application](#tag/Applications/operation/addApplication) containing:
          - application information
          - business details
          - applicant information
          - business UBO details
      2. optionally, listen for webhooks for application status updates (approval or rejection)
      3. optionally, **POST** [files needed for processing](#tag/Files/operation/uploadFileUnderApplication), such as financial statements or 
      [submit AML form](#tag/AML-Forms/operation/submitAmlForms).

      ## Full integration flow

      Full integration flow coordinates the whole sales process with the API user and requires some API user's actions after initial application submission.
      The precise split of responsibilities is agreed upon during the API user's onboarding and not necessarily all actions listed below are required.

      Fully integrated API user's actions consists of the following steps:
      1. **POST** [financing application](#tag/Applications/operation/addApplication) containing `returnOffers == true` parameter and application data:
          - application information
          - business details
          - applicant information
          - business UBO details
      2. listen for webhooks notifying about application status updates (approval or rejection)
      3. listen for `offersCreated` webhook 
      4. **GET** [all approved offers](#tag/Offers/operation/getOffersByApplicationId) available to choose from (one of multiple available products may be chosen)
      5. **PATCH** [selected offer](#tag/Offers/operation/patchOfferByID) to choose the one to proceed with
      6. if agreed on signing flow, listen for `contractReady` webhook notifying about contract prepared for signing:
         1. **GET** the [contract contents](#tag/Contracts/operation/getContract) for signing
         2. perform contract signing on your end
         3. **POST** [signed contract](#tag/Files/operation/uploadFileUnderApplication) to complete the signing procedure
      7. if agreed on disbursement flow, **POST** request to [initiate the disbursement](#tag/Disbursements/operation/disburseLoan)
      8. listen for `loanDisbursed` webhook

      ## Additional action sequences

      ### File upload

      File upload resource is used on the following cases:
      - additional financial documents are readily available and may be submitted immediately after application submission to speed up the processing
      - additional financial documents are requested by CapitalBox underwriters to approve the application ant provide final offers
      - special application flow is agreed upon with the API user and process-related documents need to be uploaded to proceed with the financing, e.g. loan contract signed on API user's end

      The file upload sequence diagram is provided below.

      ![File upload sequence](../assets/img/file_upload_sequence.png)

      ### AML form submission

      AML form submission resource is used whenever the API user has one of the following goals:
      - speed up loan application processing and submit the required AML form immediately after the application submission
      - handle most (or all) of the communication with the client without CapitalBox direct contact to the customer

      The AML form submission sequence diagram is provided below.

      ![AML form submission sequence](../assets/img/aml_form_submission_sequence.png)

      ### Batch processing

      Batch processing is used for special agreements with selected API users on multiple business entity submission processing for various purposes.

      Currently supported batch process is pre-offer processing to filter out applicants which would not pass minimum financing application requirements.

      The sequence diagram for batch request handling is provided below

      ![Batch processing sequence](../assets/img/batch_processing_sequence.png)
    x-traitTag: true
  - name: Communication
    description: |-
      Every API user is provided with the following credentials (two sets: for production and sandbox environments):
      * Basic authentication credentials:
        * **username**
        * **password**
      * Request signing credentials:
        * **private key**

      **All** API calls must use _all credentials_, i.e. all resource access paths are authenticated and requests must be signed.  

      ## Signing requests

      All requests made to the API must be signed by generating a request signature (hash) using `SHA-256` algorithm.

      To do that, your private *KEY*, resource *URL* and *Raw JSON payload* are concatenated into a single string and hashed using `SHA-256`.
      The result is the signature, which has to be added to the `Signature` header.

      ---

      **POST** request signing *pseudocode*:
      ```javascript
      URL = "https://" + HOSTNAME + "/api/sales/v2/" + RESOURCE + "/";

      SIGNATURE = sha256_hash_function(KEY + URL + RAW_JSON);
      ```
      ---

      **PATCH | PUT** request signing *pseudocode* (has both payload and resource id in path):
      ```javascript
      URL = "https://" + HOSTNAME + "/api/sales/v2/" + RESOURCE + "/" + UUID + "/";

      SIGNATURE = sha256_hash_function(KEY + URL + RAW_JSON);
      ```
      ---

      **GET | DELETE** request signing *pseudocode* (there is no payload, thus only resource path is signed):
      ```javascript
      URL = "https://" + HOSTNAME + "/api/sales/v2/" + RESOURCE + "/" + UUID + "/";

      SIGNATURE = sha256_hash_function(KEY + URL);
      ```
      ---

      **IMPORTANT:**
      1. Raw JSON payload should not have unnecessary whitespace (non-pretty-print JSON)
      3. All URLs must have trailing slash:
         * **incorrect requests:**
           * `POST .../api/sales/v2/applications`
           * `GET .../api/sales/v2/offers/440e8400-a29b-22d4-a716-886655440011`
         * **correct requests:**
           * `POST .../api/sales/v2/applications/`
           * `GET .../api/sales/v2/offers/440e8400-a29b-22d4-a716-886655440011/`

      ## Adding authentication to requests

      Below is an example in *pseudocode* to set up parameters to make a POST request, where username and password is set for basic auth and signature is provided in request headers.

      ```javascript
      options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Signature': signature
          },
          auth: 'USERNAME' + ':' + 'PASSWORD'
      };

      https.request(URL, options)
      ```

      ## Webhooks

      Some API operations respond with `201` code instead of instant response providing actionable data.
      In such cases the completion of asynchronous operation is communicated via webhooks. Details of the relevant webhook are provided under corresponding section as an `EVENT` description.

      Webhook subscription must be coordinated with CapitalBox IT - there is no option to create or modify subscription on demand via API.

      None of the webhooks are carrying sensitive data - the contents are event type and uuid of related resource which could be used in `GET` request to retrieve full results.
      Webhook requests are sent with bearer token under `Authorization` header, which will be provided by IT support during onboarding., e.g.:
      ```
      Authorization: Bearer Fcr7Pl5ZyHGzJ6jSsOEfgQpeNbX1uT2x
      ```

      All webhooks which the API user might want to subscribe to are listed under [Webhooks section](#tag/Webhooks)

      ## Request rate limiting

      Regular operational request rate is generally not limited (unless unusually high activity is noticed), however, to prevent API abuse,
      repeated identical requests are limited and would result in error response, unless cool-down period has passed.

      To avoid hitting request rate limit:
       * do not attempt regular polling to *GET* a resource before receiving webhook notification according to process flow
       * make sure you have implemented measures to prevent form resubmission if you are forwarding your client's form submission under your website to this API
       * do not poll for API status excessively. Our API has high availability and whenever temporary API outage is expected, we would contact you
       * POST requests must always be unique. If there is a need to repeat a request, it can only be done after 1 hour. For testing purposes, ensure that content is randomized in order to test correctly.
    x-traitTag: true
  - name: Sandbox
    description: |-
      A testing environment to simulate any sales scenario without the need of CapitalBox employees.

      Automated scoring results are generated randomly, so we recommend to perform at least 5-15 tests with various parameters before proceeding to Production.

      ! CURRENTLY UNAVAILABLE !
    x-traitTag: true
  - name: Leads
    description: Actions related to lead handling
  - name: Applications
    description: |-
      Actions related to financing application handling.

      Resource related to the following webhooks:
      * **[applicationReceived](#tag/Webhooks/operation/applicationReceived)** - once application is received
      * **[applicationDeclined](#tag/Webhooks/operation/applicationDeclined)** - if application is declined
      * **[applicationWithdrawn](#tag/Webhooks/operation/applicationWithdrawn)** - if application is withdrawn by the API user or the client
  - name: Offers
    description: |
      Actions related to loan offers provided by CapitalBox for previously submitted applications.

      Resource related to the following webhooks:
      * **[offersCreated](#tag/Webhooks/operation/offersCreated)** - once application is approved and offers are created
      * **[offersUpdated](#tag/Webhooks/operation/offersUpdated)** - if offer(s) are updated, e.g. offer is accepted
  - name: Files
    description: |-
      Upload various files related to Applications and/or customers. 
      Attachments can be uploaded once an application is successfully submitted, because Application UUID is mandatory for each upload.

      **Limitations apply to the file upload:**
      + A **single file is uploaded** with a single request
      + A single file must **not be larger than 8MB**
      + File contents **must be encoded in `Base64`** before being added to the request payload
      + Valid MIME Types and file extensions are listed under [Accepted MIME Types for file uploads](#tag/Enumerations/Accepted-MIME-Types-for-file-uploads) section
  - name: AML Forms
    description: Submit AML form required by CapitalBox policy in a fully automated sales process. Not mandatory for simple API integrations.
  - name: Contracts
    description: |
      Specialized contract generator that is used to share eligibility of signing contracts with a custom Bank level method. Limited usage.

      Resource related to the following webhooks:
      * **[contractReady](#tag/Webhooks/operation/contractReady)** - once contract is ready for signing
      * **[contractSigned](#tag/Webhooks/operation/contractSigned)** - if contract signing is complete
      * **[contractFailed](#tag/Webhooks/operation/contractFailed)** - if contract signing has failed
  - name: Batch Processing
    description: |-
      Mass processing for specific use cases:
      - pre-offers based on revenue data (`PREOFFER`)
      - batch payouts (`PAYOUT`)

      Resource related to the following webhooks:
      * **[batchCompleted](#tag/Webhooks/operation/batchCompleted)** - once the batch has been processed
  - name: Disbursements
    description: |-
      Disbursements resource is used to initiate disbursement of a recently sold loan and activate loan account for integrations which require explicit API user's action to trigger the disbursement.

      Actions available only for applications which have been previously approved, the offer accepted by the client and contract signed by the applicant and related parties.

      Resource related to the following webhooks:
      * **[loanDisbursed](#tag/Webhooks/operation/loanDisbursed)** - once the loan has been disbursed
  - name: Repayments
    description: |
      Repayments resource is used to submit client's repayments for automated booking. This requires special alignment of accounting within partnership agreement.
  - name: E-invoices
    description: |-
      Provides e-invoice management capabilities to be used in factoring:
      * retrieve the status and details of a specific e-invoice
      * update status of the e-invoice to discard it or deliver to the debtor
  - name: Status
    description: Status endpoint to check on both API and dependencies
  - name: Enumerations
    description: "## Products\n\nThe table below contains all products available to request financing over the CapitalBox Sales API.\n\n| Product code | Product name            | Description                                                                                                                                                    |\n|--------------|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|\n| `CL`         | Credit Line             | Revolving line of credit, which allows the business to withdraw funds repeatedly within set maximum limit and settle the balance at any time                   |\n| `IL`         | Instalment Loan         | Loan with a set number of scheduled payments. Outstanding principal balance may be settled at any time without additional fees                                 |\n| `PF`         | Purchase Financing      | Loan with a set number of scheduled payments. Outstanding principal balance may be settled at any time without additional fees                                 |\n| `RBF`        | Revenue-based Financing | Revenue-based financing provides an instalment loan which is repaid via automated transactions taking a portion of revenue processed via merchant's POS system |\n| `FL`         | Factoring Loan          | Business invoice financing (Factoring)                                                                                                                         |\n\n\n## Business entity type\n\nA specific set of business entity types are accepted. Table below maps the enumeration values to corresponding local entity types.\n** API accepts only English values!*\n\n| <div style=\"width:162px\">Field `entityType` value</div> | Finland                          | Sweden         | Denmark                        | Netherlands         | Lithuania                |\n|---------------------------------------------------------|----------------------------------|----------------|--------------------------------|---------------------|--------------------------|\n| `Sole Proprietorship`                                   | Yksityinen elinkeinonharjoittaja | Enskild firma  | Enkeltmandsvirksomhed          | Eenmanszaak         | Individuali įmonė        |\n| `Limited Company`                                       | Osakeyhtiö                       | Aktiebolag     | Selskab med begrænset hæftelse | Limited Company     | Uždaroji akcinė bendrovė |\n| `General Partnership`                                   | Avoin yhtiö                      | Handelsbolag   | I/S (Interessentskab)          | General Partnership | -                        |           \n| `Limited Partnership`                                   | Kommandiittiyhtiö                | Kommanditbolag | K/S (Kommanditselskab)         | Limited Partnership | -                        |           \n| `Other`                                                 | -                                | -              | -                              | -                   | -                        |\n\n## Accepted MIME Types for file uploads\n\nEach uploaded file is analysed to check MIME type and determine whether the file type is permitted as an upload. Only following MIME types will be accepted by the API:\n\n| MIME Type                                                                 | Extensions                 | Description                                              |\n|---------------------------------------------------------------------------|----------------------------|----------------------------------------------------------|\n| `text/plain`                                                              | `txt`, `swi`, `940`, `sta` | Text, (ASCII or UTF-8)                                   |\n| `text/tab-separated-values`                                               | `tab`, `tsv`               | Tab-separated values within text file (ASCII or UTF-8)   |\n| `text/csv`                                                                | `csv`                      | Comma-separated values within text file (ASCII or UTF-8) |\n| `text/xml`                                                                | `xml`                      | XML file                                                 |\n| `application/xml`                                                         | `xml`                      | XML file                                                 |\n| `image/jpeg`                                                              | `jpg`, `jpeg`              | JPEG images\t                                             |\n| `image/jpg`                                                               | `jpg`, `jpeg`              | JPEG images                                              |\n| `image/png`                                                               | `png`                      | Portable Network Graphics                                |\n| `application/pdf`                                                         | `pdf`                      | Adobe Portable Document Format (PDF)                     |\n| `application/msword`                                                      | `doc`                      | Microsoft Word document                                  |\n| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `docx`                     | Microsoft Word document (OpenXML)                        |\n| `application/vnd.ms-excel`                                                | `xls`                      | Microsoft Excel spreadsheet                              |\n| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`       | `xlsx`                     | Microsoft Excel spreadsheet (OpenXML)                    |\n| `application/vnd.oasis.opendocument.text`                                 | `odt`                      | OpenDocument text document                               |\n| `application/vnd.oasis.opendocument.spreadsheet`                          | `ods`                      | OpenDocument spreadsheet document                        |\n| `application/json`                                                        | `json`                     | JSON format                                              |\n| `application/ld+json`                                                     | `jsonld`                   | JSON-LD format                                           |\n\n## Industry types\n\nIndustry type definitions follow ISIC code top-level classification. See the definitions below.\n\n| Code | Description                                                                                                                   |\n|------|-------------------------------------------------------------------------------------------------------------------------------|\n| A    | Agriculture, forestry and fishing                                                                                             |\n| B    | Mining and quarrying                                                                                                          |\n| C    | Manufacturing                                                                                                                 |\n| D    | Electricity, gas, steam and air conditioning supply                                                                           |\n| E    | Water supply; sewerage; waste management and remediation activities                                                           |\n| F    | Construction                                                                                                                  |\n| G    | Wholesale and retail trade; repair of motor vehicles and motorcycles                                                          |\n| H    | Transporting and storage                                                                                                      |\n| I    | Accommodation and food service activities                                                                                     |\n| J    | Information and communication                                                                                                 |\n| K    | Financial and insurance activities                                                                                            |\n| L    | Real estate activities                                                                                                        |\n| M    | Professional, scientific and technical activities                                                                             |\n| N    | Administrative and support service activities                                                                                 |\n| O    | Public administration and defense; compulsory social security                                                                 |\n| P    | Education                                                                                                                     |\n| Q    | Human health and social work activities                                                                                       |\n| R    | Arts, entertainment and recreation                                                                                            |\n| S    | Other services activities                                                                                                     |\n| T    | Activities of households as employers; undifferentiated goods - and services - producing activities of households for own use |\n| U    | Activities of extraterritorial organizations and bodies                                                                       |\n"
    x-traitTag: true
  - name: Data Formats
    description: |-
      ## Date and time formats

      All date and time fields use ISO formatting (YYYY-mm-dd HH:mm:ss). Date is separated from time by *space*, time uses 24-hour format.
      API expects date and datetime values to correspond to the timezone corresponding to integration's country.

      Valid date and datetime formats shown below:

      | Field type | Format pattern                          | Example               |
      |------------|-----------------------------------------|-----------------------|
      | Date       | `^\d{4}-\d{2}-\d{2}$`                   | `2023-12-31`          |
      | Datetime   | `^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$` | `2023-12-31 14:02:59` |

      ## Phone number

      Phone number must use international format with leading `+` sign followed by digits (country code and phone number) without spaces or special characters.

      | Field type | Format pattern                          | Example               |
      |------------|-----------------------------------------|-----------------------|
      | Phone      | ` ^(\+)[1-9][0-9]{7,15}$`               | `+3701234567`         |

      ## personal_id

      `personal_id` is used under **Individual** object posted within application must meet formatting requirements depending on the market which the API integration is implemented in.

      | Country   | Format pattern                  | Example       |
      |-----------|---------------------------------|---------------|
      | Finland   | `^[0-9]{6}[+-A]{1}[0-9A-Z]{1}$` | `100190-003K` |
      | Sweden    | `^[0-9]{10,12}$`                | `9001011234`  |
      | Denmark   | `^[0-9]{6}[-][0-9]{4}$`         | `123456-1234` |
      | Lithuania | `^[0-9]{10,12}$`                | `36504030201` |

      ## business_id

      `business_id` is used under **Business** object posted within application must meet formatting requirements depending on the market which the API integration is implemented in.

      | Country     | Format pattern  | Example      |
      |-------------|-----------------|--------------|
      | Finland     | `^[0-9]{3,25}$` | `0123456789` |
      | Sweden      | `^[0-9]{3,25}$` | `0123456789` |
      | Denmark     | `^[0-9]{3,25}$` | `0123456789` |
      | Lithuania   | `^[0-9]{3,25}$` | `0123456789` |
      | Netherlands | `^[0-9]{8}$`    | `01234567`   |

      ## bankAccount

      `bankAccount` is used under **Loan Application** object and must meet formatting requirements depending on the market which the API integration is implemented in.

      All markets except **Sweden** and **Denmark** use IBAN. For the non-iban markets, the `bankAccount` field must contain *clearing code* and *account number* separated by a space.

      | Country     | Format pattern                  | Example                |
      |-------------|---------------------------------|------------------------|
      | Finland     | `^FI[0-9]{16}$`                 | `FI0123456789123456`   |
      | Sweden      | `^[0-9]{4,5} [0-9]{1,15}$`      | `1234 1234561`         |
      | Denmark     | `^[0-9]{4} [0-9]{4,10}$`        | `1234 123456789`       |
      | Lithuania   | `^LT[0-9]{18}$`                 | `LT012345678912345678` |
      | Netherlands | `^NL[0-9]{2}[A-Z]{4}[0-9]{10}$` | `NL12ABCD0123456789`   |
    x-traitTag: true
  - name: Schemas
    description: All schemas relevant for data payload exchange are listed below for quick reference.
    x-traitTag: true
  - name: Webhooks
    description: |
      All webhooks which API user may subscribe to are listed below.

      Many of the webhooks are necessary to successfully complete the financing application, 
      since some of the API actions are unavailable until a certain webhook is fired, e.g. GETting offers is only available after `offersCreated` webhook is fired.

      All webhook requests are sent using bearer authentication token specified within a header. Bearer token will be provided by IT support during onboarding.

      Sample authentication header provided below:
      ```
      Authorization: Bearer Fcr7Pl5ZyHGzJ6jSsOEfgQpeNbX1uT2x
      ```
externalDocs:
  description: Find out more about Swagger | OpenAPI 3.0
  url: https://swagger.io
paths:
  /leads/:
    post:
      tags:
        - Leads
      summary: Add new lead
      description: Add new lead
      operationId: addLead
      requestBody:
        description: Add new lead
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LeadForm'
        required: true
      responses:
        '201':
          description: Lead received.
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/LeadReceived'
              examples:
                application_accepted:
                  value:
                    uuid: 550e8400-e29b-41d4-a716-446655440000
                    timestamp: '2023-12-12 14:12:33'
                    payload:
                      id: 550e8400-e29b-41d4-a716-446655440000
                      received: true
                      accepted: true
                      reason: null
                  summary: Application has been accepted
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
      x-codeSamples:
        - lang: PHP
          source: |-
            <?php
            $USERNAME = 'yourUserName'; //your API user name
            $PASSWORD = 'yourPassword'; //your API user password
            $KEY = 'yourEncryptionKey'; //shared private key
            $HOSTNAME = 'yourHost'; //host is specific  to each implementation
            $URL = 'https://{$HOSTNAME}/api/sales/v2/applications/'; //request endpoint

            // JSON data to be sent in the request
            $request_payload = array(
                'application' => [
                    'loanAmount' => 10000.00,
                    'desiredTerm' => 12,
                    'loanPurpose' => 'Buying equipment',
                    'product' => 'IL'
                ],
                'business' => [
                    'business_id' => '1234567-8',
                    'groupName' => 'Stark Industries, Inc.',
                    'emailAddress' => 'noreply@capitalbox.com',
                    'mobilePhone' => '+3700000000'
                ],
                'individual' => [
                    'personal_id' => '131052-308T',
                    'firstName' => 'Tony',
                    'lastName' => 'Stark'
                ]
            );

            $raw_json = json_encode($request_payload);

            // Generate signature by signing concatenated URL and raw JSON data
            $signature = hash('sha256',$KEY . $URL . $raw_json);

            // Initialize cURL session
            $cs = curl_init();
            // Set cURL options
            curl_setopt($cs, CURLOPT_URL, $URL);
            curl_setopt($cs, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
            curl_setopt($cs, CURLOPT_USERPWD, "{$USERNAME}:{$PASSWORD}");
            curl_setopt($cs, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($cs, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Signature: ' . $signature
            ]);
            curl_setopt($cs, CURLOPT_POSTFIELDS, $raw_json);


            // Execute cURL session and store the result
            $response = curl_exec($cs);

            // Check for cURL errors
            if (curl_errno($cs)) {
                echo 'Curl error: ' . curl_error($cs);
            }

            // Close cURL session
            curl_close($cs);

            // Process the response
            if ($response) {
                // Handle the response
                echo 'Response: ' . $response;
            } else {
                // Handle the case when there is no response
                echo 'No response received';
            }
        - lang: Ruby
          source: |-
            require 'net/http'
            require 'uri'
            require 'json'
            require 'openssl'

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = "https://#{HOSTNAME}/api/sales/v2/applications/"

            # JSON data to be sent in the request
            request_payload = {
              'application' => {
                'loanAmount' => 10000.00,
                'desiredTerm' => 12,
                'loanPurpose' => 'Buying equipment',
                'product' => 'IL'
              },
              'business' => {
                'business_id' => '1234567-8',
                'groupName' => 'Stark Industries, Inc.',
                'emailAddress' => 'noreply@capitalbox.com',
                'mobilePhone' => '+3700000000'
              },
              'individual' => {
                'personal_id' => '131052-308T',
                'firstName' => 'Tony',
                'lastName' => 'Stark'
              }
            }

            raw_json = JSON.generate(request_payload)

            # Generate signature token by signing raw JSON data
            signature = OpenSSL::Digest::SHA256.hexdigest(KEY + URL + raw_json)

            # Initialize Net::HTTP session
            uri = URI.parse(URL)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = true

            # Set HTTP request and headers
            request = Net::HTTP::Post.new(uri.path)
            request.basic_auth(USERNAME, PASSWORD)
            request['Content-Type'] = 'application/json'
            request['Signature'] = signature
            request.body = raw_json

            # Execute HTTP request and store the result
            response = http.request(request)

            # Process the response
            if response.is_a?(Net::HTTPSuccess)
              puts 'Response: ' + response.body
            else
              puts 'HTTP error: ' + response.code + ' ' + response.message
            end
        - lang: Python
          source: |
            import requests
            import json
            import hashlib

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = f'https://{HOSTNAME}/api/sales/v2/applications/'

            # JSON data to be sent in the request
            request_payload = {
                'application': {
                    'loanAmount': 10000.00,
                    'desiredTerm': 12,
                    'loanPurpose': 'Buying equipment',
                    'product': 'IL'
                },
                'business': {
                    'business_id': '1234567-8',
                    'groupName': 'Stark Industries, Inc.',
                    'emailAddress': 'noreply@capitalbox.com',
                    'mobilePhone': '+3700000000'
                },
                'individual': {
                    'personal_id': '131052-308T',
                    'firstName': 'Tony',
                    'lastName': 'Stark'
                }
            }

            raw_json = json.dumps(request_payload)

            # Generate signature by signing concatenated URL and raw JSON data
            signature = hashlib.sha256((KEY + URL + raw_json).encode()).hexdigest()

            # Set HTTP headers
            headers = {
                'Content-Type': 'application/json',
                'Signature': signature
            }

            # Set HTTP basic authentication
            auth = (USERNAME, PASSWORD)

            # Make the HTTP request
            response = requests.post(URL, headers=headers, auth=auth, data=raw_json)

            # Process the response
            if response.status_code == 200:
                print('Response:', response.text)
            else:
                print('HTTP error:', response.status_code, response.text)
        - lang: JavaScript
          source: |
            const https = require('https');
            const crypto = require('crypto');

            const USERNAME = 'yourUserName';
            const PASSWORD = 'yourPassword';
            const KEY = 'yourEncryptionKey';
            const HOSTNAME = 'yourHost';
            const URL = `https://${HOSTNAME}/api/sales/v2/applications/`;

            // JSON data to be sent in the request
            const request_payload = {
                application: {
                    loanAmount: 10000.00,
                    desiredTerm: 12,
                    loanPurpose: 'Buying equipment',
                    product: 'IL'
                },
                business: {
                    business_id: '1234567-8',
                    groupName: 'Stark Industries, Inc.',
                    emailAddress: 'noreply@capitalbox.com',
                    mobilePhone: '+3700000000'
                },
                individual: {
                    personal_id: '131052-308T',
                    firstName: 'Tony',
                    lastName: 'Stark'
                }
            };

            const raw_json = JSON.stringify(request_payload);

            // Generate signature by signing concatenated URL and raw JSON data
            const signature = createHash('sha256').update(KEY + URL + raw_json).digest('hex');

            // Set HTTP options
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Signature': signature
                },
                auth: `${USERNAME}:${PASSWORD}`
            };

            // Make the HTTP request
            const req = https.request(URL, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('Response:', data);
                });
            });

            // Handle request errors
            req.on('error', (error) => {
                console.error('HTTP error:', error.message);
            });

            // Send the request body
            req.write(raw_json);

            // End the request
            req.end();
  /applications/:
    post:
      tags:
        - Applications
      summary: Add a loan application
      description: Add a loan application
      operationId: addApplication
      requestBody:
        description: Add a loan application
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApplicationForm'
        required: true
      responses:
        '201':
          description: Application received.
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/ApplicationReceived'
              examples:
                application_accepted:
                  value:
                    uuid: 550e8400-e29b-41d4-a716-446655440000
                    timestamp: '2023-12-12 14:12:33'
                    payload:
                      id: 550e8400-e29b-41d4-a716-446655440000
                      received: true
                      accepted: true
                      reason: ''
                  summary: Application has been accepted
                application_declined:
                  value:
                    uuid: 550e8400-e29b-41d4-a716-446655440000
                    timestamp: '2023-12-12 14:12:33'
                    payload:
                      id: 550e8400-e29b-41d4-a716-446655440000
                      received: true
                      accepted: false
                      reason: Applicant Too Young
                  summary: Application has been rejected
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
      x-codeSamples:
        - lang: PHP
          source: |-
            <?php
            $USERNAME = 'yourUserName'; //your API user name
            $PASSWORD = 'yourPassword'; //your API user password
            $KEY = 'yourEncryptionKey'; //shared private key
            $HOSTNAME = 'yourHost'; //host is specific  to each implementation
            $URL = 'https://{$HOSTNAME}/api/sales/v2/applications/'; //request endpoint

            // JSON data to be sent in the request
            $request_payload = array(
                'application' => [
                    'loanAmount' => 10000.00,
                    'desiredTerm' => 12,
                    'loanPurpose' => 'Buying equipment',
                    'product' => 'IL'
                ],
                'business' => [
                    'business_id' => '1234567-8',
                    'groupName' => 'Stark Industries, Inc.',
                    'emailAddress' => 'noreply@capitalbox.com',
                    'mobilePhone' => '+3700000000'
                ],
                'individual' => [
                    'personal_id' => '131052-308T',
                    'firstName' => 'Tony',
                    'lastName' => 'Stark'
                ]
            );

            $raw_json = json_encode($request_payload);

            // Generate signature by signing concatenated URL and raw JSON data
            $signature = hash('sha256',$KEY . $URL . $raw_json);

            // Initialize cURL session
            $cs = curl_init();
            // Set cURL options
            curl_setopt($cs, CURLOPT_URL, $URL);
            curl_setopt($cs, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
            curl_setopt($cs, CURLOPT_USERPWD, "{$USERNAME}:{$PASSWORD}");
            curl_setopt($cs, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($cs, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Signature: ' . $signature
            ]);
            curl_setopt($cs, CURLOPT_POSTFIELDS, $raw_json);


            // Execute cURL session and store the result
            $response = curl_exec($cs);

            // Check for cURL errors
            if (curl_errno($cs)) {
                echo 'Curl error: ' . curl_error($cs);
            }

            // Close cURL session
            curl_close($cs);

            // Process the response
            if ($response) {
                // Handle the response
                echo 'Response: ' . $response;
            } else {
                // Handle the case when there is no response
                echo 'No response received';
            }
        - lang: Ruby
          source: |-
            require 'net/http'
            require 'uri'
            require 'json'
            require 'openssl'

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = "https://#{HOSTNAME}/api/sales/v2/applications/"

            # JSON data to be sent in the request
            request_payload = {
              'application' => {
                'loanAmount' => 10000.00,
                'desiredTerm' => 12,
                'loanPurpose' => 'Buying equipment',
                'product' => 'IL'
              },
              'business' => {
                'business_id' => '1234567-8',
                'groupName' => 'Stark Industries, Inc.',
                'emailAddress' => 'noreply@capitalbox.com',
                'mobilePhone' => '+3700000000'
              },
              'individual' => {
                'personal_id' => '131052-308T',
                'firstName' => 'Tony',
                'lastName' => 'Stark'
              }
            }

            raw_json = JSON.generate(request_payload)

            # Generate signature token by signing raw JSON data
            signature = OpenSSL::Digest::SHA256.hexdigest(KEY + URL + raw_json)

            # Initialize Net::HTTP session
            uri = URI.parse(URL)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = true

            # Set HTTP request and headers
            request = Net::HTTP::Post.new(uri.path)
            request.basic_auth(USERNAME, PASSWORD)
            request['Content-Type'] = 'application/json'
            request['Signature'] = signature
            request.body = raw_json

            # Execute HTTP request and store the result
            response = http.request(request)

            # Process the response
            if response.is_a?(Net::HTTPSuccess)
              puts 'Response: ' + response.body
            else
              puts 'HTTP error: ' + response.code + ' ' + response.message
            end
        - lang: Python
          source: |
            import requests
            import json
            import hashlib

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = f'https://{HOSTNAME}/api/sales/v2/applications/'

            # JSON data to be sent in the request
            request_payload = {
                'application': {
                    'loanAmount': 10000.00,
                    'desiredTerm': 12,
                    'loanPurpose': 'Buying equipment',
                    'product': 'IL'
                },
                'business': {
                    'business_id': '1234567-8',
                    'groupName': 'Stark Industries, Inc.',
                    'emailAddress': 'noreply@capitalbox.com',
                    'mobilePhone': '+3700000000'
                },
                'individual': {
                    'personal_id': '131052-308T',
                    'firstName': 'Tony',
                    'lastName': 'Stark'
                }
            }

            raw_json = json.dumps(request_payload)

            # Generate signature by signing concatenated URL and raw JSON data
            signature = hashlib.sha256((KEY + URL + raw_json).encode()).hexdigest()

            # Set HTTP headers
            headers = {
                'Content-Type': 'application/json',
                'Signature': signature
            }

            # Set HTTP basic authentication
            auth = (USERNAME, PASSWORD)

            # Make the HTTP request
            response = requests.post(URL, headers=headers, auth=auth, data=raw_json)

            # Process the response
            if response.status_code == 200:
                print('Response:', response.text)
            else:
                print('HTTP error:', response.status_code, response.text)
        - lang: JavaScript
          source: |
            const https = require('https');
            const crypto = require('crypto');

            const USERNAME = 'yourUserName';
            const PASSWORD = 'yourPassword';
            const KEY = 'yourEncryptionKey';
            const HOSTNAME = 'yourHost';
            const URL = `https://${HOSTNAME}/api/sales/v2/applications/`;

            // JSON data to be sent in the request
            const request_payload = {
                application: {
                    loanAmount: 10000.00,
                    desiredTerm: 12,
                    loanPurpose: 'Buying equipment',
                    product: 'IL'
                },
                business: {
                    business_id: '1234567-8',
                    groupName: 'Stark Industries, Inc.',
                    emailAddress: 'noreply@capitalbox.com',
                    mobilePhone: '+3700000000'
                },
                individual: {
                    personal_id: '131052-308T',
                    firstName: 'Tony',
                    lastName: 'Stark'
                }
            };

            const raw_json = JSON.stringify(request_payload);

            // Generate signature by signing concatenated URL and raw JSON data
            const signature = createHash('sha256').update(KEY + URL + raw_json).digest('hex');

            // Set HTTP options
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Signature': signature
                },
                auth: `${USERNAME}:${PASSWORD}`
            };

            // Make the HTTP request
            const req = https.request(URL, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('Response:', data);
                });
            });

            // Handle request errors
            req.on('error', (error) => {
                console.error('HTTP error:', error.message);
            });

            // Send the request body
            req.write(raw_json);

            // End the request
            req.end();
  /applications/{application_uuid}/:
    get:
      tags:
        - Applications
      summary: Get information about existing application
      description: Get information about existing application
      operationId: getApplicationInfo
      parameters:
        - name: application_uuid
          in: path
          description: ID of the application to get information about
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: Financing information
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        description: Array of elements related to selected Resource and action
                        type: array
                        items:
                          $ref: '#/components/schemas/ApplicationInfo'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
    patch:
      tags:
        - Applications
      summary: Update an existing loan application
      description: Update an existing loan application
      operationId: updateApplication
      parameters:
        - name: application_uuid
          in: path
          description: ID of application to update
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 550e8400-e29b-41d4-a716-446655440000
      requestBody:
        description: Update a loan application
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApplicationUpdateForm'
        required: true
      responses:
        '200':
          description: Application updated
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        description: Array of elements related to selected Resource and action
                        type: array
                        items:
                          $ref: '#/components/schemas/ApplicationUpdated'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
    delete:
      tags:
        - Applications
      summary: Withdraw application
      description: Withdraw an active but yet unsold application
      operationId: withdrawApplication
      parameters:
        - name: application_uuid
          in: path
          description: ID of application to withdraw
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: Application withdrawn
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/ApplicationWithdrawn'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /offers/{offer_uuid}/:
    patch:
      tags:
        - Offers
      summary: Update Offer Status
      description: Update single Offer status to perform the selection of proposed offer
      operationId: patchOfferByID
      parameters:
        - name: offer_uuid
          in: path
          description: UUID of the Offer to be updated
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 440e8400-a29b-22d4-a716-886655440011
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OfferUpdateForm'
        required: true
      responses:
        '200':
          description: Offer Updated
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/OfferUpdated'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /offers/{application_uuid}/:
    get:
      tags:
        - Offers
      summary: Get all offers for application
      description: Returns a map of ```offer_uuid``` to offer details object. **IMPORTANT:** request for offers will return `404` error until API client is notified about offer availability via webhook
      operationId: getOffersByApplicationId
      parameters:
        - name: application_uuid
          in: path
          description: ID of the application to return offers for
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 440e8400-a29b-22d4-a716-886655440011
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        description: Array of elements related to selected Resource and action
                        type: object
                        additionalProperties:
                          x-additionalPropertiesName: offer_uuid
                          $ref: '#/components/schemas/Offer'
              example:
                uuid: a1945a40-d80b-469d-ac6b-cc66e4c866a6
                timestamp: 023-12-12 14:12:33
                payload:
                  440e8400-a29b-22d4-a716-886655440011:
                    offer_uuid: 440e8400-a29b-22d4-a716-886655440011
                    product: CL
                    term: 12
                    principalAmount: 15000
                    setupFee: 100
                    adminFee: 350
                    monthlyFee: 1.5
                    monthlyCost: 1435.23
                    totalCost: 17330.56
                    repaymentType: linear
                    offerExpires: '2024-01-31 14:30:59'
                    requireDocBalanceSheetPLA: true
                    requireGuarantors: false
                    requireUBOGuarantors: true
                  550e8400-e29b-41d4-a716-446655440000:
                    offer_uuid: 550e8400-e29b-41d4-a716-446655440000
                    product: IL
                    term: 24
                    principalAmount: 15000
                    setupFee: 100
                    adminFee: 350
                    monthlyFee: 2.3
                    monthlyCost: 1624.13
                    totalCost: 18330.56
                    repaymentType: annuity
                    offerExpires: '2024-01-31 14:30:59'
                    requireDocBalanceSheetPLA: true
                    requireGuarantors: false
                    requireUBOGuarantors: true
                  c83d7c75-09b9-4ee3-8b9d-6df30d925990:
                    offer_uuid: c83d7c75-09b9-4ee3-8b9d-6df30d925990
                    product: RBF
                    term: 24
                    principalAmount: 15000
                    setupFee: 100
                    adminFee: 350
                    monthlyFee: 2.3
                    monthlyCost: 1624.13
                    totalCost: 18330.56
                    repaymentType: annuity
                    offerExpires: '2024-01-31 14:30:59'
                    requireDocBalanceSheetPLA: true
                    requireGuarantors: false
                    requireUBOGuarantors: true
                    repaymentPercentage: 36.66
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
      x-codeSamples:
        - lang: PHP
          source: |-
            <?php
            $USERNAME = 'yourUserName'; //your API user name
            $PASSWORD = 'yourPassword'; //your API user password
            $KEY = 'yourEncryptionKey'; //shared private key
            $HOSTNAME = 'yourHost'; //host is specific  to each implementation
            $URL = 'https://{$HOSTNAME}/api/sales/v2/offers/'; //request endpoint

            //the application Id to retrieve data for
            $application_uuid = '550e8400-e29b-41d4-a716-446655440000';

            // form full request path
            $request_url = $URL . $application_uuid . '/';

            // Generate signature by signing concatenated URL and raw JSON data
            // GET request has no payload, thus only the path is signed
            $signature = hash('sha256',$KEY . $request_url);

            // Initialize cURL session
            $cs = curl_init();
            // Set cURL options
            curl_setopt($cs, CURLOPT_URL, $request_url);
            curl_setopt($cs, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($cs, CURLOPT_HTTPHEADER, [ 'Signature: ' . $signature ]);
            curl_setopt($cs, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
            curl_setopt($cs, CURLOPT_USERPWD, $USERNAME . ':' . $PASSWORD);

            // Execute cURL session and store the result
            $response = curl_exec($cs);
        - lang: Ruby
          source: |-
            require 'net/http'
            require 'uri'
            require 'json'
            require 'openssl'

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = "https://#{HOSTNAME}/api/sales/v2/offers/"

            #the application Id to retrieve data for
            application_uuid = '550e8400-e29b-41d4-a716-446655440000';

            #// form full request path
            request_url = URL + application_uuid + '/'

            # Generate signature token by signing raw JSON data
            # GET request has no payload, thus only the path is signed
            signature = OpenSSL::Digest::SHA256.hexdigest(KEY + request_url)

            # Initialize Net::HTTP session
            uri = URI.parse(request_url)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = true

            # Set HTTP request and headers
            request = Net::HTTP::Post.new(uri.path)
            request.basic_auth(USERNAME, PASSWORD)
            request['Signature'] = signature

            # Execute HTTP request and store the result
            response = http.request(request)

            # Process the response
            if response.is_a?(Net::HTTPSuccess)
              puts 'Response: ' + response.body
            else
              puts 'HTTP error: ' + response.code + ' ' + response.message
            end
        - lang: Python
          source: |-
            import requests
            import json
            import hashlib

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = f'https://{HOSTNAME}/api/sales/v2/offers/'

            # The application Id to retrieve data for
            application_uuid = '550e8400-e29b-41d4-a716-446655440000'

            # Form full request path
            request_url = URL + application_uuid + '/'

            # Generate signature token by signing raw JSON data
            # GET request has no payload, thus only the path is signed
            signature = hashlib.sha256((KEY + request_url).encode()).hexdigest()

            # Set HTTP headers
            headers = {
                'Signature': signature
            }

            # Set HTTP basic authentication
            auth = (USERNAME, PASSWORD)

            # Make the HTTP request
            response = requests.get(request_url, headers=headers, auth=auth)

            # Process the response
            if response.status_code == 200:
                print('Response:', response.text)
            else:
                print('HTTP error:', response.status_code, response.text)
        - lang: JavaScript
          source: |-
            const https = require('https');
            const crypto = require('crypto');

            const USERNAME = 'yourUserName';
            const PASSWORD = 'yourPassword';
            const KEY = 'yourEncryptionKey';
            const HOSTNAME = 'yourHost';
            const URL = `https://${HOSTNAME}/api/sales/v2/offers/`;

            // The application Id to retrieve data for
            const application_uuid = '550e8400-e29b-41d4-a716-446655440000';

            // Form full request path
            const request_url = URL + application_uuid + '/';

            // Generate signature token by signing raw JSON data
            // GET request has no payload, thus only the path is signed
            const signature = crypto.createHash('sha256').update(KEY + request_url).digest('hex');

            // Set HTTP headers
            const headers = {
                'Signature': signature
            };

            // Set HTTP basic authentication
            const auth = `${USERNAME}:${PASSWORD}`;

            // Make the HTTP request
            https.get(request_url, { headers, auth }, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    console.log('Response:', data);
                });
            }).on('error', (error) => {
                console.error('HTTP error:', error.message);
            });
  /files/:
    post:
      tags:
        - Files
      summary: Add an attachment to application
      description: Upload a file to be added as an attachment to application
      operationId: uploadFileUnderApplication
      requestBody:
        description: Upload a file under an application
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/File'
        required: true
      responses:
        '201':
          description: File uploaded
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/FileUploaded'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /aml/:
    post:
      tags:
        - AML Forms
      summary: Submit AML forms for the application
      description: Submit AML forms for the application
      operationId: submitAmlForms
      requestBody:
        description: Submit AML forms for the application
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AmlForm'
        required: true
      responses:
        '200':
          description: AML Form Submitted
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/AMLSubmitted'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /contracts/{application_uuid}:
    get:
      tags:
        - Contracts
      summary: Retrieve contract for signing
      description: Retrieve contract HTML contents for signing by application uuid
      operationId: getContract
      parameters:
        - name: application_uuid
          in: path
          description: UUID of application to get the contract for
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/Contract'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /repayments/:
    post:
      tags:
        - Repayments
      summary: Provide repayment data
      description: Provide repayment data for booking
      operationId: bookRepayment
      requestBody:
        description: Book a repayment under specified loan
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RepaymentBooking'
        required: true
      responses:
        '200':
          description: Repayment Booked
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/RepaymentReceipt'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /repayments/{uuid}/:
    get:
      tags:
        - Repayments
      summary: Retrieve received repayments
      description: Retrieve list of repayments made during the specified timeframe
      operationId: getRepayments
      parameters:
        - name: uuid
          in: path
          description: Specific pre-configured UUID from CapitalBox
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 440e8400-a29b-22d4-a716-886655440011
        - in: query
          required: false
          name: dateFrom
          description: Date from which (**inclusive**) to retrieve client repayments
          schema:
            type: string
            format: date
            default: Current day value
          example: '2024-01-30'
        - in: query
          required: false
          name: dateTo
          description: Date up to which (**inclusive**) to retrieve client repayments
          schema:
            type: string
            format: date
            default: Current day value
          example: '2024-01-30'
      responses:
        '200':
          description: Booked repayments list
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/RepaymentList'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
      x-codeSamples:
        - lang: PHP
          source: |-
            <?php
            $USERNAME = 'yourUserName'; //your API user name
            $PASSWORD = 'yourPassword'; //your API user password
            $KEY = 'yourEncryptionKey'; //shared private key
            $HOSTNAME = 'yourHost'; //host is specific  to each implementation
            $URL = 'https://{$HOSTNAME}/api/sales/v2/repayments/'; //request endpoint

            // Special identifier UIID provided by CapitalBox IT
            $uuid = '550e8400-e29b-41d4-a716-446655440000';

            // Query parameters
            $fromDate = '2024-01-05';
            $toDate = '2024-01-07';

            // full request path
            $request_url = $URL . $uuid . '/?dateFrom={$fromDate}&dateTo={$toDate}';

            // Generate signature by signing concatenated URL and raw JSON data
            // GET request has no payload, thus only the path is signed
            $signature = hash('sha256',$KEY . $request_url);

            // Initialize cURL session
            $cs = curl_init();
            // Set cURL options
            curl_setopt($cs, CURLOPT_URL, $request_url);
            curl_setopt($cs, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($cs, CURLOPT_HTTPHEADER, [ 'Signature: ' . $signature ]);
            curl_setopt($cs, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
            curl_setopt($cs, CURLOPT_USERPWD, $USERNAME . ':' . $PASSWORD);

            // Execute cURL session and store the result
            $response = curl_exec($cs);
        - lang: Ruby
          source: |-
            require 'net/http'
            require 'uri'
            require 'json'
            require 'openssl'

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = "https://#{HOSTNAME}/api/sales/v2/offers/"

            # Special identifier UIID provided by CapitalBox IT
            uuid = '550e8400-e29b-41d4-a716-446655440000'

            # Query parameters
            fromDate = '2024-01-05'
            toDate = '2024-01-07'

            # Full request path
            request_url = URL + application_uuid + '/?fromDate=#{fromDate}&toDate=#{toDate}'

            # Generate signature token by signing raw JSON data
            # GET request has no payload, thus only the path is signed
            signature = OpenSSL::Digest::SHA256.hexdigest(KEY + request_url)

            # Initialize Net::HTTP session
            uri = URI.parse(request_url)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = true

            # Set HTTP request and headers
            request = Net::HTTP::Post.new(uri.path)
            request.basic_auth(USERNAME, PASSWORD)
            request['Signature'] = signature

            # Execute HTTP request and store the result
            response = http.request(request)

            # Process the response
            if response.is_a?(Net::HTTPSuccess)
              puts 'Response: ' + response.body
            else
              puts 'HTTP error: ' + response.code + ' ' + response.message
            end
        - lang: Python
          source: |-
            import requests
            import json
            import hashlib

            USERNAME = 'yourUserName'
            PASSWORD = 'yourPassword'
            KEY = 'yourEncryptionKey'
            HOSTNAME = 'yourHost'
            URL = f'https://{HOSTNAME}/api/sales/v2/offers/'

            # Special identifier UIID provided by CapitalBox IT
            uuid = '550e8400-e29b-41d4-a716-446655440000'

            # Query parameters
            fromDate = '2024-01-05'
            toDate = '2024-01-07'

            # Full request path
            request_url = URL + application_uuid + f'/?fromDate={fromDate}&toDate={toDate}'

            # Generate signature token by signing raw JSON data
            # GET request has no payload, thus only the path is signed
            signature = hashlib.sha256((KEY + request_url).encode()).hexdigest()

            # Set HTTP headers
            headers = {
                'Signature': signature
            }

            # Set HTTP basic authentication
            auth = (USERNAME, PASSWORD)

            # Make the HTTP request
            response = requests.get(request_url, headers=headers, auth=auth)

            # Process the response
            if response.status_code == 200:
                print('Response:', response.text)
            else:
                print('HTTP error:', response.status_code, response.text)
        - lang: JavaScript
          source: |-
            const https = require('https');
            const crypto = require('crypto');

            const USERNAME = 'yourUserName';
            const PASSWORD = 'yourPassword';
            const KEY = 'yourEncryptionKey';
            const HOSTNAME = 'yourHost';
            const URL = `https://${HOSTNAME}/api/sales/v2/repayments/`;

            // Special identifier UIID provided by CapitalBox IT
            const uuid = '550e8400-e29b-41d4-a716-446655440000';

            // Query parameters
            const fromDate = '2024-01-05';
            const toDate = '2024-01-07';

            // Full request path
            const request_url = URL + uuid + `/?dateFrom=${fromDate}&dateTo=${toDate}`;

            // Generate signature token by signing raw JSON data
            // GET request has no payload, thus only the path is signed
            const signature = crypto.createHash('sha256').update(KEY + request_url).digest('hex');

            // Set HTTP headers
            const headers = {
                'Signature': signature
            };

            // Set HTTP basic authentication
            const auth = `${USERNAME}:${PASSWORD}`;

            // Make the HTTP request
            https.get(request_url, { headers, auth }, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    console.log('Response:', data);
                });
            }).on('error', (error) => {
                console.error('HTTP error:', error.message);
            });
  /disbursements/:
    post:
      tags:
        - Disbursements
      summary: Initiate application disbursement
      description: Initiate signed application disbursement
      operationId: disburseLoan
      requestBody:
        description: Disburse specified loan
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Disbursement'
        required: true
      responses:
        '200':
          description: Loan disbursed
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/DisbursementReceipt'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /einvoices/{einvoice_uuid}:
    get:
      tags:
        - E-invoices
      summary: Retrieve e-invoice's details
      description: Retrieve current e-invoice's status and additional details
      operationId: getEInvoice
      parameters:
        - name: einvoice_uuid
          in: path
          description: UUID of the e-invoice
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/EInvoice'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
    patch:
      tags:
        - E-invoices
      summary: Update e-invoice status
      description: Update e-invoice status to initiate or cancel e-invoice delivery (forwarding to the debtor)
      operationId: patchEInvoice
      parameters:
        - name: einvoice_uuid
          in: path
          description: UUID of the e-invoice to be updated
          required: true
          schema:
            type: string
            format: uuid
            examples:
              - 440e8400-a29b-22d4-a716-886655440011
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EInvoiceUpdateForm'
        required: true
      responses:
        '200':
          description: E-invoice updated
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/EInvoiceUpdated'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /batch/:
    post:
      tags:
        - Batch Processing
      summary: Process a batch request
      description: Process a batch request to evaluate financing eligibility.
      operationId: processBatch
      requestBody:
        description: Provide batch for processing
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BatchRequest'
            examples:
              PREOFFER:
                value:
                  batch_uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  batchDate: '2024-01-31 19:30:59'
                  batchType: PREOFFER
                  product: IL
                  data:
                    - business_id: 1234567-8
                      groupName: Stark Industries, Ltd.
                      regDate: '2019-08-24'
                      entityType: Sole Proprietorship
                      customNumber: A1642851751
                      mcc: '0763'
                      yearlyRevenueByMonth:
                        '202301': 1234.56
                        '202302': 6543.21
                        '202303': 9876.65
                        '202304': 567.89
                        '202305': 321.65
                        '202306': 6547.13
                        '202307': 6431.25
                        '202308': 2673.33
                        '202309': 7771.17
                        '202310': 12.53
                        '202311': 99348.33
                        '202312': 16756.4
              PAYOUT:
                value:
                  batch_uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  batchDate: '2024-01-31 19:30:59'
                  batchType: PAYOUT
                  product: IL
                  data:
                    - uuid: a1945a40-d80b-469d-ac6b-cc66e4c866a6
                      amount: 150003.99
                      paymentMessage: Loan 102323 payout
                      business_id: 1234567-8
                      counterpartyName: Stark Industries, Ltd.
                      counterpartyAddress: 221B Baker Street, London, United Kingdom
                      bankAccount: 1234 123456789
        required: true
      responses:
        '200':
          description: Batch processed
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/BatchResult'
        '201':
          description: Batch accepted for processing, [BATCH_PROCESSED](#tag/Batch-Processing/operation/batchProcessed) webhook is fired upon completion
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        description: Array of elements related to selected Resource and action
                        type: array
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /batch/{batch_uuid}/:
    get:
      tags:
        - Batch Processing
      summary: Retrieve processed batch
      description: Retrieve asynchronously processed bath by ```batch_uuid```
      operationId: getBatch
      parameters:
        - name: batch_uuid
          in: path
          description: UUID of a processed batch
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessNoPayload'
                  - type: object
                    description: Success Payload
                    properties:
                      payload:
                        $ref: '#/components/schemas/BatchResult'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
  /status/:
    get:
      tags:
        - Status
      summary: Check status of API services
      description: Retrieve environment information for the API
      operationId: apiStatus
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiStatus'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'
webhooks:
  applicationDeclined:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Application declined
      description: '`applicationDeclined` webhook is fired once application is evaluated and declined. No further API actions are possible'
      operationId: applicationDeclined
      requestBody:
        description: Application has been declined
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              applicationReceived:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: applicationDeclined
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  applicationWithdrawn:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Application withdrawn
      description: '`applicationWithdrawn` webhook is fired once application is withdrawn either by [API user request](#tag/Applications/operation/withdrawApplication) or the client if CapitalBox is communicating directly.'
      operationId: applicationWithdrawn
      requestBody:
        description: Application has been withdrawn
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              applicationReceived:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: applicationWithdrawn
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  offersCreated:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Offers created
      description: '`offersCreated` webhook is fired upon application approval. Use `uuid` value to `GET` [Offer details](#tag/Offers/operation/getOffersByApplicationId)'
      operationId: offersCreated
      requestBody:
        description: Application has been approved, offer(s) created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: offersCreated
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  offersUpdated:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Offers updated
      description: '`offersUpdated` webhook is fired once any of the offers under an application are updated, e.g. accepted for signing. Use `uuid` value to `GET` [Offer details](#tag/Offers/operation/getOffersByApplicationId)'
      operationId: offersUpdated
      requestBody:
        description: Offer(s) have been updated
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: offersUpdated
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  batchCompleted:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Batch completed
      description: '`batchCompleted` webhook is fired upon completion of an asynchronous batch processing. Use `uuid` value to `GET` [Batch processing results](#tag/Batch-Processing/operation/getBatch)'
      operationId: batchCompleted
      requestBody:
        description: Batch Processing complete
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: batchCompleted
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  loanDisbursed:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Loan disbursed
      description: '`loanDisbursed` webhook is fired upon loan disbursement to the client. UUID refers to the application which resulted in active loan account.'
      operationId: loanDisbursed
      requestBody:
        description: Loan has been disbursed
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: loanDisbursed
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  contractReady:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Contract prepared
      description: '`contractReady` webhook is fired once contract is ready for signing. Use `uuid` value to `GET` [Contract contents](#tag/Contracts/operation/getContract)'
      operationId: contractReady
      requestBody:
        description: Contract has been prepared for signing
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: contractReady
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  contractSigned:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Contract signed
      description: '`contractSigned` webhook is fired once contract is ready for signing process is completed either by CapitalBox or API user, if such signing flow was agreed upon.'
      operationId: contractSigned
      requestBody:
        description: Contract signing is complete
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: contractSigned
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
  contractFailed:
    post:
      security:
        - BearerAuth: []
      tags:
        - Webhooks
      summary: Contract signing failed
      description: '`contractFailed` webhook is fired once contract signing has failed due to some reason'
      operationId: contractFailed
      requestBody:
        description: Contract signing has failed
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
            examples:
              batchProcessed:
                value:
                  uuid: 47baebb4-cdb3-4a59-8e2c-8f5092b97a60
                  event: contractFailed
                  timestamp: '2023-12-12 14:12:33'
      responses:
        '200':
          description: Optional 200 response, contents ignored
components:
  schemas:
    Failure:
      type: object
      x-tags: Schemas
      description: Failure
      properties:
        uuid:
          description: returns provided uuid if applicable
          type: string
          examples:
            - a1945a40-d80b-469d-ac6b-cc66e4c866a6
        timestamp:
          description: timestamp of execution (format Y-m-d H:i:s)
          type: string
          format: timestamp
          examples:
            - '2023-12-12 14:12:33'
        errors:
          description: Array of error messages which had occurred during request processing
          type: string
          examples:
            - Invalid parameters supplied, Application not found
        comments:
          description: optional additional comments on the error event
          type: string
          examples:
            - Unexpected error comment
    Success:
      type: object
      x-tags: Response Schemas
      description: Success
      allOf:
        - $ref: '#/components/schemas/SuccessNoPayload'
        - type: object
          description: Success Payload
          properties:
            payload:
              description: Array of elements related to selected Resource and action
              type: object
              oneOf:
                - $ref: '#/components/schemas/ApplicationReceived'
                - $ref: '#/components/schemas/ApplicationUpdated'
                - $ref: '#/components/schemas/ApplicationWithdrawn'
                - $ref: '#/components/schemas/BatchResult'
                - $ref: '#/components/schemas/AMLSubmitted'
                - $ref: '#/components/schemas/Contract'
                - $ref: '#/components/schemas/DisbursementReceipt'
                - $ref: '#/components/schemas/FileUploaded'
                - $ref: '#/components/schemas/Offers'
                - $ref: '#/components/schemas/OfferUpdated'
                - $ref: '#/components/schemas/RepaymentReceipt'
                - $ref: '#/components/schemas/ApiStatus'
                - $ref: '#/components/schemas/SSOLoginURL'
    LeadForm:
      title: Lead form
      x-tags: Schemas
      description: Lead form containing basic information about potential customer
      required:
        - business_id
        - emailAddress
        - mobilePhone
      type: object
      properties:
        business_id:
          description: Unique business registration number to identify the business entity in local registries
          type: string
          examples:
            - 1234567-8
        emailAddress:
          description: Business email address for contacting the applicant
          type: string
          format: email
          examples:
            - info@capitalbox.com
        mobilePhone:
          description: Business phone number in international format
          type: string
          format: phone
          pattern: ^(\+)[1-9][0-9]{7,15}$
          examples:
            - '+37000000000'
        loanAmount:
          description: Desired financing amount
          type: number
          format: float
          examples:
            - 12345678.9
        desiredTerm:
          description: Desired loan term in months
          type: number
          format: integer
          examples:
            - 12
        loanPurpose:
          description: Purpose of financing
          type: string
          enum:
            - Refinancing debt
            - Buying equipment
            - Purchasing inventory
            - Remodeling/Expansion
            - Hiring employees
            - Working capital
            - Marketing
            - Factoring
            - Other
            - Bridging receivables
            - Unforeseen expenses
            - Pre-financing
            - Real Estate funding
            - Purchase Finance
        product:
          description: Financing product type
          type: string
          enum:
            - IL
            - CL
            - PF
            - RBF
            - FL
        hasCollateral:
          description: Specifies whether the applicant has collateral to be used in financing agreement
          type: boolean
          default: false
        ip:
          description: IP address of the applicant (if the applicant is submitting an application via partner portal which forwards the application to CapitalBox)
          type: string
          format: ipv4
          examples:
            - 192.168.0.1
        originator:
          description: Lead originator
          type: string
        referrer:
          description: Lead's referrer if lead data has been referred by third party which needs to be tracked
          type: string
          examples:
            - someReferrer
        analyticsID:
          description: Analytics service Id for lead tracking
          type: string
          examples:
            - anl.121.121
        verificationCallComments:
          description: Additional free-form information providing context for loan officer or loan underwriter
          type: string
          examples:
            - Verification call comments contain basic information about the potential client and provides context for the sales rep or underwriter
        customFlow:
          description: Special sales flow code, specific to each API user
          type: string
          examples:
            - specialPartnerProcedure
        customNumber:
          description: Custom application reference in addition to standard application_id used by this API. Usually API user's internal reference
          type: string
          examples:
            - A1642851751
        customPartner:
          description: Custom reference to a third party entity (a partner) involved in the sales process. Recommended to use country-coded references to prevent reference clash if integration would be scaled to multiple markets
          type: string
          examples:
            - FI7263
        customProduct:
          description: Custom variation of a product to be used in specialized integrations
          type: string
          examples:
            - i2i
        groupName:
          description: Official Business entity title
          type: string
          examples:
            - Stark Industries, Ltd.
        revenue:
          description: Monthly revenue of the business in local currency
          type: number
          format: float
          examples:
            - 12345.67
    ApplicationForm:
      title: Loan application form
      x-tags: Schemas
      description: Loan application form containing all data necessary to apply for financing
      required:
        - application
        - business
        - individual
      type: object
      properties:
        application:
          $ref: '#/components/schemas/Application'
        business:
          $ref: '#/components/schemas/Business'
        individual:
          $ref: '#/components/schemas/Individual'
        uboList:
          description: List of UBOs (Ultimate Beneficial Owners) of the business
          type: array
          items:
            $ref: '#/components/schemas/UBO'
    Application:
      title: Application
      description: Main financing application data
      required:
        - loanAmount
        - desiredTerm
        - loanPurpose
        - pullPersonalReport
        - consentDirectMarketing
        - consentDataAnalyses
      type: object
      properties:
        loanAmount:
          description: Desired financing amount
          type: number
          format: float
          examples:
            - 12345678.9
        desiredTerm:
          description: Desired loan term in months
          type: number
          format: integer
          examples:
            - 12
        loanPurpose:
          description: Purpose of financing
          type: string
          enum:
            - Refinancing debt
            - Buying equipment
            - Purchasing inventory
            - Remodeling/Expansion
            - Hiring employees
            - Working capital
            - Marketing
            - Factoring
            - Other
            - Bridging receivables
            - Unforeseen expenses
            - Pre-financing
            - Real Estate funding
            - Purchase Finance
        declaredDebts:
          description: Total amount of applicant's debts with other creditors
          type: number
          format: float
          examples:
            - 12345.67
        expectedMonthlyFee:
          description: Desired monthly fee for the application. Indicates client's expectations
          type: number
          format: float
          examples:
            - 1.34
        product:
          description: Financing product type
          type: string
          enum:
            - IL
            - CL
            - PF
            - RBF
            - FL
        hasCollateral:
          description: Specifies whether the applicant has collateral to be used in financing agreement
          type: boolean
          default: false
        bankAccount:
          description: Business bank account for the payout of approved financing. See [bank account formatting](#tag/Data-Formats/bankAccount) for details
          type: string
          examples:
            - NL11RABO4097012428
        ip:
          description: IP address of the applicant (if the applicant is submitting an application via partner portal which forwards the application to CapitalBox)
          type: string
          format: ipv4
        pullPersonalReport:
          description: Control whether personal report should be pulled by CapitalBox during the application processing.
          type: boolean
          default: true
        consentDirectMarketing:
          description: Applicant's given consent to use his personal data for direct marketing.
          type: boolean
          default: false
        consentDataAnalyses:
          description: Applicant's given consent to use his personal data for analysis.
          type: boolean
          default: false
        customFlow:
          description: Special sales flow code, specific to each API user
          type: string
          examples:
            - specialPartnerProcedure
        customNumber:
          description: Custom application reference in addition to standard application_id used by this API. Usually API user's internal reference
          type: string
          examples:
            - A1642851751
        customPartner:
          description: Custom reference to a third party entity (a partner) involved in the sales process. Recommended to use country-coded references to prevent reference clash if integration would be scaled to multiple markets
          type: string
          examples:
            - FI7263
        customProduct:
          description: Custom variation of a product to be used in specialized integrations
          type: string
          examples:
            - i2i
        redirectUrl:
          description: Redirection URL which contains dynamic token/param to identify returning customer/session. Used whenever the client must be guided through chain of redirections from API user's to CapitalBox portals to complete application
          type: string
          format: uri
          examples:
            - https://yourwebsite-...-url.com/ret/?token=234i72
        returnOffers:
          description: API feature flag - whether offers should be returned to the API caller. If enabled, further application process should be handled by the API user, otherwise CapitalBox treats the application as referral and proceeds by contacting the applicant directly
          type: boolean
          default: false
        returnTC:
          description: API feature flag - whether content of CapitalBox Terms and Conditions should be returned upon successful application. Used to pass the T&C to the applicant for review without referring to CapitalBox website
          type: boolean
          default: false
        delayedDisbursement:
          description: Specifies whether the disbursement should be withheld until separate notice
          type: boolean
          examples:
            - true
    Business:
      title: Business entity
      description: Detailed information about business entity applying for financing
      required:
        - business_id
        - emailAddress
        - mobilePhone
      type: object
      properties:
        business_id:
          description: Unique business registration number to identify the business entity in local registries
          type: string
          examples:
            - 1234567-8
        vatCode:
          description: VAT number of the business
          type: string
          examples:
            - FI07654321
        groupName:
          description: Official Business entity title
          type: string
          examples:
            - Stark Industries, Ltd.
        emailAddress:
          description: Business email address for contacting the applicant
          type: string
          format: email
          examples:
            - info@capitalbox.com
        mobilePhone:
          description: Business phone number in international format
          type: string
          format: phone
          pattern: ^(\+)[1-9][0-9]{7,15}$
          examples:
            - '+37000000000'
        regDate:
          description: Business registration date
          type: string
          format: date
        entityType:
          description: Business entity type
          type: string
          enum:
            - Sole Proprietorship
            - Limited Company
            - General Partnership
            - Limited Partnership
            - Other
        mcc:
          description: Merchant Category Code (MCC)
          type: string
          examples:
            - '0763'
        businessAddress:
          description: Business registration street address
          type: string
          examples:
            - 221B Baker Street
        city:
          description: Business registration city
          type: string
          examples:
            - Helsinki
        country:
          description: Business registration country
          type: string
          examples:
            - Finland
        postcode:
          description: Business registration postcode
          type: string
          examples:
            - 0112-10
        revenue:
          description: Monthly revenue of the business in local currency
          type: number
          format: float
          examples:
            - 12345.67
    Individual:
      title: Individual
      description: Individual applying for the loan
      required:
        - personal_id
        - firstName
        - lastName
      type: object
      properties:
        personal_id:
          description: Applicant's personal Identity code
          type: string
          examples:
            - 131052-308T
        firstName:
          description: Applicant's first name
          type: string
          examples:
            - Homer
        middleName:
          description: Applicant's middle name
          type: string
          examples:
            - Jay
        lastName:
          description: Applicant's last name
          type: string
          examples:
            - Simpson
        birthDate:
          description: Applicant's birthdate
          type: string
          format: date
        gender:
          description: Applicant's gender
          type: string
          enum:
            - MALE
            - FEMALE
        clientAddress:
          description: Applicant's residence street address
          type: string
          examples:
            - 221B Baker Street
        clientCity:
          description: Applicant's city of residence
          type: string
          examples:
            - Helsinki
        clientPostcode:
          description: Applicant's residence postcode
          type: string
          examples:
            - 221B Baker Street
        clientCountry:
          description: Applicant's country of residence
          type: string
          examples:
            - Finland
        idScanReference:
          description: Reference to applicant's Identification document scan
          type: string
          examples:
            - S12346
        idVerificationStatus:
          description: Status of applicant's Id verification
          type: string
          default: Completed
        idTransactionDateTime:
          description: ISO timestamp of applicant's Id verification transaction in local timezone
          type: string
          format: datetime
          examples:
            - '2024-01-31 19:30:59'
          pattern: ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
    UBO:
      title: UBO
      x-tags: Schemas
      description: Ultimate Beneficial Owner of the business
      required:
        - personal_id
        - firstName
        - lastName
      type: object
      properties:
        personal_id:
          description: UBO's personal Identity code
          type: string
          examples:
            - 131052-308T
        firstName:
          description: UBO's first name
          type: string
          examples:
            - Homer
        middleName:
          description: UBO's middle name
          type: string
          examples:
            - Jay
        lastName:
          description: UBO's last name
          type: string
          examples:
            - Simpson
        initials:
          description: UBO's initials
          typs: string
          examples:
            - H.J.S
        birthDate:
          description: UBO's birthdate
          type: string
          format: date
        gender:
          description: UBO's gender
          type: string
          enum:
            - MALE
            - FEMALE
        nationality:
          description: UBO's nationality
          type: string
          enum:
            - Afghanistan
            - Albania
            - Algeria
            - Andorra
            - Angola
            - Antigua and Barbuda
            - Argentina
            - Armenia
            - Australia
            - Austria
            - Azerbaijan
            - Bahamas
            - Bahrain
            - Bangladesh
            - Barbados
            - Belarus
            - Belgium
            - Belize
            - Benin
            - Bhutan
            - Bolivia
            - Bosnia and Herzegovina
            - Botswana
            - Brazil
            - Brunei
            - Bulgaria
            - Burkina Faso
            - Burundi
            - Cabo Verde
            - Cambodia
            - Cameroon
            - Canada
            - Central African Republic
            - Chad
            - Chile
            - China
            - Cyprus
            - Colombia
            - Comoros
            - Congo
            - Costa Rica
            - Cote d Ivoire
            - Croatia
            - Cuba
            - Czech Republic
            - Denmark
            - Djibouti
            - Dominica
            - Dominican Republic
            - DR Congo
            - Ecuador
            - Egypt
            - El Salvador
            - Equatorial Guinea
            - Eritrea
            - Estonia
            - Eswatini
            - Ethiopia
            - Fiji
            - Finland
            - France
            - Gabon
            - Gambia
            - Georgia
            - Germany
            - Ghana
            - Greece
            - Grenada
            - Guatemala
            - Guyana
            - Guinea
            - Guinea Bissau
            - Haiti
            - Holy See
            - Honduras
            - Hungary
            - Iceland
            - Yemen
            - India
            - Indonesia
            - Iran
            - Iraq
            - Ireland
            - Israel
            - Italy
            - Jamaica
            - Japan
            - Jordan
            - Kazakhstan
            - Kenya
            - Kyrgyzstan
            - Kiribati
            - Kuwait
            - Laos
            - Latvia
            - Lebanon
            - Lesotho
            - Liberia
            - Libya
            - Liechtenstein
            - Lithuania
            - Luxembourg
            - Madagascar
            - Malaysia
            - Malawi
            - Maldives
            - Mali
            - Malta
            - Marshall Islands
            - Mauritania
            - Mauritius
            - Mexico
            - Myanmar
            - Micronesia
            - Moldova
            - Monaco
            - Mongolia
            - Montenegro
            - Morocco
            - Mozambique
            - Namibia
            - Nauru
            - Nepal
            - Netherlands
            - New Zealand
            - Nicaragua
            - Niger
            - Nigeria
            - North Korea
            - North Macedonia
            - Norway
            - Oman
            - Pakistan
            - Palau
            - Panama
            - Papua New Guinea
            - Paraguay
            - Peru
            - Philippines
            - Poland
            - Portugal
            - Qatar
            - Romania
            - Russia
            - Rwanda
            - Saint Kitts and Nevis
            - Saint Lucia
            - Samoa
            - San Marino
            - Sao Tome and Principe
            - Saudi Arabia
            - Seychelles
            - Senegal
            - Serbia
            - Sierra Leone
            - Singapore
            - Syria
            - Slovakia
            - Slovenia
            - Solomon Islands
            - Somalia
            - South Africa
            - South Korea
            - South Sudan
            - Spain
            - Sri Lanka
            - St Vincent and Grenadines
            - State of Palestine
            - Sudan
            - Suriname
            - Sweden
            - Switzerland
            - Tajikistan
            - Tanzania
            - Thailand
            - Timor Leste
            - Togo
            - Tonga
            - Trinidad and Tobago
            - Tunisia
            - Turkey
            - Turkmenistan
            - Tuvalu
            - Uganda
            - Ukraine
            - United Arab Emirates
            - United Kingdom
            - United States
            - Uruguay
            - Uzbekistan
            - Vanuatu
            - Venezuela
            - Vietnam
            - Zambia
            - Zimbabwe
        taxDomicile:
          description: UBO's tex domicile
          type: string
          enum:
            - Afghanistan
            - Albania
            - Algeria
            - Andorra
            - Angola
            - Antigua and Barbuda
            - Argentina
            - Armenia
            - Australia
            - Austria
            - Azerbaijan
            - Bahamas
            - Bahrain
            - Bangladesh
            - Barbados
            - Belarus
            - Belgium
            - Belize
            - Benin
            - Bhutan
            - Bolivia
            - Bosnia and Herzegovina
            - Botswana
            - Brazil
            - Brunei
            - Bulgaria
            - Burkina Faso
            - Burundi
            - Cabo Verde
            - Cambodia
            - Cameroon
            - Canada
            - Central African Republic
            - Chad
            - Chile
            - China
            - Cyprus
            - Colombia
            - Comoros
            - Congo
            - Costa Rica
            - Cote d Ivoire
            - Croatia
            - Cuba
            - Czech Republic
            - Denmark
            - Djibouti
            - Dominica
            - Dominican Republic
            - DR Congo
            - Ecuador
            - Egypt
            - El Salvador
            - Equatorial Guinea
            - Eritrea
            - Estonia
            - Eswatini
            - Ethiopia
            - Fiji
            - Finland
            - France
            - Gabon
            - Gambia
            - Georgia
            - Germany
            - Ghana
            - Greece
            - Grenada
            - Guatemala
            - Guyana
            - Guinea
            - Guinea Bissau
            - Haiti
            - Holy See
            - Honduras
            - Hungary
            - Iceland
            - Yemen
            - India
            - Indonesia
            - Iran
            - Iraq
            - Ireland
            - Israel
            - Italy
            - Jamaica
            - Japan
            - Jordan
            - Kazakhstan
            - Kenya
            - Kyrgyzstan
            - Kiribati
            - Kuwait
            - Laos
            - Latvia
            - Lebanon
            - Lesotho
            - Liberia
            - Libya
            - Liechtenstein
            - Lithuania
            - Luxembourg
            - Madagascar
            - Malaysia
            - Malawi
            - Maldives
            - Mali
            - Malta
            - Marshall Islands
            - Mauritania
            - Mauritius
            - Mexico
            - Myanmar
            - Micronesia
            - Moldova
            - Monaco
            - Mongolia
            - Montenegro
            - Morocco
            - Mozambique
            - Namibia
            - Nauru
            - Nepal
            - Netherlands
            - New Zealand
            - Nicaragua
            - Niger
            - Nigeria
            - North Korea
            - North Macedonia
            - Norway
            - Oman
            - Pakistan
            - Palau
            - Panama
            - Papua New Guinea
            - Paraguay
            - Peru
            - Philippines
            - Poland
            - Portugal
            - Qatar
            - Romania
            - Russia
            - Rwanda
            - Saint Kitts and Nevis
            - Saint Lucia
            - Samoa
            - San Marino
            - Sao Tome and Principe
            - Saudi Arabia
            - Seychelles
            - Senegal
            - Serbia
            - Sierra Leone
            - Singapore
            - Syria
            - Slovakia
            - Slovenia
            - Solomon Islands
            - Somalia
            - South Africa
            - South Korea
            - South Sudan
            - Spain
            - Sri Lanka
            - St Vincent and Grenadines
            - State of Palestine
            - Sudan
            - Suriname
            - Sweden
            - Switzerland
            - Tajikistan
            - Tanzania
            - Thailand
            - Timor Leste
            - Togo
            - Tonga
            - Trinidad and Tobago
            - Tunisia
            - Turkey
            - Turkmenistan
            - Tuvalu
            - Uganda
            - Ukraine
            - United Arab Emirates
            - United Kingdom
            - United States
            - Uruguay
            - Uzbekistan
            - Vanuatu
            - Venezuela
            - Vietnam
            - Zambia
            - Zimbabwe
        isPepOrRelated:
          description: Is applicant a PEP or has relations to PEPs?
          type: boolean
        percentageOfShares:
          description: The percentage of shares owned in the business
          type: number
          format: float
          examples:
            - 33.33
    Offers:
      type: object
      x-tags: Schemas
      description: All offers for the specified application UUID
      additionalProperties:
        x-additionalPropertiesName: offer_uuid
        $ref: '#/components/schemas/Offer'
      examples:
        - 440e8400-a29b-22d4-a716-886655440011:
            offer_uuid: 440e8400-a29b-22d4-a716-886655440011
            product: CL
            term: 12
            principalAmount: 15000
            setupFee: 100
            adminFee: 350
            monthlyFee: 1.5
            monthlyCost: 1435.23
            totalCost: 17330.56
            repaymentType: linear
            offerExpires: '2024-01-31 14:30:59'
            requireDocBalanceSheetPLA: true
            requireGuarantors: false
            requireUBOGuarantors: true
        - 550e8400-e29b-41d4-a716-446655440000:
            offer_uuid: 550e8400-e29b-41d4-a716-446655440000
            product: IL
            term: 24
            principalAmount: 15000
            setupFee: 100
            adminFee: 350
            monthlyFee: 2.3
            monthlyCost: 1624.13
            totalCost: 18330.56
            repaymentType: annuity
            offerExpires: '2024-01-31 14:30:59'
            requireDocBalanceSheetPLA: true
            requireGuarantors: false
            requireUBOGuarantors: true
        - c83d7c75-09b9-4ee3-8b9d-6df30d925990:
            offer_uuid: c83d7c75-09b9-4ee3-8b9d-6df30d925990
            product: RBF
            term: 24
            principalAmount: 15000
            setupFee: 100
            adminFee: 350
            monthlyFee: 2.3
            monthlyCost: 1624.13
            totalCost: 18330.56
            repaymentType: annuity
            offerExpires: '2024-01-31 14:30:59'
            requireDocBalanceSheetPLA: true
            requireGuarantors: false
            requireUBOGuarantors: true
            repaymentPercentage: 36.66
    OfferUpdateForm:
      type: object
      required:
        - status
      properties:
        status:
          description: Status of the offer
          type: string
          enum:
            - ACCEPTED
            - REJECTED
          examples:
            - ACCEPTED
    FilesForm:
      $ref: '#/components/schemas/File'
    ApiStatus:
      type: object
      properties:
        timestamp:
          description: timestamp of execution (format Y-m-d H:i:s)
          type: string
          format: timestamp
          examples:
            - '2023-12-12 14:12:33'
        environment:
          description: Specifies the environment type
          type: string
          enum:
            - PROD
            - SANDBOX
          examples:
            - PROD
        maintenanceMode:
          description: Specifies whether the environment is in maintenance mode
          type: boolean
          examples:
            - false
        networkStatus:
          description: Specifies whether the network is UP or DOWN
          type: string
          enum:
            - UP
            - DOWN
          examples:
            - UP
        dependenciesStatus:
          description: Specifies dependent service status
          type: string
          enum:
            - UP
            - DOWN
          examples:
            - UP
    BatchRequest:
      title: Batch request
      x-tags: Schemas
      description: Batch processing request
      required:
        - batch_uuid
        - batchDate
        - batchType
        - product
        - data
      type: object
      properties:
        batch_uuid:
          type: string
          format: uuid
        batchDate:
          type: string
          format: datetime
          examples:
            - '2024-01-31 19:30:59'
          pattern: ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
        batchType:
          type: string
          enum:
            - PREOFFER
            - PAYOUT
        product:
          type: string
          enum:
            - IL
            - CL
            - PF
            - RBF
            - FL
        data:
          type: array
          items:
            oneOf:
              - $ref: '#/components/schemas/BusinessBatch'
              - $ref: '#/components/schemas/PayoutBatch'
    BusinessBatch:
      title: Business entity for batch request
      x-tags: Schemas
      description: Information about business entity to screen for financing eligibility
      required:
        - customNumber
        - yearlyRevenueByMonth
      type: object
      properties:
        business_id:
          description: Unique business registration number to identify the business entity in local registries
          type: string
          examples:
            - 1234567-8
        groupName:
          description: Official Business entity title
          type: string
          examples:
            - Stark Industries, Ltd.
        regDate:
          description: Business registration date
          type: string
          format: date
        entityType:
          description: Business entity type
          type: string
          enum:
            - Sole Proprietorship
            - Limited Company
            - General Partnership
            - Limited Partnership
            - Other
        customNumber:
          description: Custom business reference in API user's internal records
          type: string
          examples:
            - A1642851751
        mcc:
          description: Merchant Category Code (MCC)
          type: string
          examples:
            - '0763'
        yearlyRevenueByMonth:
          description: Yearly revenue of the business in local currency, listed in 12 element array (one per month)
          type: object
          additionalProperties:
            x-additionalPropertiesName: date_number
            type: number
            format: float
          examples:
            - '202301': 1234.56
              '202302': 6543.21
              '202303': 9876.65
              '202304': 567.89
              '202305': 321.65
              '202306': 6547.13
              '202307': 6431.25
              '202308': 2673.33
              '202309': 7771.17
              '202310': 12.53
              '202311': 99348.33
              '202312': 16756.4
    PayoutBatch:
      title: Payout details for batch request
      x-tags: Schemas
      description: Information about an outbound transaction to be made to the client
      required:
        - uuid
        - amount
        - paymentMessage
        - counterpartyName
        - counterpartyAddress
        - business_id
        - bankAccount
      type: object
      properties:
        uuid:
          description: Unique payment request identifier
          type: string
          examples:
            - a1945a40-d80b-469d-ac6b-cc66e4c866a6
        amount:
          description: Amount to be paid out in **local currency**
          type: number
          format: float
          examples:
            - 150003.99
        paymentMessage:
          description: Payment message added to the details of the bank transaction
          type: string
          examples:
            - Loan 102323 payout
        business_id:
          description: Unique business registration number to identify the business entity of the beneficiary
          type: string
          examples:
            - 1234567-8
        counterpartyName:
          description: Official Business entity title which will be the beneficiary of the payment
          type: string
          examples:
            - Stark Industries, Ltd.
        counterpartyAddress:
          description: Business registration address of the payout's beneficiary
          type: string
          examples:
            - 221B Baker Street, London, United Kingdom
        bankAccount:
          description: Bank account for the payout. See [bank account formatting](#tag/Data-Formats/bankAccount) for details
          type: string
          examples:
            - NL11RABO4097012428
            - 1234 123456789
    SuccessNoPayload:
      type: object
      description: Success
      properties:
        uuid:
          description: returns provided uuid if applicable
          type: string
          examples:
            - a1945a40-d80b-469d-ac6b-cc66e4c866a6
        timestamp:
          description: timestamp of execution (format Y-m-d H:i:s)
          type: string
          format: timestamp
          examples:
            - '2023-12-12 14:12:33'
    LeadReceived:
      type: object
      properties:
        received:
          description: Specifies whether the request to create new lead has been received without validation errors
          type: boolean
        accepted:
          description: Specifies whether the lead has passed initial risk check and was accepted for further processing
          type: boolean
        reason:
          description: Rejection reason if the lead has not been accepted
          type: string
          enum:
            - Applicant Too Young
            - Bad Individual Credit
            - Bad Company Credit
            - Too Many Loans
            - Low Revenue
            - Too Many Inquiries
            - Company Too New
            - Applicant Too New in the Company
            - Suspicious
            - Consumer Loan
            - Other
    ApplicationReceived:
      type: object
      properties:
        received:
          description: Specifies whether the request to create new application has been received without validation errors
          type: boolean
        accepted:
          description: Specifies whether the application has passed initial risk check and was accepted for further processing
          type: boolean
        reason:
          description: Rejection reason if the application has not been accepted
          type: string
          enum:
            - Applicant Too Young
            - Bad Individual Credit
            - Bad Company Credit
            - Too Many Loans
            - Low Revenue
            - Too Many Inquiries
            - Company Too New
            - Applicant Too New in the Company
            - Suspicious
            - Consumer Loan
            - Other
    ApplicationInfo:
      type: object
      properties:
        applicationStatus:
          description: Status of the financing application
          type: string
          enum:
            - Pending Contract
            - Processing
            - Approved
            - Sold
            - Withdrawn
            - Rejected
            - Closed
          examples:
            - Sold
        business_id:
          description: Unique business registration number to identify the business entity in local registries
          type: string
          examples:
            - 1234567-8
        product:
          description: Financing product type
          type: string
          enum:
            - IL
            - CL
            - PF
            - RBF
            - FL
        loanAmount:
          description: Approved financing amount
          type: number
          format: float
          examples:
            - 12345678.9
        disbursedAmount:
          description: Disbursed loan amount
          type: number
          format: float
          examples:
            - 12345678.9
        monthlyFee:
          description: Recurring monthly fee rate (%) - the price for the financing
          type: number
          format: float
          examples:
            - 2.5
        numberOfInstallments:
          description: Number of installments
          type: number
          format: integer
          examples:
            - 12
    ApplicationWithdrawn:
      type: object
      properties:
        status:
          type: string
          description: 'Application status: **Closed (Withdrawn)**'
          examples:
            - Closed (Withdrawn)
    ApplicationUpdateForm:
      title: Loan application update form
      description: Loan application update form containing data available to be updated
      required:
        - application
        - business
        - individual
      type: object
      properties:
        application:
          $ref: '#/components/schemas/Application'
        business:
          $ref: '#/components/schemas/Business'
        individual:
          $ref: '#/components/schemas/Individual'
        uboList:
          description: List of UBOs (Ultimate Beneficial Owners) of the business
          type: array
          items:
            $ref: '#/components/schemas/UBO'
    ApplicationUpdated:
      type: object
      properties:
        applicationStatus:
          description: Status of the financing application
          type: string
          enum:
            - Pending Contract
            - Processing
            - Approved
            - Sold
            - Withdrawn
            - Rejected
            - Closed
    OfferUpdated:
      type: object
      properties:
        offerStatus:
          description: Status of the offer
          type: string
          enum:
            - ACCEPTED
            - REJECTED
          examples:
            - ACCEPTED
        applicationStatus:
          description: Status of the financing application
          type: string
          enum:
            - Pending Contract
            - Processing
            - Approved
            - Sold
            - Withdrawn
            - Rejected
            - Closed
    Offer:
      type: object
      properties:
        offer_uuid:
          description: Unique offer id
          type: string
          examples:
            - 550e8400-e29b-41d4-a716-446655440000
        product:
          description: Offered financing product code
          type: string
          default: IL
          enum:
            - IL
            - CL
            - PF
            - RBF
            - FL
        term:
          description: Offered maximum financing term in months
          type: number
          format: integer
          examples:
            - 24
        principalAmount:
          description: Offered maximum financing amount in local currency
          type: number
          format: float
          examples:
            - 12000
        setupFee:
          description: One-time flat fee in local currency charged for account activation and *deducted from* ```principalAmount```
          type: number
          format: float
          examples:
            - 100
        adminFee:
          description: Recurring monthly flat fee in local currency charged for account administration
          type: number
          format: float
          examples:
            - 50
        monthlyFee:
          description: Recurring monthly fee rate (%) - the price for the financing
          type: number
          format: float
          examples:
            - 2.5
        monthlyCost:
          description: Estimated total monthly cost of the financing ```( (principalAmount x monthlyFee) + adminFee)```
          type: number
          format: float
          examples:
            - 735.21
        totalCost:
          description: Estimated total cost of the financing ```( principalAmount + ( (principalAmount x monthlyFee) + adminFee ) x term)```
          type: number
          format: float
          examples:
            - 15364.35
        repaymentType:
          description: Repayment calculation type - fixed total repayment amount (annuity) or fixed repayment principal amount (linear)
          type: string
          enum:
            - annuity
            - linear
        offerExpires:
          description: Offer expiration date in ISO format, local timezone
          type: string
          format: datetime
          pattern: ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
          examples:
            - '2024-01-31 14:30:59'
        requireDocBalanceSheetPLA:
          description: Specifies whether additional documents are needed for the Offer proposal to be valid
          type: boolean
        requireGuarantors:
          description: Specifies whether additional guarantors are needed for the Offer proposal to be valid
          type: boolean
        requireUBOGuarantors:
          description: Specifies whether additional UBO guarantors are needed for the Offer proposal to be valid
          type: boolean
        repaymentPercentage:
          description: RBF product only - the percentage of the applicant's revenue to be allocated to loan repayments
          type: number
          format: float
          examples:
            - 22.5
        termsAndConditions:
          description: HTML document containing Capitalbox Terms and Conditions for the product. Base64 encoded string
          type: string
          format: base64
          examples:
            - YWxsIHlvdXIgYmFzZSBhcmUgYmVsb25nIHRvIHVz
    File:
      title: File upload
      x-tags: Schemas
      description: File upload
      required:
        - application_uuid
        - filePurpose
        - fileContent
        - fileType
        - fileName
      type: object
      properties:
        application_uuid:
          type: string
          examples:
            - 550e8400-e29b-41d4-a716-446655440000
        filePurpose:
          description: Purpose of the document in financing application context
          type: string
          enum:
            - contract
        fileContent:
          description: Base64-encoded file contents
          type: string
          format: byte
          examples:
            - YWxsIHlvdXIgYmFzZSBhcmUgYmVsb25nIHRvIHVz
        fileType:
          description: File MIME type
          type: string
          enum:
            - text/plain
            - text/tab-separated-values
            - text/csv
            - text/xml
            - application/xml
            - image/jpeg
            - image/jpg
            - image/png
            - application/pdf
            - application/msword
            - application/vnd.openxmlformats-officedocument.wordprocessingml.document
            - application/vnd.ms-excel
            - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
            - application/vnd.oasis.opendocument.text
            - application/vnd.oasis.opendocument.spreadsheet
            - application/json
            - application/ld+json
          examples:
            - application/pdf
        fileName:
          description: File name
          type: string
          examples:
            - Financing Contract.pdf
    FileUploaded:
      description: File has been successfully uploaded
      type: object
      properties:
        fileStatus:
          description: Status of the file
          type: string
          examples:
            - uploaded
    PepOrRelatedDetail:
      type: object
      title: PEP or related person details
      description: Full details of PEP (Politically Exposed Person) or a person working for the business and having a relation to a PEP
      properties:
        fullName:
          description: Full name of the PEP
          type: string
          examples:
            - John Doe
        relationship:
          description: Description of the business' relationship to the PEP
          type: string
          examples:
            - Business owner's spouse
        institutionOrCompany:
          description: The name of the political organization the PEP is related to
          type: string
          examples:
            - Municipality of Helsinki
        positionWithinCompany:
          description: PEP's position within the institution the PEP is involved with
          type: string
          examples:
            - Member of the Municipal Council
        from:
          description: Start date of PEP's association to the institution
          type: string
          format: date
        until:
          description: End date of PEP's association to the institution (blank if the relationship is ongoing)
          type: string
          format: date
    CrossBorderUBO:
      type: object
      title: Details of UBOs residing outside of EEA
      description: Information about UBOs residing outside of EEA
      required:
        - fullName
        - uboResidenceCountry
      properties:
        fullName:
          description: Full name of the UBO residing in a country outside EEA
          type: string
          examples:
            - Bruce Wayne
        uboResidenceCountry:
          description: Country in which resides the UBO
          type: string
          enum:
            - Afghanistan
            - Albania
            - Algeria
            - Andorra
            - Angola
            - Antigua and Barbuda
            - Argentina
            - Armenia
            - Australia
            - Austria
            - Azerbaijan
            - Bahamas
            - Bahrain
            - Bangladesh
            - Barbados
            - Belarus
            - Belgium
            - Belize
            - Benin
            - Bhutan
            - Bolivia
            - Bosnia and Herzegovina
            - Botswana
            - Brazil
            - Brunei
            - Bulgaria
            - Burkina Faso
            - Burundi
            - Cabo Verde
            - Cambodia
            - Cameroon
            - Canada
            - Central African Republic
            - Chad
            - Chile
            - China
            - Cyprus
            - Colombia
            - Comoros
            - Congo
            - Costa Rica
            - Cote d Ivoire
            - Croatia
            - Cuba
            - Czech Republic
            - Denmark
            - Djibouti
            - Dominica
            - Dominican Republic
            - DR Congo
            - Ecuador
            - Egypt
            - El Salvador
            - Equatorial Guinea
            - Eritrea
            - Estonia
            - Eswatini
            - Ethiopia
            - Fiji
            - Finland
            - France
            - Gabon
            - Gambia
            - Georgia
            - Germany
            - Ghana
            - Greece
            - Grenada
            - Guatemala
            - Guyana
            - Guinea
            - Guinea Bissau
            - Haiti
            - Holy See
            - Honduras
            - Hungary
            - Iceland
            - Yemen
            - India
            - Indonesia
            - Iran
            - Iraq
            - Ireland
            - Israel
            - Italy
            - Jamaica
            - Japan
            - Jordan
            - Kazakhstan
            - Kenya
            - Kyrgyzstan
            - Kiribati
            - Kuwait
            - Laos
            - Latvia
            - Lebanon
            - Lesotho
            - Liberia
            - Libya
            - Liechtenstein
            - Lithuania
            - Luxembourg
            - Madagascar
            - Malaysia
            - Malawi
            - Maldives
            - Mali
            - Malta
            - Marshall Islands
            - Mauritania
            - Mauritius
            - Mexico
            - Myanmar
            - Micronesia
            - Moldova
            - Monaco
            - Mongolia
            - Montenegro
            - Morocco
            - Mozambique
            - Namibia
            - Nauru
            - Nepal
            - Netherlands
            - New Zealand
            - Nicaragua
            - Niger
            - Nigeria
            - North Korea
            - North Macedonia
            - Norway
            - Oman
            - Pakistan
            - Palau
            - Panama
            - Papua New Guinea
            - Paraguay
            - Peru
            - Philippines
            - Poland
            - Portugal
            - Qatar
            - Romania
            - Russia
            - Rwanda
            - Saint Kitts and Nevis
            - Saint Lucia
            - Samoa
            - San Marino
            - Sao Tome and Principe
            - Saudi Arabia
            - Seychelles
            - Senegal
            - Serbia
            - Sierra Leone
            - Singapore
            - Syria
            - Slovakia
            - Slovenia
            - Solomon Islands
            - Somalia
            - South Africa
            - South Korea
            - South Sudan
            - Spain
            - Sri Lanka
            - St Vincent and Grenadines
            - State of Palestine
            - Sudan
            - Suriname
            - Sweden
            - Switzerland
            - Tajikistan
            - Tanzania
            - Thailand
            - Timor Leste
            - Togo
            - Tonga
            - Trinidad and Tobago
            - Tunisia
            - Turkey
            - Turkmenistan
            - Tuvalu
            - Uganda
            - Ukraine
            - United Arab Emirates
            - United Kingdom
            - United States
            - Uruguay
            - Uzbekistan
            - Vanuatu
            - Venezuela
            - Vietnam
            - Zambia
            - Zimbabwe
    AmlForm:
      type: object
      x-tags: Schemas
      title: AML Form details
      description: AML Form providing details about source of business' funds and relations to politically exposed persons
      required:
        - application_uuid
        - industryType
        - isPepOrRelated
        - crossBorderUBO
        - crossBorderOperations
        - seniorInTargetJurisdictions
        - sourceOfWealth
      properties:
        application_uuid:
          description: Unique Loan application ID
          type: string
          format: uuid
          examples:
            - 550e8400-e29b-41d4-a716-446655440000
        industryType:
          description: Industry Type in which Company is operating. Industry type definitions follow ISIC code top-level classification. See [more detils in appendix](/#tag/Enumerations/Industry-types).
          type: string
          enum:
            - A
            - B
            - C
            - D
            - E
            - F
            - G
            - H
            - I
            - J
            - K
            - L
            - M
            - 'N'
            - O
            - P
            - Q
            - R
            - S
            - T
            - U
          examples:
            - C
        isPepOrRelated:
          description: Is applicant a PEP or has relations to PEPs?
          type: boolean
        pepOrRelatedDetails:
          description: Details of individuals who are PEPs or are related to PEP. Mandatory if ```isPepOrRelated == true```
          type: array
          items:
            $ref: '#/components/schemas/PepOrRelatedDetail'
        crossBorderUBO:
          description: Specifies whether the business has UBOs residing outside of EEA
          type: boolean
        crossBorderUBODetails:
          description: Details of UBOs residing outside of EEA
          type: array
          items:
            $ref: '#/components/schemas/CrossBorderUBO'
        crossBorderOperations:
          description: Specifies whether the business has been operating in a market which differs from the country of company registration
          type: boolean
        crossBorderOperationsLocations:
          description: Locations where the business has been operating in (excluding the country of registration).Mandatory, if ```crossBorderOperations == true```
          type: array
          items:
            type: string
            enum:
              - Afghanistan
              - Albania
              - Algeria
              - Andorra
              - Angola
              - Antigua and Barbuda
              - Argentina
              - Armenia
              - Australia
              - Austria
              - Azerbaijan
              - Bahamas
              - Bahrain
              - Bangladesh
              - Barbados
              - Belarus
              - Belgium
              - Belize
              - Benin
              - Bhutan
              - Bolivia
              - Bosnia and Herzegovina
              - Botswana
              - Brazil
              - Brunei
              - Bulgaria
              - Burkina Faso
              - Burundi
              - Cabo Verde
              - Cambodia
              - Cameroon
              - Canada
              - Central African Republic
              - Chad
              - Chile
              - China
              - Cyprus
              - Colombia
              - Comoros
              - Congo
              - Costa Rica
              - Cote d Ivoire
              - Croatia
              - Cuba
              - Czech Republic
              - Denmark
              - Djibouti
              - Dominica
              - Dominican Republic
              - DR Congo
              - Ecuador
              - Egypt
              - El Salvador
              - Equatorial Guinea
              - Eritrea
              - Estonia
              - Eswatini
              - Ethiopia
              - Fiji
              - Finland
              - France
              - Gabon
              - Gambia
              - Georgia
              - Germany
              - Ghana
              - Greece
              - Grenada
              - Guatemala
              - Guyana
              - Guinea
              - Guinea Bissau
              - Haiti
              - Holy See
              - Honduras
              - Hungary
              - Iceland
              - Yemen
              - India
              - Indonesia
              - Iran
              - Iraq
              - Ireland
              - Israel
              - Italy
              - Jamaica
              - Japan
              - Jordan
              - Kazakhstan
              - Kenya
              - Kyrgyzstan
              - Kiribati
              - Kuwait
              - Laos
              - Latvia
              - Lebanon
              - Lesotho
              - Liberia
              - Libya
              - Liechtenstein
              - Lithuania
              - Luxembourg
              - Madagascar
              - Malaysia
              - Malawi
              - Maldives
              - Mali
              - Malta
              - Marshall Islands
              - Mauritania
              - Mauritius
              - Mexico
              - Myanmar
              - Micronesia
              - Moldova
              - Monaco
              - Mongolia
              - Montenegro
              - Morocco
              - Mozambique
              - Namibia
              - Nauru
              - Nepal
              - Netherlands
              - New Zealand
              - Nicaragua
              - Niger
              - Nigeria
              - North Korea
              - North Macedonia
              - Norway
              - Oman
              - Pakistan
              - Palau
              - Panama
              - Papua New Guinea
              - Paraguay
              - Peru
              - Philippines
              - Poland
              - Portugal
              - Qatar
              - Romania
              - Russia
              - Rwanda
              - Saint Kitts and Nevis
              - Saint Lucia
              - Samoa
              - San Marino
              - Sao Tome and Principe
              - Saudi Arabia
              - Seychelles
              - Senegal
              - Serbia
              - Sierra Leone
              - Singapore
              - Syria
              - Slovakia
              - Slovenia
              - Solomon Islands
              - Somalia
              - South Africa
              - South Korea
              - South Sudan
              - Spain
              - Sri Lanka
              - St Vincent and Grenadines
              - State of Palestine
              - Sudan
              - Suriname
              - Sweden
              - Switzerland
              - Tajikistan
              - Tanzania
              - Thailand
              - Timor Leste
              - Togo
              - Tonga
              - Trinidad and Tobago
              - Tunisia
              - Turkey
              - Turkmenistan
              - Tuvalu
              - Uganda
              - Ukraine
              - United Arab Emirates
              - United Kingdom
              - United States
              - Uruguay
              - Uzbekistan
              - Vanuatu
              - Venezuela
              - Vietnam
              - Zambia
              - Zimbabwe
        stakeholdersHighRiskResidence:
          description: Specifies whether any of the senior management, beneficial owners, shareholders are a citizen and/or resident in **Russia**, **Belarus** or **Ukraine**
          type: boolean
          examples:
            - true
        stakeholdersHighRiskResidenceDetails:
          description: The jurisdiction and name of the person in senior management, beneficial owners, shareholders are a citizen and/or resident in **Russia**, **Belarus** or **Ukraine**
          examples:
            - Aleksandr Melnyk, Ukraine
        sourceOfWealth:
          description: The origins of a business' entire body of wealth
          type: array
          items:
            type: string
            enum:
              - Profit
              - Dividend
              - Physical Assets (Equipment/Inventory)
              - Investments
              - Share Sales
              - Loans
              - Government Grants
              - Other
        sourceOfWealthDetails:
          description: Additional information regarding the source of wealth if **Other** was specified under ```sourceOfWealth```
          type: string
          examples:
            - Other source of wealth
    AMLSubmitted:
      type: object
      properties:
        amlStatus:
          description: status of the AML form submission
          type: string
          default: Completed
    Contract:
      description: Financing Contract HTMl source
      type: object
      properties:
        contractEncoded:
          description: Base64 encoded text string containing HTML source of the contract
          type: string
          format: byte
          examples:
            - YWxsIHlvdXIgYmFzZSBhcmUgYmVsb25nIHRvIHVz
    RepaymentBooking:
      title: Repayment details for booking
      x-tags: Schemas
      description: Single repayment data for an active client
      type: object
      required:
        - application_uuid
        - transactionId
        - transactionDateTime
        - amount
        - currency
      properties:
        application_uuid:
          description: Unique application ID to which the repayment should be applied
          type: string
          format: uuid
        customNumber:
          description: Custom application reference in addition to standard application_uuid used by this API. Usually API user's internal reference
          type: string
          examples:
            - A1642851751
        transactionId:
          description: Unique repayment transaction ID
          type: string
          examples:
            - TR12345878
        transactionDateTime:
          description: ISO timestamp of the transaction in local timezone
          type: string
          format: datetime
          examples:
            - '2024-01-31 19:30:59'
          pattern: ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
        currency:
          description: ISO currency code for the repayment
          type: string
          enum:
            - EUR
            - DKK
            - SEK
        amount:
          description: Repaid amount
          type: number
          format: float
          examples:
            - 99.99
    RepaymentReceipt:
      title: Booked repayment receipt
      description: Receipt for a booked repayment containing the remaining outstanding balance
      type: object
      properties:
        outstandingBalance:
          description: Remaining outstanding balance in local currency after the repayment has been booked
          type: number
          format: float
          examples:
            - 3.5
    Repayment:
      title: Received Repayment
      x-tags: Schemas
      description: Single repayment
      type: object
      properties:
        valueDate:
          description: ISO date of the transaction in local timezone
          type: string
          format: date
          examples:
            - '2024-01-31'
        amount:
          description: Repaid amount
          type: number
          format: float
          examples:
            - 99.99
        currency:
          description: ISO currency code for the repayment
          type: string
          enum:
            - EUR
            - DKK
            - SEK
        originalAmount:
          description: Original payment amount submitted for booking (before currency conversion, if such was applied)
          type: number
          format: float
          examples:
            - 99.99
        originalCurrency:
          description: ISO currency code for the original payment submitted for booking (before currency conversion, if such was applied)
          type: string
          enum:
            - EUR
            - DKK
            - SEK
        exchangeRate:
          description: Currency conversion exchange rate applied during booking
          type: number
          format: float
          examples:
            - 1
        paymentMessage:
          type: string
          examples:
            - Loan 102323 repayment
        paymentUid:
          description: Unique repayment Id to identify the transaction
          type: string
          pattern: ^\d{4}-\d{6}-\d{7}$
          examples:
            - 1123-123123-1111111
        counterpartyAccount:
          description: Bank account number of the payer
          type: string
          examples:
            - 123456789
        counterpartyBankCode:
          description: Bank clearing code for the payer
          type: string
          examples:
            - 1324
        counterpartyName:
          description: Business entity title which has made the repayment
          type: string
          examples:
            - Stark Industries, Ltd.
        counterpartyAddress:
          description: Business registration address of the payer
          type: string
          examples:
            - 221B Baker Street,London,United Kingdom
    RepaymentList:
      title: Received Repayments
      description: List of received repayments
      type: object
      properties:
        repayments:
          type: array
          items:
            $ref: '#/components/schemas/Repayment'
    Disbursement:
      title: Disbursement request
      x-tags: Schemas
      description: Request to disburse single loan
      required:
        - application_uuid
      type: object
      properties:
        application_uuid:
          description: Unique application ID
          type: string
          format: uuid
        customNumber:
          description: Custom application reference in addition to standard application_uuid used by this API. Usually API user's internal reference
          type: string
          examples:
            - A1642851751
        currency:
          description: ISO currency code for the repayment
          type: string
          enum:
            - EUR
            - DKK
            - SEK
        amount:
          description: Repaid amount
          type: number
          format: float
          examples:
            - 35000
        bankAccount:
          description: Business bank account the loan should be disbursed to
          type: string
          examples:
            - NL78INGB7209131833
    DisbursementReceipt:
      title: Disbursement completed
      description: Receipt for completed loan disbursement
      type: object
      properties:
        status:
          description: Status of loan disbursement
          type: string
          enum:
            - Completed
          examples:
            - Completed
        amount:
          description: Disbursed loan amount
          type: number
          format: float
          examples:
            - 35000
    EInvoice:
      type: object
      properties:
        status:
          description: Current status of the e-invoice
          type: string
          enum:
            - ERROR
            - PENDING
            - SENT
          examples:
            - ERROR
        details:
          description: Additional details of the e-invoice, e.g. error message if status is `ERROR`
          type: string
          examples:
            - E-invoice address (EID) invalid
    EInvoiceUpdateForm:
      type: object
      required:
        - status
      properties:
        status:
          description: Status of the e-invoice
          type: string
          enum:
            - OK
            - DebtorRejected
          examples:
            - OK
        eia:
          description: Debtor's e-invoicing address for delivery, required only if `status = 'OK'`. <br> Uses strict format `[e-invoicing id]:[operatorId]`.
          type: string
          examples:
            - 003700000000:E204503
    EInvoiceUpdated:
      type: object
      properties:
        status:
          description: Status of the update action
          type: string
          enum:
            - success
          examples:
            - success
    BatchResultPreOffer:
      title: Batch pre-offer
      description: Pre-offer batch request result
      type: object
      properties:
        validUntil:
          type: string
          format: datetime
          examples:
            - '2024-01-31 19:30:59'
          pattern: ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
        batch:
          type: array
          items:
            type: object
            properties:
              customNumber:
                description: Custom business reference in API user's internal records
                type: string
                examples:
                  - A1642851751
              minAmount:
                description: Minimum financing amount
                type: number
                format: float
                examples:
                  - 5000
              maxAmount:
                description: Maximum financing amount
                type: number
                format: float
                examples:
                  - 35000
    BatchResultPayout:
      title: Batch payout
      description: Payout batch request result
      type: object
    BatchResult:
      title: Batch Result
      description: Batch processing result
      type: object
      oneOf:
        - $ref: '#/components/schemas/BatchResultPreOffer'
        - $ref: '#/components/schemas/BatchResultPayout'
    Webhook:
      type: object
      properties:
        uuid:
          type: string
          format: uuid
        event:
          type: string
          enum:
            - applicationDeclined
            - applicationWithdrawn
            - offersCreated
            - offersUpdated
            - batchCompleted
            - loanDisbursed
            - contractReady
            - contractSigned
            - contractFailed
        timestamp:
          description: timestamp of event (format Y-m-d H:i:s)
          type: string
          format: timestamp
          examples:
            - '2023-12-12 14:12:33'
    SSOLoginURL:
      type: object
      properties:
        redirect:
          type: string
          examples:
            - https://som-login-url.capitalbox.com
          format: uri
  securitySchemes:
    BasicAuth:
      type: http
      name: Authorization
      scheme: basic
    Signature:
      type: apiKey
      name: Signature
      in: header
    BearerAuth:
      type: http
      scheme: bearer
  responses:
    BadRequest:
      x-summary: Bad Request
      description: HTTP request is not valid or payload does not pass business validation rule requirements
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Failure'
          example:
            uuid: a1945a40-d80b-469d-ac6b-cc66e4c866a6
            timestamp: '2023-12-12 14:12:33'
            errors: Validation Error, Record expired or does not exist
    Unauthorized:
      x-summary: Unauthorized
      description: Authentication or request signature are invalid
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Failure'
          example:
            timestamp: '2023-12-12 14:12:33'
            errors: Invalid Token, Invalid Credentials
    ServiceUnavailable:
      description: Service Unavailable
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Failure'
          example:
            timestamp: '2023-12-12 14:12:33'
            errors: Service Unavailable
x-tagGroups:
  - name: General Information
    tags:
      - Introduction
      - Communication
      - Changelog
      - Sandbox
  - name: API Reference
    tags:
      - Leads
      - Applications
      - Offers
      - Files
      - AML Forms
      - Contracts
      - Batch Processing
      - Disbursements
      - Repayments
      - E-invoices
      - Status
  - name: Appendix
    tags:
      - Enumerations
      - Data Formats
      - Webhooks
      - Schemas
