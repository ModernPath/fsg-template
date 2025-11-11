import React from 'react'
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts'

// Unified color palette for all charts
export const MASTER_COLORS = {
  primary: ['#e5c07b', '#d4a373', '#c2956a', '#b08968', '#a67c5a', '#9c6f4c'],
  secondary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  gradients: {
    blue: { start: '#3b82f6', end: '#1d4ed8' },
    green: { start: '#10b981', end: '#047857' },
    yellow: { start: '#f59e0b', end: '#d97706' },
    red: { start: '#ef4444', end: '#dc2626' },
    purple: { start: '#8b5cf6', end: '#7c3aed' },
    gold: { start: '#e5c07b', end: '#d4a373' }
  }
}

// Master chart configuration
export const MASTER_CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  height: 300,
  compactHeight: 200,
  
  // Grid styling
  grid: {
    strokeDasharray: "3 3",
    stroke: "#374151",
    strokeOpacity: 0.3,
    horizontal: true,
    vertical: false
  },
  
  // Axis styling
  axis: {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }
  },
  
  // Tooltip styling
  tooltip: {
    contentStyle: { 
      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
      border: '1px solid rgba(0, 0, 0, 0.1)', 
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      color: '#1f2937'
    },
    labelStyle: { color: '#1f2937', fontWeight: 600 }
  }
}

// Master tooltip formatter
export const createMasterTooltipFormatter = (colors: string[]) => {
  return (value: any, name: string, props: any) => [
    <span key="value" style={{ 
      color: colors[props.dataKey % colors.length] || colors[0], 
      fontWeight: 600 
    }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>, 
    <span key="label" style={{ color: '#374151', fontWeight: 500 }}>
      {name}
    </span>
  ]
}

// Master chart wrapper component
interface MasterChartWrapperProps {
  children: React.ReactNode
  height?: number
  className?: string
}

export function MasterChartWrapper({ 
  children, 
  height = MASTER_CHART_CONFIG.height,
  className = ""
}: MasterChartWrapperProps) {
  // MasterChartWrapper rendering successfully
  return (
    <div 
      style={{ 
        width: '100%', 
        height: `${height}px`, 
        minHeight: `${height}px`,
        position: 'relative'
      }}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

// Master grid component
export function MasterGrid() {
  return <CartesianGrid {...MASTER_CHART_CONFIG.grid} />
}

// Master X-axis component
interface MasterXAxisProps {
  dataKey?: string
  tickFormatter?: (value: any) => string
  type?: 'number' | 'category'
  width?: number
  label?: string | { value: string; angle?: number; position?: string }
}

export function MasterXAxis({ dataKey, tickFormatter, type, width, label }: MasterXAxisProps) {
  return (
    <XAxis 
      dataKey={dataKey}
      type={type}
      width={width}
      tickFormatter={tickFormatter}
      label={label ? (typeof label === 'string' ? { 
        value: label, 
        position: 'insideBottom', 
        offset: -10,
        style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }
      } : {
        ...label,
        style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12, fontWeight: 500, ...label }
      }) : undefined}
      {...MASTER_CHART_CONFIG.axis}
    />
  )
}

// Master Y-axis component
interface MasterYAxisProps {
  tickFormatter?: (value: any) => string
  type?: 'number' | 'category'
  width?: number
  dataKey?: string
  label?: string | { value: string; angle?: number; position?: string }
}

export function MasterYAxis({ tickFormatter, type, width, dataKey, label }: MasterYAxisProps) {
  return (
    <YAxis 
      type={type}
      width={width}
      dataKey={dataKey}
      tickFormatter={tickFormatter}
      label={label ? (typeof label === 'string' ? { 
        value: label, 
        angle: -90, 
        position: 'insideLeft',
        style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }
      } : {
        ...label,
        style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12, fontWeight: 500, ...label }
      }) : undefined}
      {...MASTER_CHART_CONFIG.axis}
    />
  )
}

// Master tooltip component
interface MasterTooltipProps {
  formatter?: (value: any, name: string, props: any) => [React.ReactNode, React.ReactNode]
  labelFormatter?: (label: any, payload?: any[]) => React.ReactNode
  colors?: string[]
}

