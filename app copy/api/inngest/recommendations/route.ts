export const runtime = 'nodejs';

import { serve } from 'inngest/next';
import { inngestRecommendations } from '@/lib/inngest/inngest.client';
import { 
  generateFundingRecommendationsFunction, 
  sendRecommendationEmailFunction 
} from '@/lib/inngest/functions/recommendationGenerator';

export const { GET, POST, PUT } = serve({
  client: inngestRecommendations,
  functions: [
    generateFundingRecommendationsFunction,
    sendRecommendationEmailFunction,
  ],
}); 