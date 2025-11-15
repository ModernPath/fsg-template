'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface NDACreationFormProps {
  companyId?: string;
  buyerId?: string;
  onSuccess?: (nda: any) => void;
  onCancel?: () => void;
}

export function NDACreationForm({
  companyId,
  buyerId,
  onSuccess,
  onCancel,
}: NDACreationFormProps) {
  const t = useTranslations('ndas');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_id: companyId || '',
    buyer_id: buyerId || '',
    recipient_name: '',
    recipient_email: '',
    recipient_company: '',
    recipient_address: '',
    purpose: 'M&A Due Diligence and Business Evaluation',
    term_years: '3',
    effective_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ndas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          term_years: parseInt(formData.term_years),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create NDA');
      }

      const { nda } = await response.json();

      if (onSuccess) {
        onSuccess(nda);
      } else {
        router.push(`/dashboard/ndas/${nda.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('createNDA')}</CardTitle>
        <CardDescription>{t('createNDADescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('recipientInformation')}</h3>

            <div className="space-y-2">
              <Label htmlFor="recipient_name">
                {t('recipientName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => handleChange('recipient_name', e.target.value)}
                placeholder={t('recipientNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_email">
                {t('recipientEmail')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipient_email"
                type="email"
                value={formData.recipient_email}
                onChange={(e) => handleChange('recipient_email', e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_company">{t('recipientCompany')}</Label>
              <Input
                id="recipient_company"
                value={formData.recipient_company}
                onChange={(e) => handleChange('recipient_company', e.target.value)}
                placeholder={t('recipientCompanyPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_address">{t('recipientAddress')}</Label>
              <Textarea
                id="recipient_address"
                value={formData.recipient_address}
                onChange={(e) => handleChange('recipient_address', e.target.value)}
                placeholder={t('recipientAddressPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('ndaDetails')}</h3>

            <div className="space-y-2">
              <Label htmlFor="purpose">
                {t('purpose')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder={t('purposePlaceholder')}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term_years">{t('termYears')}</Label>
                <Select
                  value={formData.term_years}
                  onValueChange={(value) => handleChange('term_years', value)}
                >
                  <SelectTrigger id="term_years">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('oneYear')}</SelectItem>
                    <SelectItem value="2">{t('twoYears')}</SelectItem>
                    <SelectItem value="3">{t('threeYears')}</SelectItem>
                    <SelectItem value="5">{t('fiveYears')}</SelectItem>
                    <SelectItem value="10">{t('tenYears')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_date">{t('effectiveDate')}</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => handleChange('effective_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('createNDA')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

