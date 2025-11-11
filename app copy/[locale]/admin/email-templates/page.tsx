'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ConfirmDialog 
} from '@/components/ui/ConfirmDialog'
import { 
  Mail, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { EmailTemplate, EmailTemplateType } from '@/types/email'
import { formatDistanceToNow } from 'date-fns'
import { fi } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

export default function EmailTemplatesPage() {
  const t = useTranslations('Admin')
  const params = useParams()
  const locale = params.locale as string
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<EmailTemplateType | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [typeFilter, activeFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      if (activeFilter !== 'all') {
        params.append('active', activeFilter === 'active' ? 'true' : 'false')
      }
      
      // Set a higher limit to show all templates
      params.append('limit', '50')

      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session found')
      }

      console.log('🔄 Loading templates with params:', params.toString())
      const response = await fetch(`/api/admin/email-templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('📡 Response body:', responseText)
      
      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.status} ${responseText}`)
      }
      
      const data = JSON.parse(responseText)
      console.log('✅ Parsed data:', data)
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('❌ Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete) return
    
    try {
      setDeleting(true)
      
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session found')
      }
      
      const response = await fetch(`/api/admin/email-templates/${templateToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }
      
      await loadTemplates()
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Virhe poistossa: ' + (error as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      detailed: 'Yksityiskohtainen',
      marketing: 'Markkinointi',
      welcome: 'Yleinen tervetuloa',
      customer_welcome: 'Asiakkaan tervetuloa',
      partner_welcome: 'Kumppanin tervetuloa',
      document_upload: 'Dokumentit',
      funding_options: 'Rahoitusvaihtoehdot',
      progress_update: 'Prosessin päivitys',
      notification: 'Järjestelmäilmoitus',
      booking: 'Tapaamisen vahvistus',
      custom: 'Mukautettu'
    }
    return labels[type] || type
  }

  const getTypeBadgeVariant = (type: EmailTemplateType) => {
    switch (type) {
      case 'detailed': return 'default'
      case 'marketing': return 'secondary'
      case 'custom': return 'default'
      case 'booking': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Sähköpostimallit
          </h1>
          <p className="text-muted-foreground">
            Hallinnoi automaattisesti rahoittajille lähetettäviä sähköpostimalleja
          </p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Automaattinen järjestelmä:</strong> Sähköpostit lähetetään automaattisesti valituille rahoituskumppaneille hakemusprosessin aikana. Manuaalista lähetystä ei ole.
            </p>
          </div>
        </div>
        <Link href={`/${locale}/admin/email-templates/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Uusi malli
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hae malleja nimellä tai aiheella..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value: EmailTemplateType | 'all') => setTypeFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Kaikki tyypit</SelectItem>
                  <SelectItem value="detailed">Yksityiskohtainen</SelectItem>
                  <SelectItem value="marketing">Markkinointi</SelectItem>
                  <SelectItem value="custom">Mukautettu</SelectItem>
                  <SelectItem value="welcome">Tervetuloa</SelectItem>
                  <SelectItem value="document_upload">Dokumentit</SelectItem>
                  <SelectItem value="funding_options">Rahoitusvaihtoehdot</SelectItem>
                  <SelectItem value="progress_update">Päivitys</SelectItem>
                  <SelectItem value="notification">Ilmoitus</SelectItem>
                  <SelectItem value="booking">Varaus</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={activeFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setActiveFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Kaikki</SelectItem>
                  <SelectItem value="active">Aktiiviset</SelectItem>
                  <SelectItem value="inactive">Ei-aktiiviset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mallit ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Ladataan malleja...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ei malleja hakuehdoilla
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nimi</TableHead>
                  <TableHead>Tyyppi</TableHead>
                  <TableHead>Aihe</TableHead>
                  <TableHead>Tila</TableHead>
                  <TableHead>Muokattu</TableHead>
                  <TableHead className="text-right">Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      {template.description && (
                        <div className="text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(template.type)}>
                        {getTypeLabel(template.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{template.subject}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.is_active ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-700">Aktiivinen</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-700">Ei-aktiivinen</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(template.updated_at), { 
                          addSuffix: true, 
                          locale: fi 
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        v{template.version}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1">
                        <Link href={`/${locale}/admin/email-templates/${template.id}/preview`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/${locale}/admin/email-templates/${template.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setTemplateToDelete(template)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Poista sähköpostimalli"
        description={`Haluatko varmasti poistaa mallin "${templateToDelete?.name}"? Tätä toimintoa ei voi peruuttaa.`}
        confirmText={deleting ? 'Poistetaan...' : 'Poista'}
        cancelText="Peruuta"
        onConfirm={handleDelete}
        isLoading={deleting}
        variant="destructive"
      />
    </div>
  )
} 