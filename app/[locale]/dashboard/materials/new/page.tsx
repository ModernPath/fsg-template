/**
 * New Materials Generation Page
 * 
 * Select company and start the material generation wizard
 */

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialsSelectionClient } from "./materials-selection-client";

export default async function NewMaterialsPage() {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      role,
      user_organizations!inner(
        organization_id,
        role
      )
    `)
    .eq("id", user.id)
    .single();

  const organizationId = profile?.user_organizations?.[0]?.organization_id;

  if (!organizationId) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>
              You must be part of an organization to generate materials
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check permissions
  if (!["seller", "broker", "admin", "partner"].includes(profile.role.toLowerCase())) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Insufficient Permissions</CardTitle>
            <CardDescription>
              You don't have permission to generate materials. Contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry")
    .eq("organization_id", organizationId)
    .order("name");

  if (!companies || companies.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Companies</CardTitle>
            <CardDescription>
              You need to add a company before generating materials
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <MaterialsSelectionClient companies={companies} />
    </div>
  );
}

