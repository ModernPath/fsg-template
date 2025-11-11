# Frontend Architecture

## UI/UX Design Approach

The Financial Services Group (FSG) application follows a unique, sophisticated design system emphasizing clarity, usability, and a distinct brand identity, centered around a dark theme with gold accents.

### Design Principles

1. **Spacious Layout**
   - Maximum content width: 1440px (large screens)
   - Generous padding: 2rem - 4rem
   - Ample whitespace between sections
   - Airy vertical spacing (min 2rem between elements)

2. **Typography Scale**
   - Headings:
     - H1: 48px/3rem (Hero titles)
     - H2: 36px/2.25rem (Section titles)
     - H3: 28px/1.75rem (Card titles)
     - H4: 24px/1.5rem (Subsection titles)
   - Body text:
     - Large: 18px/1.125rem (Primary content)
     - Regular: 16px/1rem (Secondary content)
     - Small: 14px/0.875rem (Supporting text)
   - Line height: 1.6 for optimal readability

3. **Color Palette**
   - **Primary Background:** `#000000` (Black)
   - **Secondary Background:** `#111111` (Very Dark Gray)
   - **Primary Text & Accent:** `FFFFE0` (Light Yellow - for highlight)
   - **Secondary Text:** `#F0E68C` (Khaki/Light Gold)
   - **Tertiary Text/Subtle Elements:** `#A9A9A9` (Dark Gray - for less emphasis against black)
   - **Interactive Elements (Hover/Focus):** `#FFFFE0` 
   - **Error/Warning:** `#DC143C` (Crimson - provides contrast on black)

4. **Input Fields**
```scss
.input-field {
  height: 56px;
  padding: 0 1.25rem;
  font-size: 1.125rem;
  border-radius: 12px;
  border: 2px solid #A9A9A9; // Dark Gray border
  transition: all 0.2s ease;
  width: 100%;
  background: #111111; // Very Dark Gray background
  color: #FFD700; // Gold text

  &:focus {
    border-color: #FFD700; // Gold border on focus
    box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.2); // Subtle gold glow
    background: #000000; // Black background on focus
  }

  &::placeholder {
    color: #A9A9A9; // Dark Gray placeholder
  }
}

.input-label {
  font-size: 1rem;
  font-weight: 500;
  color: #F0E68C; // Light Gold label
  margin-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}
```

5. **Buttons**
```scss
.button {
  height: 56px;
  padding: 0 2rem;
  font-size: 1.125rem;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: none; // Remove border for solid buttons

  &-primary {
    background: #FFD700; // Gold background
    color: #000000; // Black text for contrast

    &:hover {
      background: #FFFFE0; // Lighter gold/yellow on hover
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3); // Gold glow
    }
  }

  &-secondary {
    background: transparent; // Transparent background
    border: 2px solid #FFD700; // Gold border
    color: #FFD700; // Gold text

    &:hover {
      background: rgba(255, 215, 0, 0.1); // Subtle gold background on hover
      color: #FFFFE0; // Lighter gold text
      border-color: #FFFFE0;
    }
  }
}
```

6. **Cards**
```scss
.card {
  padding: 2rem;
  border-radius: 16px;
  background: #111111; // Very dark gray background
  border: 1px solid #A9A9A9; // Subtle border
  box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.5); // Darker shadow for depth

  &-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: #FFD700; // Gold title
    margin-bottom: 1rem;
  }

  &-content {
    font-size: 1.125rem;
    color: #F0E68C; // Light Gold content
    line-height: 1.6;
  }
}
```

7. **Container Widths**
```scss
.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (min-width: 1024px) {
    padding: 0 4rem;
  }
  
  &-narrow {
    max-width: 1024px;
  }
  
  &-wide {
    max-width: 1680px;
  }
}
```

8. **Form Layout**
```scss
.form-container {
  max-width: 640px;
  margin: 0 auto;
  
  &-wide {
    max-width: 800px;
  }
  
  .form-section {
    margin-bottom: 2.5rem;
    
    &-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
  }
}
```

