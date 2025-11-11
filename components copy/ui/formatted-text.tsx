'use client'

import React from 'react'

interface FormattedTextProps {
  content: string
  className?: string
}

/**
 * Komponentti CFO-avustajan tekstien parempaa muotoilua varten
 * - Jakaa pitkät tekstit tiiviisiin kappaleisiin
 * - Lisää visuaalisia parannuksia ja korostuksia
 * - Parantaa luettavuutta älykkäällä jaksotuksella
 */
export function FormattedText({ content, className = '' }: FormattedTextProps) {
  // Funktio tekstin älykkääseen muotoiluun
  const formatText = (text: string) => {
    // Ensiksi jaa teksti kappaleisiin
    let paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
    
    // Jos ei ole selkeitä kappaleita, jaa pitkät tekstit älykkäästi
    if (paragraphs.length === 1 && paragraphs[0].length > 300) {
      paragraphs = smartSplitLongText(paragraphs[0])
    }
    
    return paragraphs.map((paragraph, index) => {
      const trimmedParagraph = paragraph.trim()
      
      // Tunnista erilaisia tekstielementtejä
      if (trimmedParagraph.startsWith('**') && trimmedParagraph.endsWith('**')) {
        // Korostettu otsikko
        return (
          <div key={index} className="mb-2">
            <h4 className="text-base font-semibold text-gold-primary mb-1">
              {trimmedParagraph.replace(/\*\*/g, '')}
            </h4>
          </div>
        )
      }
      
      if (trimmedParagraph.startsWith('•') || trimmedParagraph.includes('\n•')) {
        // Lista-elementit
        const listItems = trimmedParagraph
          .split('\n')
          .filter(item => item.trim().startsWith('•'))
          .map(item => item.replace('•', '').trim())
        
        return (
          <div key={index} className="mb-2">
            <ul className="space-y-1">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start">
                  <span className="text-gold-primary mr-2 mt-0.5 text-sm">•</span>
                  <span className="text-gray-200 leading-snug text-sm">{formatInlineElements(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
      
      if (trimmedParagraph.includes(':') && trimmedParagraph.split(':')[0].length < 50) {
        // Mahdollinen avain-arvo pari tai otsikko
        const [title, ...rest] = trimmedParagraph.split(':')
        if (rest.length > 0) {
          return (
            <div key={index} className="mb-2">
              <div className="text-gold-secondary font-medium text-sm mb-0.5">{title.trim()}:</div>
              <div className="text-gray-200 leading-snug text-sm pl-3 border-l-2 border-gold-primary/30">
                {formatInlineElements(rest.join(':').trim())}
              </div>
            </div>
          )
        }
      }
      
      // Tavallinen kappale - tiiviimpi välistys
      return (
        <div key={index} className="mb-2">
          <p className="text-gray-200 leading-snug text-sm">
            {formatInlineElements(trimmedParagraph)}
          </p>
        </div>
      )
    })
  }
  
  // Funktio pitkien tekstien älykkääseen jakamiseen
  const smartSplitLongText = (text: string): string[] => {
    const sentences = text.split(/([.!?]+\s+)/)
    const paragraphs: string[] = []
    let currentParagraph = ''
    
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i]
      const punctuation = sentences[i + 1] || ''
      
      if (!sentence?.trim()) continue
      
      const fullSentence = sentence + (punctuation || '')
      
      // Jos kappale on jo tarpeeksi pitkä (150-250 merkkiä), aloita uusi
      if (currentParagraph.length > 150 && currentParagraph.length + fullSentence.length > 250) {
        paragraphs.push(currentParagraph.trim())
        currentParagraph = fullSentence
      } else {
        currentParagraph += fullSentence
      }
    }
    
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim())
    }
    
    return paragraphs.length > 1 ? paragraphs : [text]
  }
  
  // Funktio inline-elementtien muotoiluun - vain perusmuotoilu ilman korostuksia
  const formatInlineElements = (text: string) => {
    // Käsittele vain **lihavointi** merkinnät, poista muut korostukset
    let result: React.ReactNode[] = [text]
    
    // Vain **Lihavointi** - ja vain jos se on lauseen/kappaleen alussa
    result = result.flatMap((item, index) => {
      if (typeof item !== 'string') return item
      const parts = item.split(/(\*\*[^*]+\*\*)/g)
      return parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Tarkista onko tämä lauseen/kappaleen alussa
          const textBefore = parts.slice(0, partIndex).join('')
          const isAtStart = textBefore.trim() === '' || /[.!?]\s*$/.test(textBefore.trim())
          
          if (isAtStart) {
            return (
              <strong key={`${index}-bold-${partIndex}`} className="text-gold-primary font-semibold">
                {part.replace(/\*\*/g, '')}
              </strong>
            )
          } else {
            // Jos ei ole alussa, poista ** merkinnät mutta älä korosta
            return part.replace(/\*\*/g, '')
          }
        }
        return part
      })
    })
    
    return result.filter(item => item !== '')
  }
  
  return (
    <div className={`formatted-text ${className}`}>
      {formatText(content)}
    </div>
  )
}

export default FormattedText
