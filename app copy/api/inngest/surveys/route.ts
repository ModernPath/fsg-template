import { serve } from 'inngest/next';
import { inngestSurveys } from '@/lib/inngest-client';
import { 
  sendSurveyInvitations, 
  sendSingleSurveyInvitation, 
  sendSurveyReminders 
} from '@/lib/inngest/functions/survey-invitations';
import {
  monitorOrphanedConversions,
  sendMonthlyCommissionReports,
  checkDuplicateCommissions,
  reconcileSingleApplication
} from '@/lib/inngest/functions/partnerCommissionMonitoring';

export const { GET, POST, PUT } = serve({
  client: inngestSurveys,
  functions: [
    sendSurveyInvitations,
    sendSingleSurveyInvitation,
    sendSurveyReminders,
    // Partner commission monitoring functions
    monitorOrphanedConversions,
    sendMonthlyCommissionReports,
    checkDuplicateCommissions,
    reconcileSingleApplication,
  ],
});
