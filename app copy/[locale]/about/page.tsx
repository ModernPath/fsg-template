'use server';

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import AboutPage from './AboutPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Meistä - Trusty Finance tiimi ja asiantuntemus | Trusty Finance',
    description: 'Tutustu Trusty Finance -tiimiin: kokeneet rahoitusasiantuntijat, joilla on vahva teknologinen osaaminen ja kansainvälinen kokemus.',
    locale: locale,
    path: '/about'
  })
}

export default async function AboutPageRoute({ params }: Props) {
  return <AboutPage />
}
