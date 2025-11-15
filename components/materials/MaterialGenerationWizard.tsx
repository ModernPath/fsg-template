"use client";

/**
 * Material Generation Wizard
 * 
 * Multi-step wizard for generating business materials (teasers, IM, pitch decks)
 * Guides users through:
 * 1. Selection (what to generate)
 * 2. Public data collection (automatic)
 * 3. Document upload (financial docs)
 * 4. AI questionnaire
 * 5. Generation & review
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2, Clock, AlertCircle, FileText, Loader2, Sparkles, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MaterialTemplateSelector } from "./MaterialTemplateSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GammaConfigurationPanel } from "./GammaConfigurationPanel";
import { EnrichmentConfigurationPanel } from "./EnrichmentConfigurationPanel";

interface MaterialGenerationWizardProps {
  companyId: string;
  companyName: string;
  onComplete?: () => void;
}

interface Job {
  id: string;
  status: string;
  progress: number;
  current_step: string;
  company: {
    id: string;
    name: string;
    industry: string;
  };
  generating: {
    teaser: boolean;
    im: boolean;
    pitch_deck: boolean;
  };
  phases: {
    public_data_collected: boolean;
    documents_uploaded: boolean;
    questionnaire_completed: boolean;
    data_consolidated: boolean;
  };
  data_collection: {
    cached_data_sources: number;
    questionnaire: {
      total_questions: number;
      answered_questions: number;
      completion_percentage: number;
    };
  };
  generated_assets: any;
  timing: {
    created_at: string;
    estimated_minutes_remaining: number;
  };
  available_actions: string[];
}

export function MaterialGenerationWizard({ 
  companyId, 
  companyName, 
  onComplete 
}: MaterialGenerationWizardProps) {
  const [step, setStep] = useState<"select" | "progress" | "upload" | "questionnaire" | "complete">("select");
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Selection state
  const [generateTeaser, setGenerateTeaser] = useState(true);
  const [generateIM, setGenerateIM] = useState(false);
  const [generatePitchDeck, setGeneratePitchDeck] = useState(false);

  // Configuration state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("professional-teaser");
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Questionnaire state
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Poll job status
  useEffect(() => {
    if (jobId && step === "progress") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/bizexit/materials/generate/${jobId}/status`);
          if (response.ok) {
            const data = await response.json();
            setJob(data.job);

            // Update UI based on job status
            if (data.job.status === "awaiting_uploads") {
              setStep("upload");
            } else if (data.job.status === "questionnaire_pending" || data.job.status === "questionnaire_in_progress") {
              setStep("questionnaire");
              // Fetch questions
              fetchQuestionnaire(jobId);
            } else if (data.job.status === "completed") {
              setStep("complete");
              clearInterval(interval);
            } else if (data.job.status === "failed" || data.job.status === "cancelled") {
              clearInterval(interval);
              toast({
                title: "Generation failed",
                description: data.job.error?.message || "An error occurred",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Error polling job status:", error);
        }
      }, 3000); // Poll every 3 seconds

      setPollInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [jobId, step]);

  const fetchQuestionnaire = async (id: string) => {
    try {
      const response = await fetch(`/api/bizexit/materials/generate/${id}/questionnaire`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      toast({
        title: "Error",
        description: "Failed to load questionnaire",
        variant: "destructive",
      });
    }
  };

  const handleStartGeneration = async () => {
    if (!generateTeaser && !generateIM && !generatePitchDeck) {
      toast({
        title: "Selection required",
        description: "Please select at least one material type to generate",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/bizexit/materials/generate/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          generate_teaser: generateTeaser,
          generate_im: generateIM,
          generate_pitch_deck: generatePitchDeck,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start generation");
      }

      setJobId(data.job.id);
      setJob(data.job);
      setStep("progress");

      toast({
        title: "Generation started",
        description: data.message,
      });
    } catch (error: any) {
      console.error("Error starting generation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start generation",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelGeneration = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/bizexit/materials/generate/${jobId}/cancel`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Generation cancelled",
          description: "The materials generation job has been cancelled",
        });
        setStep("select");
        setJobId(null);
        setJob(null);
        if (pollInterval) clearInterval(pollInterval);
      }
    } catch (error) {
      console.error("Error cancelling generation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel generation",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleFileUpload = async () => {
    if (!jobId || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/bizexit/materials/generate/${jobId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload documents");
      }

      toast({
        title: "Documents uploaded",
        description: `${data.uploaded} document(s) uploaded successfully`,
      });

      // Clear selected files
      setSelectedFiles([]);
      
      // Return to progress view
      setStep("progress");
    } catch (error: any) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitQuestionnaire = async () => {
    // Validate required questions
    const unanswered = questions.filter(q => q.is_required && !answers[q.id]);
    if (unanswered.length > 0) {
      toast({
        title: "Required questions",
        description: `Please answer all required questions (${unanswered.length} remaining)`,
        variant: "destructive",
      });
      return;
    }

    if (!jobId) return;

    try {
      const response = await fetch(`/api/bizexit/materials/generate/${jobId}/questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit questionnaire");
      }

      toast({
        title: "Questionnaire submitted",
        description: data.completed 
          ? "AI is now consolidating your data and generating materials..."
          : "Answers saved. You can continue later.",
      });

      if (data.completed) {
        setStep("progress");
      }
    } catch (error: any) {
      console.error("Error submitting questionnaire:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit questionnaire",
        variant: "destructive",
      });
    }
  };

  // Render different steps
  if (step === "select") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Generate Business Materials
          </CardTitle>
          <CardDescription>
            Automatically create professional materials for {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">What would you like to generate?</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="teaser"
                  checked={generateTeaser}
                  onCheckedChange={(checked) => setGenerateTeaser(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="teaser" className="text-base font-medium cursor-pointer">
                    Teaser (1-2 pages)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    A brief, compelling overview to spark initial interest. Perfect for first contact with potential buyers.
                  </p>
                  <Badge variant="outline" className="mt-2">~15 minutes</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="im"
                  checked={generateIM}
                  onCheckedChange={(checked) => setGenerateIM(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="im" className="text-base font-medium cursor-pointer">
                    Information Memorandum (15-30 pages)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive document with detailed financials, operations, and market analysis. Requires financial document uploads.
                  </p>
                  <Badge variant="outline" className="mt-2">~4 hours</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="pitch-deck"
                  checked={generatePitchDeck}
                  onCheckedChange={(checked) => setGeneratePitchDeck(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="pitch-deck" className="text-base font-medium cursor-pointer">
                    Pitch Deck (10-15 slides)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visual presentation for investor meetings. Includes key metrics, growth story, and investment opportunity.
                  </p>
                  <Badge variant="outline" className="mt-2">~2 hours</Badge>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>What happens next?</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>We'll collect public information about your company</li>
                {(generateIM || generatePitchDeck) && (
                  <li>You'll be asked to upload financial documents (P&L, balance sheet)</li>
                )}
                <li>Our AI will ask targeted questions about your business</li>
                <li>Materials will be automatically generated and made available for review</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Template Selection */}
          {generateTeaser && (
            <div className="pt-4 border-t">
              <MaterialTemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
                materialType="teaser"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            
            {/* Configuration Dialog */}
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generation Settings</DialogTitle>
                  <DialogDescription>
                    Configure presentation design and data modules
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="gamma" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gamma">Presentation Design</TabsTrigger>
                    <TabsTrigger value="enrichment">Data Modules</TabsTrigger>
                  </TabsList>
                  <TabsContent value="gamma" className="space-y-4">
                    <GammaConfigurationPanel
                      companyId={companyId}
                      onSave={() => {
                        toast({
                          title: "Settings saved",
                          description: "Presentation design updated",
                        });
                        setShowConfigDialog(false);
                      }}
                      onCancel={() => setShowConfigDialog(false)}
                    />
                  </TabsContent>
                  <TabsContent value="enrichment" className="space-y-4">
                    <EnrichmentConfigurationPanel
                      companyId={companyId}
                      onSave={() => {
                        toast({
                          title: "Settings saved",
                          description: "Data modules updated",
                        });
                        setShowConfigDialog(false);
                      }}
                      onCancel={() => setShowConfigDialog(false)}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <Button 
            onClick={handleStartGeneration} 
            disabled={generating || (!generateTeaser && !generateIM && !generatePitchDeck)}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Generation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "progress" && job) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generating Materials</CardTitle>
          <CardDescription>
            {job.current_step}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              {job.phases.public_data_collected ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />
              )}
              <div>
                <p className="font-medium">Public Data Collection</p>
                <p className="text-sm text-muted-foreground">
                  {job.phases.public_data_collected 
                    ? `Collected data from ${job.data_collection.cached_data_sources} sources`
                    : "Gathering public information about your company..."
                  }
                </p>
              </div>
            </div>

            {(job.generating.im || job.generating.pitch_deck) && (
              <div className="flex items-start gap-3">
                {job.phases.documents_uploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                ) : job.status === "awaiting_uploads" ? (
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">Financial Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {job.phases.documents_uploaded 
                      ? "Documents uploaded and processed"
                      : "Waiting for document uploads..."
                    }
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              {job.phases.questionnaire_completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : job.status === "questionnaire_pending" ? (
                <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
              )}
              <div>
                <p className="font-medium">AI Questionnaire</p>
                <p className="text-sm text-muted-foreground">
                  {job.phases.questionnaire_completed
                    ? "All questions answered"
                    : job.data_collection.questionnaire.total_questions > 0
                    ? `${job.data_collection.questionnaire.answered_questions}/${job.data_collection.questionnaire.total_questions} questions answered`
                    : "Questionnaire will be generated soon..."
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {job.phases.data_consolidated ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Data Consolidation & Generation</p>
                <p className="text-sm text-muted-foreground">
                  {job.phases.data_consolidated 
                    ? "Data consolidated, materials being generated..."
                    : "Pending previous steps..."
                  }
                </p>
              </div>
            </div>
          </div>

          {job.timing.estimated_minutes_remaining > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Estimated time remaining</AlertTitle>
              <AlertDescription>
                Approximately {job.timing.estimated_minutes_remaining} minutes
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleCancelGeneration}>
            Cancel Generation
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "upload") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Financial Documents
          </CardTitle>
          <CardDescription>
            Upload your company's financial documents for comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Required Documents</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Profit & Loss Statement (last 3 years)</li>
                <li>Balance Sheet (latest)</li>
                <li>Cash Flow Statement (optional but recommended)</li>
              </ul>
              <p className="mt-2 text-xs">
                Accepted formats: PDF, Excel, CSV, Images (JPEG/PNG)
              </p>
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-muted-foreground mb-4">
              Select files to upload
            </p>
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected files:</p>
              <ul className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("progress")}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleFileUpload} 
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "questionnaire") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            AI-Generated Questionnaire
          </CardTitle>
          <CardDescription>
            Help our AI understand your business better by answering these targeted questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id} className="text-base">
                {index + 1}. {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={question.id}
                value={answers[question.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder="Your answer..."
                rows={4}
                className="w-full"
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("progress")}>
            Back
          </Button>
          <Button onClick={handleSubmitQuestionnaire}>
            Submit Questionnaire
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "complete" && job) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Materials Generated Successfully!
          </CardTitle>
          <CardDescription>
            Your business materials are ready for review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">All done!</AlertTitle>
            <AlertDescription className="text-green-800">
              Your materials have been generated and are available below.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {job.generated_assets?.teaser && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Teaser</p>
                    <p className="text-sm text-muted-foreground">
                      {job.generated_assets.teaser.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.generated_assets.teaser.gamma_presentation_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={job.generated_assets.teaser.gamma_presentation_url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  )}
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {job.generated_assets?.im && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Information Memorandum</p>
                    <p className="text-sm text-muted-foreground">
                      {job.generated_assets.im.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.generated_assets.im.gamma_presentation_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={job.generated_assets.im.gamma_presentation_url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  )}
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {job.generated_assets?.pitch_deck && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Pitch Deck</p>
                    <p className="text-sm text-muted-foreground">
                      {job.generated_assets.pitch_deck.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.generated_assets.pitch_deck.gamma_presentation_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={job.generated_assets.pitch_deck.gamma_presentation_url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  )}
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => {
            if (onComplete) onComplete();
            else window.location.href = "/dashboard/materials";
          }}>
            View All Materials
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}