9. **Navigation**
```scss
.nav {
  height: 80px;
  padding: 0 2rem;
  background: #000000; // Black nav background

  &-link {
    font-size: 1.125rem;
    font-weight: 500;
    color: #F0E68C; // Light Gold links
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      background: #111111; // Dark gray background on hover
      color: #FFD700; // Brighter Gold text
    }

    &.active {
      color: #000000; // Black text for active link
      background: #FFD700; // Gold background for active
      font-weight: 600;
    }
  }
}
```

10. **Spacing System**
```scss
:root {
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;
  --spacing-3xl: 6rem;
}
```

11. **Hero Sections**
```scss
.hero {
  padding: var(--spacing-2xl) 0;
  
  &-title {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: var(--spacing-lg);
    
    @media (min-width: 1024px) {
      font-size: 4rem;
    }
  }
  
  &-subtitle {
    font-size: 1.5rem;
    color: #6B7280;
    margin-bottom: var(--spacing-xl);
    
    @media (min-width: 1024px) {
      font-size: 1.75rem;
    }
  }
}
```

12. **Feature Cards**
```scss
.feature-card {
  padding: 2rem;
  border-radius: 16px;
  background: #111111; // Very dark gray background
  border: 1px solid #A9A9A9; // Dark Gray border
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.6); // Enhanced shadow
    border-color: #FFD700; // Gold border on hover
  }

  &-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 1.5rem;
    // Use gold-themed icons or SVG masks
    filter: invert(85%) sepia(60%) saturate(475%) hue-rotate(350deg) brightness(105%) contrast(102%); // Approximate gold filter
  }

  &-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #FFD700; // Gold title
    margin-bottom: 1rem;
  }

  &-description {
    font-size: 1.125rem;
    color: #F0E68C; // Light Gold description
    line-height: 1.6;
  }
}
```

### Component Examples

1. **Registration Form**
```html
<div class="container">
  <div class="form-container-wide">
    <h1 class="hero-title">Start Your Journey</h1>
    <p class="hero-subtitle">Get AI-powered insights and personalized recommendations for your business</p>
    
    <form class="form-section">
      <div class="form-group">
        <label class="input-label">Company Name</label>
        <input type="text" class="input-field" placeholder="Enter your company name">
      </div>
      
      <div class="form-group">
        <label class="input-label">Business Email</label>
        <input type="email" class="input-field" placeholder="Enter your business email">
      </div>
      
      <button type="submit" class="button button-primary">
        Continue
      </button>
    </form>
  </div>
</div>
```

2. **Feature Grid**
```html
<div class="container">
  <div class="grid grid-cols-3 gap-8">
    <div class="feature-card">
      <div class="feature-card-icon">
        [Icon]
      </div>
      <h3 class="feature-card-title">Financial Health</h3>
      <p class="feature-card-description">
        Get a comprehensive analysis of your business's financial health with clear metrics and actionable insights
      </p>
    </div>
    <!-- Repeat for other features -->
  </div>
</div>
```

### Responsive Behavior

- **Breakpoints**
```scss
$breakpoints: (
  'sm': 640px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px,
  '2xl': 1536px
);
```

- **Container Padding**
```scss
.container {
  padding: 0 1rem;
  
  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
  
  @media (min-width: 1280px) {
    padding: 0 4rem;
  }
}
```

- **Typography Scaling**
```scss
.hero-title {
  font-size: 2.5rem; // 40px
  
  @media (min-width: 768px) {
    font-size: 3rem; // 48px
  }
  
  @media (min-width: 1024px) {
    font-size: 3.5rem; // 56px
  }
  
  @media (min-width: 1280px) {
    font-size: 4rem; // 64px
  }
}
```

### Animation & Interaction

```scss
// Smooth transitions
.transition-base {
  transition: all 0.2s ease;
}

// Hover effects
.hover-lift {
  &:hover {
    transform: translateY(-2px);
  }
}

// Focus states
.focus-ring {
  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
  }
}
```

