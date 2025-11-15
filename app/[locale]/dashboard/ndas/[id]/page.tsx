/**
 * Single NDA View Page
 */

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { NDAViewer } from '@/components/ndas/NDAViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NDAPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function NDAPage({ params }: NDAPageProps) {
  const { id, locale } = await params;
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  // Fetch NDA with related data
  const { data: nda, error } = await supabase
    .from('ndas')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        legal_name,
        business_id,
        address,
        city,
        country
      ),
      buyer:buyer_id (
        id,
        full_name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error || !nda) {
    console.error('Error fetching NDA:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">NDA not found</p>
          <Link href={`/${locale}/dashboard/ndas`}>
            <Button className="mt-4">Back to NDAs</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get user profile to determine permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.is_admin || false;
  const isCreator = nda.created_by === user.id;
  const isBuyer = nda.buyer_id === user.id;

  // Determine permissions
  const canSign = isBuyer && nda.status !== 'signed';
  const canEdit = (isAdmin || isCreator) && nda.status !== 'signed';
  const canDelete = (isAdmin || isCreator) && nda.status !== 'signed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/ndas`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to NDAs
          </Button>
        </Link>
      </div>

      {/* NDA Viewer */}
      <NDAViewer
        nda={nda}
        canSign={canSign}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}

