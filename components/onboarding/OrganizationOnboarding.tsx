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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  Sparkles,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Search,
  AlertCircle,
  Info,
} from "lucide-react";

interface OrganizationOnboardingProps {
  userId: string;
  userRole: string;
  userName: string;
  userEmail: string;
}

interface YTJCompany {
  businessId: string;
  name: string;
  registrationDate?: string;
  companyForm?: string;
  addresses?: Array<{
    street?: string;
    postCode?: string;
    city?: string;
    country?: string;
  }>;
  businessLines?: Array<{
    name?: string;
  }>;
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
  const [ytjLoading, setYtjLoading] = useState(false);
  const [ytjResults, setYtjResults] = useState<YTJCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ytjVerified, setYtjVerified] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    businessId: "",
    type: userRole === "seller" ? "seller" : "broker",
    website: "",
    country: "FI",
    industry: "",
    description: "",
    address: "",
    employees: null as number | null,
    revenue: null as number | null,
  });

  /**
   * Search companies from YTJ registry
   */
  const searchYTJ = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast({
        title: "Liian lyhyt hakusana",
        description: "Kirjoita vähintään 2 merkkiä",
        variant: "destructive",
      });
      return;
    }

    setYtjLoading(true);
    setYtjResults([]);

    try {
      console.log("🔍 Searching YTJ for:", searchQuery);

      const response = await fetch(
        `/api/ytj/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("YTJ-haku epäonnistui");
      }

      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setYtjResults(data.data);
        toast({
          title: `✅ Löytyi ${data.data.length} yritystä`,
          description: "Valitse oikea yritys listasta",
        });
      } else {
        // No results found
        toast({
          title: "❌ Ei tuloksia",
          description: `Yritystä "${searchQuery}" ei löytynyt. Kokeile lyhyempää hakusanaa (esim. pelkkä yrityksen nimi ilman Oy/Ab).`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("YTJ search error:", error);
      toast({
        title: "YTJ-haku epäonnistui",
        description: "Yritä hetken kuluttua uudelleen",
        variant: "destructive",
      });
    } finally {
      setYtjLoading(false);
    }
  };

  /**
   * Select company from YTJ results
   * Only fetches basic data from Finnish Business Registry (fast, ~1s)
   */
  const selectYTJCompany = async (company: YTJCompany) => {
    // Fill form with YTJ basic data
    const address = company.addresses?.[0];
    const addressStr = address
      ? `${address.street || ""}, ${address.postCode || ""} ${
          address.city || ""
        }`.trim()
      : "";

    const industry = company.businessLines?.[0]?.name || "";

    setFormData({
      ...formData,
      name: company.name,
      businessId: company.businessId,
      address: addressStr,
      industry: industry,
    });

    setYtjVerified(true);
    setYtjResults([]);
    setSearchQuery("");

    toast({
      title: "✅ Yritystiedot haettu",
      description: "YTJ-perustiedot ladattu onnistuneesti",
    });
  };

  /**
   * AI-assisted description generation
   */
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
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found");
      }

      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
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
          title: "✨ AI loi kuvauksen",
          description: "Voit muokata sitä tarpeen mukaan",
        });
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Virhe",
        description: "AI-generointi epäonnistui",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Submit organization
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error("Organisaation nimi vaaditaan");
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Generate UUID client-side to avoid RLS SELECT policy conflict
      const orgId = crypto.randomUUID();
      console.log("🆔 Generated org ID:", orgId);

      // Create organization WITHOUT .select() to avoid RLS policy conflict
      // RLS allows INSERT but SELECT requires user to be member first
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: orgId, // Use pre-generated UUID
          name: formData.name,
          slug: `${slug}-${Date.now()}`,
          type: formData.type,
          website: formData.website || null,
          country: formData.country,
          industry: formData.industry || null,
          description: formData.description || null,
          business_id: formData.businessId || null,
          data_quality: null, // Enrichment data is available after onboarding
        });

      if (orgError) {
        console.error("❌ Error creating organization:", orgError);
        throw new Error(`Organisaation luonti epäonnistui: ${orgError.message}`);
      }

      console.log("✅ Organization created:", orgId);

      // Link user to organization with admin role
      // This MUST happen before we try to SELECT the organization again
      const { error: linkError } = await supabase
        .from("user_organizations")
        .insert({
          user_id: userId,
          organization_id: orgId,
          role: "admin", // Organization admin (valid: admin, broker, seller, analyst, viewer)
        });

      if (linkError) {
        console.error("❌ Error linking user to organization:", linkError);
        throw new Error(`Käyttäjän linkitys epäonnistui: ${linkError.message}`);
      }

      console.log("✅ User linked to organization");

      // Mark onboarding complete (no organization_id in profiles table)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("id", userId);

      if (profileError) {
        console.error("❌ Error updating profile:", profileError);
        throw new Error(`Profiilin päivitys epäonnistui: ${profileError.message}`);
      }

      console.log("✅ Profile updated");

      console.log("🎉 Organization creation complete!");

      toast({
        title: "✅ Organisaatio luotu!",
        description: "Tervetuloa BizExitiin",
      });

      // Small delay to ensure database changes propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force refresh and redirect to dashboard
      router.refresh();
      window.location.href = "/dashboard"; // Force full page reload to clear auth cache
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Virhe",
        description:
          error instanceof Error ? error.message : "Organisaation luonti epäonnistui",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-2xl p-8 space-y-6 bg-slate-900/90 border-slate-700">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Tervetuloa BizExit-alustalle! 🎉
          </h1>
          <p className="text-slate-400">
            Luodaan organisaatiosi muutamassa vaiheessa
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1
                ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            1
          </div>
          <div className="w-16 h-1 bg-slate-700"></div>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2
                ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            2
          </div>
          <div className="w-16 h-1 bg-slate-700"></div>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 3
                ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            3
          </div>
        </div>

        {/* Role Info */}
        <Alert className="bg-purple-900/20 border-purple-500">
          <Info className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-slate-300">
            <strong>Roolisi: {userRole}</strong>
            <br />
            {userRole === "seller"
              ? "Myyt yrityksiä. Voit luoda listauksia ja hallita kauppoja."
              : "Välität kauppoja. Voit luoda listauksia ja hallita kauppoja."}
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: YTJ Search */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Hae yrityksesi YTJ-rekisteristä *
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Esim: Nokia, Supercell, Rovio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchYTJ();
                      }
                    }}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button
                    type="button"
                    onClick={searchYTJ}
                    disabled={ytjLoading || searchQuery.length < 2}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {ytjLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  💡 Vinkki: Käytä lyhyttä hakusanaa (esim. "Supercell" toimii paremmin kuin "Supercell Oy")
                </p>
              </div>

              {/* YTJ Results */}
              {ytjResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ytjResults.map((company, index) => (
                    <div
                      key={index}
                      onClick={() => selectYTJCompany(company)}
                      className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-purple-500 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {company.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            Y-tunnus: {company.businessId}
                          </div>
                          {company.addresses?.[0] && (
                            <div className="text-sm text-slate-400">
                              {company.addresses[0].city}
                            </div>
                          )}
                          {company.businessLines?.[0] && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs border-slate-600 text-slate-300"
                            >
                              {company.businessLines[0].name}
                            </Badge>
                          )}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Entry Option */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-400">
                    Tai täytä manuaalisesti
                  </span>
                </div>
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <Label className="text-slate-300">Organisaation nimi *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Esim. Yrityskauppa Oy"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {ytjVerified && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    YTJ-vahvistettu
                  </div>
                )}
              </div>

              {/* Business ID */}
              {formData.businessId && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Y-tunnus</Label>
                  <Input
                    value={formData.businessId}
                    onChange={(e) =>
                      setFormData({ ...formData, businessId: e.target.value })
                    }
                    placeholder="1234567-8"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.name}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Jatka
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Industry */}
              <div className="space-y-2">
                <Label className="text-slate-300">Toimiala *</Label>
                <Input
                  required
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Esim. Yrityskauppa, Rahoitus, Konsultointi"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label className="text-slate-300">Maa</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FI">🇫🇮 Suomi</SelectItem>
                    <SelectItem value="SE">🇸🇪 Ruotsi</SelectItem>
                    <SelectItem value="NO">🇳🇴 Norja</SelectItem>
                    <SelectItem value="DK">🇩🇰 Tanska</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label className="text-slate-300">Verkkosivusto</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Address */}
              {formData.address && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Osoite</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Katuosoite, Postinumero Kaupunki"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Takaisin
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Jatka
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Description */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Organisaation kuvaus</Label>
                  <Button
                    type="button"
                    onClick={generateDescription}
                    disabled={aiLoading || !formData.name || !formData.industry}
                    size="sm"
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    AI ehdottaa
                  </Button>
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Kerro lyhyesti organisaatiostasi..."
                  rows={5}
                  className="bg-slate-800 border-slate-700 text-white resize-none"
                />
                <p className="text-xs text-slate-400">
                  AI voi generoida kuvauksen automaattisesti - voit muokata sitä
                  vapaasti
                </p>
              </div>

              {/* Summary */}
              <Alert className="bg-slate-800 border-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-slate-300">
                  <div className="font-medium mb-2">Yhteenveto:</div>
                  <ul className="space-y-1 text-sm">
                    <li>• Nimi: {formData.name}</li>
                    {formData.businessId && (
                      <li>• Y-tunnus: {formData.businessId}</li>
                    )}
                    <li>• Toimiala: {formData.industry}</li>
                    {formData.employees && (
                      <li>• Henkilöstö: ~{formData.employees} henkilöä</li>
                    )}
                    <li>• Maa: {formData.country}</li>
                    {ytjVerified && (
                      <li className="text-green-500">• ✅ YTJ-vahvistettu</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Takaisin
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
