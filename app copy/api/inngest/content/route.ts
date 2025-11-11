import { serve } from 'inngest/next';
import { inngestContent } from '@/lib/inngest-client';
import { 
  helloWorld,
  publishScheduledPosts,
  generateDailyContent,
  analyzeContentPerformance,
  generateContentFromPlan,
  generateContentBulk
} from '@/lib/inngest-functions';

export const { GET, POST, PUT } = serve({
  client: inngestContent,
  functions: [
    helloWorld,
    publishScheduledPosts,
    generateDailyContent,
    analyzeContentPerformance,
    generateContentFromPlan,
    generateContentBulk,
  ],
});
