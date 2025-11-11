'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'

// Custom Switch component that works reliably (copied from surveys)
const CustomSwitch = ({ checked, onChange, disabled = false }: { 
  checked: boolean, 
  onChange: (checked: boolean) => void,
  disabled?: boolean 
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
)

import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/auth/AuthProvider' // Assuming useAuth provides session/token
import { Database } from '@/types/database'

type LandingPage = Database['public']['Tables']['landing_pages']['Row']

interface Props {
  page: LandingPage
  locale: string
}

export function LandingPagePublishToggle({ page, locale }: Props) {
  const t = useTranslations('LandingPages');
  const { toast } = useToast();
  const router = useRouter();
  const { session, isAuthenticated } = useAuth(); 
  const [isToggling, setIsToggling] = useState(false);
  // Use local state derived from prop, update on success
  const [isPublished, setIsPublished] = useState(page.published);

  const handleToggle = async (checked: boolean) => {
    if (!isAuthenticated || !session?.access_token) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to continue',
        variant: 'destructive',
      });
      // Consider redirecting or disabling the toggle if not authenticated
      return;
    }

    setIsToggling(true);
    const action = checked ? 'publish' : 'unpublish';
    const url = `/api/landing-pages/${page.id}/${action}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} page`);
      }

      // Update local state on success
      setIsPublished(checked);

      toast({
        title: t(checked ? 'success.published' : 'success.unpublished'),
        variant: 'default',
      });
      
      // Optionally refresh data - full page reload might be simplest here
      // router.refresh(); // Next.js router refresh
      // Or force reload if necessary for external state
       window.location.reload(); 

    } catch (err) {
      console.error(`Error ${action}ing landing page:`, err);
      toast({
        title: err instanceof Error ? err.message : `Failed to ${action} page`,
        variant: 'destructive',
      });
      // Revert local state on error
      setIsPublished(!checked);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <CustomSwitch
      checked={isPublished}
      onChange={handleToggle}
      disabled={isToggling}
    />
  );
} 