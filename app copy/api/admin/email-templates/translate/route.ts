import { NextRequest, NextResponse } from 'next/server';
import { emailTranslationService } from '@/lib/services/emailTemplateTranslationService';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/admin/email-templates/translate
 * Auto-generate language versions for email templates
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n📧 [POST /api/admin/email-templates/translate]');

    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // 2. Verify token and get user
    console.log('🔑 Creating auth client...');
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // 3. Verify admin status
    const { data: profile } = await authClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      console.error('❌ User is not admin');
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('✅ Admin access verified');

    // 4. Parse request body
    const body = await request.json();
    const { 
      target_languages = ['en', 'sv'],
      master_template_id,
      auto_translate_all = false
    } = body;

    console.log('📝 Translation request:', {
      target_languages,
      master_template_id,
      auto_translate_all
    });

    // 5. Validate target languages
    const supportedLanguages = ['en', 'sv', 'de', 'fr', 'es', 'no', 'da'];
    const invalidLanguages = target_languages.filter((lang: string) => !supportedLanguages.includes(lang));
    
    if (invalidLanguages.length > 0) {
      return NextResponse.json(
        { 
          error: 'Unsupported languages', 
          invalid_languages: invalidLanguages,
          supported_languages: supportedLanguages
        },
        { status: 400 }
      );
    }

    let results;

    if (auto_translate_all) {
      // 6a. Auto-translate all master templates
      console.log('🌐 Starting auto-translation for all master templates...');
      await emailTranslationService.translateAllMasterTemplates(target_languages);
      
      // Get summary of results
      const supabase = await createClient(undefined, true);
      const { data: allTemplates } = await supabase
        .from('email_templates')
        .select('id, name, type, language, master_template_id')
        .in('language', ['fi', ...target_languages])
        .eq('is_active', true);

      const masterTemplates = allTemplates?.filter(t => !t.master_template_id) || [];
      const languageVersions = allTemplates?.filter(t => t.master_template_id) || [];

      results = {
        action: 'auto_translate_all',
        master_templates_count: masterTemplates.length,
        language_versions_count: languageVersions.length,
        target_languages,
        summary: target_languages.map((lang: string) => ({
          language: lang,
          templates_count: languageVersions.filter(t => t.language === lang).length
        }))
      };

    } else if (master_template_id) {
      // 6b. Translate specific master template
      console.log(`🎯 Translating specific template: ${master_template_id}`);
      const translationResults = await emailTranslationService.generateLanguageVersions(
        master_template_id,
        target_languages
      );

      results = {
        action: 'translate_specific',
        master_template_id,
        target_languages,
        translations: translationResults
      };

    } else {
      return NextResponse.json(
        { error: 'Either master_template_id or auto_translate_all=true must be provided' },
        { status: 400 }
      );
    }

    console.log('✅ Translation completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Translation completed successfully',
      data: results
    });

  } catch (error) {
    console.error('❌ Translation error:', error);
    return NextResponse.json(
      { 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/email-templates/translate
 * Get translation status and available languages
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n📧 [GET /api/admin/email-templates/translate]');

    // 1. Verify authentication (simplified for GET)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get translation status
    const supabase = await createClient(undefined, true);
    
    // Get all templates with language info
    const { data: allTemplates, error } = await supabase
      .from('email_templates')
      .select('id, name, type, language, master_template_id, is_active, updated_at')
      .eq('is_active', true)
      .order('type')
      .order('name');

    if (error) {
      console.error('❌ Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Organize data
    const masterTemplates = allTemplates.filter(t => !t.master_template_id);
    const languageVersions = allTemplates.filter(t => t.master_template_id);

    const languageStats = ['en', 'sv', 'de', 'fr', 'es', 'no', 'da'].map(lang => ({
      language: lang,
      templates_count: languageVersions.filter(t => t.language === lang).length,
      coverage_percentage: Math.round((languageVersions.filter(t => t.language === lang).length / masterTemplates.length) * 100)
    }));

    const status = {
      master_templates_count: masterTemplates.length,
      language_versions_count: languageVersions.length,
      supported_languages: ['en', 'sv', 'de', 'fr', 'es', 'no', 'da'],
      language_stats: languageStats,
      master_templates: masterTemplates.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        language_versions: languageVersions
          .filter(lv => lv.master_template_id === t.id)
          .map(lv => ({
            id: lv.id,
            language: lv.language,
            updated_at: lv.updated_at
          }))
      }))
    };

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Error getting translation status:', error);
    return NextResponse.json(
      { error: 'Failed to get translation status' },
      { status: 500 }
    );
  }
} 