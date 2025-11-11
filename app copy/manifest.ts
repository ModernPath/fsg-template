import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trusty Finance - AI-pohjainen yritysrahoitusneuvonta',
    short_name: 'Trusty Finance',
    description: 'AI-pohjainen yritysrahoitusneuvonta Suomessa. Löydä paras rahoitusvaihtoehto yrityksellesi tekoälyn avulla.',
    start_url: '/fi',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FFD700',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'fi',
    dir: 'ltr',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      }
    ]
  }
}
