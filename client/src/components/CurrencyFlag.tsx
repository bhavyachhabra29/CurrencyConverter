import { cn } from "@/lib/utils";

interface CurrencyFlagProps {
  currencyCode: string;
  className?: string;
}

// Map of currency codes to country codes (for flag display)
const currencyToCountryMap: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  AUD: "au",
  CAD: "ca",
  CHF: "ch",
  CNY: "cn",
  INR: "in",
  BTC: "btc", // Special case for Bitcoin
  // Add more mappings as needed
};

export function CurrencyFlag({ currencyCode, className }: CurrencyFlagProps) {
  // Default to the currency code if no mapping exists
  const countryCode = currencyToCountryMap[currencyCode] || currencyCode.toLowerCase().slice(0, 2);
  
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center",
        className
      )}
    >
      {countryCode === "btc" ? (
        // Bitcoin logo
        <svg viewBox="0 0 24 24" fill="#F7931A" width="24" height="24">
          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.55-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" />
        </svg>
      ) : (
        // Regular country flag
        <img
          src={`https://flagcdn.com/w20/${countryCode}.png`}
          alt={`${currencyCode} flag`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback for missing flags
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E";
          }}
        />
      )}
    </div>
  );
}
