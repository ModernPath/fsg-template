import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateTranslation } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    console.log('\n📝 [POST /api/blog]');
    
    // Get authorization token from request headers
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Create service role client for auth verification and all operations
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);
    
    // Verify the token using the service role client
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id);

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ User is not admin');
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin access verified');
    
    const { target_languages, ...postData } = await request.json()
    
    // Create the post in the original language first
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({ ...postData, author_id: user.id })
      .select()
      .single()

    if (insertError) throw insertError

    // Create translations only if target languages are specified and not empty
    if (target_languages?.length > 0) {
      const translationPromises = target_languages.map(async (lang: string) => {
        try {
          // Generate translation using Gemini
          const translation = await generateTranslation({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            meta_description: post.meta_description,
            slug: post.slug,
            targetLanguage: lang
          })

          // Create translated version
          const { data: translatedPost, error: translationError } = await supabase
            .from('posts')
            .insert({
              ...post,
              id: undefined, // Let Supabase generate a new ID
              title: translation.title,
              content: translation.content,
              excerpt: translation.excerpt,
              meta_description: translation.meta_description,
              slug: translation.slug,
              locale: lang,
              created_at: post.created_at // Keep same creation date as original
            })
            .select()
            .single()

          if (translationError) throw translationError
          return translatedPost
        } catch (err) {
          console.error(`Error creating translation for ${lang}:`, err)
          return null
        }
      })

      // Wait for all translations to complete
      const translations = await Promise.all(translationPromises)
      return NextResponse.json({ 
        data: { 
          original: post,
          translations: translations.filter(t => t !== null)
        }
      })
    }

    return NextResponse.json({ data: { original: post } })
  } catch (err) {
    console.error('Error creating post:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    console.log('\n📝 [PUT /api/blog]');
    
    // Get authorization token from request headers
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Create service role client for auth verification and all operations
    console.log('🔑 Creating service role client...');
    const supabase = await createClient(undefined, true);
    
    // Verify the token using the service role client
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id);

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.error('❌ User is not admin');
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ Admin access verified');
    
    const { id, target_languages, ...postData } = await request.json()
    
    // Update the post
    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update({ 
        ...postData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data: post })
  } catch (err) {
    console.error('Error updating post:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update post' },
      { status: 500 }
    )
  }
} 