## Page Structure

### 1. Public Pages

#### 1.1 Home Page
- Hero section with clear value proposition
- Feature highlights with icons and short descriptions
- How it works section (3-step process visualization)
- Testimonials from business owners
- Call-to-action for signup/login

#### 1.2 Features Page
- Detailed explanation of each core feature
- Benefit-focused content
- Interactive demo elements
- Visual explanations of the AI analysis process

#### 1.3 Pricing Page
- Clear pricing tiers (Basic, Professional, Enterprise)
- Feature comparison table
- FAQ section
- Contact information for custom solutions

#### 1.4 About Us
- Company mission and vision
- Team information
- Partner financial institutions
- Regulatory compliance information

#### 1.5 Contact Page
- Contact form
- Office location with map
- Support hours and contact channels
- FAQ section

### 2. User Journey & Authentication

#### 2.1 Start Your Financial Journey
- **Hero Section**
  - Large, engaging headline: "Transform Your Business Finances with AI"
  - Subheading emphasizing value: "Join 10,000+ businesses getting AI-powered financial insights"
  - Social proof: Logos of notable clients and trust indicators
  - CTA button: "Start Free Analysis" (primary action)

- **Quick Start Form** (replaces traditional registration)
  - Clean, spacious layout with large input fields
  - Progress indicator showing 3 simple steps
  - Step 1: Basic Info
    - Company name (large input)
    - Business email
    - Industry dropdown (with modern search)
  - Step 2: Financial Goals
    - Visual cards for selecting primary goals:
      - Optimize Working Capital
      - Secure Growth Funding
      - Improve Financial Health
      - Strategic Planning
    - Option to select multiple goals
  - Step 3: Current Stage
    - Annual revenue range (visual slider)
    - Current financing needs (if any)
    - Timeline for financial goals
  - Success screen with personalized welcome message

#### 2.2 Secure Access (replaces traditional login)
- **Modern Authentication**
  - Large, clean login form
  - "Welcome back to your financial command center"
  - Email/password with biometric option
  - Single Sign-On options prominently displayed
    - Google Workspace
    - Microsoft 365
    - Financial ID (region-specific)
  - "Remember this device" with enhanced security messaging
  - Quick access to support via chat

#### 2.3 Account Recovery
- **Smart Recovery Process**
  - AI-assisted verification
  - Multi-channel recovery options
    - Email verification
    - SMS verification
    - Business ID verification
  - Step-by-step guidance with estimated completion time
  - Security tips and best practices displayed during process

#### 2.4 First-Time Experience
- **Personalized Onboarding**
  - Welcome video from AI advisor
  - Guided tour of key features
  - Quick setup checklist with progress tracking
  - Sample reports preview
  - Integration options with accounting software
  - Customization of dashboard based on goals

#### UI Components for Authentication

##### Value Proposition Cards
```typescript
interface ValueCard {
  icon: string;        // Modern line icon
  title: string;       // Benefit-focused heading
  description: string; // One-line value statement
  action?: string;     // Optional CTA
}
```

##### Progress Timeline
```typescript
interface ProgressStep {
  step: number;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  estimatedTime: string;
}
```

##### Authentication Form Styling
```scss
.auth-container {
  max-width: 800px;  // Larger container
  padding: 3rem;
  background-color: #000000; // Black background

  .form-heading {
    font-size: 2.5rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: #FFD700; // Gold heading
  }

  .input-field { // Inherits updated styles from above
    height: 60px;
    font-size: 1.2rem;
    border-radius: 12px;
    transition: all 0.3s ease;

    &:focus {
      transform: scale(1.02);
    }
  }

  .cta-button { // Uses updated button styles
    height: 60px;
    font-size: 1.2rem;
    font-weight: 500;
    // Primary button style will be gold background, black text
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      // Hover effect from button-primary
    }
  }
}
```

