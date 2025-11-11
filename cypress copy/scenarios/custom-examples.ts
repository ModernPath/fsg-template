/**
 * CUSTOM TEST SCENARIOS - Examples
 * 
 * Create your own test scenarios here and reference them in bug-hunter.config.json
 */

import { TestScenario, TestStep } from '../../tools/autonomous-bug-hunter';

// =============================================================================
// EXAMPLE 1: E-Commerce Checkout Flow
// =============================================================================

export const checkoutFlowScenario: Partial<TestScenario> = {
  id: 'custom-checkout-flow',
  name: 'Complete checkout process with payment',
  category: 'payment',
  priority: 'critical',
  steps: [
    {
      action: 'navigate',
      target: '/products',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    {
      action: 'click',
      target: '[data-testid="product-card"]',
    },
    {
      action: 'click',
      target: '[data-testid="add-to-cart"]',
    },
    {
      action: 'verify',
      assertion: {
        type: 'text',
        expected: 'Added to cart',
      },
    },
    {
      action: 'click',
      target: '[data-testid="view-cart"]',
    },
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/cart',
      },
    },
    {
      action: 'click',
      target: '[data-testid="checkout-button"]',
    },
    {
      action: 'type',
      target: '#email',
      value: 'test@example.com',
    },
    {
      action: 'type',
      target: '#phone',
      value: '+358401234567',
    },
    {
      action: 'click',
      target: '[data-testid="payment-method-card"]',
    },
    {
      action: 'type',
      target: '#card-number',
      value: '4111111111111111',
    },
    {
      action: 'click',
      target: '[data-testid="submit-order"]',
    },
    {
      action: 'wait',
      timeout: 5000,
    },
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/order-confirmation',
      },
    },
  ],
  expectedOutcome: 'Order placed successfully with payment confirmation',
  tags: ['checkout', 'payment', 'critical-path'],
};

// =============================================================================
// EXAMPLE 2: User Onboarding Flow
// =============================================================================

export const onboardingFlowScenario: Partial<TestScenario> = {
  id: 'custom-onboarding-flow',
  name: 'Complete multi-step onboarding process',
  category: 'form',
  priority: 'high',
  steps: [
    {
      action: 'navigate',
      target: '/onboarding',
    },
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="onboarding-step-1"]',
    },
    // Step 1: Company Information
    {
      action: 'type',
      target: '#company-name',
      value: 'Test Company Oy',
    },
    {
      action: 'type',
      target: '#business-id',
      value: '1234567-8',
    },
    {
      action: 'click',
      target: '[data-testid="next-step"]',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    // Step 2: Financial Information
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="onboarding-step-2"]',
    },
    {
      action: 'type',
      target: '#revenue',
      value: '500000',
    },
    {
      action: 'type',
      target: '#employees',
      value: '10',
    },
    {
      action: 'click',
      target: '[data-testid="next-step"]',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    // Step 3: Document Upload
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="onboarding-step-3"]',
    },
    {
      action: 'click',
      target: '[data-testid="skip-documents"]',
    },
    {
      action: 'wait',
      timeout: 1000,
    },
    // Complete
    {
      action: 'click',
      target: '[data-testid="complete-onboarding"]',
    },
    {
      action: 'wait',
      timeout: 3000,
    },
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/dashboard',
      },
    },
  ],
  expectedOutcome: 'User completes onboarding and reaches dashboard',
  tags: ['onboarding', 'multi-step-form', 'user-journey'],
};

// =============================================================================
// EXAMPLE 3: Search and Filter Functionality
// =============================================================================

export const searchFilterScenario: Partial<TestScenario> = {
  id: 'custom-search-filter',
  name: 'Search and filter with multiple criteria',
  category: 'ui',
  priority: 'medium',
  steps: [
    {
      action: 'navigate',
      target: '/products',
    },
    {
      action: 'wait',
      timeout: 1000,
    },
    // Test search
    {
      action: 'type',
      target: '[data-testid="search-input"]',
      value: 'financing',
    },
    {
      action: 'wait',
      timeout: 500,
    },
    {
      action: 'verify',
      assertion: {
        type: 'count',
        expected: 3,
      },
      target: '[data-testid="product-card"]',
    },
    // Test filter
    {
      action: 'click',
      target: '[data-testid="filter-category"]',
    },
    {
      action: 'click',
      target: '[data-testid="category-business"]',
    },
    {
      action: 'wait',
      timeout: 500,
    },
    // Test sort
    {
      action: 'click',
      target: '[data-testid="sort-by"]',
    },
    {
      action: 'click',
      target: '[data-testid="sort-price-low-high"]',
    },
    {
      action: 'wait',
      timeout: 500,
    },
    // Clear filters
    {
      action: 'click',
      target: '[data-testid="clear-filters"]',
    },
    {
      action: 'wait',
      timeout: 500,
    },
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="product-card"]',
    },
  ],
  expectedOutcome: 'Search, filter, and sort work correctly',
  tags: ['search', 'filter', 'ui-interaction'],
};

