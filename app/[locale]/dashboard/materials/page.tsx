/**
 * Materials Dashboard Page
 * 
 * Shows all generated materials for the organization's companies
 * Allows initiating new material generation
 */

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, ExternalLink, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Material {
  id: string;
  name: string;
  type: string;
  created_at: string;
  gamma_presentation_url: string | null;
  storage_path: string | null;
  company: {
    id: string;
    name: string;
  };
}

interface GenerationJob {
  id: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  company: {
    id: string;
    name: string;
  };
  generate_teaser: boolean;
  generate_im: boolean;
  generate_pitch_deck: boolean;
  created_at: string;
}

export default async function MaterialsPage() {
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
              You must be part of an organization to access materials
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get all materials for organization
  const { data: materials } = await supabase
    .from("company_assets")
    .select(`
      id,
      name,
      type,
      created_at,
      gamma_presentation_url,
      storage_path,
      companies!inner(
        id,
        name,
        organization_id
      )
    `)
    .eq("companies.organization_id", organizationId)
    .in("type", ["teaser", "im", "pitch_deck", "information_memorandum"])
    .order("created_at", { ascending: false });

  // Get active generation jobs
  const { data: activeJobs } = await supabase
    .from("material_generation_jobs")
    .select(`
      id,
      status,
      progress_percentage,
      current_step,
      generate_teaser,
      generate_im,
      generate_pitch_deck,
      created_at,
      companies!inner(
        id,
        name,
        organization_id
      )
    `)
    .eq("companies.organization_id", organizationId)
    .in("status", [
      "initiated",
      "collecting_data",
      "awaiting_uploads",
      "processing_uploads",
      "questionnaire_pending",
      "questionnaire_in_progress",
      "consolidating",
      "generating_teaser",
      "generating_im",
      "generating_pitch_deck",
    ])
    .order("created_at", { ascending: false });

  // Get companies for new generation
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry")
    .eq("organization_id", organizationId)
    .order("name");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "initiated":
      case "collecting_data":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Collecting Data
        </Badge>;
      case "awaiting_uploads":
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Awaiting Uploads
        </Badge>;
      case "processing_uploads":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </Badge>;
      case "questionnaire_pending":
      case "questionnaire_in_progress":
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Questionnaire Pending
        </Badge>;
      case "consolidating":
      case "generating_teaser":
      case "generating_im":
      case "generating_pitch_deck":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating
        </Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>;
      case "failed":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Failed
        </Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "teaser":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "im":
      case "information_memorandum":
        return <FileText className="w-5 h-5 text-purple-500" />;
      case "pitch_deck":
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Materials</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated teasers, information memorandums, and pitch decks
          </p>
        </div>
        {companies && companies.length > 0 && (
          <Button asChild>
            <Link href="/dashboard/materials/new">
              <Plus className="w-4 h-4 mr-2" />
              Generate New Materials
            </Link>
          </Button>
        )}
      </div>

      {/* Active Generation Jobs */}
      {activeJobs && activeJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Generations</h2>
          <div className="grid gap-4">
            {activeJobs.map((job: any) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.companies.name}</CardTitle>
                      <CardDescription>{job.current_step}</CardDescription>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{job.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${job.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Generating:</span>
                    {job.generate_teaser && <Badge variant="outline">Teaser</Badge>}
                    {job.generate_im && <Badge variant="outline">IM</Badge>}
                    {job.generate_pitch_deck && <Badge variant="outline">Pitch Deck</Badge>}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/materials/job/${job.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Generated Materials */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Generated Materials</h2>
        
        {materials && materials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material: any) => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {getTypeIcon(material.type)}
                    <Badge variant="outline" className="capitalize">
                      {material.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-4">{material.name}</CardTitle>
                  <CardDescription>{material.companies.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(material.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    {material.gamma_presentation_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={material.gamma_presentation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </Button>
                    )}
                    {material.storage_path && (
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Materials Yet</CardTitle>
              <CardDescription>
                {companies && companies.length > 0 
                  ? "Generate your first business materials to get started"
                  : "Add a company first to generate materials"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companies && companies.length > 0 ? (
                <Button asChild>
                  <Link href="/dashboard/materials/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Materials
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/companies/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Company
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
