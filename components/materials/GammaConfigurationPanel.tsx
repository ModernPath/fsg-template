"use client";

/**
 * Gamma Configuration Panel
 * 
 * Allows users to configure Gamma presentation settings:
 * - Theme selection
 * - Brand colors
 * - Font styles
 * - Slide layouts
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palette, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface GammaConfig {
  theme: "professional" | "modern" | "minimal" | "creative" | "corporate";
  brandColor: string;
  secondaryColor?: string;
  fontStyle: "sans" | "serif" | "modern" | "classic";
  slideLayout: "standard" | "widescreen" | "compact";
  includeCompanyLogo: boolean;
  includeFooter: boolean;
  slideTransitions: boolean;
}

interface GammaConfigurationPanelProps {
  companyId: string;
  initialConfig?: Partial<GammaConfig>;
  onSave?: (config: GammaConfig) => void;
  onCancel?: () => void;
}

const THEME_OPTIONS = [
  {
    value: "professional",
    label: "Professional",
    description: "Clean, business-focused design",
    preview: "bg-blue-600",
  },
  {
    value: "modern",
    label: "Modern",
    description: "Contemporary with bold accents",
    preview: "bg-purple-600",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Simple and elegant",
    preview: "bg-gray-800",
  },
  {
    value: "creative",
    label: "Creative",
    description: "Vibrant and dynamic",
    preview: "bg-gradient-to-r from-pink-500 to-yellow-500",
  },
  {
    value: "corporate",
    label: "Corporate",
    description: "Traditional corporate style",
    preview: "bg-slate-700",
  },
];

const FONT_STYLES = [
  { value: "sans", label: "Sans Serif", description: "Modern, clean (Helvetica, Arial)" },
  { value: "serif", label: "Serif", description: "Traditional, elegant (Times, Georgia)" },
  { value: "modern", label: "Modern", description: "Contemporary (Inter, SF Pro)" },
  { value: "classic", label: "Classic", description: "Timeless (Garamond, Baskerville)" },
];

const BRAND_COLOR_PRESETS = [
  { name: "Gold", value: "#D4AF37" },
  { name: "Blue", value: "#2563EB" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Green", value: "#059669" },
  { name: "Red", value: "#DC2626" },
  { name: "Orange", value: "#EA580C" },
  { name: "Teal", value: "#0D9488" },
  { name: "Gray", value: "#475569" },
];

export function GammaConfigurationPanel({
  companyId,
  initialConfig,
  onSave,
  onCancel,
}: GammaConfigurationPanelProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<GammaConfig>({
    theme: initialConfig?.theme || "professional",
    brandColor: initialConfig?.brandColor || "#D4AF37",
    secondaryColor: initialConfig?.secondaryColor || "#1F2937",
    fontStyle: initialConfig?.fontStyle || "sans",
    slideLayout: initialConfig?.slideLayout || "widescreen",
    includeCompanyLogo: initialConfig?.includeCompanyLogo !== false,
    includeFooter: initialConfig?.includeFooter !== false,
    slideTransitions: initialConfig?.slideTransitions !== false,
  });

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save to database
      const response = await fetch(`/api/companies/${companyId}/gamma-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      toast({
        title: "Configuration saved",
        description: "Gamma presentation settings have been updated",
      });

      if (onSave) onSave(config);
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      theme: "professional",
      brandColor: "#D4AF37",
      secondaryColor: "#1F2937",
      fontStyle: "sans",
      slideLayout: "widescreen",
      includeCompanyLogo: true,
      includeFooter: true,
      slideTransitions: true,
    });
    toast({
      title: "Reset to defaults",
      description: "Configuration has been reset",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-600" />
            Presentation Design
          </CardTitle>
          <CardDescription>
            Customize how your materials will look in Gamma presentations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setConfig({ ...config, theme: theme.value as any })}
                  className={`
                    p-4 border-2 rounded-lg text-left transition-all
                    ${
                      config.theme === theme.value
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded ${theme.preview}`} />
                    <div>
                      <div className="font-medium">{theme.label}</div>
                      {config.theme === theme.value && (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Colors */}
          <div className="space-y-3">
            <Label>Brand Color</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BRAND_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setConfig({ ...config, brandColor: preset.value })}
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all
                    ${
                      config.brandColor === preset.value
                        ? "border-gray-900 scale-110"
                        : "border-gray-300"
                    }
                  `}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={config.brandColor}
                onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={config.brandColor}
                onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                placeholder="#D4AF37"
                className="flex-1"
              />
            </div>
          </div>

          {/* Font Style */}
          <div className="space-y-2">
            <Label htmlFor="font-style">Font Style</Label>
            <Select
              value={config.fontStyle}
              onValueChange={(value) => setConfig({ ...config, fontStyle: value as any })}
            >
              <SelectTrigger id="font-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_STYLES.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <div>
                      <div className="font-medium">{font.label}</div>
                      <div className="text-xs text-muted-foreground">{font.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slide Layout */}
          <div className="space-y-2">
            <Label htmlFor="slide-layout">Slide Layout</Label>
            <Select
              value={config.slideLayout}
              onValueChange={(value) => setConfig({ ...config, slideLayout: value as any })}
            >
              <SelectTrigger id="slide-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="widescreen">
                  <div>
                    <div className="font-medium">Widescreen (16:9)</div>
                    <div className="text-xs text-muted-foreground">Modern, best for screens</div>
                  </div>
                </SelectItem>
                <SelectItem value="standard">
                  <div>
                    <div className="font-medium">Standard (4:3)</div>
                    <div className="text-xs text-muted-foreground">Classic presentation format</div>
                  </div>
                </SelectItem>
                <SelectItem value="compact">
                  <div>
                    <div className="font-medium">Compact</div>
                    <div className="text-xs text-muted-foreground">More content per slide</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Additional Options</Label>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Include Company Logo</div>
                <div className="text-xs text-muted-foreground">
                  Add logo to slide headers
                </div>
              </div>
              <Button
                variant={config.includeCompanyLogo ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setConfig({ ...config, includeCompanyLogo: !config.includeCompanyLogo })
                }
              >
                {config.includeCompanyLogo ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Include Footer</div>
                <div className="text-xs text-muted-foreground">
                  Show page numbers and company name
                </div>
              </div>
              <Button
                variant={config.includeFooter ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig({ ...config, includeFooter: !config.includeFooter })}
              >
                {config.includeFooter ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Slide Transitions</div>
                <div className="text-xs text-muted-foreground">
                  Smooth transitions between slides
                </div>
              </div>
              <Button
                variant={config.slideTransitions ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setConfig({ ...config, slideTransitions: !config.slideTransitions })
                }
              >
                {config.slideTransitions ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
        
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>

        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Preview Note */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> These settings will be applied to all future Gamma
            presentations generated for this company. Existing presentations will not be
            affected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

