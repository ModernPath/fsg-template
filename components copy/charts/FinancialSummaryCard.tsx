import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialSummaryCardProps {
  title: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  description?: string;
  highlight?: boolean;
  children?: React.ReactNode;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  value,
  valuePrefix = '',
  valueSuffix = '',
  description,
  highlight = false,
  children
}) => {
  return (
    <Card className={`w-full overflow-hidden border border-gold-primary/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-gold-primary/40 ${
      highlight 
        ? 'bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 shadow-2xl border-gold-primary/40' 
        : 'bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-gray-900/70'
    }`}>
      <CardHeader className="pb-3 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-primary/5 via-transparent to-gold-secondary/5 rounded-t-lg"></div>
        <CardTitle className="text-xl font-bold text-gold-primary relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold-primary animate-pulse"></div>
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-300 relative z-10 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="relative">
        <div className="mb-4">
          <div className="flex items-baseline">
            {valuePrefix && <span className="text-sm mr-2 text-gray-400 font-medium">{valuePrefix}</span>}
            <span className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-secondary bg-clip-text text-transparent">
              {value}
            </span>
            {valueSuffix && <span className="text-lg ml-2 text-gold-secondary/80 font-medium">{valueSuffix}</span>}
          </div>
          <div className="mt-2 h-1 bg-gradient-to-r from-gold-primary/20 via-gold-secondary/40 to-gold-primary/20 rounded-full"></div>
        </div>
        
        {children}
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard; 