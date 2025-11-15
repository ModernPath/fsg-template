/**
 * Inngest Functions - Materials Generation Workflow
 * 
 * Orchestrates the entire materials generation process:
 * 1. Collect public data (YTJ, Tavily, web scraping)
 * 2. Process document uploads (OCR, extraction)
 * 3. Generate and process AI questionnaire
 * 4. Consolidate all data
 * 5. Generate teaser (AI + Gamma)
 * 6. Generate IM (AI + Gamma) [optional]
 * 7. Generate pitch deck (AI + Gamma) [optional]
 */

import { inngest } from "../inngest-client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for Inngest workers
const getServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Step 1: Initiate Generation - Start the workflow
 */
export const materialsGenerateInitiated = inngest.createFunction(
  {
    id: "materials-generate-initiated",
    name: "Materials Generation: Initiated",
    retries: 3,
  },
  { event: "materials/generate.initiated" },
  async ({ event, step }) => {
    const { jobId, companyId, organizationId, types, userId } = event.data;

    await step.run("update-job-status", async () => {
      const supabase = getServiceClient();
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "collecting_data",
          progress_percentage: 5,
          current_step: "Collecting public data...",
        })
        .eq("id", jobId);
    });

    // Trigger next step: public data collection
    await step.sendEvent("trigger-public-data-collection", {
      name: "materials/collect-public-data",
      data: { jobId, companyId, organizationId },
    });

    return { success: true, jobId, nextStep: "collect-public-data" };
  }
);

/**
 * Step 2: Collect Public Data
 */
export const materialsCollectPublicData = inngest.createFunction(
  {
    id: "materials-collect-public-data",
    name: "Materials Generation: Collect Public Data",
    retries: 2,
  },
  { event: "materials/collect-public-data" },
  async ({ event, step }) => {
    const { jobId, companyId, organizationId } = event.data;
    const supabase = getServiceClient();

    // Get company details
    const company = await step.run("fetch-company-details", async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      return data;
    });

    if (!company) {
      throw new Error("Company not found");
    }

    // Collect from YTJ (Finnish Business Register)
    const ytjData = await step.run("collect-ytj-data", async () => {
      if (!company.business_id) {
        return null;
      }

      try {
        // Call YTJ API (you may need to implement this)
        const response = await fetch(
          `https://avoindata.prh.fi/bis/v1/${company.business_id}`,
          { headers: { Accept: "application/json" } }
        );
        
        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        // Cache the data
        await supabase.from("generation_data_cache").insert({
          job_id: jobId,
          data_source: "ytj",
          data_type: "company_info",
          data: data,
          collected_at: new Date().toISOString(),
        });

        return data;
      } catch (error) {
        console.error("YTJ collection error:", error);
        return null;
      }
    });

    // Collect from Tavily (AI-powered search)
    const tavilyData = await step.run("collect-tavily-data", async () => {
      const tavilyApiKey = process.env.TAVILY_API_KEY;
      
      if (!tavilyApiKey) {
        console.warn("Tavily API key not configured");
        return null;
      }

      try {
        const searchQuery = `${company.name} ${company.industry || ""} company Finland`;
        
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: searchQuery,
            search_depth: "advanced",
            max_results: 10,
            include_domains: [],
            exclude_domains: [],
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        // Cache the data
        await supabase.from("generation_data_cache").insert({
          job_id: jobId,
          data_source: "tavily",
          data_type: "web_search",
          data: data,
          collected_at: new Date().toISOString(),
        });

        return data;
      } catch (error) {
        console.error("Tavily collection error:", error);
        return null;
      }
    });

    // Update job status
    await step.run("mark-public-data-collected", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "public_data_collected",
          progress_percentage: 20,
          current_step: "Public data collected",
          public_data_collected: true,
          public_data_collected_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    });

    // Check if we need document uploads
    const { data: job } = await supabase
      .from("material_generation_jobs")
      .select("generate_im, generate_pitch_deck")
      .eq("id", jobId)
      .single();

    if (job?.generate_im || job?.generate_pitch_deck) {
      // Requires financial documents
      await step.sendEvent("require-uploads", {
        name: "materials/require-uploads",
        data: { jobId, companyId, organizationId },
      });
    } else {
      // Skip to questionnaire
      await step.sendEvent("generate-questionnaire", {
        name: "materials/generate-questionnaire",
        data: { jobId, companyId, organizationId },
      });
    }

    return {
      success: true,
      ytjCollected: !!ytjData,
      tavilyCollected: !!tavilyData,
    };
  }
);

