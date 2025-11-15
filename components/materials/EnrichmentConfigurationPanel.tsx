"use client";

/**
 * Enrichment Configuration Panel
 * 
 * Allows users to select which of the 17 enrichment modules
 * to include in material generation
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  CheckCircle2, 
  Info,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Shield,
  Network,
  Globe,
  History,
  PieChart,
  Heart,
  Zap,
  Award,
  AlertTriangle,
  GitMerge,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnrichmentModule {
  id: string;
  name: string;
  description: string;
  category: "base" | "ma_specific";
  icon: any;
  required: boolean;
  estimatedTime: string;
}

const ENRICHMENT_MODULES: EnrichmentModule[] = [
  // Base modules (1-9)
  {
    id: "basic_info",
    name: "Basic Information",
    description: "Company name, industry, location, business model",
    category: "base",
    icon: Building2,
    required: true,
    estimatedTime: "1 min",
  },
  {
    id: "financial_data",
    name: "Financial Data",
    description: "Revenue, EBITDA, key financial metrics",
    category: "base",
    icon: DollarSign,
    required: true,
    estimatedTime: "2 min",
  },
  {
    id: "industry_analysis",
    name: "Industry Analysis",
    description: "Market size, trends, growth drivers",
    category: "base",
    icon: TrendingUp,
    required: false,
    estimatedTime: "3 min",
  },
  {
    id: "competitive_analysis",
    name: "Competitive Analysis",
    description: "Competitors, market position, differentiation",
    category: "base",
    icon: Target,
    required: false,
    estimatedTime: "3 min",
  },
  {
    id: "growth_analysis",
    name: "Growth Analysis",
    description: "Historical growth, expansion opportunities",
    category: "base",
    icon: TrendingUp,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "financial_health",
    name: "Financial Health",
    description: "Profitability, cash flow, debt analysis",
    category: "base",
    icon: Heart,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "personnel_info",
    name: "Personnel Information",
    description: "Team size, key executives, organizational structure",
    category: "base",
    icon: Users,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "market_intelligence",
    name: "Market Intelligence",
    description: "Market trends, positioning, opportunities",
    category: "base",
    icon: Globe,
    required: false,
    estimatedTime: "3 min",
  },
  {
    id: "web_presence",
    name: "Web Presence",
    description: "Website analysis, digital footprint",
    category: "base",
    icon: Network,
    required: false,
    estimatedTime: "2 min",
  },

  // M&A specific modules (10-17)
  {
    id: "ma_history",
    name: "M&A History",
    description: "Previous acquisitions, divestitures, funding rounds",
    category: "ma_specific",
    icon: History,
    required: false,
    estimatedTime: "3 min",
  },
  {
    id: "valuation_data",
    name: "Valuation Data",
    description: "Valuation multiples, comparable transactions",
    category: "ma_specific",
    icon: PieChart,
    required: false,
    estimatedTime: "3 min",
  },
  {
    id: "customer_intelligence",
    name: "Customer Intelligence",
    description: "Customer concentration, retention, revenue patterns",
    category: "ma_specific",
    icon: Users,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "operational_efficiency",
    name: "Operational Efficiency",
    description: "Key operational metrics, productivity analysis",
    category: "ma_specific",
    icon: Zap,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "competitive_advantages",
    name: "Competitive Advantages",
    description: "Unique selling points, barriers to entry",
    category: "ma_specific",
    icon: Award,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "risk_assessment",
    name: "Risk Assessment",
    description: "Potential risks, challenges, mitigation strategies",
    category: "ma_specific",
    icon: AlertTriangle,
    required: false,
    estimatedTime: "3 min",
  },
  {
    id: "integration_potential",
    name: "Integration Potential",
    description: "Ease of integration, synergy opportunities",
    category: "ma_specific",
    icon: GitMerge,
    required: false,
    estimatedTime: "2 min",
  },
  {
    id: "exit_attractiveness",
    name: "Exit Attractiveness",
    description: "Appeal to buyers, strategic fit analysis",
    category: "ma_specific",
    icon: Star,
    required: false,
    estimatedTime: "3 min",
  },
];

interface EnrichmentConfigurationPanelProps {
  companyId: string;
  initialSelection?: string[];
  onSave?: (selectedModules: string[]) => void;
  onCancel?: () => void;
}

export function EnrichmentConfigurationPanel({
  companyId,
  initialSelection,
  onSave,
  onCancel,
}: EnrichmentConfigurationPanelProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Initialize with required modules + initial selection
  const requiredModules = ENRICHMENT_MODULES.filter(m => m.required).map(m => m.id);
  const [selectedModules, setSelectedModules] = useState<string[]>(
    initialSelection || [...requiredModules]
  );

  const handleToggleModule = (moduleId: string) => {
    const module = ENRICHMENT_MODULES.find(m => m.id === moduleId);
    if (module?.required) return; // Can't deselect required modules

    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedModules(ENRICHMENT_MODULES.map(m => m.id));
  };

  const handleSelectDefaults = () => {
    const defaults = ENRICHMENT_MODULES.filter(
      m => m.required || ["industry_analysis", "competitive_analysis", "growth_analysis"].includes(m.id)
    ).map(m => m.id);
    setSelectedModules(defaults);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/companies/${companyId}/enrichment-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: selectedModules }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      toast({
        title: "Configuration saved",
        description: "Enrichment modules have been updated",
      });

      if (onSave) onSave(selectedModules);
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

  const baseModules = ENRICHMENT_MODULES.filter(m => m.category === "base");
  const maModules = ENRICHMENT_MODULES.filter(m => m.category === "ma_specific");

  const selectedCount = selectedModules.length;
  const totalTime = ENRICHMENT_MODULES
    .filter(m => selectedModules.includes(m.id))
    .reduce((total, m) => {
      const time = parseInt(m.estimatedTime);
      return total + time;
    }, 0);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Enrichment Modules</CardTitle>
            <CardDescription>
              Choose which data modules to include in the material generation process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedCount} modules selected
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Estimated time: ~{totalTime} minutes
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectDefaults}
                >
                  Defaults
                </Button>
              </div>
            </div>

            {/* Base Modules */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Base Modules</h3>
                <Badge variant="outline">Core Data</Badge>
              </div>
              <div className="grid gap-3">
                {baseModules.map((module) => {
                  const Icon = module.icon;
                  const isSelected = selectedModules.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`
                        flex items-start gap-3 p-4 border rounded-lg transition-all
                        ${isSelected ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200"}
                        ${module.required ? "opacity-75" : "cursor-pointer hover:border-gray-300"}
                      `}
                      onClick={() => !module.required && handleToggleModule(module.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={module.required}
                        className="mt-1"
                      />
                      <Icon className="w-5 h-5 text-primary-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{module.name}</div>
                          {module.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {module.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{module.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* M&A Specific Modules */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">M&A Specific Modules</h3>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                  Advanced
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                These modules provide deep insights specifically valuable for M&A transactions
              </p>
              <div className="grid gap-3">
                {maModules.map((module) => {
                  const Icon = module.icon;
                  const isSelected = selectedModules.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`
                        flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                        ${isSelected ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 hover:border-gray-300"}
                      `}
                      onClick={() => handleToggleModule(module.id)}
                    >
                      <Checkbox checked={isSelected} className="mt-1" />
                      <Icon className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{module.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {module.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{module.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
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
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>

          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm space-y-2">
                <p>
                  <strong>Note:</strong> More modules provide richer data but take longer to process.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Required modules cannot be deselected</li>
                  <li>M&A modules are recommended for comprehensive teasers and IMs</li>
                  <li>You can update this configuration anytime before generation</li>
                  <li>Each module uses AI to gather and analyze data from multiple sources</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

