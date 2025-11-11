'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { useCreateUser } from '@/hooks/useAdminQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { UserPlus } from 'lucide-react'

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const t = useTranslations('AdminUsers')
  const { session } = useAuth()
  const { toast } = useToast()
  const createUserMutation = useCreateUser()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    is_admin: false,
    is_partner: false,
    send_email: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid')
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('validation.passwordTooShort')
    }

    if (!formData.first_name) {
      newErrors.first_name = t('validation.firstNameRequired')
    }

    if (formData.phone_number && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = t('validation.phoneInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await createUserMutation.mutateAsync(formData)
      
      toast({
        title: t('createUser.success'),
        description: `${formData.email} ${t('messages.userCreated')}`,
      })

      // Reset form and close modal
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          is_admin: false,
          is_partner: false,
          send_email: true
        })
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t('createUser.error'),
        description: error instanceof Error ? error.message : t('error'),
        variant: 'destructive'
      })
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('createUser.title')}
          </DialogTitle>
          <DialogDescription>
            {t('createUser.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('createUser.form.email')} *</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('createUser.form.emailPlaceholder')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('createUser.form.password')} *</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('createUser.form.passwordPlaceholder')}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t('createUser.form.firstName')} *</Label>
              <Input
                id="first_name"
                placeholder={t('createUser.form.firstNamePlaceholder')}
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t('createUser.form.lastName')}</Label>
              <Input
                id="last_name"
                placeholder={t('createUser.form.lastNamePlaceholder')}
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t('createUser.form.phone')}</Label>
            <Input
              id="phone"
              placeholder={t('createUser.form.phonePlaceholder')}
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={errors.phone_number ? 'border-red-500' : ''}
            />
            {errors.phone_number && (
              <p className="text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          {/* Role checkboxes */}
          <div className="space-y-3">
            <Label>{t('createUser.form.roles')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => handleInputChange('is_admin', !!checked)}
                />
                <Label htmlFor="is_admin" className="text-sm font-normal">
                  {t('createUser.form.isAdmin')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_partner"
                  checked={formData.is_partner}
                  onCheckedChange={(checked) => handleInputChange('is_partner', !!checked)}
                />
                <Label htmlFor="is_partner" className="text-sm font-normal">
                  {t('createUser.form.isPartner')}
                </Label>
              </div>
            </div>
          </div>

          {/* Send email checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send_email"
              checked={formData.send_email}
              onCheckedChange={(checked) => handleInputChange('send_email', !!checked)}
            />
            <Label htmlFor="send_email" className="text-sm font-normal">
              {t('createUser.form.sendEmail')}
            </Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createUserMutation.isPending}
            >
              {t('createUser.form.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {t('createUser.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