/**
 * Step 3: Require Document Uploads
 */
export const materialsRequireUploads = inngest.createFunction(
  {
    id: "materials-require-uploads",
    name: "Materials Generation: Require Uploads",
  },
  { event: "materials/require-uploads" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    const supabase = getServiceClient();

    await step.run("update-status-awaiting-uploads", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "awaiting_uploads",
          progress_percentage: 25,
          current_step: "Waiting for financial document uploads...",
        })
        .eq("id", jobId);
    });

    // TODO: Send notification to user to upload documents

    return { success: true, status: "awaiting_uploads" };
  }
);

/**
 * Step 4: Process Uploaded Documents (triggered by upload API)
 */
export const materialsProcessUploads = inngest.createFunction(
  {
    id: "materials-process-uploads",
    name: "Materials Generation: Process Uploads",
    retries: 2,
  },
  { event: "materials/process-uploads" },
  async ({ event, step }) => {
    const { jobId, documentIds } = event.data;
    const supabase = getServiceClient();

    await step.run("update-status-processing", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "processing_uploads",
          progress_percentage: 30,
          current_step: "Processing uploaded documents...",
        })
        .eq("id", jobId);
    });

    // Process each document with Gemini OCR/extraction
    const extractedData = await step.run("extract-financial-data", async () => {
      const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY;
      if (!API_KEY) {
        console.error("GOOGLE_AI_STUDIO_KEY not set, skipping extraction");
        return [];
      }

      const { GoogleAIFileManager } = await import("@google/genai");
      const { GoogleGenAI } = await import("@google/genai");
      
      const fileManager = new GoogleAIFileManager(API_KEY);
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const results = [];

      for (const docId of documentIds) {
        try {
          // Get document from storage
          const { data: doc } = await supabase
            .from("company_assets")
            .select("*")
            .eq("id", docId)
            .single();

          if (!doc || !doc.storage_path) continue;

          // Download file from Supabase Storage
          const { data: fileBlob, error: downloadError } = await supabase.storage
            .from("documents")
            .download(doc.storage_path);

          if (downloadError || !fileBlob) {
            console.error(`Failed to download ${doc.name}:`, downloadError);
            continue;
          }

          // Convert blob to buffer
          const arrayBuffer = await fileBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Save temporarily for Gemini upload
          const fs = await import("fs/promises");
          const path = await import("path");
          const os = await import("os");
          
          const tempDir = os.tmpdir();
          const tempFilePath = path.join(tempDir, `${docId}_${doc.name}`);
          await fs.writeFile(tempFilePath, buffer);

          try {
            // Upload to Gemini File API
            const uploadResult = await fileManager.uploadFile(tempFilePath, {
              mimeType: doc.mime_type,
              displayName: doc.name,
            });

            console.log(`Uploaded ${doc.name} to Gemini: ${uploadResult.file.uri}`);

            // Extract financial data with Gemini
            const extractionPrompt = `
You are a financial data extraction expert. Analyze this document and extract key financial metrics.

Extract the following information if available:
1. Revenue (total sales, turnover)
2. Net Profit / Loss
3. EBITDA
4. Total Assets
5. Total Liabilities
6. Cash & Cash Equivalents
7. Equity
8. Operating Expenses
9. Gross Margin %
10. Any other significant financial metrics

Return the data in JSON format with the following structure:
{
  "revenue": { "value": number, "currency": "EUR", "period": "2023" },
  "net_profit": { "value": number, "currency": "EUR", "period": "2023" },
  "ebitda": { "value": number, "currency": "EUR", "period": "2023" },
  "total_assets": { "value": number, "currency": "EUR", "period": "2023" },
  "total_liabilities": { "value": number, "currency": "EUR", "period": "2023" },
  "cash": { "value": number, "currency": "EUR", "period": "2023" },
  "equity": { "value": number, "currency": "EUR", "period": "2023" },
  "operating_expenses": { "value": number, "currency": "EUR", "period": "2023" },
  "gross_margin_percentage": number,
  "additional_metrics": {}
}

If a metric is not found, set its value to null.
`;

            const result = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      fileData: {
                        fileUri: uploadResult.file.uri,
                        mimeType: uploadResult.file.mimeType,
                      },
                    },
                    { text: extractionPrompt },
                  ],
                },
              ],
              config: {
                temperature: 0.1, // Low temperature for accuracy
                responseMimeType: "application/json",
              },
            });

            const extractedText = result.text;
            let extractedJson;

            try {
              extractedJson = JSON.parse(extractedText);
            } catch (parseError) {
              console.error("Failed to parse Gemini response:", parseError);
              extractedJson = { error: "Failed to parse AI response" };
            }

            // Save extracted data
            await supabase.from("extracted_financial_data").insert({
              job_id: jobId,
              document_id: docId,
              extracted_data: extractedJson,
              extraction_method: "gemini_ai",
              confidence_score: 0.85, // Could be calculated based on completeness
              extracted_at: new Date().toISOString(),
            });

            results.push({
              document_id: docId,
              document_name: doc.name,
              data: extractedJson,
            });

            // Cleanup: Delete uploaded file from Gemini
            try {
              await fileManager.deleteFile(uploadResult.file.name);
            } catch (deleteError) {
              console.error("Failed to delete Gemini file:", deleteError);
            }
          } finally {
            // Cleanup: Delete temp file
            try {
              await fs.unlink(tempFilePath);
            } catch (unlinkError) {
              console.error("Failed to delete temp file:", unlinkError);
            }
          }
        } catch (error) {
          console.error(`Error extracting from document ${docId}:`, error);
          
          // Save error record
          await supabase.from("extracted_financial_data").insert({
            job_id: jobId,
            document_id: docId,
            extracted_data: { error: String(error) },
            extraction_method: "gemini_ai",
            confidence_score: 0,
            extracted_at: new Date().toISOString(),
          });
        }
      }

      return results;
    });

    await step.run("mark-documents-uploaded", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          documents_uploaded: true,
          documents_uploaded_at: new Date().toISOString(),
          progress_percentage: 40,
        })
        .eq("id", jobId);
    });

    // Proceed to questionnaire
    await step.sendEvent("generate-questionnaire", {
      name: "materials/generate-questionnaire",
      data: event.data,
    });

    return { success: true, extracted: extractedData.length };
  }
);

