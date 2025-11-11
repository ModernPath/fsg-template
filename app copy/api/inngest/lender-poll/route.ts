export const runtime = 'nodejs';

import { serve } from 'inngest/next';
import { inngestLenderPoll } from '@/lib/inngest/inngest.client';
import { 
  pollLenderApplicationsFunction, 
  manualPollLenderApplicationFunction 
} from '@/lib/inngest/functions/lenderPollService';

export const { GET, POST, PUT } = serve({
  client: inngestLenderPoll,
  functions: [
    pollLenderApplicationsFunction,
    manualPollLenderApplicationFunction,
  ],
}); 