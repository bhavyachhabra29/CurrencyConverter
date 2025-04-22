interface StatisticsProps {
  statistics: {
    average: number;
    min: number;
    max: number;
    volatility: number;
  };
}

export default function Statistics({ statistics }: StatisticsProps) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-medium text-neutral-700 mb-3">Statistics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-neutral-100 p-3 rounded-md">
          <div className="text-xs text-neutral-500">Average</div>
          <div className="text-lg font-semibold text-primary font-mono">
            {statistics.average.toFixed(4)}
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded-md">
          <div className="text-xs text-neutral-500">Lowest</div>
          <div className="text-lg font-semibold text-error font-mono">
            {statistics.min.toFixed(4)}
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded-md">
          <div className="text-xs text-neutral-500">Highest</div>
          <div className="text-lg font-semibold text-success font-mono">
            {statistics.max.toFixed(4)}
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded-md">
          <div className="text-xs text-neutral-500">Volatility</div>
          <div className="text-lg font-semibold text-warning font-mono">
            {statistics.volatility.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