/**
 * Step 5: Generate AI Questionnaire
 */
export const materialsGenerateQuestionnaire = inngest.createFunction(
  {
    id: "materials-generate-questionnaire",
    name: "Materials Generation: Generate Questionnaire",
    retries: 2,
  },
  { event: "materials/generate-questionnaire" },
  async ({ event, step }) => {
    const { jobId, companyId } = event.data;
    const supabase = getServiceClient();

    // Get company and collected data
    const context = await step.run("fetch-context", async () => {
      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      const { data: cachedData } = await supabase
        .from("generation_data_cache")
        .select("*")
        .eq("job_id", jobId);

      return { company, cachedData };
    });

    // Generate questions with AI
    const questions = await step.run("generate-ai-questions", async () => {
      // TODO: Call Gemini to generate contextual questions
      // For now, use a template set
      
      return [
        {
          question: "What is your company's unique competitive advantage?",
          category: "business_model",
          required: true,
          order: 1,
        },
        {
          question: "Who are your main customer segments?",
          category: "customers",
          required: true,
          order: 2,
        },
        {
          question: "What are your key growth drivers for the next 3 years?",
          category: "future_goals",
          required: true,
          order: 3,
        },
        {
          question: "Describe your operational scalability",
          category: "operations",
          required: false,
          order: 4,
        },
        {
          question: "What regulatory or compliance considerations affect your business?",
          category: "legal",
          required: false,
          order: 5,
        },
      ];
    });

    // Save questions to database
    await step.run("save-questionnaire", async () => {
      for (const q of questions) {
        await supabase.from("material_questionnaire_responses").insert({
          job_id: jobId,
          question_key: q.category + "_" + q.order,
          question_text: q.question,
          question_category: q.category,
          is_required: q.required,
          display_order: q.order,
        });
      }
    });

    await step.run("update-status-questionnaire-pending", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "questionnaire_pending",
          progress_percentage: 45,
          current_step: "Waiting for questionnaire completion...",
        })
        .eq("id", jobId);
    });

    // TODO: Send notification to user to complete questionnaire

    return { success: true, questionsGenerated: questions.length };
  }
);

