'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  replyTo: string | null
  onCancelReply: () => void
}

export default function CommentForm({ onSubmit, replyTo, onCancelReply }: CommentFormProps) {
  const t = useTranslations('Blog.comments')
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {replyTo && (
        <div className="flex items-center justify-between bg-gold-primary/10 p-3 rounded-lg">
          <div className="text-gold-primary">
            <span className="font-semibold">{t('replyingTo')}</span> {replyTo}
          </div>
          <button 
            type="button" 
            onClick={onCancelReply}
            className="text-gold-primary hover:text-gold-highlight transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      )}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gold-primary mb-2">
          {t('yourComment')}
        </label>
        <textarea
          id="comment"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-gray-dark bg-gray-very-dark text-gold-primary p-4 focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-colors"
          placeholder={t('commentPlaceholder')}
          required
        />
      </div>
      <div className="flex justify-end">
      <button
        type="submit"
        disabled={submitting || !content.trim()}
          className="py-3 px-6 bg-gold-primary hover:bg-gold-highlight text-black font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
          {submitting ? t('submitting') : t('submit')}
      </button>
      </div>
    </form>
  )
} 