"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";

export default function DebugPage() {
  const supabase = createClient();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDebugInfo() {
      try {
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Get user
        const { data: { user } } = await supabase.auth.getUser();

        let profile = null;
        let organizations = null;

        if (user) {
          // Get profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          profile = profileData;

          // Get organizations
          const { data: orgsData } = await supabase
            .from("user_organizations")
            .select(`
              *,
              organizations(*)
            `)
            .eq("user_id", user.id);
          organizations = orgsData;
        }

        setDebugInfo({
          hasSession: !!session,
          sessionExpiry: session?.expires_at,
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          profile,
          organizations,
        });
      } catch (err) {
        setDebugInfo({
          error: err instanceof Error ? err.message : "Unknown error"
        });
      } finally {
        setLoading(false);
      }
    }

    loadDebugInfo();
  }, [supabase]);

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">🐛 Debug Information</h1>
      
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Session Status</h2>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <a 
            href="/fi/auth/sign-in"
            className="block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Go to Login
          </a>
          <a 
            href="/fi/dashboard"
            className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Dashboard
          </a>
          <a 
            href="/fi/dashboard/companies"
            className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Companies
          </a>
        </div>
      </Card>
    </div>
  );
}