/**
 * Step 6: Questionnaire Completed (triggered by user submission)
 */
export const materialsQuestionnaireCompleted = inngest.createFunction(
  {
    id: "materials-questionnaire-completed",
    name: "Materials Generation: Questionnaire Completed",
  },
  { event: "materials/questionnaire-completed" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    const supabase = getServiceClient();

    await step.run("mark-questionnaire-complete", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          questionnaire_completed: true,
          questionnaire_completed_at: new Date().toISOString(),
          status: "consolidating",
          progress_percentage: 60,
          current_step: "Consolidating all data...",
        })
        .eq("id", jobId);
    });

    // Trigger data consolidation
    await step.sendEvent("consolidate-data", {
      name: "materials/consolidate-data",
      data: event.data,
    });

    return { success: true };
  }
);

/**
 * Step 7: Consolidate All Data
 */
export const materialsConsolidateData = inngest.createFunction(
  {
    id: "materials-consolidate-data",
    name: "Materials Generation: Consolidate Data",
    retries: 2,
  },
  { event: "materials/consolidate-data" },
  async ({ event, step }) => {
    const { jobId, companyId } = event.data;
    const supabase = getServiceClient();

    // Gather all collected data
    const allData = await step.run("gather-all-data", async () => {
      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      const { data: publicData } = await supabase
        .from("generation_data_cache")
        .select("*")
        .eq("job_id", jobId);

      const { data: financialData } = await supabase
        .from("extracted_financial_data")
        .select("*")
        .eq("job_id", jobId);

      const { data: questionnaireData } = await supabase
        .from("material_questionnaire_responses")
        .select("*")
        .eq("job_id", jobId);

      // ✨ NEW: Get enriched company data (17 modules)
      const { data: enrichedData } = await supabase
        .from("company_enriched_data")
        .select("*")
        .eq("company_id", companyId)
        .single();

      return {
        company,
        publicData,
        financialData,
        questionnaireData,
        enrichedData,
      };
    });

    // Use AI to consolidate and structure the data
    const consolidatedData = await step.run("ai-consolidate", async () => {
      // ✨ Combine all data sources including enriched data (17 modules)
      return {
        company_overview: allData.company,
        public_info: allData.publicData,
        financials: allData.financialData,
        questionnaire: allData.questionnaireData,
        enriched: allData.enrichedData, // 17 modules of enriched data
        consolidated_at: new Date().toISOString(),
      };
    });

    // Update job with consolidated data
    await step.run("save-consolidated-data", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          data_consolidated: true,
          data_consolidated_at: new Date().toISOString(),
          progress_percentage: 70,
          metadata: {
            ...consolidatedData,
          },
        })
        .eq("id", jobId);
    });

    // Trigger material generation
    await step.sendEvent("start-generation", {
      name: "materials/start-generation",
      data: event.data,
    });

    return { success: true, consolidated: true };
  }
);

