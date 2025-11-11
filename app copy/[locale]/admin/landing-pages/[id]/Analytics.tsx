'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

// Custom Switch component that works reliably (copied from surveys)
const CustomSwitch = ({ checked, onChange, disabled = false }: { 
  checked: boolean, 
  onChange: (checked: boolean) => void,
  disabled?: boolean 
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
  </label>
)

import { Database } from '@/types/database'

type LandingPage = Database['public']['Tables']['landing_pages']['Row']

interface Props {
  page: LandingPage | null
  locale: string
}

export default function Analytics({ page, locale }: Props) {
  const t = useTranslations('LandingPages')
  const { register, formState: { errors }, watch, setValue } = useFormContext<LandingPage>()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enable_analytics">{t('analytics.enableAnalytics')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('analytics.enableAnalyticsDescription')}
          </p>
        </div>
        <CustomSwitch
          checked={watch('enable_analytics')}
          onChange={(checked: boolean) => setValue('enable_analytics', checked)}
        />
      </div>

      {watch('enable_analytics') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ga_measurement_id">{t('analytics.gaMeasurementId')}</Label>
            <Input
              id="ga_measurement_id"
              {...register('ga_measurement_id')}
              error={errors.ga_measurement_id?.message as string}
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gtm_container_id">{t('analytics.gtmContainerId')}</Label>
            <Input
              id="gtm_container_id"
              {...register('gtm_container_id')}
              error={errors.gtm_container_id?.message as string}
              placeholder="GTM-XXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb_pixel_id">{t('analytics.fbPixelId')}</Label>
            <Input
              id="fb_pixel_id"
              {...register('fb_pixel_id')}
              error={errors.fb_pixel_id?.message as string}
              placeholder="XXXXXXXXXXXXXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_pixel_id">{t('analytics.linkedinPixelId')}</Label>
            <Input
              id="linkedin_pixel_id"
              {...register('linkedin_pixel_id')}
              error={errors.linkedin_pixel_id?.message as string}
              placeholder="XXXXXXXXXX"
            />
          </div>
        </>
      )}
    </div>
  )
} 