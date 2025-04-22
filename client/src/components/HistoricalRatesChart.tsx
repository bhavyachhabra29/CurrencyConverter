import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import Chart from "chart.js/auto";
import { cn } from "@/lib/utils";
import Statistics from "@/components/Statistics";

interface HistoricalRatesChartProps {
  fromCurrency: string;
  toCurrency: string;
  className?: string;
}

interface HistoricalDataResponse {
  rates: {
    date: string;
    rate: number;
  }[];
  statistics: {
    average: number;
    min: number;
    max: number;
    volatility: number;
  };
}

export default function HistoricalRatesChart({ 
  fromCurrency, 
  toCurrency, 
  className 
}: HistoricalRatesChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [period, setPeriod] = useState("30");

  const { data, isLoading } = useQuery<HistoricalDataResponse>({
    queryKey: ['/api/historical', `from=${fromCurrency}`, `to=${toCurrency}`, `days=${period}`],
    refetchOnWindowFocus: false,
    enabled: !!fromCurrency && !!toCurrency,
  });

  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current || !data?.rates?.length) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const dates = data.rates.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const rates = data.rates.map(item => item.rate);

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: `${fromCurrency} to ${toCurrency}`,
          data: rates,
          borderColor: 'hsl(var(--primary))',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `Rate: ${context.raw.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 7,
              maxRotation: 0
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              precision: 4
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, fromCurrency, toCurrency]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  return (
    <Card className={cn("bg-white shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-700">Historical Rates</h2>
          <div className="flex items-center">
            <span className="text-sm text-neutral-500 mr-3">Past {period} days</span>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="15">15 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="relative h-[300px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <canvas ref={chartRef} />
          )}
        </div>
        
        <div className="mt-4 flex justify-between text-sm text-neutral-500">
          {data?.rates && data.rates.length > 0 && (
            <>
              <div>{new Date(data.rates[0].date).toLocaleDateString()}</div>
              <div>{new Date(data.rates[data.rates.length - 1].date).toLocaleDateString()}</div>
            </>
          )}
        </div>
        
        {data?.statistics && (
          <Statistics statistics={data.statistics} />
        )}
      </CardContent>
    </Card>
  );
}
