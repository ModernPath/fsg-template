"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { TagCloud } from 'react-tagcloud';
import { ColorOptions } from 'react-tagcloud';
import { CompanyRow } from '../OnboardingFlow';
import CompanySelector from '@/components/ui/CompanySelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from 'lucide-react';

// Interface for the collected questionnaire data
interface QuestionnaireData {
  purpose_cashManagement: string[];
  purpose_growth: string[];
  purpose_structure: string[];
  purpose_other?: string;
  factoring_monthlyInvoices?: string;
  factoring_paymentDays?: string;
  factoring_customerLocation?: string;
  factoring_largestCustomers?: string;
  factoring_financingPercentage?: string;
  factoring_numberOfInvoices?: string;
  factoring_averageInvoiceAmount?: string;
  consolidation_totalAmount?: string;
  consolidation_mainGoal?: string;
  consolidation_collateral?: string;
  companySituation: string[];
  currentRevenue?: string;
  situationDetails?: string;
  fundingAmount?: string;
  collateralOptions: string[];
  collateralDetails?: string;
}

// Props for the component
interface Step4NeedsAssessmentProps {
  loading: boolean;
  error: string | null;
  goToStep: (step: number) => void;
  onSubmit: (data: QuestionnaireData) => Promise<void>;
  companyId: string | null;
  userCompanies: CompanyRow[];
  handleCompanyChange: (companyId: string) => void;
  isFetchingCompanies: boolean;
}

// Define base structure with keys and counts
const termCounts = {
  growth: 64,
  funding: 55,
  investment: 40,
  workingCapital: 35,
  acquisition: 30,
  expansion: 28,
  productDevelopment: 25,
  recruitment: 22,
  marketing: 20,
  internationalization: 18,
  loan: 15,
  equityInvestment: 12,
  grant: 10,
};

// Options for react-tagcloud (Updated for Dark Theme)
const tagCloudColorOptions: ColorOptions = {
  luminosity: 'light',
  hue: 'yellow',
};

// UPDATED Style classes for Theme-aware design
const textareaClasses = "w-full px-5 py-3 text-lg text-foreground bg-card border border-border rounded-lg focus:ring-primary/20 focus:border-primary focus:bg-card transition-colors placeholder-muted-foreground min-h-[150px]";

