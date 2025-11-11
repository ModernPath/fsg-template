import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest-client';

// Main Inngest endpoint - now empty after splitting into specialized endpoints
// Functions have been moved to:
// - /api/inngest/content - Content generation functions
// - /api/inngest/surveys - Survey and commission monitoring functions  
// - /api/inngest/company - Company enrichment functions

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // No functions registered here - all moved to specialized endpoints
  ],
}); 