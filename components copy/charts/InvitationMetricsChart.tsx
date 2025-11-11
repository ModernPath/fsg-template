import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, CheckCircle, TrendingUp } from 'lucide-react';
import { MasterInsight, MASTER_COLORS } from './MasterChartStyle';

interface InvitationMetricsChartProps {
  data: {
    total_sent: number;
    opened: number;
    completed: number;
    open_rate: number;
    completion_rate: number;
  };
}

const InvitationMetricsChart = ({ data }: InvitationMetricsChartProps) => {
  const chartData = [
    {
      name: 'Lähetetty',
      value: data.total_sent,
      percentage: 100,
      color: MASTER_COLORS.secondary[0], // Blue
      icon: Mail,
      emoji: '📧'
    },
    {
      name: 'Avattu',
      value: data.opened,
      percentage: data.open_rate,
      color: MASTER_COLORS.secondary[2], // Yellow
      icon: Eye,
      emoji: '👁️'
    },
    {
      name: 'Valmistunut',
      value: data.completed,
      percentage: data.completion_rate,
      color: MASTER_COLORS.secondary[1], // Green
      icon: CheckCircle,
      emoji: '✅'
    }
  ];

  const funnelData = chartData.map(item => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage.toFixed(1)
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {chartData.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: metric.color }}>
                  {metric.value.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${metric.color}20`,
                      color: metric.color,
                      border: `1px solid ${metric.color}40`
                    }}
                  >
                    {metric.percentage.toFixed(1)}%
                  </Badge>
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground">
                      lähetetyistä
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Kutsujen konversiosuppilo
          </CardTitle>
          <CardDescription>
            Kuinka moni kutsutuista avasi ja täytti kyselyn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Custom Funnel Visualization */}
          <div className="space-y-4">
            {chartData.map((step, index) => {
              const width = (step.value / data.total_sent) * 100;
              const Icon = step.icon;
              
              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: step.color }} />
                      <span className="font-medium text-sm">{step.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: step.color }}>
                        {step.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Funnel Bar */}
                  <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div 
                      className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-center"
                      style={{ 
                        width: `${Math.max(width, 5)}%`,
                        backgroundColor: step.color,
                        background: `linear-gradient(90deg, ${step.color} 0%, ${step.color}CC 100%)`
                      }}
                    >
                      {width > 15 && (
                        <span className="text-white font-medium text-sm">
                          {step.value} ({step.percentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Drop-off indicator */}
                  {index < chartData.length - 1 && (
                    <div className="flex items-center justify-center mt-2 mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                        <span>
                          -{((chartData[index].value - chartData[index + 1].value) / chartData[index].value * 100).toFixed(1)}% pudotus
                        </span>
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Enhanced Conversion Rates */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div 
                className="absolute inset-0 opacity-5"
                style={{ backgroundColor: MASTER_COLORS.secondary[2] }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xl">👁️</div>
                  <span className="font-medium text-sm">Avausprosentti</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.secondary[2] }}>
                  {data.open_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.opened.toLocaleString()} / {data.total_sent.toLocaleString()} kutsua avattu
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div 
                className="absolute inset-0 opacity-5"
                style={{ backgroundColor: MASTER_COLORS.secondary[1] }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xl">✅</div>
                  <span className="font-medium text-sm">Valmistumisprosentti</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: MASTER_COLORS.secondary[1] }}>
                  {data.completion_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.completed.toLocaleString()} / {data.total_sent.toLocaleString()} kyselyä valmistunut
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MasterInsight
          icon="📊"
          title="Kutsujen tehokkuus"
          description={`Avausprosentti ${data.open_rate.toFixed(1)}% on ${
            data.open_rate > 50 ? 'erinomainen' :
            data.open_rate > 30 ? 'hyvä' :
            data.open_rate > 15 ? 'keskitasoinen' : 'matala'
          }. ${
            data.open_rate > 50 ? 'Kutsut toimivat hyvin!' :
            data.open_rate > 30 ? 'Hyvä tulos, voi optimoida edelleen.' :
            'Kutsujen sisältöä kannattaa parantaa.'
          }`}
          color={data.open_rate > 50 ? 'green' : data.open_rate > 30 ? 'blue' : data.open_rate > 15 ? 'yellow' : 'red'}
        />
        
        <MasterInsight
          icon="🎯"
          title="Konversio-optimointi"
          description={`Valmistumisprosentti ${data.completion_rate.toFixed(1)}% kertoo ${
            data.completion_rate > 25 ? 'erinomaisesta' :
            data.completion_rate > 15 ? 'hyvästä' :
            data.completion_rate > 10 ? 'kohtuullisesta' : 'matalasta'
          } konversiosta. ${
            data.completion_rate > 25 ? 'Kysely on hyvin suunniteltu!' :
            data.completion_rate > 15 ? 'Hyvä tulos, pieniä parannuksia voi tehdä.' :
            'Kyselyä kannattaa lyhentää tai yksinkertaistaa.'
          }`}
          color={data.completion_rate > 25 ? 'green' : data.completion_rate > 15 ? 'blue' : data.completion_rate > 10 ? 'yellow' : 'red'}
        />
      </div>
    </div>
  );
};

export default InvitationMetricsChart;
