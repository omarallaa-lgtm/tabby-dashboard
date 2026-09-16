'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { KpiMetric } from '@/lib/mock-data';

interface StatCardProps {
  metric: KpiMetric;
  delay?: number;
}

export function StatCard({ metric, delay = 0 }: StatCardProps) {
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    metric.id === 'dsat' || metric.id === 'aht'
      ? metric.trend === 'up' ? 'text-red-500' : 'text-green-600'
      : metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  const isNegative = metric.id === 'dsat' || metric.id === 'aht';

  return (
    <Card
      className="relative overflow-hidden p-5 transition-all hover:shadow-md animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{metric.value}</p>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            trendColor,
            metric.trend === 'up' && !isNegative && 'bg-green-50 dark:bg-green-950/30',
            metric.trend === 'up' && isNegative && 'bg-red-50 dark:bg-red-950/30',
            metric.trend === 'down' && !isNegative && 'bg-red-50 dark:bg-red-950/30',
            metric.trend === 'down' && isNegative && 'bg-green-50 dark:bg-green-950/30',
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {metric.trendValue}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{metric.trendLabel}</span>
        <span className="text-xs font-medium text-muted-foreground">Target: {metric.target}</span>
      </div>

      <div className="mt-3 flex items-end gap-1 h-8">
        {metric.sparkline.map((val, i) => {
          const max = Math.max(...metric.sparkline);
          const min = Math.min(...metric.sparkline);
          const range = max - min || 1;
          const height = ((val - min) / range) * 100;
          const isLast = i === metric.sparkline.length - 1;
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t-sm transition-all',
                isLast ? 'bg-primary' : 'bg-primary/30'
              )}
              style={{ height: `${Math.max(height, 8)}%` }}
            />
          );
        })}
      </div>
    </Card>
  );
}
