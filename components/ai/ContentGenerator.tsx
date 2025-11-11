"use client";

import { useState } from "react";
import { useAI } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Download, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ContentGeneratorProps {
  resourceType: "company" | "deal";
  resourceId: string;
  allowedTypes?: string[];
}

const CONTENT_TYPES = {
  teaser: {
    label: "Teaser (1 sivu)",
    description: "Lyhyt, anonyymi markkinointidokumentti",
  },
  im: {
    label: "Information Memorandum (5-10 sivua)",
    description: "Kattava markkinointidokumentti",
  },
  cim: {
    label: "Confidential IM (15-30 sivua)",
    description: "Yksityiskohtainen sijoitusdokumentti",
  },
  due_diligence: {
    label: "Due Diligence -kysymykset",
    description: "Kattava kysymyslista",
  },
  risk_assessment: {
    label: "Riskiarviointi",
    description: "Yksityiskohtainen riskianalyysi",
  },
  recommendation: {
    label: "Sijoitussuositus",
    description: "Ostopäätössuositus perusteluineen",
  },
};

/**
 * AI Content Generator Component
 * 
 * Generates various types of documents and reports using AI
 */
export function ContentGenerator({
  resourceType,
  resourceId,
  allowedTypes,
}: ContentGeneratorProps) {
  const { generateContent, loading, error } = useAI();
  const [selectedType, setSelectedType] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const availableTypes = allowedTypes
    ? Object.entries(CONTENT_TYPES).filter(([key]) => allowedTypes.includes(key))
    : Object.entries(CONTENT_TYPES);

  const handleGenerate = async () => {
    if (!selectedType) return;

    const content = await generateContent(selectedType, resourceType, resourceId);
    if (content) {
      setGeneratedContent(content);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI-Sisällöngenerointi
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Luo automaattisesti dokumentteja ja raportteja AI:n avulla
          </p>
        </div>

        {/* Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Dokumenttityyppi
          </label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Valitse dokumenttityyppi" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map(([key, { label, description }]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedType || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generoidaan...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generoi dokumentti
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Generated Content */}
        {generatedContent && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Generoitu sisältö
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Kopioitu
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Kopioi
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-1 h-3 w-3" />
                  Lataa
                </Button>
              </div>
            </div>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

