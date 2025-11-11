interface ImagePlaceholderProps {
  title: string
  subtitle?: string
  className?: string
}

export default function ImagePlaceholder({ title, subtitle, className = '' }: ImagePlaceholderProps) {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg flex flex-col items-center justify-center p-4 ${className}`}>
      <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg" />
      <div className="relative text-center">
        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">{title}</h4>
        {subtitle && <p className="text-sm text-blue-700 dark:text-blue-300">{subtitle}</p>}
      </div>
    </div>
  )
} 