import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Chart from "chart.js/auto";

interface ForecastChartProps {
  fromCurrency: string;
  toCurrency: string;
}

interface ForecastDataResponse {
  forecast: {
    date: string;
    rate: number;
  }[];
  analysis: {
    percentChange: number;
    direction: "up" | "down" | "stable";
    confidence: number;
    expectedHigh: number;
    expectedLow: number;
  };
}

export default function ForecastChart({ fromCurrency, toCurrency }: ForecastChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const { data, isLoading } = useQuery<ForecastDataResponse>({
    queryKey: ['/api/forecast', `from=${fromCurrency}`, `to=${toCurrency}`],
    refetchOnWindowFocus: false,
    enabled: !!fromCurrency && !!toCurrency,
  });

  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current || !data?.forecast?.length) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const dates = data.forecast.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const rates = data.forecast.map(item => item.rate);
    const upperBound = rates.map(rate => rate + (rate * 0.005));
    const lowerBound = rates.map(rate => rate - (rate * 0.005));

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Forecast',
            data: rates,
            borderColor: 'hsl(var(--primary))',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: 'Upper Bound',
            data: upperBound,
            borderColor: 'transparent',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            borderWidth: 0,
            fill: 0,
            pointRadius: 0,
            pointHoverRadius: 0
          },
          {
            label: 'Lower Bound',
            data: lowerBound,
            borderColor: 'transparent',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            borderWidth: 0,
            fill: 0,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
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
                if (context.datasetIndex === 0) {
                  return `Forecast: ${context.raw.toFixed(4)}`;
                }
                return false;
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

  // Get direction class for styling
  const getDirectionClass = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-700">Future Forecast</h2>
          <div className="flex items-center">
            <span className="text-sm text-neutral-500 mr-3">{fromCurrency} to {toCurrency}</span>
            <span className="text-xs bg-neutral-100 py-1 px-2 rounded text-neutral-600">Based on trend analysis</span>
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
          {data?.forecast && data.forecast.length > 0 && (
            <>
              <div>{new Date(data.forecast[0].date).toLocaleDateString()}</div>
              <div>{new Date(data.forecast[data.forecast.length - 1].date).toLocaleDateString()}</div>
            </>
          )}
        </div>
        
        {data?.analysis && (
          <div className="mt-6 bg-neutral-100 p-4 rounded-lg">
            <h3 className="text-base font-medium text-neutral-700 mb-2">Forecast Analysis</h3>
            <p className="text-sm text-neutral-600">
              Based on historical data and current economic indicators, the {fromCurrency} to {toCurrency} rate is expected to 
              <span className={`${getDirectionClass(data.analysis.direction)} font-medium mx-1`}>
                {data.analysis.direction === 'up' ? 'increase' : data.analysis.direction === 'down' ? 'decrease' : 'remain stable'} 
                by approximately {Math.abs(data.analysis.percentChange).toFixed(1)}%
              </span> 
              over the next 30 days. 
              Major factors influencing this forecast include recent central bank policy decisions 
              and changing interest rate differentials.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-neutral-500">Confidence</div>
                <div className="text-lg font-semibold text-primary">
                  {data.analysis.confidence}%
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-neutral-500">Direction</div>
                <div className={`text-lg font-semibold ${getDirectionClass(data.analysis.direction)}`}>
                  {data.analysis.direction === 'up' ? 'Upward' : data.analysis.direction === 'down' ? 'Downward' : 'Stable'}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-neutral-500">Expected High</div>
                <div className="text-lg font-semibold font-mono text-primary">
                  {data.analysis.expectedHigh.toFixed(4)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-xs text-neutral-500">Expected Low</div>
                <div className="text-lg font-semibold font-mono text-primary">
                  {data.analysis.expectedLow.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
