"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface OrganizationOnboardingProps {
  userId: string;
  userRole: string;
  userName: string;
  userEmail: string;
}

export function OrganizationOnboarding({
  userId,
  userRole,
  userName,
  userEmail,
}: OrganizationOnboardingProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: userRole === "seller" ? "seller" : "broker",
    website: "",
    country: "FI",
    industry: "",
    description: "",
  });

  // AI-assisted name generation
  const generateOrgName = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "organization_name",
          context: {
            userName,
            userEmail,
            userRole,
            industry: formData.industry,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, name: data.content });
        toast({
          title: "✨ AI ehdotti nimeä!",
          description: "Voit muokata sitä tarpeen mukaan",
        });
      }
    } catch (error) {
      console.error("Error generating name:", error);
    } finally {
      setAiLoading(false);
    }
  };

  // AI-assisted description generation
  const generateDescription = async () => {
    if (!formData.name || !formData.industry) {
      toast({
        title: "Puuttuvia tietoja",
        description: "Täytä organisaation nimi ja toimiala ensin",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "organization_description",
          context: {
            name: formData.name,
            industry: formData.industry,
            userRole,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, description: data.content });
        toast({
          title: "✨ AI loi kuvauksen!",
          description: "Voit muokata sitä tarpeen mukaan",
        });
      }
    } catch (error) {
      console.error("Error generating description:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.name,
          slug: `${slug}-${Date.now()}`,
          type: formData.type,
          website: formData.website || null,
          country: formData.country,
          industry: formData.industry || null,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Link user to organization
      const userOrgRole =
        userRole === "partner"
          ? "broker"
          : ["seller", "broker", "admin"].includes(userRole)
            ? userRole
            : "viewer";

      const { error: linkError } = await supabase
        .from("user_organizations")
        .insert({
          user_id: userId,
          organization_id: org.id,
          role: userOrgRole,
        });

      if (linkError) throw linkError;

      // Update profile to mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      toast({
        title: "🎉 Organisaatio luotu!",
        description: "Tervetuloa BizExit-alustalle",
      });

      // Redirect to dashboard
      router.refresh();
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Virhe",
        description:
          error.message || "Organisaation luonti epäonnistui. Yritä uudelleen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tervetuloa BizExit-alustalle! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Luodaan organisaatiosi muutamassa vaiheessa
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
            </div>
            <div
              className={`w-12 h-1 ${step >= 2 ? "bg-primary-600" : "bg-gray-200"}`}
            />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : "2"}
            </div>
            <div
              className={`w-12 h-1 ${step >= 3 ? "bg-primary-600" : "bg-gray-200"}`}
            />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Roolisi: {userRole}
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {userRole === "seller" &&
                        "Myyt yrityksiä. Voit luoda listauksia ja hallita kauppoja."}
                      {userRole === "broker" &&
                        "Välität yrityskauppoja. Voit yhdistää ostajia ja myyjiä."}
                      {userRole === "partner" &&
                        "Tarjoat rahoituspalveluita. Voit tehdä rahoitustarjouksia."}
                      {userRole === "admin" &&
                        "Hallinnoit alustaa. Sinulla on täysi pääsy kaikkiin toimintoihin."}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Organisaation nimi *</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Esim. Oy Yrityskaupat Ab"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateOrgName}
                    disabled={aiLoading}
                    className="whitespace-nowrap"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  AI voi ehdottaa nimeä sinulle
                </p>
              </div>

              <div>
                <Label htmlFor="industry">Toimiala *</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Esim. Yrityskaupat, Rahoitus, Konsultointi"
                  required
                />
              </div>

              <div>
                <Label htmlFor="country">Maa</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FI">🇫🇮 Suomi</SelectItem>
                    <SelectItem value="SE">🇸🇪 Ruotsi</SelectItem>
                    <SelectItem value="NO">🇳🇴 Norja</SelectItem>
                    <SelectItem value="DK">🇩🇰 Tanska</SelectItem>
                    <SelectItem value="US">🇺🇸 USA</SelectItem>
                    <SelectItem value="GB">🇬🇧 Iso-Britannia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!formData.name || !formData.industry}
              >
                Jatka
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="website">Verkkosivusto</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="description">Kuvaus</Label>
                <div className="space-y-2">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Kerro organisaatiostasi lyhyesti..."
                    rows={4}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateDescription}
                    disabled={aiLoading}
                    className="w-full"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Luodaan kuvausta...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI luo kuvauksen
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Takaisin
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Jatka
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Tarkista tiedot
                </h3>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organisaation nimi
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Toimiala
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.industry}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maa</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.country === "FI" && "🇫🇮 Suomi"}
                    {formData.country === "SE" && "🇸🇪 Ruotsi"}
                    {formData.country === "NO" && "🇳🇴 Norja"}
                    {formData.country === "DK" && "🇩🇰 Tanska"}
                  </p>
                </div>

                {formData.website && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Verkkosivusto
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.website}
                    </p>
                  </div>
                )}

                {formData.description && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Kuvaus
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {formData.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                  disabled={loading}
                >
                  Takaisin
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Luodaan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Luo organisaatio
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}