export function MasterTooltip({ 
  formatter, 
  labelFormatter, 
  colors = MASTER_COLORS.primary 
}: MasterTooltipProps) {
  return (
    <Tooltip
      {...MASTER_CHART_CONFIG.tooltip}
      formatter={formatter || createMasterTooltipFormatter(colors)}
      labelFormatter={labelFormatter}
    />
  )
}

// Master legend component
export function MasterLegend() {
  return <Legend />
}

// Enhanced empty state component
interface MasterEmptyStateProps {
  icon: string
  title: string
  description: string
  className?: string
}

export function MasterEmptyState({ 
  icon, 
  title, 
  description, 
  className = "" 
}: MasterEmptyStateProps) {
  return (
    <div className={`h-64 flex items-center justify-center text-muted-foreground ${className}`}>
      <div className="text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1">{description}</p>
      </div>
    </div>
  )
}

// Master loading skeleton
export function MasterChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div 
      className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2 animate-pulse"></div>
        <div className="text-sm text-muted-foreground">Ladataan kaavioita...</div>
      </div>
    </div>
  )
}

// Master insight box component
interface MasterInsightProps {
  icon: string
  title: string
  description: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'
  className?: string
}

export function MasterInsight({
  icon,
  title,
  description,
  color = 'blue',
  className = ""
}: MasterInsightProps) {
  const colorStyles = {
    blue: {
      gradient: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-500',
      titleText: 'text-blue-900 dark:text-blue-100',
      descText: 'text-blue-700/80 dark:text-blue-300/70'
    },
    green: {
      gradient: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/20',
      iconBg: 'bg-green-500/10',
      iconText: 'text-green-500',
      titleText: 'text-green-900 dark:text-green-100',
      descText: 'text-green-700/80 dark:text-green-300/70'
    },
    yellow: {
      gradient: 'from-yellow-500/10 to-amber-600/5',
      border: 'border-yellow-500/20',
      iconBg: 'bg-yellow-500/10',
      iconText: 'text-yellow-600',
      titleText: 'text-yellow-900 dark:text-yellow-100',
      descText: 'text-yellow-700/80 dark:text-yellow-300/70'
    },
    red: {
      gradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
      iconText: 'text-red-500',
      titleText: 'text-red-900 dark:text-red-100',
      descText: 'text-red-700/80 dark:text-red-300/70'
    },
    purple: {
      gradient: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/10',
      iconText: 'text-purple-500',
      titleText: 'text-purple-900 dark:text-purple-100',
      descText: 'text-purple-700/80 dark:text-purple-300/70'
    },
    orange: {
      gradient: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/10',
      iconText: 'text-orange-500',
      titleText: 'text-orange-900 dark:text-orange-100',
      descText: 'text-orange-700/80 dark:text-orange-300/70'
    }
  }

  const style = colorStyles[color]

  return (
    <div className={`relative overflow-hidden rounded-xl border ${style.border} bg-gradient-to-br ${style.gradient} backdrop-blur-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center text-xl ${style.iconText}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${style.titleText} mb-1.5`}>
              {title}
            </h4>
            <p className={`text-xs leading-relaxed ${style.descText}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className={`absolute top-0 right-0 w-32 h-32 ${style.iconBg} rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2`}></div>
    </div>
  )
}

// Master gradient definitions for charts
export function MasterGradientDefs() {
  return (
    <defs>
      {Object.entries(MASTER_COLORS.gradients).map(([name, gradient]) => (
        <linearGradient key={name} id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradient.start} stopOpacity={0.8} />
          <stop offset="100%" stopColor={gradient.start} stopOpacity={0.1} />
        </linearGradient>
      ))}
    </defs>
  )
}

// Utility functions
export const formatters = {
  currency: (value: number) => `€${value.toFixed(2)}`,
  percentage: (value: number) => `${value.toFixed(1)}%`,
  number: (value: number) => value.toLocaleString(),
  duration: (value: number) => value >= 60 ? `${Math.round(value / 60)}m` : `${Math.round(value)}s`,
  date: (value: string) => new Date(value).toLocaleDateString('fi-FI', { 
    month: 'short', 
    day: 'numeric' 
  }),
  dateTime: (value: string) => new Date(value).toLocaleDateString('fi-FI', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric' 
  })
}
