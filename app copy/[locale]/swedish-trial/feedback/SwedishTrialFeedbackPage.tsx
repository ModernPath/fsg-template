'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft,
  CheckCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Heart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SwedishTrialFeedbackPageProps {
  locale: string;
}

export default function SwedishTrialFeedbackPage({ locale }: SwedishTrialFeedbackPageProps) {
  const t = useTranslations('SwedishTrialFeedback');
  const router = useRouter();

  // Force dark mode for this page
  React.useEffect(() => {
    const forceDarkMode = () => {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    };

    forceDarkMode();
    
    return () => {
      // Remove forced dark mode classes when leaving the page
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    };
  }, []);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    experience: '',
    rating: '',
    mostUseful: '',
    improvements: '',
    missingFeatures: '',
    wouldRecommend: '',
    additionalComments: '',
    contactForInterview: false,
    emailUpdates: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would normally send to your API
      // For now, we'll simulate a submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Swedish Trial Feedback Submitted:', formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <Card className="bg-gray-800/50 border-gold-primary/30 p-8 max-w-2xl w-full text-center">
          <div className="w-16 h-16 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-gold-primary" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            {t('success.title', { default: 'Tack för din feedback!' })}
          </h1>
          
          <p className="text-gray-300 mb-8 leading-relaxed">
            {t('success.description', { 
              default: 'Din feedback är ovärderlig för att utveckla TrustyFinance för svenska företag. Vi kommer att kontakta dig när vi lanserar officiellt.' 
            })}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push(`/${locale}/swedish-trial`)}
              className="bg-gold-primary hover:bg-gold-highlight text-black font-medium"
            >
              {t('success.backToTrial', { default: 'Tillbaka till beta' })}
            </Button>
            
            <Button
              onClick={() => router.push(`/${locale}/onboarding`)}
              variant="outline"
              className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10"
            >
              {t('success.tryPlatform', { default: 'Testa plattformen' })}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Force dark mode for swedish trial feedback page */
        body {
          --background: 0 0% 3.9% !important;
          --foreground: 0 0% 98% !important;
          --card: 0 0% 3.9% !important;
          --card-foreground: 0 0% 98% !important;
          --primary: 45 65% 75% !important;
          --primary-foreground: 0 0% 0% !important;
          background-color: hsl(0 0% 3.9%) !important;
          color: hsl(0 0% 98%) !important;
          color-scheme: dark !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            href={`/${locale}/swedish-trial`}
            className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-highlight mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('navigation.back', { default: 'Tillbaka till beta' })}
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('title', { default: 'Hjälp oss förbättra TrustyFinance' })}
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('subtitle', { 
              default: 'Din feedback är avgörande för att skapa den bästa finansieringsplattformen för svenska företag.' 
            })}
          </p>
        </div>

        {/* Feedback Form */}
        <Card className="bg-gray-800/50 border-gold-primary/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-gold-primary" />
                {t('sections.contact.title', { default: 'Kontaktinformation' })}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">
                    {t('fields.name', { default: 'Namn' })}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder={t('placeholders.name', { default: 'Ditt namn' })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    {t('fields.email', { default: 'E-post' })}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder={t('placeholders.email', { default: 'din@email.se' })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="company" className="text-gray-300">
                    {t('fields.company', { default: 'Företag' })}
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder={t('placeholders.company', { default: 'Ditt företagsnamn' })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-gray-300">
                    {t('fields.role', { default: 'Roll' })}
                  </Label>
                  <Input
                    id="role"
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder={t('placeholders.role', { default: 'VD, CFO, etc.' })}
                  />
                </div>
              </div>
            </div>

            {/* Experience Feedback */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-gold-primary" />
                {t('sections.experience.title', { default: 'Din upplevelse' })}
              </h2>
              
              {/* Overall Rating */}
              <div>
                <Label className="text-gray-300 mb-3 block">
                  {t('fields.rating', { default: 'Hur skulle du betygsätta din övergripande upplevelse?' })}
                </Label>
                <RadioGroup 
                  value={formData.rating} 
                  onValueChange={(value) => handleInputChange('rating', value)}
                  className="flex flex-wrap gap-4"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                      <Label htmlFor={`rating-${rating}`} className="text-gray-300 flex items-center gap-1">
                        {rating} <Star className="w-4 h-4 text-gold-primary" />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Most Useful Feature */}
              <div>
                <Label htmlFor="mostUseful" className="text-gray-300">
                  {t('fields.mostUseful', { default: 'Vad var mest användbart?' })}
                </Label>
                <Textarea
                  id="mostUseful"
                  value={formData.mostUseful}
                  onChange={(e) => handleInputChange('mostUseful', e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
                  placeholder={t('placeholders.mostUseful', { 
                    default: 'Beskriv vilken funktion eller aspekt som var mest värdefull för dig...' 
                  })}
                />
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <ThumbsUp className="w-6 h-6 text-gold-primary" />
                {t('sections.improvements.title', { default: 'Förbättringsförslag' })}
              </h2>
              
              <div>
                <Label htmlFor="improvements" className="text-gray-300">
                  {t('fields.improvements', { default: 'Vad skulle kunna förbättras?' })}
                </Label>
                <Textarea
                  id="improvements"
                  value={formData.improvements}
                  onChange={(e) => handleInputChange('improvements', e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
                  placeholder={t('placeholders.improvements', { 
                    default: 'Dela dina förslag för hur vi kan förbättra plattformen...' 
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="missingFeatures" className="text-gray-300">
                  {t('fields.missingFeatures', { default: 'Saknade funktioner?' })}
                </Label>
                <Textarea
                  id="missingFeatures"
                  value={formData.missingFeatures}
                  onChange={(e) => handleInputChange('missingFeatures', e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
                  placeholder={t('placeholders.missingFeatures', { 
                    default: 'Vilka funktioner eller tjänster skulle du vilja se?' 
                  })}
                />
              </div>
            </div>

            {/* Recommendation */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-gold-primary" />
                {t('sections.recommendation.title', { default: 'Rekommendation' })}
              </h2>
              
              <div>
                <Label className="text-gray-300 mb-3 block">
                  {t('fields.wouldRecommend', { default: 'Skulle du rekommendera TrustyFinance till andra företag?' })}
                </Label>
                <RadioGroup 
                  value={formData.wouldRecommend} 
                  onValueChange={(value) => handleInputChange('wouldRecommend', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="recommend-yes" />
                    <Label htmlFor="recommend-yes" className="text-gray-300 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      {t('options.yes', { default: 'Ja' })}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="recommend-no" />
                    <Label htmlFor="recommend-no" className="text-gray-300 flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      {t('options.no', { default: 'Nej' })}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="recommend-maybe" />
                    <Label htmlFor="recommend-maybe" className="text-gray-300">
                      {t('options.maybe', { default: 'Kanske' })}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Additional Comments */}
            <div>
              <Label htmlFor="additionalComments" className="text-gray-300">
                {t('fields.additionalComments', { default: 'Ytterligare kommentarer' })}
              </Label>
              <Textarea
                id="additionalComments"
                value={formData.additionalComments}
                onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                placeholder={t('placeholders.additionalComments', { 
                  default: 'Finns det något annat du vill dela med oss?' 
                })}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contactForInterview"
                  checked={formData.contactForInterview}
                  onCheckedChange={(checked) => handleInputChange('contactForInterview', checked)}
                />
                <Label htmlFor="contactForInterview" className="text-gray-300">
                  {t('fields.contactForInterview', { 
                    default: 'Jag är intresserad av en djupare intervju om min upplevelse (30 min, belöning ingår)' 
                  })}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailUpdates"
                  checked={formData.emailUpdates}
                  onCheckedChange={(checked) => handleInputChange('emailUpdates', checked)}
                />
                <Label htmlFor="emailUpdates" className="text-gray-300">
                  {t('fields.emailUpdates', { 
                    default: 'Jag vill få uppdateringar om TrustyFinance lansering i Sverige' 
                  })}
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gold-primary hover:bg-gold-highlight text-black font-semibold py-3 px-8 text-lg rounded-xl shadow-lg transition-all duration-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    {t('buttons.submitting', { default: 'Skickar...' })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    {t('buttons.submit', { default: 'Skicka feedback' })}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
      </div>
    </>
  );
}
