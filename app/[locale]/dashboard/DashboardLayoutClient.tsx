"use client";

/**
 * BizExit Dashboard Layout Client Component
 * Handles client-side authentication and layout rendering
 */

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { createClient } from "@/utils/supabase/client";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function DashboardLayoutClient({
  children,
  params: { locale },
}: DashboardLayoutClientProps) {
  const { isAuthenticated, session, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user?.id) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *,
            user_organizations(
              organization_id,
              role,
              organizations(
                id,
                name,
                type
              )
            )
          `)
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [session?.user?.id, supabase]);

  // Handle loading state
  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle authentication
  if (!isAuthenticated || !session?.user) {
    redirect(
      `/${locale}/auth/sign-in?next=${encodeURIComponent(`/${locale}/dashboard`)}`
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <DashboardNav locale={locale} profile={profile} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <DashboardHeader user={session.user} profile={profile} locale={locale} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

