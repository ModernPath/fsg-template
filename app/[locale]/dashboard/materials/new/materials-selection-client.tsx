"use client";

/**
 * Materials Selection Client Component
 * 
 * Allows user to select a company and launch the generation wizard
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialGenerationWizard } from "@/components/materials/MaterialGenerationWizard";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  industry: string | null;
}

interface MaterialsSelectionClientProps {
  companies: Company[];
}

export function MaterialsSelectionClient({ companies }: MaterialsSelectionClientProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [showWizard, setShowWizard] = useState(false);
  const router = useRouter();

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  if (showWizard && selectedCompany) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setShowWizard(false)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selection
        </Button>
        <MaterialGenerationWizard
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          onComplete={() => router.push("/dashboard/materials")}
        />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Business Materials</CardTitle>
        <CardDescription>
          Select a company to generate professional business materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company">Select Company</Label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger id="company">
              <SelectValue placeholder="Choose a company..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                  {company.industry && (
                    <span className="text-muted-foreground ml-2">
                      ({company.industry})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedCompanyId}
            onClick={() => setShowWizard(true)}
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

