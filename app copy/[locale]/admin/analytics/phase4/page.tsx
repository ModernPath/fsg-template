'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CursorArrowRaysIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

interface Phase4Analytics {
  totalDisplays: number;
  actionBreakdown: {
    refine: number;
    justify: number;
    proceed: number;
  };
  customMessageUsage: number;
  averageTimeToDecision: number;
  conversionRate: number;
  abandonmentRate: number;
  variantPerformance: {
    control: {
      name: string;
      displays: number;
      proceeds: number;
      conversionRate: number;
    };
    variant: {
      name: string;
      displays: number;
      proceeds: number;
      conversionRate: number;
    };
  };
}

export default function Phase4AnalyticsPage() {
  const t = useTranslations('Admin');
  const [analytics, setAnalytics] = useState<Phase4Analytics | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/phase4?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching Phase 4 analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Phase 4 Data Available
          </h2>
          <p className="text-gray-500">
            Phase 4 analytics will appear here once users start interacting with the feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Phase 4 Interactive Confirmation Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor user interactions and A/B test performance
          </p>
        </div>
        
        <div className="flex gap-2">
          {['1d', '7d', '30d'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === '1d' ? 'Today' : range === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Displays</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalDisplays.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CursorArrowRaysIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.conversionRate)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Decision Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(analytics.averageTimeToDecision)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Custom Messages</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.customMessageUsage}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Action Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics.actionBreakdown).map(([action, count]) => {
              const percentage = (count / analytics.totalDisplays) * 100;
              const colors = {
                refine: 'bg-blue-500',
                justify: 'bg-amber-500',
                proceed: 'bg-green-500'
              };
              
              return (
                <div key={action} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {action === 'refine' ? 'Refine Analysis' : 
                         action === 'justify' ? 'More Justifications' : 
                         'Proceed to Bidding'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[action as keyof typeof colors]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* A/B Test Results */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            A/B Test Performance
          </h3>
          <div className="space-y-4">
            {[analytics.variantPerformance.control, analytics.variantPerformance.variant].map((variant, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{variant.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    variant.conversionRate > (index === 0 ? analytics.variantPerformance.variant.conversionRate : analytics.variantPerformance.control.conversionRate)
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {index === 0 ? 'Control' : 'Variant B'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Displays</p>
                    <p className="font-semibold">{variant.displays}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Proceeds</p>
                    <p className="font-semibold">{variant.proceeds}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversion</p>
                    <p className="font-semibold">{formatPercentage(variant.conversionRate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Statistical Significance Indicator */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Statistical Significance:</strong> 
              {analytics.variantPerformance.control.displays + analytics.variantPerformance.variant.displays >= 400
                ? ' Likely significant (>400 total samples)'
                : ' Insufficient data for significance'
              }
            </p>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Performance Insights</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                {analytics.conversionRate > 0.7 
                  ? 'High conversion rate indicates effective Phase 4 design'
                  : 'Conversion rate could be improved with design optimizations'
                }
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                {analytics.customMessageUsage > analytics.totalDisplays * 0.1
                  ? 'Good custom message adoption suggests users want more control'
                  : 'Low custom message usage - consider simplifying the interface'
                }
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                {analytics.averageTimeToDecision < 30
                  ? 'Quick decision times indicate clear UI'
                  : 'Long decision times may indicate confusing options'
                }
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Optimization Opportunities</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                Monitor which variant performs better over time
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                Investigate high abandonment rates if present
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                Consider A/B testing additional UI variations
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