// =============================================================================
// EXAMPLE 4: Multi-Language Switching
// =============================================================================

export const languageSwitchScenario: Partial<TestScenario> = {
  id: 'custom-language-switch',
  name: 'Switch between languages and verify translations',
  category: 'ui',
  priority: 'medium',
  steps: [
    {
      action: 'navigate',
      target: '/fi',
    },
    {
      action: 'verify',
      assertion: {
        type: 'text',
        expected: 'Tervetuloa',
      },
      target: 'h1',
    },
    // Switch to English
    {
      action: 'click',
      target: '[data-testid="language-switcher"]',
    },
    {
      action: 'click',
      target: '[data-testid="lang-en"]',
    },
    {
      action: 'wait',
      timeout: 1000,
    },
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/en',
      },
    },
    {
      action: 'verify',
      assertion: {
        type: 'text',
        expected: 'Welcome',
      },
      target: 'h1',
    },
    // Switch to Swedish
    {
      action: 'click',
      target: '[data-testid="language-switcher"]',
    },
    {
      action: 'click',
      target: '[data-testid="lang-sv"]',
    },
    {
      action: 'wait',
      timeout: 1000,
    },
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/sv',
      },
    },
    {
      action: 'verify',
      assertion: {
        type: 'text',
        expected: 'Välkommen',
      },
      target: 'h1',
    },
  ],
  expectedOutcome: 'Language switching works and translations are correct',
  tags: ['i18n', 'localization', 'ui'],
};

// =============================================================================
// EXAMPLE 5: Error Recovery Flow
// =============================================================================

export const errorRecoveryScenario: Partial<TestScenario> = {
  id: 'custom-error-recovery',
  name: 'Handle API errors gracefully and allow retry',
  category: 'api',
  priority: 'high',
  steps: [
    {
      action: 'navigate',
      target: '/dashboard',
    },
    // Simulate network error by navigating to endpoint that fails
    {
      action: 'click',
      target: '[data-testid="load-data-button"]',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    // Verify error message appears
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="error-message"]',
    },
    // Test retry button
    {
      action: 'click',
      target: '[data-testid="retry-button"]',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    // Verify either success or error handling
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="data-loaded"], [data-testid="error-message"]',
    },
  ],
  expectedOutcome: 'Application handles errors gracefully with retry option',
  tags: ['error-handling', 'resilience', 'ux'],
};

// =============================================================================
// EXAMPLE 6: Authentication Session Persistence
// =============================================================================

export const sessionPersistenceScenario: Partial<TestScenario> = {
  id: 'custom-session-persistence',
  name: 'Verify authentication session persists across page refreshes',
  category: 'auth',
  priority: 'high',
  steps: [
    {
      action: 'navigate',
      target: '/auth/login',
    },
    {
      action: 'type',
      target: '#email',
      value: 'test@example.com',
    },
    {
      action: 'type',
      target: '#password',
      value: 'TestPassword123!',
    },
    {
      action: 'click',
      target: '[data-testid="login-button"]',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/dashboard',
      },
    },
    // Refresh page
    {
      action: 'navigate',
      target: '/dashboard',
    },
    {
      action: 'wait',
      timeout: 2000,
    },
    // Should still be authenticated
    {
      action: 'verify',
      assertion: {
        type: 'url',
        expected: '/dashboard',
      },
    },
    {
      action: 'verify',
      assertion: {
        type: 'visible',
        expected: true,
      },
      target: '[data-testid="user-profile"]',
    },
  ],
  expectedOutcome: 'User remains authenticated after page refresh',
  tags: ['auth', 'session', 'persistence'],
};

// =============================================================================
// Export all scenarios
// =============================================================================

export const customScenarios = [
  checkoutFlowScenario,
  onboardingFlowScenario,
  searchFilterScenario,
  languageSwitchScenario,
  errorRecoveryScenario,
  sessionPersistenceScenario,
];

export default customScenarios;

