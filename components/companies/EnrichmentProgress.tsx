/**
 * EnrichmentProgress Component
 * 
 * Shows the status and progress of company enrichment job
 */

'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface EnrichmentJob {
  id: string;
  company_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface EnrichmentProgressProps {
  companyId: string;
  onComplete?: () => void;
}

export default function EnrichmentProgress({ companyId, onComplete }: EnrichmentProgressProps) {
  const t = useTranslations('enrichment.enrichment');
  const [job, setJob] = useState<EnrichmentJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/enrichment-status`);
        if (res.ok) {
          const data = await res.json();
          setJob(data.job);
          
          // If completed, call onComplete callback
          if (data.job?.status === 'completed' && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('Failed to fetch enrichment status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();
    
    // Poll every 5 seconds if job is pending or processing
    const interval = setInterval(() => {
      if (job?.status === 'pending' || job?.status === 'processing') {
        fetchJobStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [companyId, job?.status, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t('loadingStatus')}</span>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">{t('statusPending')}</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600">{t('statusProcessing')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600">{t('statusCompleted')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('statusFailed')}</Badge>;
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{t('enrichmentProgress')}</span>
        </div>
        {getStatusBadge()}
      </div>

      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="space-y-2">
          <Progress value={job.progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {t('progressText', { progress: Math.round(job.progress) })}
          </p>
        </div>
      )}

      {job.status === 'completed' && job.completed_at && (
        <p className="text-sm text-muted-foreground">
          {t('completedAt', { 
            date: new Date(job.completed_at).toLocaleString() 
          })}
        </p>
      )}

      {job.status === 'failed' && job.error_message && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{job.error_message}</p>
        </div>
      )}
    </div>
  );
}

