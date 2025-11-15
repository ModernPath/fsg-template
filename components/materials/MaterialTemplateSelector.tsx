"use client";

/**
 * Material Template Selector
 * 
 * Allows users to choose from predefined templates for different
 * presentation styles and industry-specific formats
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MaterialTemplate {
  id: string;
  name: string;
  description: string;
  category: "general" | "tech" | "retail" | "manufacturing" | "services";
  style: "formal" | "modern" | "creative" | "minimal";
  slides: number;
  features: string[];
  preview?: string;
  recommended: boolean;
}

const TEMPLATES: MaterialTemplate[] = [
  {
    id: "professional-teaser",
    name: "Professional M&A Teaser",
    description: "Classic teaser format used by investment banks and M&A advisors",
    category: "general",
    style: "formal",
    slides: 11,
    features: [
      "Executive summary",
      "Investment highlights",
      "Financial snapshot",
      "Growth opportunities",
      "Ideal buyer profile",
    ],
    recommended: true,
  },
  {
    id: "tech-startup",
    name: "Tech Startup Pitch",
    description: "Modern format for technology companies and SaaS businesses",
    category: "tech",
    style: "modern",
    slides: 15,
    features: [
      "Product demonstration",
      "Tech stack overview",
      "User metrics & growth",
      "Market opportunity",
      "Competitive landscape",
    ],
    recommended: false,
  },
  {
    id: "manufacturing-overview",
    name: "Manufacturing Company Overview",
    description: "Detailed format for manufacturing and production companies",
    category: "manufacturing",
    style: "formal",
    slides: 20,
    features: [
      "Production capacity",
      "Supply chain analysis",
      "Equipment & facilities",
      "Quality certifications",
      "Customer portfolio",
    ],
    recommended: false,
  },
  {
    id: "retail-business",
    name: "Retail Business Presentation",
    description: "Tailored for retail, e-commerce, and consumer brands",
    category: "retail",
    style: "creative",
    slides: 12,
    features: [
      "Store locations/online presence",
      "Customer demographics",
      "Product portfolio",
      "Sales channels",
      "Brand positioning",
    ],
    recommended: false,
  },
  {
    id: "service-company",
    name: "Service Company Profile",
    description: "Professional services, consulting, and B2B services",
    category: "services",
    style: "formal",
    slides: 14,
    features: [
      "Service offerings",
      "Client testimonials",
      "Team expertise",
      "Case studies",
      "Recurring revenue model",
    ],
    recommended: false,
  },
  {
    id: "minimal-overview",
    name: "Minimal Executive Summary",
    description: "Clean, concise format focusing on key metrics",
    category: "general",
    style: "minimal",
    slides: 8,
    features: [
      "Key metrics dashboard",
      "Growth trajectory",
      "Competitive advantage",
      "Investment thesis",
    ],
    recommended: false,
  },
];

interface MaterialTemplateSelectorProps {
  selectedTemplate?: string;
  onSelect: (templateId: string) => void;
  materialType: "teaser" | "im" | "pitch_deck";
}

export function MaterialTemplateSelector({
  selectedTemplate,
  onSelect,
  materialType,
}: MaterialTemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<MaterialTemplate | null>(null);

  const getTemplatesForType = () => {
    // Filter templates based on material type
    if (materialType === "teaser") {
      return TEMPLATES.filter(t => t.slides <= 12);
    } else if (materialType === "pitch_deck") {
      return TEMPLATES.filter(t => t.slides <= 20);
    }
    return TEMPLATES; // IM can use all templates
  };

  const templates = getTemplatesForType();

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-600",
      tech: "bg-blue-600",
      retail: "bg-purple-600",
      manufacturing: "bg-orange-600",
      services: "bg-green-600",
    };
    return (
      <Badge className={colors[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const getStyleBadge = (style: string) => {
    const variants: Record<string, "default" | "outline" | "secondary"> = {
      formal: "default",
      modern: "secondary",
      creative: "outline",
      minimal: "outline",
    };
    return (
      <Badge variant={variants[style]}>
        {style.charAt(0).toUpperCase() + style.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a template that best matches your company and industry
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <Card
              key={template.id}
              className={`
                relative cursor-pointer transition-all
                ${
                  isSelected
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }
              `}
              onClick={() => onSelect(template.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.recommended && (
                        <Badge className="bg-green-600 text-xs">Recommended</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getCategoryBadge(template.category)}
                      {getStyleBadge(template.style)}
                      <Badge variant="outline" className="text-xs">
                        {template.slides} slides
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Includes:</div>
                  <ul className="space-y-1">
                    {template.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{template.name}</DialogTitle>
                      <DialogDescription>{template.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p>Template preview</p>
                          <p className="text-sm mt-2">{template.slides} slides</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Style</div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {template.style}
                          </p>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Category</div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {template.category}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Features</div>
                        <ul className="grid grid-cols-2 gap-2">
                          {template.features.map((feature, index) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground flex items-center gap-2"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          onSelect(template.id);
                        }}
                      >
                        Select This Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTemplate && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Template selected:{" "}
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your materials will be generated using this template structure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

