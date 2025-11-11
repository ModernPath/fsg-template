import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/lib/inngest/inngest.client';

// Service role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Auth client for token verification
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Function to determine document type based on filename and fiscal year
function guessDocumentType(filename: string, fiscalYear?: number): string {
  const lowerName = filename.toLowerCase();
  const currentYear = new Date().getFullYear();
  const isCurrentYear = fiscalYear === currentYear;
  
  // Check for leasing/asset information documents first
  if (lowerName.includes('tarjous') || lowerName.includes('quotation') || 
      lowerName.includes('quote') || lowerName.includes('offer') ||
      lowerName.includes('hintakyselty') || lowerName.includes('price') ||
      lowerName.includes('spec') || lowerName.includes('spesification') ||
      lowerName.includes('tekniset tiedot') || lowerName.includes('technical') ||
      lowerName.includes('leasing') || lowerName.includes('vuokra') ||
      lowerName.includes('rent') || lowerName.includes('rental') ||
      lowerName.includes('auto') || lowerName.includes('car') ||
      lowerName.includes('ajoneuvo') || lowerName.includes('vehicle') ||
      lowerName.includes('kone') || lowerName.includes('machinery') ||
      lowerName.includes('equipment') || lowerName.includes('laiteet') ||
      lowerName.includes('tietokone') || lowerName.includes('computer') ||
      lowerName.includes('kannettava') || lowerName.includes('laptop') ||
      lowerName.includes('toimisto') || lowerName.includes('office') ||
      lowerName.includes('kaluste') || lowerName.includes('furniture') ||
      lowerName.includes('työpöytä') || lowerName.includes('desk') ||
      lowerName.includes('tuoli') || lowerName.includes('chair') ||
      lowerName.includes('printer') || lowerName.includes('tulostin') ||
      lowerName.includes('monitor') || lowerName.includes('näyttö') ||
      lowerName.includes('software') || lowerName.includes('ohjelmisto') ||
      lowerName.includes('license') || lowerName.includes('lisenssi') ||
      // Common vendor/store names that indicate purchase offers/quotations
      lowerName.includes('verkkokauppa.com') || lowerName.includes('gigantti') ||
      lowerName.includes('power') || lowerName.includes('finn.fi') ||
      lowerName.includes('nettiauto') || lowerName.includes('kamux') ||
      lowerName.includes('rinta-jouppi') || lowerName.includes('bauhaus') ||
      lowerName.includes('k-rauta') || lowerName.includes('würth') ||
      lowerName.includes('toolstation') || lowerName.includes('motonet')) {
    return 'leasing_document';
  }
  
  // Check for traditional collateral documents (security/guarantee related)
  if (lowerName.includes('vakuus') || lowerName.includes('collateral') || 
      lowerName.includes('security') || lowerName.includes('guarantee') ||
      lowerName.includes('pantti') || lowerName.includes('kiinteistö') ||
      lowerName.includes('real estate') || lowerName.includes('property') ||
      lowerName.includes('arvio') || lowerName.includes('valuation') ||
      lowerName.includes('appraisal') || lowerName.includes('omaisuus') ||
      lowerName.includes('asset') || lowerName.includes('mortgage') ||
      lowerName.includes('kiinnitys') || lowerName.includes('takaus') ||
      lowerName.includes('surety') || lowerName.includes('pledge')) {
    return 'collateral_document';
  }
  
  // Check for purchase-related documents (could be either leasing or general)
  if (lowerName.includes('kuitti') || lowerName.includes('receipt') ||
      lowerName.includes('osto') || lowerName.includes('purchase') ||
      lowerName.includes('hankinta') || lowerName.includes('acquisition') ||
      lowerName.includes('tilaus') || lowerName.includes('order') ||
      lowerName.includes('lasku') || lowerName.includes('invoice') ||
      lowerName.includes('tosite') || lowerName.includes('voucher')) {
    // Default to leasing document for purchase-related documents
    return 'leasing_document';
  }
  
  // Check for financial statements (comprehensive reports) - FIRST to avoid conflicts
  if (lowerName.includes('tilinpäätös') || lowerName.includes('tilinpaatos') || 
      lowerName.includes('annual_report') || lowerName.includes('vuosikertomus')) {
    return 'financial_statements';
  }
  
  // Check for interim financial statements (välitilinpäätös)
  if (lowerName.includes('välitilinpäätös') || lowerName.includes('valitilipatos') ||
      lowerName.includes('interim') || lowerName.includes('väliraportti')) {
    return 'balance_income_interim';
  }

  // Check for current year financial data (max 2 months old)
  if ((lowerName.includes('tuloslaskelma') || lowerName.includes('tulos') || 
       lowerName.includes('tase') || lowerName.includes('balance') ||
       lowerName.includes('p&l') || lowerName.includes('profit') || lowerName.includes('loss') ||
       lowerName.includes('assets') || lowerName.includes('liabilities')) &&
       !lowerName.includes('tilinpäätös') && !lowerName.includes('tilinpaatos') &&
       isCurrentYear) {
    return 'balance_income_interim';
  }
  
  // Check for specific income statements (historical)
  if ((lowerName.includes('tuloslaskelma') || lowerName.includes('tulos') || 
       lowerName.includes('p&l') || lowerName.includes('profit') || lowerName.includes('loss')) &&
       !lowerName.includes('tilinpäätös') && !lowerName.includes('tilinpaatos') &&
       !isCurrentYear) {
    return 'financial_statements';
  }
  
  // Check for specific balance sheets (historical)
  if ((lowerName.includes('tase') || lowerName.includes('balance') || 
       lowerName.includes('assets') || lowerName.includes('liabilities')) &&
       !lowerName.includes('tilinpäätös') && !lowerName.includes('tilinpaatos') &&
       !isCurrentYear) {
    return 'financial_statements';
  }
  
  // Check for forecasts and projections
  if (lowerName.includes('ennuste') || lowerName.includes('forecast') || 
      lowerName.includes('projection') || lowerName.includes('budget')) {
    return 'forecast';
  }
  
  // Check for business plans
  if (lowerName.includes('liiketoimintasuunnitelma') || lowerName.includes('business_plan') || 
      lowerName.includes('business-plan') || lowerName.includes('businessplan')) {
    return 'business_plan';
  }
  
  // Default fallback based on fiscal year
  if (isCurrentYear) {
    return 'financial_statements'; // Use unified type
  } else {
    return 'financial_statements'; // Use unified type
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received, verifying...');
    
    // 2. Verify token using auth client
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // 3. Get form data with file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // 4. Get other form data
    const companyId = formData.get('companyId') as string;
    const fiscalYearStr = formData.get('fiscalYear') as string;
    const fiscalPeriod = formData.get('fiscalPeriod') as string;
    const manualDocumentType = formData.get('documentType') as string | null; // Manual document type selection
    
    // Get locale from formData, URL, or default to 'fi'
    let locale = formData.get('locale') as string || 'fi';
    if (!['en', 'fi', 'sv'].includes(locale)) {
      // Try to extract from URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const pathLocale = pathParts[1]; // e.g., /fi/api/...
      if (['en', 'fi', 'sv'].includes(pathLocale)) {
        locale = pathLocale;
      } else {
        locale = 'fi'; // Default fallback
      }
    }
    
    // Parse fiscalYear safely
    const fiscalYear = fiscalYearStr ? parseInt(fiscalYearStr) : null;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json({ error: 'Missing required companyId field' }, { status: 400 });
    }
    
    // 5. Verify company belongs to user
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('created_by', user.id)
      .single();
      
    if (companyError) {
      // If company doesn't exist or doesn't belong to user, check if user is admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      // If not admin, return error
      if (!profile?.is_admin) {
        console.error('User tried to upload to company they do not own');
        return NextResponse.json({ error: 'You do not have permission to upload to this company' }, { status: 403 });
      }
    }

    // 6. Get document types to determine appropriate type_id
    const { data: documentTypes, error: typesError } = await supabaseAdmin
      .from('document_types')
      .select('id, name');

    if (typesError) {
      console.error('Error fetching document types:', typesError);
      return NextResponse.json({ error: 'Error fetching document types' }, { status: 500 });
    }

    // 7. Determine document type based on manual selection or filename analysis
    let guessedTypeName: string;
    let documentTypeId: string | undefined;
    let isManualSelection = false; // Track if this was a manual selection
    
    if (manualDocumentType) {
      // Tarkista onko valittu tyyppi sellainen joka ei vaadi automaattista tunnistusta
      const noAutoDetectTypes = ['leasing_document', 'collateral_document', 'other'];
      
      if (noAutoDetectTypes.includes(manualDocumentType)) {
        // Käytä manuaalista valintaa suoraan
        console.log(`Manual document type selected (no auto-detect): "${manualDocumentType}"`);
        guessedTypeName = manualDocumentType;
        const documentType = documentTypes?.find(dt => dt.name === manualDocumentType);
        documentTypeId = documentType?.id;
        isManualSelection = true; // Set flag for manual selection
      } else {
        // Tee automaattinen tunnistus vaikka manual tyyppi olisi valittu
        console.log(`Manual document type selected but auto-detecting: "${manualDocumentType}"`);
        guessedTypeName = guessDocumentType(file.name, fiscalYear || undefined);
        const documentType = documentTypes?.find(dt => dt.name === guessedTypeName);
        documentTypeId = documentType?.id;
      }
    } else {
      // Auto-detect based on filename and fiscal year
      guessedTypeName = guessDocumentType(file.name, fiscalYear || undefined);
      const documentType = documentTypes?.find(dt => dt.name === guessedTypeName);
      documentTypeId = documentType?.id;
    }

    console.log(`Document type detection: filename="${file.name}", fiscalYear=${fiscalYear}, manual="${manualDocumentType || 'none'}", final="${guessedTypeName}", foundId="${documentTypeId}", isManualSelection=${isManualSelection}`);

    // If no document type found, default to a generic type
    let finalDocumentTypeId = documentTypeId;
    if (!finalDocumentTypeId) {
      const defaultType = documentTypes?.find(dt => dt.name === 'financial_statements') || 
                          documentTypes?.find(dt => dt.name === 'other');
      finalDocumentTypeId = defaultType?.id;
      console.log(`No matching document type found, using default: ${defaultType?.name} (${finalDocumentTypeId})`);
    }
    
    // 8. Upload file to storage using admin role
    const fileName = `${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
    const filePath = `${companyId}/${fileName}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('financial_documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: `Error uploading file: ${uploadError.message}` }, { status: 500 });
    }
    
    console.log('File uploaded successfully:', filePath);
    
    // 9. Create document record with document_type_id
    const currentDate = new Date().toISOString();
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        company_id: companyId,
        document_type_id: finalDocumentTypeId,
        name: file.name,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        fiscal_year: fiscalYear ?? new Date().getFullYear() - 1,
        fiscal_period: fiscalPeriod || 'annual',
        uploaded_by: user.id,
        created_by: user.id,
        processed: false,
        processing_status: 'pending',
        uploaded_at: currentDate,
        created_at: currentDate,
        metadata: JSON.stringify({
          upload_method: 'web_upload',
          original_filename: file.name,
          content_type: file.type,
          user_agent: request.headers.get('user-agent') || 'unknown',
          detected_document_type: guessedTypeName,
          is_manual_selection: isManualSelection, // Store the manual selection flag
          manual_document_type: manualDocumentType || null // Store the original manual selection
        })
      })
      .select('*')
      .single();
      
    if (docError) {
      console.error('Error creating document record:', docError);
      
      // Try to delete the uploaded file if database insert fails
      try {
        await supabaseAdmin.storage
          .from('financial_documents')
          .remove([filePath]);
        console.log('Deleted uploaded file after database error');
      } catch (removeErr) {
        console.error('Failed to delete uploaded file after database error:', removeErr);
      }
      
      return NextResponse.json({ error: `Error recording document: ${docError.message}` }, { status: 500 });
    }

    // 10. Send document upload confirmation email
    try {
      // Get user's profile for name
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
        
      // Get company name
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      if (!profileError && !companyError && profile && companyData) {
        const { EmailTemplateService } = await import('@/lib/services/emailTemplateService');
        const emailService = new EmailTemplateService();
        
        await emailService.sendDocumentUploadConfirmation(
          companyId,
          companyData.name,
          profile.email,
          profile.full_name || 'Asiakas'
        );
        
        console.log(`✅ Document upload confirmation email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send document upload confirmation email:', emailError);
      // Don't fail the upload if email fails
    }

    // 11. Trigger document analysis
    try {
      await inngest.send({
        name: 'document/uploaded',
        data: {
          documentId: document.id,
          companyId: companyId,
          userId: user.id,
          locale: locale, // ✅ Fixed: Pass locale for correct language in AI analysis
          isManualSelection: isManualSelection, // Pass the flag to the processor
          manualDocumentType: manualDocumentType || null // Pass the manual type
        }
      });
      console.log(`Document analysis triggered successfully (locale: ${locale})`);
    } catch (inngestError) {
      console.error('Error sending Inngest event:', inngestError);
      // Don't fail the upload if analysis trigger fails
    }
    
    return NextResponse.json({ 
      success: true, 
      document: document,
      filePath: filePath,
      detectedType: guessedTypeName,
      message: 'Document uploaded successfully and queued for analysis.'
    }, { status: 201 });
  } catch (error) {
    console.error('Unhandled error in document upload API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// Prevent CSRF attacks
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Also increase payload size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
}; 