"use client";

/**
 * Material Preview Page
 * 
 * Preview and manage generated material with Gamma integration
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { MaterialPreviewEdit } from "@/components/materials/MaterialPreviewEdit";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MaterialPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaterial() {
      try {
        setLoading(true);
        setError(null);

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/${locale}/auth/sign-in`);
          return;
        }

        // Get profile and organization
        const { data: profile } = await supabase
          .from("profiles")
          .select(`
            id,
            role,
            user_organizations(
              organization_id
            )
          `)
          .eq("id", user.id)
          .single();

        const organizationId = profile?.user_organizations?.[0]?.organization_id;

        if (!organizationId) {
          router.push(`/${locale}/dashboard`);
          return;
        }

        // Fetch material with company info
        const { data: materialData, error: materialError } = await supabase
          .from("company_assets")
          .select(`
            id,
            name,
            type,
            content,
            gamma_presentation_id,
            gamma_presentation_url,
            gamma_edit_url,
            gamma_embed_url,
            storage_path,
            created_at,
            updated_at,
            companies!inner(
              id,
              name,
              organization_id
            )
          `)
          .eq("id", id)
          .eq("companies.organization_id", organizationId)
          .single();

        if (materialError || !materialData) {
          setError("Material not found");
          return;
        }

        // Transform data to match component interface
        setMaterial({
          ...materialData,
          company: {
            id: materialData.companies.id,
            name: materialData.companies.name,
          },
        });

      } catch (err: any) {
        console.error("Error fetching material:", err);
        setError(err.message || "Error loading material");
      } finally {
        setLoading(false);
      }
    }

    fetchMaterial();
  }, [id, locale, router, supabase]);

  const handleRegenerate = () => {
    // Navigate to materials generation with this company
    if (material?.company?.id) {
      router.push(`/${locale}/dashboard/materials/new?company=${material.company.id}&regenerate=${id}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("company_assets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Material deleted",
        description: "The material has been permanently removed",
      });

      router.push(`/${locale}/dashboard/materials`);
    } catch (error: any) {
      console.error("Error deleting material:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete material",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            {error || "Material not found"}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/materials`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Materials
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/materials`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Materials
          </Button>
        </Link>
      </div>

      {/* Material Preview & Edit */}
      <MaterialPreviewEdit
        material={material}
        onRegenerate={handleRegenerate}
        onDelete={handleDelete}
      />
    </div>
  );
}

