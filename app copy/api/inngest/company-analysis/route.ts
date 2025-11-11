export const runtime = 'nodejs';

import { serve } from 'inngest/next';
import { inngestCompanyAnalysis } from '@/lib/inngest/inngest.client';
import { analyzeCompanyRegistration } from '@/lib/inngest/functions/companyAnalyzer';

export const { GET, POST, PUT } = serve({
  client: inngestCompanyAnalysis,
  functions: [
    analyzeCompanyRegistration,
  ],
}); 