/**
 * Step 8: Generate Materials (Teaser, IM, Pitch Deck)
 */
export const materialsStartGeneration = inngest.createFunction(
  {
    id: "materials-start-generation",
    name: "Materials Generation: Start Generation",
    retries: 2,
  },
  { event: "materials/start-generation" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    const supabase = getServiceClient();

    // Get job configuration
    const { data: job } = await supabase
      .from("material_generation_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) {
      throw new Error("Job not found");
    }

    // Generate teaser (always)
    if (job.generate_teaser) {
      await step.sendEvent("generate-teaser", {
        name: "materials/generate-teaser",
        data: event.data,
      });
    }

    // Generate IM (optional)
    if (job.generate_im) {
      await step.sendEvent("generate-im", {
        name: "materials/generate-im",
        data: event.data,
      });
    }

    // Generate pitch deck (optional)
    if (job.generate_pitch_deck) {
      await step.sendEvent("generate-pitch-deck", {
        name: "materials/generate-pitch-deck",
        data: event.data,
      });
    }

    return { success: true };
  }
);

/**
 * Step 9a: Generate Teaser
 */
export const materialsGenerateTeaser = inngest.createFunction(
  {
    id: "materials-generate-teaser",
    name: "Materials Generation: Generate Teaser",
    retries: 2,
  },
  { event: "materials/generate-teaser" },
  async ({ event, step }) => {
    const { jobId, companyId, organizationId } = event.data;
    const supabase = getServiceClient();

    await step.run("update-status-generating-teaser", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "generating_teaser",
          progress_percentage: 75,
          current_step: "Generating teaser with AI...",
        })
        .eq("id", jobId);
    });

    // Get consolidated data
    const { data: job } = await supabase
      .from("material_generation_jobs")
      .select("metadata")
      .eq("id", jobId)
      .single();

    // Generate teaser content with AI using enriched data
    const teaserContent = await step.run("ai-generate-teaser", async () => {
      const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;
      
      if (!API_KEY) {
        console.error("Gemini API key not configured");
        return {
          title: `Business Opportunity: ${job?.metadata?.company_overview?.name}`,
          summary: "Teaser generation requires Gemini API key",
          highlights: [],
        };
      }

      try {
        // Import teaser generator
        const { generateTeaser } = await import('@/lib/teaser-generator');

        // Generate comprehensive teaser using enriched data
        const teaser = await generateTeaser({
          companyOverview: {
            name: job?.metadata?.company_overview?.name || 'Unknown Company',
            industry: job?.metadata?.company_overview?.industry,
            description: job?.metadata?.company_overview?.description,
          },
          enrichedData: job?.metadata?.enriched?.enriched_data,
          financialData: job?.metadata?.financials,
          questionnaireData: job?.metadata?.questionnaire,
        }, API_KEY);

        return teaser;
      } catch (error) {
        console.error("Teaser generation error:", error);
        return {
          title: `Business Opportunity: ${job?.metadata?.company_overview?.name}`,
          summary: "Error generating teaser content",
          highlights: [],
        };
      }
    });

    // Create Gamma presentation
    const gammaResult = await step.run("create-gamma-presentation", async () => {
      const gammaApiKey = process.env.GAMMA_API_KEY;
      
      if (!gammaApiKey) {
        console.warn("Gamma API key not configured - skipping presentation creation");
        return null;
      }

      try {
        // Import Gamma generator
        const { createGammaPresentation } = await import('@/lib/gamma-generator');

        // Create professional presentation from teaser content
        const presentation = await createGammaPresentation(teaserContent, gammaApiKey);

        console.log(`✅ Gamma presentation created: ${presentation.url}`);
        
        return {
          url: presentation.url,
          editUrl: presentation.editUrl,
          id: presentation.id,
          status: presentation.status,
        };
      } catch (error) {
        console.error("❌ Gamma API error:", error);
        
        // Try alternative prompt-based approach if structured API fails
        if (gammaApiKey) {
          try {
            const { createGammaPresentationFromPrompt } = await import('@/lib/gamma-generator');
            
            const prompt = `Create a professional M&A teaser presentation for ${teaserContent.title}.
            
Executive Summary: ${teaserContent.summary}

Investment Highlights:
${teaserContent.investmentHighlights?.join('\n') || ''}

Include slides for: business overview, financial snapshot, competitive advantages, growth opportunities, ideal buyer profile, and next steps.`;

            const presentation = await createGammaPresentationFromPrompt(prompt, gammaApiKey);
            console.log(`✅ Gamma presentation created via prompt: ${presentation.url}`);
            
            return {
              url: presentation.url,
              editUrl: presentation.editUrl,
              id: presentation.id,
              status: presentation.status,
            };
          } catch (promptError) {
            console.error("❌ Gamma prompt-based generation also failed:", promptError);
            return null;
          }
        }
        
        return null;
      }
    });

    // Save teaser as company asset
    const teaserAsset = await step.run("save-teaser-asset", async () => {
      const { data: asset } = await supabase
        .from("company_assets")
        .insert({
          company_id: companyId,
          organization_id: organizationId,
          name: `Teaser - ${job?.metadata?.company_overview?.name}`,
          type: "teaser",
          content: teaserContent,
          gamma_presentation_url: gammaResult?.url,
          gamma_presentation_id: gammaResult?.id,
          gamma_edit_url: gammaResult?.editUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return asset;
    });

    // Link asset to job
    await step.run("link-teaser-to-job", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          teaser_asset_id: teaserAsset?.id,
          progress_percentage: 85,
        })
        .eq("id", jobId);
    });

    return { 
      success: true, 
      assetId: teaserAsset?.id, 
      gammaUrl: gammaResult?.url,
      gammaEditUrl: gammaResult?.editUrl,
    };
  }
);

