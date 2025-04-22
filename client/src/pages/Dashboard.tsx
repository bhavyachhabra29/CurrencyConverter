import { useState } from "react";
import CurrencyConverter from "@/components/CurrencyConverter";
import TabNavigation from "@/components/TabNavigation";
import HistoricalRatesChart from "@/components/HistoricalRatesChart";
import ForecastChart from "@/components/ForecastChart";
import ConversionHistory from "@/components/ConversionHistory";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CurrencyPair } from "@/types/currency";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("historical");
  const [currencyPair, setCurrencyPair] = useState<CurrencyPair>({
    from: "USD",
    to: "EUR"
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Currency Converter */}
      <CurrencyConverter 
        onCurrencyPairChange={setCurrencyPair}
      />

      {/* Tabs Navigation */}
      <div className="mb-8">
        <TabNavigation 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="historical">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <HistoricalRatesChart 
              fromCurrency={currencyPair.from} 
              toCurrency={currencyPair.to} 
              className="lg:col-span-2"
            />
            <ConversionHistory />
          </div>
        </TabsContent>
        
        <TabsContent value="forecast">
          <ForecastChart 
            fromCurrency={currencyPair.from} 
            toCurrency={currencyPair.to} 
          />
        </TabsContent>
        
        <TabsContent value="history">
          <div className="bg-white rounded-lg shadow-md p-6">
            <ConversionHistory showAll={true} />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