##### Success Animation
```typescript
interface SuccessState {
  message: string;
  nextSteps: string[];
  animation: 'pulse' | 'scale' | 'checkmark';
  duration: number;
}
```

#### Visual Design Elements

- **Gradients**
  - Subtle gold gradients might be used for highlights: `linear-gradient(135deg, #FFD700, #F0E68C)`
  - Primarily solid black backgrounds.

- **Shadows**
  - Subtle dark shadows on dark elements for depth.
  - Potentially use gold outer glows (`box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);`) for highlighting interactive elements on hover/focus.

- **Animations**
  - Smooth transitions between steps
  - Progress indicators with fluid animations
  - Success celebrations with confetti effect

- **Spacing**
  - Large padding: `3rem`
  - Input spacing: `2rem`
  - Section margins: `4rem`
  - Comfortable line height: `1.8`

### 3. Dashboard (Authenticated)

#### 3.1 Overview Dashboard
- Account summary with key metrics
- Recent activity feed
- Quick action buttons
- Status of current financing applications
- Financing offer highlights
- Company financial health summary

#### 3.2 Company Profile
- Basic company information (editable)
- Business registration details
- Industry classification
- Contact information
- Team member management
- Company logo/branding

#### 3.3 Financial Analysis Hub
- Financial health overview
- Key metrics visualization
- Document upload interface
- AI analysis results
- Historical financial data
- Trend analysis and projections
- Interactive questionnaire for missing information

#### 3.4 Financing Needs
- Create new financing need
- View existing financing needs
- Purpose and amount specification
- Timeframe selection
- Requirements definition
- Link to application process

#### 3.5 Financing Applications
- Application creation wizard
- Application status tracking
- Document attachment
- Application history
- Communication log with providers
- Edit/withdraw options

#### 3.6 Financing Offers
- Offer inbox
- Comparison view
- Detailed offer terms
- Accept/decline interface
- Negotiation features
- Document viewer for offer details
- Decision support information

#### 3.7 Settings
- Profile management
- Notification preferences
- Account security
- Subscription management
- Data privacy settings
- Integrations configuration

## Component Library

The application uses Shadcn UI as its component foundation, with customized styling to match FSG's brand identity.

### Key Custom Components

1. **Financial Data Card**
   - Purpose: Display financial metrics with context
   - Features: Trend indicator, comparison to previous period, descriptive labels

2. **Document Uploader**
   - Purpose: Handle financial document uploads
   - Features: Drag-and-drop, multi-file, progress indicator, file type validation

3. **Financing Comparison Table**
   - Purpose: Side-by-side offer comparison
   - Features: Highlight differences, sort by different parameters, export functionality

4. **Financial Health Gauge**
   - Purpose: Visualize company's financial health score
   - Features: Color-coded scale, context information, improvement suggestions

5. **Application Status Tracker**
   - Purpose: Show financing application progress
   - Features: Timeline visualization, status updates, next steps

6. **AI Analysis Summary**
   - Purpose: Present AI-generated insights
   - Features: Collapsible sections, highlight key findings, source references

7. **Financial Chart Suite**
   - Purpose: Visualize financial data
   - Features: Multiple chart types (bar, line, pie), responsive sizing, export options

## Page Layouts

### Standard Layout Structure
- Fixed top navigation
- Sidebar navigation (on authenticated pages)
- Main content area
- Footer with legal information and links

### Dashboard Layout
- Collapsible sidebar
- Top navbar with user menu, notifications, and help
- Content area with breadcrumbs
- Responsive adjustments for different screen sizes

### Form Layouts
- Single column for simple forms
- Multi-column for complex data entry
- Fieldset grouping for related information
- Inline validation with helpful error messages

## Responsive Behavior

- **Desktop (1200px+)**: Full feature set, optimized for data visualization
- **Tablet (768px-1199px)**: Adapted layouts, maintained functionality
- **Mobile (320px-767px)**: Essential functions, simplified views

### Mobile Adaptations
- Hamburger menu for navigation
- Simplified charts and visualizations
- Sequential display of comparison data
- Chunked form input to reduce overwhelming UX

