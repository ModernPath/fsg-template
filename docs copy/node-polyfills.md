# Node.js Polyfills Guide

This guide explains how to use Node.js polyfills for browser APIs in server-side code.

## Fetch API Polyfill

The `fetch` API is available natively in modern browsers but requires a polyfill in Node.js (prior to Node.js 18). Our project uses `node-fetch` v2 to provide this functionality in server environments.

## How to Use in API Routes

```typescript
// Add this at the top of your API route file that uses fetch
import { setupNodePolyfills } from '@/lib/utils/nodePolyfill';

// Only needed in environments where fetch is not available
if (typeof fetch === 'undefined') {
  setupNodePolyfills();
}

export async function GET(request: Request) {
  // Now you can use fetch safely
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Usage in Tests

For Jest tests:
- The fetch API is mocked globally in `jest.setup.js`
- For real network requests in integration tests, use the `INTEGRATION_TEST=true` environment variable

For Vitest tests:
- `vitest.setup.ts` automatically imports the polyfill
- Integration tests should set `process.env.INTEGRATION_TEST = 'true'` for additional polyfills

## Usage in Scripts

For Node.js scripts that need to use fetch:

```typescript
import { setupNodePolyfills } from '@/lib/utils/nodePolyfill';

// Call this at the start of your script
setupNodePolyfills();

async function main() {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  console.log(data);
}

main().catch(console.error);
```

## Current Implementation Details

The polyfill implementation has two main functions:

1. `setupNodePolyfill()`: Default export, adds fetch to the global scope
2. `setupNodePolyfills()`: Named export, adds fetch to globalThis and handles special integration test setup

The implementation is located in `lib/utils/nodePolyfill.ts`

## Environment Considerations

- **NextJS API Routes**: Use polyfill as needed for API routes that make fetch requests
- **Integration Tests**: Set `process.env.INTEGRATION_TEST = 'true'` for additional test-specific polyfills
- **Node.js Scripts**: Always call `setupNodePolyfills()` at the beginning
- **Browser Environments**: No polyfill needed, native fetch is used

## Troubleshooting

If you encounter fetch-related errors:

1. Check if the polyfill is properly imported and initialized
2. Verify if your environment has native fetch support
3. Run a test case like `test-polyfill.js` to confirm polyfill functionality
4. Make sure `node-fetch` dependency is installed

For any issues, refer to the test files in `__tests__/integration/fetch-polyfill.test.ts` 