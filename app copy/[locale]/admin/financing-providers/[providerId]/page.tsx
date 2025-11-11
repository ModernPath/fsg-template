'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

// Temporary types, replace with actual type from regenerated supabase types
type Lender = any 
// Type for the data sent in the PUT request
type LenderUpdatePayload = Partial<{
  name: string;
  type: string;
  description: string | null;
  email: string | null;
  primary_email: string | null;
  secondary_email: string | null;
  category: string;
  priority: number;
  is_active: boolean;
  tags: string[];
  processing_time_estimate: string | null;
  contact_person: string | null;
  notes: string | null;
  funding_categories: string[];
  min_funding_amount?: number | null;
  max_funding_amount?: number | null;
  max_term_months?: number | null;
  send_private_data?: boolean;
  partnership_type?: string;
  // lender_identifier?: string | null;
}>

export default function EditLenderPage() { // Renamed component
  const t = useTranslations('Admin.Lenders.Edit') // Updated namespace
  const { session, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const providerId = params.providerId as string // Keep param name consistent with route file

  const [lender, setLender] = useState<Lender | null>(null) // Renamed state
  // Form state matching the schema
  const [name, setName] = useState('')
  const [type, setType] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [secondaryEmail, setSecondaryEmail] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [priority, setPriority] = useState<number>(1)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [tags, setTags] = useState<string>('')
  const [processingTimeEstimate, setProcessingTimeEstimate] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [notes, setNotes] = useState('')
  const [fundingCategories, setFundingCategories] = useState<string[]>([])
  // --- NEW STATE for new fields ---
  const [minFundingAmount, setMinFundingAmount] = useState<string>('');
  const [maxFundingAmount, setMaxFundingAmount] = useState<string>('');
  const [maxTermMonths, setMaxTermMonths] = useState<string>('');
  const [sendPrivateData, setSendPrivateData] = useState<boolean>(false);
  const [partnershipType, setPartnershipType] = useState<string>('verified'); // NEW: verified or marketing
  // --- END NEW STATE ---

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const providerTypes = ['qred', 'capital_box', 'email', 'api', 'hybrid']; // Updated types
  const availableFundingCategories = ['business_loan_unsecured', 'business_loan_secured', 'credit_line', 'factoring_ar', 'leasing'];
  const categoryOptions = ['bank', 'fintech', 'traditional', 'government', 'private', 'general'];

  const { confirm, ConfirmComponent } = useConfirm();

  const fetchLender = useCallback(async () => { // Renamed function
    if (!session?.access_token || !providerId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
        // The API route remains financing-providers/[providerId]
        const response = await fetch(`/api/admin/financing-providers/${providerId}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API Error: ${response.statusText}`);
        }
        const { data } = await response.json();
        setLender(data); // Set lender state
        // Populate form fields based on lender schema
        setName(data.name || '');
        setType(data.type || undefined);
        setDescription(data.description || '');
        setEmail(data.email || '');
        setPrimaryEmail(data.primary_email || '');
        setSecondaryEmail(data.secondary_email || '');
        setCategory(data.category || 'general');
        setPriority(data.priority || 1);
        setIsActive(data.is_active ?? true);
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : '');
        setProcessingTimeEstimate(data.processing_time_estimate || '');
        setContactPerson(data.contact_person || '');
        setNotes(data.notes || '');
        setFundingCategories(data.funding_categories || []);
        // --- POPULATE NEW FIELDS --- 
        setMinFundingAmount(data.min_funding_amount?.toString() || '');
        setMaxFundingAmount(data.max_funding_amount?.toString() || '');
        setMaxTermMonths(data.max_term_months?.toString() || '');
        setSendPrivateData(data.send_private_data || false);
        setPartnershipType(data.partnership_type || 'verified');
        // --- END POPULATE NEW FIELDS ---
        // Removed fields not in schema: website, apiIntegration, contactInfo, active

    } catch (err) {
        console.error('Error fetching lender:', err); // Updated log
        setError(err instanceof Error ? err.message : t('errors.fetchFailed'));
    } finally {
        setLoading(false);
    }
  }, [providerId, session?.access_token, t]);

  useEffect(() => {
    if (!authLoading && session?.user) {
      fetchLender(); // Call renamed function
    } else if (!authLoading && !session?.user) {
      router.replace(`/${locale}/auth/sign-in?next=${encodeURIComponent(`/${locale}/admin/financing-providers/${providerId}`)}`);
    }
     // Use fetchLender
  }, [authLoading, session, fetchLender, router, locale, providerId]);

  const handleFundingCategoryChange = (category: string) => {
    setFundingCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!session?.access_token || !providerId) {
        setError(t('errors.unauthorized'));
        return;
    }
    // Updated validation to include fundingCategories
    if (!name || !type || fundingCategories.length === 0) {
        setError(t('errors.missingFields'));
        return;
    }

    setSaving(true)
    setError(null)

    // Convert string amounts/term to numbers or null
    const minAmount = minFundingAmount ? parseInt(minFundingAmount, 10) : null;
    const maxAmount = maxFundingAmount ? parseInt(maxFundingAmount, 10) : null;
    const maxTerm = maxTermMonths ? parseInt(maxTermMonths, 10) : null;

    // Parse tags from comma-separated string
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Construct payload matching the backend API expected fields for update
    const updateData: LenderUpdatePayload = {
      name,
      type,
      description: description || null,
      email: email || null,
      primary_email: primaryEmail || null,
      secondary_email: secondaryEmail || null,
      category,
      priority,
      is_active: isActive,
      tags: tagsArray,
      processing_time_estimate: processingTimeEstimate || null,
      contact_person: contactPerson || null,
      notes: notes || null,
      funding_categories: fundingCategories,
      min_funding_amount: !isNaN(minAmount!) ? minAmount : null,
      max_funding_amount: !isNaN(maxAmount!) ? maxAmount : null,
      max_term_months: !isNaN(maxTerm!) ? maxTerm : null,
      send_private_data: sendPrivateData,
      partnership_type: partnershipType,
    }

    try {
      // The API route remains financing-providers/[providerId]
      const response = await fetch(`/api/admin/financing-providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      const { data: updatedLender } = await response.json(); // Use lender naming
      console.log("Successfully updated lender:", updatedLender);
      setLender(updatedLender); // Update local state
      setError(null)
      // Optionally show a success message using a state variable

    } catch (err) {
      console.error('Error updating lender:', err) // Updated log
      setError(err instanceof Error ? err.message : t('errors.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!session?.access_token || !providerId) return;

    const shouldDelete = await confirm({
      title: t('confirmDeleteTitle', { default: 'Poista rahoittaja' }),
      message: t('confirmDelete', { default: 'Haluatko varmasti poistaa tämän rahoittajan?' }),
      confirmText: t('delete', { default: 'Poista' }),
      cancelText: t('cancel', { default: 'Peruuta' }),
      variant: 'danger'
    });

    if (!shouldDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
        // The API route remains financing-providers/[providerId]
        const response = await fetch(`/api/admin/financing-providers/${providerId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        // Status 204 check remains the same
        if (!response.ok && response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API Error: ${response.statusText}`);
        }
        
        console.log("Successfully deleted lender."); // Updated log
        router.push(`/${locale}/admin/financing-providers`);

    } catch (err) {
        console.error('Error deleting lender:', err); // Updated log
        setDeleteError(err instanceof Error ? err.message : t('errors.deleteFailed'));
    } finally {
        setDeleting(false);
    }
  };

  // Loading skeleton remains the same - ADD SKELETONS for new fields
  if (authLoading || loading) {
    return (
        <div className="max-w-2xl mx-auto p-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-6"> {/* Adjusted spacing */}
                    <Skeleton className="h-10 w-full" /> {/* Name */}
                    <Skeleton className="h-10 w-full" /> {/* Type */}
                    <Skeleton className="h-24 w-full" /> {/* Funding Categories */}
                    <Skeleton className="h-20 w-full" /> {/* Description */}
                    <Skeleton className="h-10 w-full" /> {/* Email */}
                    {/* --- ADD SKELETONS for new fields --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-10 w-full" /> {/* Min Amount */}
                      <Skeleton className="h-10 w-full" /> {/* Max Amount */}
                      <Skeleton className="h-10 w-full" /> {/* Max Term */}
                    </div>
                    <Skeleton className="h-6 w-1/2" /> {/* Send Private Data Checkbox */}
                    {/* --- END SKELETONS --- */}
                    <Skeleton className="h-10 w-full mt-4" /> {/* Save Button */}
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!session || !isAdmin) {
    return null; // Redirecting
  }

  // Fetch error display remains similar
  if (error && !lender) { 
    return (
       <div className="max-w-2xl mx-auto p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <h5 className="font-bold">{t('errors.fetchTitle')}</h5> {/* Use specific key */}
            <p>{error}</p>
          </Alert>
       </div>
    )
  }

  // Not found message remains similar
  if (!lender) {
    return <div className="max-w-2xl mx-auto p-4 text-center">{t('notFound')}</div>;
  }

  // Form structure updated
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title', { name: lender.name })}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          {error && !saving && ( // Show update error only if not currently saving
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <h5 className="font-bold">{t('errors.updateTitle')}</h5> {/* Specific key */}
              <p>{error}</p>
            </Alert>
          )}
          {deleteError && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <h5 className="font-bold">{t('errors.deleteTitle')}</h5> {/* Specific key */}
                <p>{deleteError}</p>
            </Alert>
          )}

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Perustiedot</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('fields.name.label')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('fields.name.placeholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t('fields.type.label')}</Label>
                <Select onValueChange={setType} value={type} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t('fields.type.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {providerTypes.map((pt) => (
                      <SelectItem key={pt} value={pt}>{t(`types.${pt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('fields.description.label')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('fields.description.placeholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Email Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Sähköpostiosoitteet</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_email">{t('fields.primaryEmail.label')}</Label>
                <Input
                  id="primary_email"
                  type="email"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  placeholder={t('fields.primaryEmail.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_email">{t('fields.secondaryEmail.label')}</Label>
                <Input
                  id="secondary_email"
                  type="email"
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  placeholder={t('fields.secondaryEmail.placeholder')}
                />
              </div>
            </div>

            {/* Legacy Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('fields.email.label')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('fields.email.placeholder')}
              />
            </div>
          </div>

          {/* Categorization Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Luokittelu ja hallinta</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('fields.category.label')}</Label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t('fields.category.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{t(`categories.${cat}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">{t('fields.priority.label')}</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  placeholder={t('fields.priority.placeholder')}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox 
                  id="is_active" 
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                />
                <Label htmlFor="is_active" className="font-normal cursor-pointer">
                  {t('fields.isActive.label')}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">{t('fields.tags.label')}</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t('fields.tags.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processing_time_estimate">{t('fields.processingTimeEstimate.label')}</Label>
                <Input
                  id="processing_time_estimate"
                  value={processingTimeEstimate}
                  onChange={(e) => setProcessingTimeEstimate(e.target.value)}
                  placeholder={t('fields.processingTimeEstimate.placeholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">{t('fields.contactPerson.label')}</Label>
                <Input
                  id="contact_person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder={t('fields.contactPerson.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('fields.notes.label')}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('fields.notes.placeholder')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Funding Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Rahoitusasetukset</h3>
            
            {/* Funding Categories Multi-select Checkboxes */}
            <div className="space-y-2">
              <Label>{t('fields.fundingCategories.label')}</Label>
              <div className="space-y-2 rounded-md border p-4">
                {availableFundingCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`funding-${category}`}
                      checked={fundingCategories.includes(category)}
                      onCheckedChange={() => handleFundingCategoryChange(category)}
                    />
                    <Label htmlFor={`funding-${category}`} className="font-normal cursor-pointer">
                      {t(`fundingCategories.${category}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Partnership Type */}
            <div className="space-y-2">
              <Label>Kumppanisuuden tyyppi</Label>
              <Select value={partnershipType} onValueChange={setPartnershipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Varmennettu kumppani - saa yksityiskohtaiset hakijatiedot</SelectItem>
                  <SelectItem value="marketing">Markkinoinnillinen kumppani - saa vain teaser-viestin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                <strong>Varmennettu:</strong> Saa hakijan yhteystiedot ja yksityiskohtaiset tiedot. 
                <br />
                <strong>Markkinoinnillinen:</strong> Saa vain yleistä tietoa (toimiala, summa, sijainti) ilman yrityksen nimeä tai yhteystietoja.
              </p>
            </div>

            {/* --- NEW FIELDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_funding_amount">{t('fields.minFundingAmount.label')}</Label>
                <Input
                  id="min_funding_amount"
                  type="number"
                  value={minFundingAmount}
                  onChange={(e) => setMinFundingAmount(e.target.value)}
                  placeholder={t('fields.minFundingAmount.placeholder')}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_funding_amount">{t('fields.maxFundingAmount.label')}</Label>
                <Input
                  id="max_funding_amount"
                  type="number"
                  value={maxFundingAmount}
                  onChange={(e) => setMaxFundingAmount(e.target.value)}
                  placeholder={t('fields.maxFundingAmount.placeholder')}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_term_months">{t('fields.maxTermMonths.label')}</Label>
                <Input
                  id="max_term_months"
                  type="number"
                  value={maxTermMonths}
                  onChange={(e) => setMaxTermMonths(e.target.value)}
                  placeholder={t('fields.maxTermMonths.placeholder')}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="send_private_data" 
                checked={sendPrivateData}
                onCheckedChange={(checked) => setSendPrivateData(checked as boolean)}
              />
              <Label htmlFor="send_private_data" className="font-normal cursor-pointer">
                {t('fields.sendPrivateData.label')}
              </Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
             <Button type="submit" disabled={saving || loading} className="w-full sm:w-auto">
               {saving ? <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" /> : null}
               {t('actions.save')}
             </Button>
             <Button 
               variant="destructive" 
               type="button" 
               onClick={handleDelete} 
               disabled={deleting || loading} 
               className="w-full sm:w-auto"
             >
               {deleting ? <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
               {t('actions.delete')}
             </Button>
           </div>
        </form>
      </CardContent>
    </Card>
  )
} 