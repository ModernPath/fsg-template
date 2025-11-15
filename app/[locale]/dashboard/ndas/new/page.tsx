/**
 * Create New NDA Page
 */

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { NDACreationForm } from '@/components/ndas/NDACreationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NewNDAPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    company_id?: string;
    buyer_id?: string;
  }>;
}

export default async function NewNDAPage({ params, searchParams }: NewNDAPageProps) {
  const { locale } = await params;
  const { company_id, buyer_id } = await searchParams;
  
  const supabase = await createClient();

  // Get user context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

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

      {/* NDA Creation Form */}
      <NDACreationForm
        companyId={company_id}
        buyerId={buyer_id}
      />
    </div>
  );
}

