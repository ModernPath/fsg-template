'use client'

import Image from 'next/image'
import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

// Team member images
import timoImage from '@/public/images/tiimi/timo_tiimi.jpg'
import alexanderImage from '@/public/images/tiimi/alexander_tiimi.jpg'
import perttiImage from '@/public/images/tiimi/pertti_tiimi.jpeg'
import tiimiVakavanaImage from '@/public/images/other/tiimi_vakavana.jpeg'

export default function TeamPage() {
  const t = useTranslations('Team')
  
  const teamMembers = [
    {
      id: 'timo',
      name: t('teamMembers.timo.name'),
      role: t('teamMembers.timo.role'),
      image: timoImage,
      description: t('teamMembers.timo.description'),
      expertise: [
        t('teamMembers.timo.expertise.0'),
        t('teamMembers.timo.expertise.1'),
        t('teamMembers.timo.expertise.2'),
        t('teamMembers.timo.expertise.3')
      ].filter(Boolean),
      experience: t('teamMembers.timo.experience')
    },
    {
      id: 'alexander',
      name: t('teamMembers.alexander.name'),
      role: t('teamMembers.alexander.role'),
      image: alexanderImage,
      description: t('teamMembers.alexander.description'),
      expertise: [
        t('teamMembers.alexander.expertise.0'),
        t('teamMembers.alexander.expertise.1'),
        t('teamMembers.alexander.expertise.2'),
        t('teamMembers.alexander.expertise.3')
      ].filter(Boolean),
      experience: t('teamMembers.alexander.experience')
    },
    {
      id: 'pertti',
      name: t('teamMembers.pertti.name'),
      role: t('teamMembers.pertti.role'),
      image: perttiImage,
      description: t('teamMembers.pertti.description'),
      expertise: [
        t('teamMembers.pertti.expertise.0'),
        t('teamMembers.pertti.expertise.1'),
        t('teamMembers.pertti.expertise.2'),
        t('teamMembers.pertti.expertise.3')
      ].filter(Boolean),
      experience: t('teamMembers.pertti.experience')
    }
  ]

  const teamValues = [
    {
      title: t('teamValues.transparency.title'),
      description: t('teamValues.transparency.description')
    },
    {
      title: t('teamValues.expertise.title'),
      description: t('teamValues.expertise.description')
    },
    {
      title: t('teamValues.personalization.title'),
      description: t('teamValues.personalization.description')
    },
    {
      title: t('teamValues.innovation.title'),
      description: t('teamValues.innovation.description')
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gold-primary mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('hero.description')}
        </p>
      </div>

      {/* Team Photo */}
      <div className="mb-16">
        <div className="max-w-4xl mx-auto">
          <Image
            src={tiimiVakavanaImage}
            alt={t('teamPhoto.alt')}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </div>

      {/* Team Members */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('founders.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <Card key={member.id} className="bg-card border-border shadow-lg">
              <CardHeader className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gold-primary/50">
                  <Image
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    fill
                  />
                </div>
                <CardTitle className="text-xl font-semibold text-white">
                  {member.name}
                </CardTitle>
                <p className="text-gold-primary font-medium">{member.role}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {member.description}
                </p>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">{t('expertise.title')}</h4>
                  <ul className="space-y-1">
                    {member.expertise.map((skill, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-gold-primary rounded-full"></div>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-white">{t('experience.label')}</span> {member.experience}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('values.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teamValues.map((value, index) => (
            <Card key={index} className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gold-primary">
                  {value.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Expertise Section */}
      <div className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 rounded-lg p-8 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('combinedExpertise.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('combinedExpertise.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gold-primary mb-2">{t('stats.years.value')}</div>
            <div className="text-white font-semibold mb-2">{t('stats.years.label')}</div>
            <div className="text-sm text-muted-foreground">{t('stats.years.description')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold-primary mb-2">{t('stats.projects.value')}</div>
            <div className="text-white font-semibold mb-2">{t('stats.projects.label')}</div>
            <div className="text-sm text-muted-foreground">{t('stats.projects.description')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold-primary mb-2">{t('stats.satisfaction.value')}</div>
            <div className="text-white font-semibold mb-2">{t('stats.satisfaction.label')}</div>
            <div className="text-sm text-muted-foreground">{t('stats.satisfaction.description')}</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t('cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button className="bg-gold-primary text-black hover:bg-gold-highlight">
              {t('cta.bookMeeting')}
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black">
              {t('cta.back')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