/**
 * Step 9b: Generate IM (similar structure to teaser)
 */
export const materialsGenerateIM = inngest.createFunction(
  {
    id: "materials-generate-im",
    name: "Materials Generation: Generate IM",
    retries: 2,
  },
  { event: "materials/generate-im" },
  async ({ event, step }) => {
    // Similar implementation to teaser, but more comprehensive
    // TODO: Implement full IM generation
    return { success: true, message: "IM generation placeholder" };
  }
);

/**
 * Step 9c: Generate Pitch Deck (similar structure)
 */
export const materialsGeneratePitchDeck = inngest.createFunction(
  {
    id: "materials-generate-pitch-deck",
    name: "Materials Generation: Generate Pitch Deck",
    retries: 2,
  },
  { event: "materials/generate-pitch-deck" },
  async ({ event, step }) => {
    // Similar implementation to teaser
    // TODO: Implement full pitch deck generation
    return { success: true, message: "Pitch deck generation placeholder" };
  }
);

/**
 * Step 10: Mark Job Complete (triggered when all materials are done)
 */
export const materialsGenerationComplete = inngest.createFunction(
  {
    id: "materials-generation-complete",
    name: "Materials Generation: Complete",
  },
  { event: "materials/generation-complete" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    const supabase = getServiceClient();

    await step.run("mark-complete", async () => {
      await supabase
        .from("material_generation_jobs")
        .update({
          status: "completed",
          progress_percentage: 100,
          current_step: "All materials generated successfully!",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    });

    // TODO: Send completion notification to user

    return { success: true, status: "completed" };
  }
);

/**
 * Cancellation Handler
 */
export const materialsGenerationCancelled = inngest.createFunction(
  {
    id: "materials-generation-cancelled",
    name: "Materials Generation: Cancelled",
  },
  { event: "materials/generate.cancelled" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    
    // Cleanup any in-progress work
    await step.run("cleanup-cancelled-job", async () => {
      console.log(`Job ${jobId} cancelled, cleaning up...`);
      // Add any cleanup logic here
    });

    return { success: true, cancelled: true };
  }
);

