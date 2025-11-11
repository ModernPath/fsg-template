'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import { useUpdateUser } from '@/hooks/useAdminQueries'
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
import { Edit } from 'lucide-react'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  is_admin: boolean
  is_partner: boolean
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const t = useTranslations('AdminUsers')
  const { session } = useAuth()
  const { toast } = useToast()
  const updateUserMutation = useUpdateUser()

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    is_admin: false,
    is_partner: false,
    password: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        is_admin: user.is_admin,
        is_partner: user.is_partner,
        password: ''
      })
      setErrors({})
    }
  }, [user])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid')
    }

    if (!formData.first_name) {
      newErrors.first_name = t('validation.firstNameRequired')
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = t('validation.passwordTooShort')
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
      // Only include password if it's not empty
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }

      await updateUserMutation.mutateAsync({
        userId: user.id,
        userData: updateData
      })
      
      toast({
        title: t('editUser.success'),
        description: `${formData.email} ${t('messages.userUpdated')}`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: t('editUser.error'),
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

  const isCurrentUser = user.id === session?.user?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('editUser.title')}
          </DialogTitle>
          <DialogDescription>
            {t('editUser.description', { email: user.email })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">{t('editUser.form.email')} *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-first_name">{t('editUser.form.firstName')} *</Label>
              <Input
                id="edit-first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-last_name">{t('editUser.form.lastName')}</Label>
              <Input
                id="edit-last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t('editUser.form.phone')}</Label>
            <Input
              id="edit-phone"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={errors.phone_number ? 'border-red-500' : ''}
            />
            {errors.phone_number && (
              <p className="text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="edit-password">{t('editUser.form.newPassword')}</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder={t('editUser.form.newPasswordPlaceholder')}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Role checkboxes - disabled for current user */}
          <div className="space-y-3">
            <Label>{t('editUser.form.roles')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => handleInputChange('is_admin', !!checked)}
                  disabled={isCurrentUser}
                />
                <Label htmlFor="edit-is_admin" className="text-sm font-normal">
                  {t('editUser.form.isAdmin')}
                  {isCurrentUser && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({t('editUser.form.cannotChangeOwnRole')})
                    </span>
                  )}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_partner"
                  checked={formData.is_partner}
                  onCheckedChange={(checked) => handleInputChange('is_partner', !!checked)}
                  disabled={isCurrentUser}
                />
                <Label htmlFor="edit-is_partner" className="text-sm font-normal">
                  {t('editUser.form.isPartner')}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateUserMutation.isPending}
            >
              {t('editUser.form.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              {t('editUser.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
