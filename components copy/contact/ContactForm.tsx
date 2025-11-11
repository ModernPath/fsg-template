'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/database'
import { TurnstileWidget } from '@/components/ui/turnstile'

type ContactInput = Database['public']['Tables']['contacts']['Insert']

export default function ContactForm() {
  const t = useTranslations('Contact')
  const supabase = createClient()

  const [formData, setFormData] = useState<ContactInput>({
    name: '',
    company: '',
    email: '',
    description: ''
  })

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setError(null)

    if (!turnstileToken) {
      setError(t('form.error.captcha'))
      setStatus('error')
      return
    }

    try {
      // Validate turnstile token first
      const validateResponse = await fetch('/api/auth/validate-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (!validateResponse.ok) {
        throw new Error(t('form.error.captchaValidation'))
      }

      const { error: submitError } = await supabase
        .from('contacts')
        .insert(formData)

      if (submitError) throw submitError

      // Trigger email notification
      try {
        const response = await fetch('/api/contact-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          console.error('Error sending notification:', await response.text())
        }
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError)
      }

      setStatus('success')
      setFormData({
        name: '',
        company: '',
        email: '',
        description: ''
      })
    } catch (err) {
      console.error('Error submitting contact form:', err)
      setError(err instanceof Error ? err.message : (err as { message: string }).message || 'An error occurred')
      setStatus('error')
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (status === 'success') {
    return (
      <div className="bg-black/30 border border-gold-primary/50 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-gold-primary mb-2">
          {t('form.success.title')}
        </h3>
        <p className="text-gold-primary/80">
          {t('form.success.message')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-md">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gold-primary mb-1">
          {t('form.name')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md bg-gray-dark border-gray-700 text-gold-primary shadow-sm focus:border-gold-primary focus:ring focus:ring-gold-primary/20 px-3 py-2"
          required
          minLength={2}
          aria-invalid={formData.name.length > 0 && formData.name.length < 2}
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gold-primary mb-1">
          {t('form.company')}
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md bg-gray-dark border-gray-700 text-gold-primary shadow-sm focus:border-gold-primary focus:ring focus:ring-gold-primary/20 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gold-primary mb-1">
          {t('form.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md bg-gray-dark border-gray-700 text-gold-primary shadow-sm focus:border-gold-primary focus:ring focus:ring-gold-primary/20 px-3 py-2"
          required
          aria-invalid={formData.email.length > 0 && !formData.email.includes('@')}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gold-primary mb-1">
          {t('form.description')}
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="mt-1 block w-full rounded-md bg-gray-dark border-gray-700 text-gold-primary shadow-sm focus:border-gold-primary focus:ring focus:ring-gold-primary/20 px-3 py-2"
          required
          minLength={10}
          aria-invalid={formData.description.length > 0 && formData.description.length < 10}
        />
      </div>

      <TurnstileWidget
        onVerify={setTurnstileToken}
        onError={() => setError(t('form.error.captcha'))}
        onExpire={() => setTurnstileToken(null)}
        className="mt-4"
      />

      <button
        type="submit"
        disabled={status === 'submitting' || !turnstileToken}
        className="w-full flex justify-center py-2 px-4 border border-gold-primary rounded-md shadow-sm text-sm font-medium text-black bg-gold-primary hover:bg-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary disabled:opacity-50 transition-colors duration-200"
      >
        {status === 'submitting' ? t('form.submitting') : t('form.submit')}
      </button>
    </form>
  )
} 