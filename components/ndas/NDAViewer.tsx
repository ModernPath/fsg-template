'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NDAViewerProps {
  nda: any;
  canSign?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onUpdate?: () => void;
}

export function NDAViewer({
  nda,
  canSign = false,
  canEdit = false,
  canDelete = false,
  onUpdate,
}: NDAViewerProps) {
  const t = useTranslations('ndas');
  const router = useRouter();
  const [isSignLoading, setIsSignLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusBadge = () => {
    switch (nda.status) {
      case 'signed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('signed')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            {t('pending')}
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('expired')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <FileText className="w-3 h-3 mr-1" />
            {t('draft')}
          </Badge>
        );
    }
  };

  const handleSign = async () => {
    setIsSignLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ndas/${nda.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_data: null, // Optional: Add signature canvas data here
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign NDA');
      }

      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSignLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ndas/${nda.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete NDA');
      }

      router.push('/dashboard/ndas');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a blob from the markdown content
    const blob = new Blob([nda.content || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDA-${nda.recipient_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('ndaDocument')}
              </CardTitle>
              <CardDescription>
                {t('recipient')}: {nda.recipient_name} ({nda.recipient_email})
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="font-semibold">{t('created')}:</span>{' '}
              {new Date(nda.created_at).toLocaleDateString()}
            </div>
            {nda.expires_at && (
              <div>
                <span className="font-semibold">{t('expires')}:</span>{' '}
                {new Date(nda.expires_at).toLocaleDateString()}
              </div>
            )}
            {nda.signed_at && (
              <div>
                <span className="font-semibold">{t('signedOn')}:</span>{' '}
                {new Date(nda.signed_at).toLocaleDateString()}
              </div>
            )}
            {nda.recipient_company && (
              <div>
                <span className="font-semibold">{t('company')}:</span> {nda.recipient_company}
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('downloadMarkdown')}
            </Button>

            {canEdit && nda.status !== 'signed' && (
              <Button
                onClick={() => router.push(`/dashboard/ndas/${nda.id}/edit`)}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('edit')}
              </Button>
            )}

            {canSign && nda.status !== 'signed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('signNDA')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmSignature')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('signatureWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSign} disabled={isSignLoading}>
                      {isSignLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('signing')}
                        </>
                      ) : (
                        t('confirmSign')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {canDelete && nda.status !== 'signed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleteLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleteLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('deleting')}
                        </>
                      ) : (
                        t('confirmDelete')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('documentContent')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{nda.content || t('noContent')}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

