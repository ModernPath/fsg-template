export const runtime = 'nodejs';

import { serve } from 'inngest/next';
import { inngestCapitalbox } from '@/lib/inngest/inngest.client';
import { manualFetchCapitalBoxOffers } from '@/lib/inngest/functions/capitalboxService';

export const { GET, POST, PUT } = serve({
  client: inngestCapitalbox,
  functions: [
    manualFetchCapitalBoxOffers,
  ],
}); 