// Component
export const Step4NeedsAssessment: React.FC<Step4NeedsAssessmentProps> = ({
  loading,
  error,
  goToStep,
  onSubmit,
  companyId,
  userCompanies,
  handleCompanyChange,
  isFetchingCompanies
}) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>({
    purpose_cashManagement: [],
    purpose_growth: [],
    purpose_structure: [],
    companySituation: [],
    collateralOptions: [],
  });
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  const [formattedRevenue, setFormattedRevenue] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);

  const t = useTranslations('Onboarding');
  const t4 = useTranslations('Onboarding.step4');

  const handleNextStage = () => {
    if (currentStage < 6) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleCheckboxChange = (group: keyof QuestionnaireData, value: string) => {
    setQuestionnaireData(prev => {
      const currentValues = prev[group] as string[] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [group]: newValues };
    });
  };

  const formatAmountWithCurrency = (value: string | number): string => {
    if (!value && value !== 0) return '';
    
    // Strip non-numeric characters, but keep decimal point
    const numericValue = typeof value === 'string' 
      ? value.replace(/[^\d]/g, '')
      : String(value);
    
    if (!numericValue) return '';

    // Format with thousands separators
    const parts = [];
    for (let i = numericValue.length; i > 0; i -= 3) {
      parts.unshift(numericValue.slice(Math.max(0, i - 3), i));
    }
    
    return parts.join(' ');
  };

  const validateAmount = (amount: string): boolean => {
    if (!amount) {
      setAmountError(null); // Optional in this step
      return true;
    }
    
    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      setAmountError(t4('stage4.amountInvalid', { default: 'Please enter a valid amount' }));
      return false;
    }
    
    setAmountError(null);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for the fundingAmount field
    if (name === 'fundingAmount') {
      const numericValue = value.replace(/[^\d]/g, '');
      setFormattedAmount(formatAmountWithCurrency(numericValue));
      validateAmount(numericValue);
      setQuestionnaireData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'currentRevenue') {
      const numericValue = value.replace(/[^\d]/g, '');
      setFormattedRevenue(formatAmountWithCurrency(numericValue));
      setQuestionnaireData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      // Handle all other inputs normally
      setQuestionnaireData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (questionnaireData.fundingAmount) {
      setFormattedAmount(formatAmountWithCurrency(questionnaireData.fundingAmount));
      validateAmount(questionnaireData.fundingAmount);
    }
  }, [questionnaireData.fundingAmount]);

  useEffect(() => {
    if (questionnaireData.currentRevenue) {
      setFormattedRevenue(formatAmountWithCurrency(questionnaireData.currentRevenue));
    }
  }, [questionnaireData.currentRevenue]);

  const handleRadioChange = (name: keyof QuestionnaireData, value: string) => {
    setQuestionnaireData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log("Final Questionnaire Data:", questionnaireData);
    try {
      await onSubmit(questionnaireData);
      console.log("Submission successful, setting analysisSuccess to true");
      setAnalysisSuccess(true);
    } catch (error) {
      console.error("Submission failed:", error);
      // The parent component will handle setting the error state
    }
  };

  // Add a log to see when the button is clicked
  const handleSeeResultsClick = () => {
    console.log("See results button clicked, navigating to step 5");
    
    // Directly update the URL since the parent goToStep has a limitation
    const url = new URL(window.location.href);
    url.searchParams.set('step', '5');
    window.location.href = url.toString(); // Use window.location.href to force a reload
  };

  // Define steps for progress bar
  const steps = [
    { id: 1, name: t('progressSteps.intro') },
    { id: 2, name: t('progressSteps.businessOperations') },
    { id: 3, name: t('progressSteps.companySituation') },
    { id: 4, name: t('progressSteps.financingNeeds') },
    { id: 5, name: t('progressSteps.collateral') },
    { id: 6, name: t('progressSteps.summary') },
  ];

  const MultiStepRegisterForm = () => {
    return (
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4">
          {steps.map((step) => (
            <li key={step.name} className="relative">
              {step.id < steps.length ? (
                <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-dark" aria-hidden="true" />
              ) : null}
              <div className="group relative flex items-start">
                <span className="flex h-9 items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                      currentStage > step.id
                        ? 'border-gold-primary bg-gold-primary text-white' // Completed
                        : currentStage === step.id
                        ? 'border-gold-primary bg-transparent text-gold-primary' // Active
                        : 'border-gray-dark bg-gray-dark/50 text-gray-400' // Pending
                    }`}
                  >
                    {currentStage > step.id ? (
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <span className="font-medium text-sm">{step.id}</span>
                    )}
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span
                    className={`text-sm font-medium ${
                      currentStage === step.id ? 'text-gold-primary' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 1: // Start
        return (
              <div className="text-center space-y-6 bg-card p-8 rounded-lg border border-border">
      <h2 className="text-2xl lg:text-3xl font-bold text-foreground">{t4('stage1.title')}</h2>
      <p className="text-lg text-muted-foreground">{t4('stage1.greeting')}</p>
      <p className="text-muted-foreground">{t4('stage1.confidentiality')}</p>
      <p className="text-muted-foreground">{t4('stage1.purpose')}</p>
            <p className="text-sm text-gray-medium">{t4('stage1.duration')}</p>
            <p className="text-lg font-semibold text-foreground mt-4">{t4('stage1.startPrompt')}</p>
            <Button 
              onClick={handleNextStage} 
              className="onboarding-btn-primary mt-4 px-8 py-3 rounded-lg"
            >
              {t4('stage1.startButton')}
            </Button>
          </div>
        );
      case 2: // Purpose
        return (
                  <div className="space-y-8 bg-card p-8 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">{t4('stage2.title')}</h2>
          <p className="text-muted-foreground mb-6">Valitse yksi tai useampi asia alla olevista vaihtoehdoista:</p>
            
            {/* Rahoitustarve - Combined section */}
                      <fieldset className="space-y-3 border border-border p-4 rounded-md">
            <legend className="text-lg font-medium text-foreground mb-2">Rahoitustarve</legend>
              
              {/* Cash Management options */}
              {['option1', 'option2', 'option3', 'option4'].map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cash_${key}`}
                    checked={questionnaireData.purpose_cashManagement.includes(t4(`stage2.cashManagement.${key}`))}
                    onCheckedChange={() => {
                      handleCheckboxChange('purpose_cashManagement', t4(`stage2.cashManagement.${key}`));
                    }}
                  />
                  <Label htmlFor={`cash_${key}`} className="text-gray-light">{t4(`stage2.cashManagement.${key}`)}</Label>
                </div>
              ))}

              {/* Growth options */}
              {['option1', 'option2', 'option3'].map(key => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`growth_${key}`}
                    checked={questionnaireData.purpose_growth.includes(t4(`stage2.growth.${key}`))}
                      onCheckedChange={() => {
                      handleCheckboxChange('purpose_growth', t4(`stage2.growth.${key}`));
                    }}
                  />
                  <Label htmlFor={`growth_${key}`} className="text-gray-light">{t4(`stage2.growth.${key}`)}</Label>
                </div>
              ))}

              {/* Structure options */}
              {['option1', 'option2'].map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`structure_${key}`}
                    checked={questionnaireData.purpose_structure.includes(t4(`stage2.structure.${key}`))}
                    onCheckedChange={() => {
                      handleCheckboxChange('purpose_structure', t4(`stage2.structure.${key}`));
                    }}
                  />
                  <Label htmlFor={`structure_${key}`} className="text-gray-light">{t4(`stage2.structure.${key}`)}</Label>
                </div>
              ))}
              
              {/* Other purpose text field */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="purpose_other" className="text-gray-light">{t4('stage2.structure.otherLabel')}</Label>
                <Textarea
                  id="purpose_other"
                  name="purpose_other"
                  placeholder={t4('stage2.structure.otherPlaceholder')}
                  onChange={handleInputChange}
                  value={questionnaireData.purpose_other || ''}
                  className="onboarding-textarea w-full px-3 py-2 rounded-lg"
                />
              </div>
            </fieldset>

            {/* Conditional Follow-up Questions */}
            {/* FACTORING QUESTIONS MOVED TO STAGE 4 */}
            
            {questionnaireData.purpose_cashManagement.includes(t4('stage2.cashManagement.option4')) && (
              <div className="mt-6 space-y-4 border-t border-gray-dark pt-6">
                <h3 className="text-lg font-medium onboarding-text-white">{t4('stage2.cashManagement.option4')} - {t('details', { default: 'Details' })}</h3>
                <div>
                  <Label htmlFor="consolidation_totalAmount" className="block mb-2">{t4('stage2.followUp.consolidation.q1Label')}</Label>
                  <Input
                    name="consolidation_totalAmount"
                    placeholder={t4('stage2.followUp.consolidation.q1Placeholder')}
                    onChange={handleInputChange}
                    value={questionnaireData.consolidation_totalAmount || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="consolidation_mainGoal" className="block mb-2">{t4('stage2.followUp.consolidation.q2Label')}</Label>
                  <Input
                    name="consolidation_mainGoal"
                    placeholder={t4('stage2.followUp.consolidation.q2Placeholder')}
                    onChange={handleInputChange}
                    value={questionnaireData.consolidation_mainGoal || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="consolidation_collateral" className="block mb-2">{t4('stage2.followUp.consolidation.q3Label')}</Label>
                  <Textarea
                    name="consolidation_collateral"
                    placeholder={t4('stage2.followUp.consolidation.q3Placeholder')}
                    onChange={handleInputChange}
                    value={questionnaireData.consolidation_collateral || ''}
                  />
                </div>
              </div>
            )}
            {/* Navigation Buttons for Stage 2 */}
            <div className="flex justify-between mt-8">
              <Button type="button" onClick={handlePrevStage} variant="outline">{t4('prevButton')}</Button>
              <Button type="button" onClick={handleNextStage}>{t4('nextButton')}</Button>
            </div>
          </div>
        );
      case 3: // Company Situation
        return (
                  <div className="space-y-8 bg-card p-8 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">{t4('stage3.title')}</h2>
            <p className="text-white mb-6">Valitse tilannettasi parhaiten kuvaavat vaihtoehdot yksi tai useampi:</p>
            <div className="space-y-3">
              {['option1', 'option2', 'option8', 'option3', 'option4', 'option5', 'option6', 'option7'].map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`situation_${key}`}
                    checked={questionnaireData.companySituation.includes(t4(`stage3.${key}`))}
                    onCheckedChange={() => {
                      handleCheckboxChange('companySituation', t4(`stage3.${key}`));
                    }}
                  />
                  <Label 
                    htmlFor={`situation_${key}`} 
                    className="text-white font-medium"
                  >
                    {t4(`stage3.${key}`)}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="mt-6 space-y-4">
              <Label htmlFor="currentRevenue">{t4('stage3.currentRevenueLabel')}</Label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                  <span className="text-lg font-medium onboarding-text-accent">€</span>
                </div>
                <Input 
                  id="currentRevenue" 
                  name="currentRevenue" 
                  type="text"
                  inputMode="numeric"
                  placeholder={t4('stage3.currentRevenuePlaceholder')} 
                  onChange={handleInputChange} 
                  value={formattedRevenue}
                  className="onboarding-input w-full px-5 py-3 text-lg pl-10"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Label htmlFor="situationDetails">{t4('stage3.additionalInfoLabel')}</Label>
            <Textarea 
                id="situationDetails" 
              name="situationDetails" 
                placeholder={t4('stage3.additionalInfoPlaceholder')} 
              onChange={handleInputChange} 
              value={questionnaireData.situationDetails || ''} 
            />
            </div>
            {/* Navigation Buttons for Stage 3 */}
            <div className="flex justify-between mt-8">
              <Button type="button" onClick={handlePrevStage} variant="outline">{t4('prevButton')}</Button>
              <Button type="button" onClick={handleNextStage}>{t4('nextButton')}</Button>
            </div>
          </div>
        );
      case 4: // Funding Amount
        return (
                  <div className="space-y-8 bg-card p-8 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">{t4('stage4.title')}</h2>
            <p className="text-gray-light mb-6">Syötä tarvitsemasi rahoituksen kokonaistarve (€):</p>
            <div>
              <Label htmlFor="fundingAmount" className="block text-lg font-medium text-foreground mb-3">
                Rahoituksen kokonaismäärä:
              </Label>
              <div className="relative rounded-lg shadow-lg mt-2">
                {/* Euro Symbol Prefix */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                  <span className="text-2xl font-medium text-foreground">€</span>
                </div>
                
                <Input 
                  id="fundingAmount" 
                  name="fundingAmount" 
                  type="text"
                  inputMode="numeric"
                  placeholder={t4('stage4.amountPlaceholder')} 
                  onChange={handleInputChange} 
                  value={formattedAmount} 
                  className={`w-full px-5 py-6 text-2xl text-foreground bg-card border-2 border-primary/50 rounded-lg focus:ring-4 focus:ring-primary/20 focus:border-primary focus:bg-card transition-all placeholder-muted-foreground font-medium shadow-lg shadow-primary/10 hover:shadow-primary/20 pl-10 ${amountError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
              </div>
              
              {/* Validation message or helper text */}
              {amountError ? (
                <p className="mt-2 text-sm text-red-400">{amountError}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-medium">
                  {t4('stage4.amountHelp', { default: 'Enter your estimated funding requirement' })}
                </p>
              )}
        
            </div>

            {/* FACTORING QUESTIONS REMOVED - NOW HANDLED IN STEP 7 APPLICATION */}

            {/* Navigation Buttons for Stage 4 */}
            <div className="flex justify-between mt-8">
              <Button type="button" onClick={handlePrevStage} variant="outline">{t4('prevButton')}</Button>
              <Button type="button" onClick={handleNextStage}>{t4('nextButton')}</Button>
            </div>
          </div>
        );
      case 5: // Collateral
        return (
                  <div className="space-y-8 bg-card p-8 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">{t4('stage5.title')}</h2>
            <p className="text-gray-light mb-6">{t4('stage5.instruction')}</p>
            
            <fieldset className="space-y-3">
              <legend className="text-lg font-medium text-foreground mb-2">{t4('stage5.optionsLabel')}</legend>
              {['option1', 'option2', 'option3', 'option4'].map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`collateral_${key}`}
                    checked={(questionnaireData.collateralOptions || []).includes(t4(`stage5.${key}`))}
                    onCheckedChange={() => {
                      handleCheckboxChange('collateralOptions', t4(`stage5.${key}`));
                    }}
                  />
                  <Label htmlFor={`collateral_${key}`} className="text-gray-light">{t4(`stage5.${key}`)}</Label>
                </div>
              ))}
            </fieldset>

            <div className="mt-6 space-y-4">
              <Label htmlFor="collateralDetails">{t4('stage5.detailsLabel')}</Label>
              <Textarea 
                id="collateralDetails" 
                name="collateralDetails" 
                placeholder={t4('stage5.detailsPlaceholder')} 
                onChange={handleInputChange} 
                value={questionnaireData.collateralDetails || ''} 
              />
            </div>
            {/* Navigation Buttons for Stage 5 */}
            <div className="flex justify-between mt-8">
              <Button type="button" onClick={handlePrevStage} variant="outline">{t4('prevButton')}</Button>
              <Button type="button" onClick={handleNextStage}>{t4('nextButton')}</Button>
            </div>
          </div>
        );
      case 6: // Submit
        return (
          <form onSubmit={handleFinalSubmit} className="space-y-8 bg-card p-8 rounded-lg border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">{t4('stage6.title')}</h2>
            <p className="text-gray-light mb-6">{t4('stage6.instruction')}</p>
            
            {/* Display loading or success state */}
            {loading && (
              <div className="flex items-center justify-center p-4 bg-gray-dark rounded-md">
                <Spinner className="h-6 w-6 text-white mr-2" />
                <span className="text-gray-light">{t4('submitting', { default: 'Submitting...' })}</span>
              </div>
            )}

            {analysisSuccess ? (
              <div className="text-center space-y-4 p-6 bg-green-900/30 border border-green-500/50 rounded-lg">
                <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto" />
                <h3 className="text-xl font-semibold text-green-300">{t4('stage6.successTitle', { default: 'Information Submitted' })}</h3>
                <p className="text-green-200">{t4('stage6.successDescription', { default: 'Your funding needs information has been saved.' })}</p>
                <Button onClick={() => goToStep(5)} className="mt-4">
                  {t4('stage6.continueButton', { default: 'Continue to Document Upload' })}
                </Button>
              </div>
            ) : (
              <div className="flex justify-between mt-8">
                <Button type="button" onClick={handlePrevStage} variant="outline" disabled={loading}>{t4('prevButton')}</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="h-4 w-4 mr-2"/> : null}
                  {t4('stage6.submitButton')}
                </Button>
              </div>
            )}

          </form>
        );
      default:
        return <div>Invalid stage</div>;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
      {/* Company Selector */}
      {userCompanies.length > 1 && (
        <div className="mb-8">
          <CompanySelector
            companies={userCompanies}
            selectedCompanyId={companyId}
            onCompanyChange={handleCompanyChange}
            isLoading={isFetchingCompanies}
          />
        </div>
      )}
      
      {/* Mobiiliversio kelluvasta navigaatiosta - näytetään vain pienillä näytöillä */}
      <div className="sm:hidden fixed top-[60px] left-0 right-0 z-10 bg-background/90 backdrop-blur-sm py-3 px-4 border-b border-primary/30 shadow-lg">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const isCompleted = currentStage > index + 1;
            const isCurrent = currentStage === index + 1;
            
            return (
              <div 
                key={step.id} 
                className={
                  isCompleted ? 'step-number-amber' :
                  isCurrent ? 'step-number-amber-inactive' :
                  'step-number-amber-pending'
                  + ' relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer hover:opacity-80'
                }
                onClick={() => setCurrentStage(index + 1)}
                role="button"
                aria-label={`Go to stage ${index + 1}: ${step.name}`}
                tabIndex={0}
              >
                {isCompleted ? (
                  <CheckIcon className="w-4 h-4 text-black" />
                ) : (
                  <span className="text-xs font-semibold">{step.id}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main flex container for progress bar and content */}
      <div className="flex flex-row">
        {/* Left side: Vertical progress bar - KELLUVAKSI MUUTETTU */}
        <div className="hidden sm:block w-[220px] sticky top-[80px] self-start h-auto">
          {/* Steps */}
          <div className="space-y-12 relative">
            {/* Vertical line - positioned to run through the middle of the circles */}
            <div className="absolute left-[185px] top-0 bottom-0 w-0.5 bg-border z-[-1]" aria-hidden="true"></div>
            
            {steps.map((step, index) => {
              const isCompleted = currentStage > index + 1;
              const isCurrent = currentStage === index + 1;
              
              return (
                <div key={step.id} className="flex items-center justify-end pr-[20px]">
                  {/* Step name */}
                  <div className="pr-3 text-right">
                    <span 
                      className={`text-sm leading-tight inline-block cursor-pointer hover:opacity-80 ${isCurrent ? 'font-medium text-white' : 'text-muted-foreground'}`}
                      onClick={() => setCurrentStage(index + 1)}
                      role="button"
                      aria-label={`Go to stage ${index + 1}: ${step.name}`}
                      tabIndex={0}
                    >
                      {step.name}
                    </span>
                  </div>
                  
                  {/* Step circle - positioned so the vertical line runs through its center */}
                  <div 
                    className={
                      isCompleted ? 'step-number-amber' :
                      isCurrent ? 'step-number-amber-inactive' :
                      'step-number-amber-pending'
                      + ' relative z-10 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer hover:opacity-80'
                    }
                    onClick={() => setCurrentStage(index + 1)}
                    role="button"
                    aria-label={`Go to stage ${index + 1}: ${step.name}`}
                    tabIndex={0}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-6 h-6 text-black" />
                    ) : (
                      <span className="text-lg font-semibold">{step.id}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Right side: Content - Lisää margin-top mobiiliversiossa */}
        <div className="flex-1 text-foreground sm:mt-0 mt-12">
          {renderStageContent()}

          {/* Error Display */}
          {error && (
            <div className="mt-6 text-red-400 text-sm p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              {error}
            </div>
          )}

          {/* Step Navigation (Back to Step 2) */}
          <div className="mt-10 flex justify-start">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goToStep(2)}
              disabled={loading}
              className="text-muted-foreground hover:text-white"
            >
              {t('back', { default: 'Back' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4NeedsAssessment; 
