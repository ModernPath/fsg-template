import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { Database } from '@/types/supabase'; // Assuming this path is correct for your DB types
import { inngest } from '@/lib/inngest/inngest.client'; // Import Inngest client
import { FundingRecommendations } from '@/types/financial'; // Import type if needed

// Helper function to generate a description from questionnaire data
function generateDescriptionFromQuestionnaire(questionnaire: any): string {
  try {
    // Extract key information from the questionnaire
    const purposes = [
      ...(questionnaire.purpose_cashManagement || []),
      ...(questionnaire.purpose_growth || []),
      ...(questionnaire.purpose_structure || []),
    ];
    
    const fundingAmount = questionnaire.fundingAmount 
      ? `approximately ${questionnaire.fundingAmount}` 
      : 'an unspecified amount';
    
    const collateral = (questionnaire.collateralOptions || []).join(', ');
    const collateralDetails = questionnaire.collateralDetails 
      ? `with details: ${questionnaire.collateralDetails}` 
      : '';
    
    const situationDetails = questionnaire.situationDetails || '';
    const companySituation = questionnaire.companySituation || '';
    const currentRevenue = questionnaire.currentRevenue 
      ? `with current revenue of ${questionnaire.currentRevenue}` 
      : '';
    
    // Generate a coherent description
    let description = `The company needs financing for the following purposes: ${purposes.join(', ')}. `;
    
    if (questionnaire.fundingAmount) {
      description += `They're seeking ${fundingAmount}. `;
    }
    
    if (companySituation) {
      description += `The company's current situation is: ${companySituation} ${currentRevenue}. `;
    }
    
    if (situationDetails) {
      description += `Additional situation details: ${situationDetails}. `;
    }
    
    if (collateral) {
      description += `Available collateral includes: ${collateral} ${collateralDetails}. `;
    }
    
    // Add factoring details if present
    if (questionnaire.factoring_monthlyInvoices || questionnaire.factoring_paymentDays) {
      description += `Regarding factoring: `;
      if (questionnaire.factoring_monthlyInvoices) {
        description += `monthly invoices of ${questionnaire.factoring_monthlyInvoices}, `;
      }
      if (questionnaire.factoring_paymentDays) {
        description += `payment days of ${questionnaire.factoring_paymentDays}, `;
      }
      if (questionnaire.factoring_customerLocation) {
        description += `customers located in ${questionnaire.factoring_customerLocation}, `;
      }
      description = description.trim().replace(/,$/, '. ');
    }
    
    // Add consolidation details if present
    if (questionnaire.consolidation_totalAmount || questionnaire.consolidation_mainGoal) {
      description += `Regarding consolidation: `;
      if (questionnaire.consolidation_totalAmount) {
        description += `total amount of ${questionnaire.consolidation_totalAmount}, `;
      }
      if (questionnaire.consolidation_mainGoal) {
        description += `main goal is ${questionnaire.consolidation_mainGoal}, `;
      }
      if (questionnaire.consolidation_collateral) {
        description += `collateral includes ${questionnaire.consolidation_collateral}, `;
      }
      description = description.trim().replace(/,$/, '. ');
    }
    
    return description.trim();
  } catch (error) {
    console.error('Error generating description from questionnaire:', error);
    return 'Financing needs based on completed questionnaire.';
  }
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Initialize Google Generative AI Client
let genAI: GoogleGenAI;
try {
  if (!process.env.GOOGLE_AI_STUDIO_KEY) {
    throw new Error('GOOGLE_AI_STUDIO_KEY is not defined in environment variables');
  }
  genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_STUDIO_KEY! });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
  // Handle initialization error appropriately in production
}

