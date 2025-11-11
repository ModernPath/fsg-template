import React, { useRef, useEffect } from 'react';
import { MASTER_COLORS, MasterInsight } from './MasterChartStyle';

interface CircleProgressChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  showInsight?: boolean;
}

const CircleProgressChart: React.FC<CircleProgressChartProps> = ({
  percentage,
  size = 180,
  strokeWidth = 15,
  circleColor = '#374151',
  progressColor = MASTER_COLORS.primary[0],
  children,
  title,
  description,
  showInsight = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = circumference - (percentage / 100) * circumference;

  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'stroke-dashoffset 1s ease-in-out';
      circleRef.current.style.strokeDashoffset = progress.toString();
    }
  }, [progress]);

  // Get quality assessment based on percentage
  const getQuality = () => {
    if (percentage >= 90) return { text: 'Erinomainen', color: 'green' as const };
    if (percentage >= 75) return { text: 'Hyvä', color: 'blue' as const };
    if (percentage >= 50) return { text: 'Kohtuullinen', color: 'yellow' as const };
    return { text: 'Parannettavaa', color: 'red' as const };
  };

  const quality = getQuality();

  return (
    <div className="space-y-4">
      {/* Circle Progress */}
      <div className="flex flex-col items-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={circleColor}
              strokeWidth={strokeWidth}
            />
            <circle
              ref={circleRef}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
            />
          </svg>
          {children ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {children}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold" style={{ color: progressColor }}>
                {percentage.toFixed(1)}%
              </div>
              {title && (
                <div className="text-sm text-muted-foreground mt-1 text-center">
                  {title}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quality indicator */}
        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          quality.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          quality.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
          quality.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          <span>{quality.text}</span>
        </div>
      </div>

      {/* Insight */}
      {showInsight && description && (
        <MasterInsight
          icon="🎯"
          title={title || "Edistyminen"}
          description={description}
          color={quality.color}
        />
      )}
    </div>
  );
};

export default CircleProgressChart; 