import { cn } from "@/lib/utils";

interface TabNavigationProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  const tabs = [
    { id: "historical", label: "Historical Rates" },
    { id: "forecast", label: "Future Forecast" },
    { id: "history", label: "Conversion History" }
  ];

  return (
    <div className="border-b border-neutral-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:text-primary hover:border-neutral-300"
            )}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