## Interaction Patterns

1. **Progressive Disclosure**
   - Show essential information first
   - Reveal details on interaction
   - Use accordions and tabs for complex data sets

2. **Inline Editing**
   - Edit data without page transitions
   - Immediate validation
   - Clear save/cancel options

3. **Guided Actions**
   - Step-by-step wizards for complex processes
   - Clear progress indicators
   - Ability to save progress and continue later

4. **Notification System**
   - Toast notifications for immediate feedback
   - Inbox for important updates
   - Email notifications for critical events

## State Management

- React Context API for global state
- React Query for server state and caching
- Local component state for UI-specific behavior
- Form state managed with React Hook Form

## Accessibility Implementation

- Semantic HTML structure
- ARIA labels where necessary
- Keyboard navigation support
- Focus management
- Screen reader testing
- Color contrast compliance
- Text alternatives for visual elements

## Internationalization

- Finnish as primary language
- English as secondary language
- Support for Swedish in future releases
- Translation keys for all UI elements
- Date, time, and currency formatting based on locale
- RTL support in component design

## Performance Optimizations

- Code splitting by route
- Lazy loading of heavy components
- Image optimization
- Efficient data fetching with React Query
- Memoization of expensive calculations
- Virtualization for long lists
- Web Vitals monitoring and optimization

## Design Concepts

The following design concepts showcase the application's visual direction, centered around a sophisticated **dark theme (black background, `#000000`)** with **light gold accents (`#FFD700`, `#F0E68C`)**. The brand incorporates unique animal mascots—a sloth, kangaroo, and ape—dressed in business attire, adding a distinct and memorable character.

### Design System Elements

#### Color Palette
*Placeholder: Image showing the new Black & Gold color palette.*

The color palette uses a deep black background contrasted with shades of gold for text and interactive elements, conveying sophistication and modernity.
- **Background:** `#000000` (Black)
- **Primary Text/Accent:** `#FFD700` (Gold)
- **Secondary Text:** `#F0E68C` (Light Gold/Khaki)
- **Borders/Subtle Elements:** `#A9A9A9` (Dark Gray)
- **Highlights:** `#FFFFE0` (Light Yellow)

#### Typography
*Placeholder: Image showing typography samples on a black background with gold text.*

The typography system (e.g., Georgia for headings, Open Sans for body) remains, but rendered in gold tones against the black background for high contrast and readability.

#### UI Components
*Placeholder: Image showing UI elements (buttons, inputs, cards) in the Black & Gold theme.*

Components are styled with the new palette:
- **Buttons:** Gold primary buttons with black text, or outlined gold secondary buttons.
- **Forms:** Dark gray inputs with gold text and gold focus indicators.
- **Cards:** Very dark gray cards (`#111111`) with gold text and subtle borders.

### Brand and UI Applications

#### Financial Services Group Logo & Mascots
*Placeholder: Image of the FSG logo adapted for the dark theme, potentially incorporating subtle gold elements. Include illustrations of the Sloth, Kangaroo, and Ape mascots in business attire.*

The logo is adapted for the dark theme. The unique animal mascots (Sloth, Kangaroo, Ape in business wear) are key visual elements used throughout the application and marketing materials, representing diverse approaches to financial strategy within a professional context.

#### Dashboard Interface
*Placeholder: Mockup of the main dashboard with the Black & Gold theme, perhaps featuring one of the animal mascots in a corner or as part of a chart illustration.*

The dashboard uses the black background with gold text and accents. Data visualizations use shades of gold, yellow, and potentially contrasting neutral colors against the dark backdrop. Mascots may appear subtly integrated into the UI.

### Key Component Designs

#### Financial Health Gauge
*Placeholder: Image of the gauge component with a dark background and gold/yellow/red indicators.*

The gauge uses the new color scheme, likely with a gold or yellow needle/indicator against a dark background. Color coding for status (green/amber/red) might be adapted using shades of gold/yellow/crimson for visibility on black.

