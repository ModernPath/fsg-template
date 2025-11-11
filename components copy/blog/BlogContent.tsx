'use client'

import React from 'react'
import parse, { Element, domToReact } from 'html-react-parser'
import Image from 'next/image'

interface BlogContentProps {
  content: string
}

// Custom component rendering for parsed HTML
const customReplace = (domNode: any) => {
  if (domNode instanceof Element) {
    // Handle headings with gold gradient
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(domNode.name)) {
      const props = { ...domNode.attribs }
      let className = `${props.class || ''} font-bold leading-tight mb-6 text-white`
      
      if (domNode.name === 'h1') {
        props.class = `${className} text-4xl md:text-5xl`
      } else if (domNode.name === 'h2') {
        props.class = `${className} text-3xl md:text-4xl`
      } else if (domNode.name === 'h3') {
        props.class = `${className} text-2xl md:text-3xl`
      } else if (domNode.name === 'h4') {
        props.class = `${className} text-xl md:text-2xl`
      } else {
        props.class = `${className} text-lg md:text-xl`
      }
      
      return React.createElement(
        domNode.name,
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      )
    }

    // Make paragraphs gold tinted
    if (domNode.name === 'p') {
      const props = { ...domNode.attribs }
      props.class = `${props.class || ''} text-gray-200 text-lg mb-6 leading-relaxed`
      
      return React.createElement(
        'p',
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      )
    }

    // Style lists
    if (domNode.name === 'ul' || domNode.name === 'ol') {
      const props = { ...domNode.attribs }
      props.class = `${props.class || ''} ${domNode.name === 'ul' ? 'list-disc' : 'list-decimal'} pl-6 mb-6 text-gray-200 space-y-2 text-lg leading-relaxed`
      
      return React.createElement(
        domNode.name,
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      )
    }

    // Style list items to ensure consistent text color if nested
    if (domNode.name === 'li') {
      const props = { ...domNode.attribs };
      props.class = `${props.class || ''} text-gray-200 text-lg leading-relaxed`;
      return React.createElement(
        'li',
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      );
    }

    // Style bold/strong tags
    if (domNode.name === 'strong' || domNode.name === 'b') {
      const props = { ...domNode.attribs };
      props.class = `${props.class || ''} font-bold text-white`;
      return React.createElement(
        domNode.name,
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      );
    }

    // Style links
    if (domNode.name === 'a') {
      const props = { ...domNode.attribs }
      props.class = `${props.class || ''} text-gold-highlight hover:text-gold-primary underline transition-colors`
      
      return React.createElement(
        'a',
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      )
    }

    // Style blockquotes
    if (domNode.name === 'blockquote') {
      const props = { ...domNode.attribs }
      props.class = `${props.class || ''} border-l-4 border-gold-primary pl-4 italic my-6 py-2 text-gray-300`
      
      return React.createElement(
        'blockquote',
        props,
        domToReact(domNode.children as any, { replace: customReplace })
      )
    }

    // Handle images
    if (domNode.name === 'img') {
      const { src, alt, width, height, ...rest } = domNode.attribs
      
      // If we have width and height as numbers
      if (width && height && !isNaN(Number(width)) && !isNaN(Number(height))) {
        return (
          <div className="my-8 relative rounded-xl overflow-hidden shadow-lg">
            <Image
              src={src || ''}
              alt={alt || ''}
              width={parseInt(width, 10)}
              height={parseInt(height, 10)}
              className="object-cover w-full"
            />
          </div>
        )
      }
      
      // Fallback for images without dimensions
      return (
        <div className="my-8 relative rounded-xl overflow-hidden shadow-lg">
          <img
            src={src || ''}
            alt={alt || ''}
            className="w-full object-cover"
            {...rest}
          />
        </div>
      )
    }
  }
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose prose-lg max-w-none text-gray-200">
      {parse(content, { replace: customReplace })}
    </div>
  )
} 