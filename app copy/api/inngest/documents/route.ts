export const runtime = 'nodejs';

import { serve } from 'inngest/next';
import { inngestDocuments } from '@/lib/inngest/inngest.client';
import { 
  processDocument, 
  generateFinancialAnalysis, 
  processDocumentAnalysisRequest 
} from '@/lib/inngest/functions/documentProcessor';
// ❌ REMOVED: analyzeFinancialDocument was causing duplicate event processing
// import { analyzeFinancialDocument } from '@/lib/inngest/functions/documentAnalyzer';

export const { GET, POST, PUT } = serve({
  client: inngestDocuments,
  functions: [
    processDocument,              // ✅ Handles document/uploaded
    generateFinancialAnalysis,    // ✅ Handles internal analysis
    processDocumentAnalysisRequest, // ✅ Handles financial/analysis-requested
    // ❌ REMOVED: analyzeFinancialDocument (duplicate event listener for document/uploaded)
  ],
}); 