#### Financing Comparison Table
*Placeholder: Image of the comparison table in the Black & Gold theme.*

The table uses gold text and borders on a black or very dark gray background. Favorable terms might be highlighted in a brighter gold or light yellow.

### Environmental Design
*Placeholder: Image of an office interior concept reflecting the sophisticated dark theme with gold accents.*

The physical space concept could reflect the digital theme with dark walls, gold fixtures, and potentially artwork featuring the business animal mascots.

These design concepts embody a unique, sophisticated, and modern brand identity for Financial Services Group, using the Black & Gold theme and distinctive animal mascots to stand out while maintaining professionalism.

## Admin UI Design

The admin section provides interfaces for managing core application data. It uses a consistent layout with sidebar navigation and relies heavily on Shadcn/ui components for structure and presentation.

### Admin Layout (`/admin/layout.tsx`)

- Provides a consistent structure for all admin pages.
- Includes a sidebar for navigation between different admin sections (Dashboard, Companies, etc.).
- Ensures admin-only access (implementation detail for backend/middleware).

### Admin Dashboard (`/admin`)

- The main landing page after admin login.
- Can contain summary information or quick links (details TBD).

### Companies List Page (`/admin/companies`)

- **Purpose:** Display a list of all registered companies.
- **Component:** Shadcn/ui `Table`.
- **Columns:** Company Name, Owner Email, Created At.
- **Functionality:**
    - Each row links to the corresponding Company Detail page.
    - Potential future features: Search, filtering, pagination.

### Company Detail Page (`/admin/companies/[companyId]`)

- **Purpose:** Show comprehensive details for a single company.
- **Layout:** Uses multiple Shadcn/ui `Card` components for organized information display.
- **Cards:**
    1.  **Company Information:** Displays data from the `companies` table (Name, Address, Org Number, Website, Description, etc.).
    2.  **Owner Information:** Displays data from the linked `profiles` table (Full Name, Email). Requires fetching profile data based on `companies.owner_id`.
    3.  **Funding Needs:** Displays data from the linked `funding_needs` table (Amount, Purpose, Timeline, etc.). Requires fetching based on `company_id`.
    4.  **Funding Recommendations:** Displays data from the linked `funding_recommendations` table (Recommended Amount, Provider, Rationale, etc.). Requires fetching based on `company_id`.
    5.  **Funding Applications:** Displays a list or table of `funding_applications` linked to the company. Shows Application ID, Status, Created At. Requires fetching based on `company_id`.

### Styling and Components

- Adheres to the general UI/UX principles (dark theme, gold accents, spacing).
- Utilizes Shadcn/ui components (`Table`, `Card`, `Button`, etc.) for consistency and rapid development.
- Data fetching will be handled server-side within the page components or dedicated API routes.

#### Step 7: KYC/UBO Information
- **Component:** `components/auth/onboarding/Step7KycUbo.tsx`
- **Purpose:** Collect Know Your Customer (KYC) and Ultimate Beneficial Owner (UBO) information.
- **Functionality:** Form for collecting necessary details, potentially integrating with a third-party verification service. Triggers the final application submission API (`/api/onboarding/submit-final-application`).

### Bookkeeper Document Request Modal (within Step 4)
- **Location:** Integrated within `components/auth/onboarding/Step4DocumentUpload.tsx`.
- **Purpose:** Allows users to send an email request to their bookkeeper if they cannot find the required financial documents.
- **Functionality:**
    - A button ("Send Document Request") below the file upload area triggers the modal.
    - The modal contains a form with fields for:
        - Bookkeeper's Email Address (required)
        - Personal Message (optional)
    - Form submission calls the `/api/send-document-request` backend endpoint.
    - Displays loading, success, and error states for the email sending process.
    - Uses component state (`isRequestModalOpen`, `bookkeeperEmail`, `personalMessage`, `emailSendStatus`, `emailSendError`) to manage visibility and form data.

## Dashboard