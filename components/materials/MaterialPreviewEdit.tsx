"use client";

/**
 * Material Preview & Edit Component
 * 
 * Displays generated materials with options to:
 * - Preview in Gamma (view link)
 * - Edit in Gamma (edit link)
 * - Download as PDF/PPTX
 * - View raw content
 * - Regenerate with different settings
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  Edit3,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface MaterialAsset {
  id: string;
  name: string;
  type: "teaser" | "im" | "pitch_deck" | "information_memorandum";
  content: any;
  gamma_presentation_id?: string;
  gamma_presentation_url?: string;
  gamma_edit_url?: string;
  gamma_embed_url?: string;
  storage_path?: string;
  created_at: string;
  updated_at?: string;
  company: {
    id: string;
    name: string;
  };
}

interface MaterialPreviewEditProps {
  material: MaterialAsset;
  onRegenerate?: () => void;
  onDelete?: () => void;
}

export function MaterialPreviewEdit({
  material,
  onRegenerate,
  onDelete,
}: MaterialPreviewEditProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopyLink = async () => {
    if (!material.gamma_presentation_url) return;

    try {
      await navigator.clipboard.writeText(material.gamma_presentation_url);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Presentation link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "pdf" | "pptx") => {
    setExporting(true);
    try {
      const response = await fetch(`/api/materials/${material.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${material.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Material exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Error exporting material:", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export material",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getTypeBadge = () => {
    switch (material.type) {
      case "teaser":
        return <Badge className="bg-blue-600">Teaser</Badge>;
      case "im":
      case "information_memorandum":
        return <Badge className="bg-purple-600">Information Memorandum</Badge>;
      case "pitch_deck":
        return <Badge className="bg-orange-600">Pitch Deck</Badge>;
      default:
        return <Badge>{material.type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary-600" />
                <CardTitle>{material.name}</CardTitle>
              </div>
              <CardDescription>
                {material.company.name} • Created{" "}
                {new Date(material.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            {getTypeBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {material.gamma_presentation_url && (
              <>
                <Button asChild>
                  <a
                    href={material.gamma_presentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Presentation
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>

                {material.gamma_edit_url && (
                  <Button variant="outline" asChild>
                    <a
                      href={material.gamma_edit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit in Gamma
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}

                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </>
                  )}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport("pptx")}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PPTX
            </Button>

            {onRegenerate && (
              <Button variant="outline" onClick={onRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Material Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium capitalize">
                {material.type.replace("_", " ")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium text-green-600">Published</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">
                {new Date(material.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="font-medium">
                {material.updated_at
                  ? new Date(material.updated_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Preview</CardTitle>
              <CardDescription>
                Preview your Gamma presentation in an embedded frame
              </CardDescription>
            </CardHeader>
            <CardContent>
              {material.gamma_presentation_url ? (
                <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={material.gamma_presentation_url}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="fullscreen"
                    title={material.name}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No presentation preview available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Content</CardTitle>
              <CardDescription>
                Raw content used to generate this material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border overflow-auto max-h-[600px]">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(material.content, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Use this code to embed the presentation on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {material.gamma_presentation_url ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                    <code className="text-sm">
                      {`<iframe src="${material.gamma_presentation_url}" width="960" height="540" frameborder="0" allowfullscreen></iframe>`}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const embedCode = `<iframe src="${material.gamma_presentation_url}" width="960" height="540" frameborder="0" allowfullscreen></iframe>`;
                      navigator.clipboard.writeText(embedCode);
                      toast({
                        title: "Copied",
                        description: "Embed code copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Embed Code
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No embed code available for this material</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Material Management</CardTitle>
          <CardDescription>
            Advanced options for managing this material
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Gamma Presentation ID</div>
              <div className="text-sm text-muted-foreground">
                {material.gamma_presentation_id || "Not available"}
              </div>
            </div>
            {material.gamma_presentation_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(material.gamma_presentation_id!);
                  toast({ title: "ID copied" });
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Download Original Files</div>
              <div className="text-sm text-muted-foreground">
                Access source files used for generation
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/api/materials/${material.id}/source-files`}>
                <Download className="w-3 h-3 mr-1" />
                Download
              </Link>
            </Button>
          </div>

          {onDelete && (
            <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10">
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">
                  Delete Material
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Permanently remove this material
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

