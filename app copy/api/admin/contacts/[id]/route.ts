import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    // 1. Token Verification & Admin Check
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and check admin status
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('id, is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 2. Update contact status
    const { data: contact, error: updateError } = await authClient
      .from('contacts')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating contact:', updateError)
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: contact,
      message: 'Contact updated successfully'
    })

  } catch (err) {
    console.error('❌ [PATCH /api/admin/contacts/[id]] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. Token Verification & Admin Check  
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and check admin status
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('id, is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 2. Delete contact
    const { error: deleteError } = await authClient
      .from('contacts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting contact:', deleteError)
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Contact deleted successfully'
    })

  } catch (err) {
    console.error('❌ [DELETE /api/admin/contacts/[id]] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
