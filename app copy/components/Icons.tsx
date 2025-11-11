import { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string
}

export function IconBrain(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2C9.24 2 7 4.24 7 7c0 2.24 1.5 4.13 3.53 4.78C9.25 12.43 8 14.15 8 16v1c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1c0-1.85-1.25-3.57-2.53-4.22C15.5 11.13 17 9.24 17 7c0-2.76-2.24-5-5-5zm-2 9.04c-1.3-.55-2-1.8-2-3.04 0-1.65 1.35-3 3-3s3 1.35 3 3c0 1.24-.7 2.49-2 3.04C11.35 11.23 11 11.6 11 12v3h2v-3c0-.4.35-.77.65-1.02.3-.25.5-.58.5-.98 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .4.2.73.5.98.3.25.65.62.65 1.02v3h2v-3c0-.4.35-.77.65-1.02.3-.25.5-.58.5-.98 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .4.2.73.5.98.3.25.65.62.65 1.02v4h-2v-4c0-.4-.35-.77-.65-1.02C10.35 12.73 10 12.4 10 12c0-.4.2-.73.5-.98.3-.25.65-.62.65-1.02 0-.83-.67-1.5-1.5-1.5S8.5 9.17 8.5 10c0 .4.2.73.5.98.3.25.65.62.65 1.02v.96z" opacity="1"/>
      <path d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" opacity="0.4"/>
    </svg>
  )
}

export function IconCode(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M16 6l4.29 4.29c.39.39.39 1.02 0 1.41L16 16.59l-1.41-1.41L17.17 12l-2.58-2.59L16 8.41V6z"/>
      <path d="M8 6v2.41L6.59 9.41 4 12l2.59 2.59L8 15.41V18l-4.29-4.29c-.39-.39-.39-1.02 0-1.41L8 6z"/>
      <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.7"/>
      <circle cx="8" cy="12" r="1" fill="currentColor" opacity="0.7"/>
    </svg>
  )
}

export function IconDatabase(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" opacity="1"/>
      <rect x="6" y="6" width="12" height="4" rx="1" opacity="0.6"/>
      <path d="M6 12h12v2H6zm0 4h12v2H6z" opacity="0.6"/>
      <circle cx="8" cy="8" r="1" fill="lightgreen" opacity="0.9"/>
      <circle cx="12" cy="8" r="1" fill="lightgreen" opacity="0.9"/>
      <circle cx="16" cy="8" r="1" fill="lightgreen" opacity="0.9"/>
    </svg>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="12" r="10" opacity="1"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" opacity="0.5"/>
      <path d="M12,2 C14.7614237,2 17,4.23857625 17,7 C17,9.76142375 14.7614237,12 12,12 C9.23857625,12 7,9.76142375 7,7 C7,4.23857625 9.23857625,2 12,2 Z M12,12 C14.7614237,12 17,14.2385763 17,17 C17,19.7614237 14.7614237,22 12,22 C9.23857625,22 7,19.7614237 7,17 C7,14.2385763 9.23857625,12 12,12 Z" opacity="0.7"/>
    </svg>
  )
}

export function IconRocket(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M15.5 12.5c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.4"/>
      <path d="M13.89 8.11L12 2h-1l-1.89 6.11L2 12l6.11 1.89L11 22h1l1.89-6.11L22 12l-6.11-1.89z" opacity="1"/>
    </svg>
  )
}

export function IconShield(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16l-3-3 1.41-1.41L11 14.17l5.59-5.59L18 10l-7 7z" opacity="1"/>
       <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.03L18.82 6.18 12 8.44 5.18 6.18 12 3.03zM4.03 6.75L12 9.58l7.97-2.83L20 11c0 4.41-3.14 8.54-8 9.91-4.86-1.37-8-5.5-8-9.91V6.75z" opacity="0.5"/>
    </svg>
  )
}

export function IconChart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" opacity="1"/>
      <path d="M5 9.2h3V19H5z" opacity="0.7"/>
      <path d="M10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" opacity="0.7"/>
      <path d="M5 21h14" strokeWidth="2" stroke="currentColor" opacity="0.5"/>
    </svg>
  )
}

export function IconMoney(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="12" r="10" opacity="1"/>
      <path d="M12 6c-2.43 0-4.42 1.62-4.9 3.85.29-.1.6-.15.93-.15 2.21 0 4 1.79 4 4s-1.79 4-4 4c-.33 0-.64-.05-.93-.15C7.58 16.38 9.57 18 12 18c3.31 0 6-2.69 6-6s-2.69-6-6-6z" opacity="0.6"/>
      <path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" opacity="0.9"/>
    </svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M16 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 10c2.67 0 8 1.34 8 4v2H8v-2c0-2.66 5.33-4 8-4zm-8 0c-2.67 0-8 1.34-8 4v2h6v-2c0-.63.42-1.75 2-2.47.33-.15.7-.23 1.09-.28-.54-.3-.99-.77-1.32-1.36-.64.07-1.32.11-2.11.11z" opacity="1"/>
    </svg>
  )
}

export function IconTrendingUp(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" opacity="1"/>
    </svg>
  )
}

export function IconTarget(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="12" r="10" opacity="0.3"/>
      <circle cx="12" cy="12" r="6" opacity="0.6"/>
      <circle cx="12" cy="12" r="2" opacity="1"/>
    </svg>
  )
}

export function IconAward(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="8" r="6" opacity="1"/>
      <path d="M15.9 15.9L12 12l-3.9 3.9 2.4 6.6h3l2.5-6.5z" opacity="0.7"/>
      <circle cx="12" cy="8" r="2" opacity="0.4"/>
    </svg>
  )
}

export function IconCalculator(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm2 5h2v2H9V7zm4 0h2v2h-2V7zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h6v2H9v-2z" opacity="1"/>
      <rect x="7" y="3" width="10" height="4" rx="1" opacity="0.7"/>
    </svg>
  )
}

export function IconBank(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2L2 7v2h20V7l-10-5z"/>
      <rect x="4" y="11" width="2" height="8" rx="0.5"/>
      <rect x="7" y="11" width="2" height="8" rx="0.5"/>
      <rect x="11" y="11" width="2" height="8" rx="0.5"/>
      <rect x="15" y="11" width="2" height="8" rx="0.5"/>
      <rect x="18" y="11" width="2" height="8" rx="0.5"/>
      <rect x="2" y="19" width="20" height="2" rx="1"/>
      <circle cx="12" cy="7.5" r="1" fill="currentColor" opacity="0.7"/>
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
} 