import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CurrencyFlag } from "./CurrencyFlag";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ArrowLeftRight } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";
import { CurrencyPair } from "@/types/currency";
import { queryClient } from "@/lib/queryClient";

interface CurrencyConverterProps {
  onCurrencyPairChange: (pair: CurrencyPair) => void;
}

interface Rate {
  rate: number;
  baseCurrency: string;
  targetCurrency: string;
  lastUpdated: string;
}

export default function CurrencyConverter({ onCurrencyPairChange }: CurrencyConverterProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");

  // Fetch supported currencies
  const { data: currencies = [], isLoading: currenciesLoading } = useQuery({
    queryKey: ['/api/currencies'],
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Fetch current exchange rate
  const { data: rateData, isLoading: rateLoading, refetch: refetchRate } = useQuery<Rate>({
    queryKey: ['/api/rate', `from=${fromCurrency}`, `to=${toCurrency}`],
    refetchOnWindowFocus: false,
  });

  // Save conversion
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!rateData) return null;
      
      return apiRequest('POST', '/api/conversions', {
        amount,
        fromCurrency,
        toCurrency,
        rate: rateData.rate,
        result: amount * rateData.rate
      });
    },
    onSuccess: () => {
      toast({
        title: "Conversion saved",
        description: "Your conversion has been saved to history",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save conversion",
        variant: "destructive",
      });
    }
  });

  // Handle currency pair change
  useEffect(() => {
    onCurrencyPairChange({ from: fromCurrency, to: toCurrency });
  }, [fromCurrency, toCurrency, onCurrencyPairChange]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? 0 : value);
  };

  const handleFromCurrencyChange = (value: string) => {
    setFromCurrency(value);
  };

  const handleToCurrencyChange = (value: string) => {
    setToCurrency(value);
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleConvertAndSave = () => {
    saveMutation.mutate();
  };

  const handleShareConversion = () => {
    if (!rateData) return;
    
    const text = `${amount} ${fromCurrency} = ${(amount * rateData.rate).toFixed(2)} ${toCurrency} (Rate: ${rateData.rate})`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Currency Conversion',
        text: text,
      }).catch(err => {
        console.error('Share failed:', err);
        copyToClipboard(text);
      });
    } else {
      copyToClipboard(text);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Conversion details copied to clipboard"
      });
    });
  };

  const convertedAmount = rateData ? amount * rateData.rate : 0;
  const lastUpdated = rateData?.lastUpdated ? new Date(rateData.lastUpdated).toLocaleString() : '';

  return (
    <Card className="bg-white shadow-md mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-neutral-700 mb-4">Convert Currency</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-neutral-600 mb-1">
              Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="focus:ring-primary focus:border-primary pl-4 pr-12 py-6 text-lg"
              />
            </div>
          </div>
          
          {/* From Currency */}
          <div>
            <Label htmlFor="from-currency" className="text-sm font-medium text-neutral-600 mb-1">
              From
            </Label>
            <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
              <SelectTrigger id="from-currency" className="w-full pl-10 pr-10 py-6">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <CurrencyFlag currencyCode={fromCurrency} />
                </div>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currenciesLoading ? (
                  <div className="flex justify-center p-2">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  currencies.map(([code, name]: [string, string]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center">
                        <CurrencyFlag currencyCode={code} className="mr-2" />
                        <span>{code} - {name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* To Currency */}
          <div>
            <Label htmlFor="to-currency" className="text-sm font-medium text-neutral-600 mb-1">
              To
            </Label>
            <Select value={toCurrency} onValueChange={handleToCurrencyChange}>
              <SelectTrigger id="to-currency" className="w-full pl-10 pr-10 py-6">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <CurrencyFlag currencyCode={toCurrency} />
                </div>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currenciesLoading ? (
                  <div className="flex justify-center p-2">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  currencies.map(([code, name]: [string, string]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center">
                        <CurrencyFlag currencyCode={code} className="mr-2" />
                        <span>{code} - {name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Swap Button */}
        <div className="flex justify-center my-4">
          <Button 
            variant="outline"
            size="icon"
            onClick={handleSwapCurrencies}
            className="rounded-full bg-primary text-white hover:bg-primary-dark"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Result Card */}
        <div className="bg-neutral-100 rounded-lg p-6 mt-4">
          <div className="text-center">
            {rateLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-3 w-40 mx-auto" />
              </div>
            ) : (
              <>
                <div className="flex justify-center items-baseline">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(convertedAmount, toCurrency)}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-2">
                  {amount} {fromCurrency} = {rateData?.rate.toFixed(4)} {toCurrency}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Last updated: {lastUpdated}
                </p>
              </>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleConvertAndSave}
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={rateLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Convert & Save
            </Button>
            <Button 
              variant="outline"
              onClick={handleShareConversion}
              className="w-full"
              disabled={rateLoading}
            >
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
