"use client"

import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface OrbProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  blur?: 'sm' | 'md' | 'lg'
  animation?: 'float' | 'orbit' | 'glow'
  speed?: 'slow' | 'medium' | 'fast'
  className?: string
}

interface AnimatedOrbProps {
  orbs?: OrbProps[]
  count?: number
  colors?: string[]
  className?: string
}

const defaultOrbs: OrbProps[] = [
  {
    size: 'lg',
    color: 'bg-indigo-500/20',
    blur: 'lg',
    animation: 'float',
    speed: 'slow',
    className: 'absolute top-1/4 right-1/4'
  },
  {
    size: 'lg',
    color: 'bg-purple-500/20',
    blur: 'lg',
    animation: 'float',
    speed: 'medium',
    className: 'absolute bottom-1/4 left-1/3'
  }
]

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-40 h-40'
}

const blurMap = {
  sm: 'blur-lg',
  md: 'blur-xl',
  lg: 'blur-2xl'
}

const animationMap = {
  float: {
    slow: 'animate-float-slow',
    medium: 'animate-float-medium',
    fast: 'animate-float-fast'
  },
  orbit: {
    slow: 'animate-orbit-slow',
    medium: 'animate-orbit-medium',
    fast: 'animate-orbit-fast'
  },
  glow: {
    slow: 'animate-glow-slow',
    medium: 'animate-glow-medium',
    fast: 'animate-glow-fast'
  }
}

const speedOptions = ['slow', 'medium', 'fast'] as const
const sizeOptions = ['sm', 'md', 'lg'] as const
const animationOptions = ['float', 'orbit', 'glow'] as const
const blurOptions = ['sm', 'md', 'lg'] as const

export function AnimatedOrbs({ orbs, count, colors, className }: AnimatedOrbProps) {
  const [generatedOrbs, setGeneratedOrbs] = useState<OrbProps[]>([])
  
  useEffect(() => {
    // If explicit orbs are provided, use those
    if (orbs) {
      setGeneratedOrbs(orbs)
      return
    }
    
    // Otherwise generate orbs based on count and colors
    if (count) {
      const defaultColors = ['bg-indigo-500/20', 'bg-purple-500/20', 'bg-blue-500/20', 'bg-pink-500/20']
      const orbColors = colors ? colors.map(color => `bg-${color}`) : defaultColors
      
      const newOrbs: OrbProps[] = []
      
      for (let i = 0; i < count; i++) {
        // Generate random position
        const top = Math.random() * 100
        const left = Math.random() * 100
        const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)]
        const speed = speedOptions[Math.floor(Math.random() * speedOptions.length)]
        const animation = animationOptions[Math.floor(Math.random() * animationOptions.length)]
        const blur = blurOptions[Math.floor(Math.random() * blurOptions.length)]
        const color = orbColors[Math.floor(Math.random() * orbColors.length)]
        
        newOrbs.push({
          size,
          color,
          blur,
          animation,
          speed,
          className: `absolute top-[${top}%] left-[${left}%]`
        })
      }
      
      setGeneratedOrbs(newOrbs)
    } else {
      // Fallback to default orbs
      setGeneratedOrbs(defaultOrbs)
    }
  }, [orbs, count, colors])
  
  return (
    <div className={cn('absolute inset-0', className)}>
      {generatedOrbs.map((orb, index) => (
        <div key={index} className={orb.className || `absolute top-1/${index + 2} left-1/${index + 2}`}>
          <div
            className={cn(
              'rounded-full',
              sizeMap[orb.size || 'md'],
              orb.color,
              blurMap[orb.blur || 'lg'],
              animationMap[orb.animation || 'float'][orb.speed || 'medium']
            )}
          />
        </div>
      ))}
    </div>
  )
} 