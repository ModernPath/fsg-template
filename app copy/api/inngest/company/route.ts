import { serve } from 'inngest/next';
import { inngestCompany } from '@/lib/inngest-client';
import { enrichCompanyFinancialData } from '@/lib/inngest/functions/company-enrichment';

export const { GET, POST, PUT } = serve({
  client: inngestCompany,
  functions: [
    enrichCompanyFinancialData,
  ],
});
