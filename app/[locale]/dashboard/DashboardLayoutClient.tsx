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
import { Toaster } from "@/components/ui/toaster";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar Navigation - Hidden on mobile */}
        <div className="hidden lg:flex">
          <DashboardNav locale={locale} profile={profile} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <DashboardNav
                locale={locale}
                profile={profile}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden w-full lg:w-auto">
          {/* Header */}
          <DashboardHeader
            user={session.user}
            profile={profile}
            locale={locale}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </>
  );
}