export async function POST(req: NextRequest) {
  console.log('POST /api/financing-needs called');
  let needsRecordId: string | null = null;
  let companyId: string | null = null;
  let userId: string | null = null;

  try {
    const body = await req.json();
    companyId = body.companyId;
    userId = body.userId;
    const questionnaire = body.questionnaire;

    // --- Validation ---
    if (!companyId || !userId || !questionnaire) {
      console.error('Missing required fields: companyId, userId, or questionnaire');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!genAI) {
      console.error('Gemini AI client not initialized.');
      return NextResponse.json({ error: 'AI service initialization failed.' }, { status: 500 });
    }

    console.log(`Processing financing needs for company: ${companyId}, user: ${userId}`);
    
    // Generate a description from the questionnaire data
    const description = generateDescriptionFromQuestionnaire(questionnaire);
    console.log('Generated description:', description);

    // --- Action 1: Insert initial record into financing_needs ---
    console.log('Action 1: Inserting initial record...');
    const { data: initialInsertData, error: initialInsertError } = await supabaseAdmin
      .from('financing_needs')
      .insert({
        company_id: companyId,
        created_by: userId,
        description: description,
        requirements: questionnaire,
        amount: questionnaire.fundingAmount ? Number(questionnaire.fundingAmount) : null,
        currency: 'EUR',
        purpose: null,
        time_horizon: null,
        urgency: null,
      })
      .select('id')
      .single();

    if (initialInsertError || !initialInsertData) {
      console.error('Error inserting initial financing_needs record:', initialInsertError);
      throw new Error(`Database error during initial insert: ${initialInsertError?.message}`);
    }
    needsRecordId = initialInsertData.id;
    console.log(`Initial record inserted with ID: ${needsRecordId}`);

    // --- Action 2: Call Gemini to parse the description --- 
    console.log('Action 2: Calling Gemini to parse description...');
    let parsedDetails: any = {}; 
    try {
      const parsingPrompt = `Analyze the following user description of their company's financing needs. Extract the relevant details according to the provided JSON schema. Respond ONLY with the JSON object matching the schema. If a value is not explicitly mentioned or unclear, use null for that field. For requirements, list key points as strings in an array.

User Description:
"${description}"

JSON Schema:
${JSON.stringify({
        type: "OBJECT",
        properties: {
          amount: { type: "NUMBER", description: "Estimated funding amount needed, null if not specified" },
          currency: { type: "STRING", description: "Currency code (e.g., EUR, USD), null if not specified" },
          purpose: { type: "STRING", description: "Brief summary of the funding purpose, null if unclear" },
          time_horizon: { type: "STRING", description: "Estimated timeframe (e.g., '0-6 months', '6-12 months', '>1 year'), null if not specified" },
          urgency: { type: "STRING", description: "Urgency level ('High', 'Medium', 'Low'), null if not specified" },
        },
        required: []
      }, null, 2)}

JSON Output:`;
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: parsingPrompt }]
      });
      const responseText = result.text || '';
      console.log('Raw Gemini Parsing Response:', responseText);
      const cleanedText = responseText.trim().match(/\{.*\}/s)?.[0] || responseText.trim();
      parsedDetails = JSON.parse(cleanedText);
      console.log('Parsed details from Gemini:', parsedDetails);
    } catch (geminiError: any) {
      console.error('Error calling or parsing Gemini for description parsing:', geminiError);
      // Log but continue, update will use nulls
    }

    // --- Action 3: Update the financing_needs record with parsed data --- 
    console.log(`Action 3: Updating record ID ${needsRecordId} with parsed details...`);
    const { error: updateError } = await supabaseAdmin
      .from('financing_needs')
      .update({
        amount: parsedDetails?.amount ?? (questionnaire.fundingAmount ? Number(questionnaire.fundingAmount) : null), // Fallback to questionnaire amount
        currency: parsedDetails?.currency ?? 'EUR',
        purpose: parsedDetails?.purpose ?? null,
        time_horizon: parsedDetails?.time_horizon ?? null,
        urgency: parsedDetails?.urgency ?? null,
      })
      .eq('id', needsRecordId);

    if (updateError) {
      console.error(`Error updating financing_needs record ${needsRecordId}:`, updateError);
      throw new Error(`Database error during update: ${updateError.message}`);
    }
    console.log(`Record ${needsRecordId} updated successfully.`);

    // Return success response with the created needs ID
    return NextResponse.json({ 
      success: true, 
      message: 'Financing needs saved successfully.', 
      financingNeedsId: needsRecordId 
    });

  } catch (error: any) {
    console.error('Error processing financing needs:', error);
    // Update the needs record status to 'failed' if possible
    if (needsRecordId) {
      try {
        await supabaseAdmin
          .from('financing_needs')
          .update({ status: 'error' }) // Assuming a status field exists
          .eq('id', needsRecordId);
      } catch (updateErr) {
        console.error(`Failed to update financing_needs ${needsRecordId} status to error:`, updateErr);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 