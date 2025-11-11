'use client'

import { useState, useEffect } from 'react'
// import { useUser } from '@supabase/auth-helpers-react' // Removed deprecated import
import { useAuth } from '@/components/auth/AuthProvider' // Added AuthProvider import
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import CommentForm from './CommentForm'
import { createClient } from '@/utils/supabase/client'
import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useConfirm } from '@/hooks/useConfirm'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  post_id: string
  parent_id?: string | null
  profiles: {
    id: string
    username: string
  } | null
}

interface CommentsProps {
  postId: string
}

export default function Comments({ postId }: CommentsProps) {
  const t = useTranslations('Blog.comments')
  // const user = useUser() // Replaced with useAuth
  const { user, isAuthenticated } = useAuth() // Use user and isAuthenticated from useAuth
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyToComment, setReplyToComment] = useState<string | null>(null)
  const { confirm, ConfirmComponent } = useConfirm()

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(id, username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)

      setComments(data || [])
    } catch (err: any) {
      console.error('Error fetching comments:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleNewComment = async (content: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            content, 
            post_id: postId,
            ...(replyToComment ? { parent_id: replyToComment } : {})
          }
        ])
        .select()
      
      if (error) throw new Error(error.message)
      
      fetchComments()
      setReplyToComment(null)
    } catch (err: any) {
      console.error('Error adding comment:', err)
      setError(err.message)
    }
  }

  const deleteComment = async (commentId: string) => {
    const shouldDelete = await confirm({
      title: t('deleteConfirmTitle', { default: 'Poista kommentti' }),
      message: t('deleteConfirm', { default: 'Haluatko varmasti poistaa tämän kommentin?' }),
      confirmText: t('delete', { default: 'Poista' }),
      cancelText: t('cancel', { default: 'Peruuta' }),
      variant: 'danger'
    })

    if (!shouldDelete) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user?.id || '')
      
      if (error) throw new Error(error.message)
      
      fetchComments()
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      setError(err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="py-4 text-center text-gold-primary/70">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-dark rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-10 bg-gray-dark rounded mb-6"></div>
          <div className="h-24 bg-gray-dark rounded mb-4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg text-gold-primary">
        <p>{t('error')}: {error}</p>
    </div>
    )
  }

  const replyUsername = replyToComment 
    ? comments.find(c => c.id === replyToComment)?.profiles?.username || null
    : null

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gold-primary">
        {t('title')} ({comments.length})
      </h3>

      {user ? (
        <CommentForm 
          onSubmit={handleNewComment} 
          replyTo={replyUsername}
          onCancelReply={() => setReplyToComment(null)}
        />
      ) : (
        <div className="p-4 bg-gray-very-dark border border-gray-dark rounded-lg text-gold-primary/80">
          <p>{t('loginPrompt')}</p>
        </div>
      )}

        {comments.length === 0 ? (
        <div className="p-4 bg-gray-very-dark border border-gray-dark rounded-lg text-gold-primary/80">
          <p>{t('noComments')}</p>
        </div>
        ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-gray-very-dark border border-gray-dark rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-dark flex items-center justify-center text-gold-primary text-lg font-semibold flex-shrink-0 border-2 border-gold-primary/20">
                  {(comment.profiles?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gold-primary">{comment.profiles?.username || t('anonymousUser')}</span>
                      <span className="text-sm text-gold-primary/50 ml-2">{formatDate(comment.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isAuthenticated && (
                        <button 
                          onClick={() => setReplyToComment(comment.id)}
                          className="text-sm font-medium text-gold-primary hover:text-gold-highlight transition-colors"
                        >
                          {t('reply')}
                        </button>
                      )}
                      {user?.id === comment.author_id && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                          className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
                      >
                          {t('delete')}
                      </button>
                    )}
                  </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-gold-primary/90 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
      )}
      <ConfirmComponent />
    </div>
  )
} 