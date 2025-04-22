import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";
import { Conversion } from "@shared/schema";

interface ConversionHistoryProps {
  showAll?: boolean;
}

export default function ConversionHistory({ showAll = false }: ConversionHistoryProps) {
  // Get conversion history with a limit unless showAll is true
  const { data: conversions = [], isLoading } = useQuery<Conversion[]>({
    queryKey: ['/api/conversions', showAll ? 'all' : 'recent'],
    refetchOnWindowFocus: false,
  });

  const displayConversions = showAll ? conversions : conversions.slice(0, 5);

  // Function to handle repeating a conversion
  const handleRepeatConversion = (conversion: Conversion) => {
    // This would trigger an event to update the converter component
    // In a real app, this would use a global state management solution or context
    const event = new CustomEvent('repeat-conversion', {
      detail: {
        amount: conversion.amount,
        fromCurrency: conversion.fromCurrency,
        toCurrency: conversion.toCurrency
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-neutral-700 mb-4">
          {showAll ? "Conversion History" : "Recent Conversions"}
        </h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="border border-neutral-200 rounded-md p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : displayConversions.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-neutral-200 rounded-md">
            <p className="text-neutral-500">No conversion history yet</p>
            <p className="text-sm text-neutral-400 mt-1">
              Your recent conversions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayConversions.map((conversion) => (
              <div key={conversion.id} className="border border-neutral-200 rounded-md p-4 hover:bg-neutral-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="font-semibold font-mono">
                        {formatCurrency(conversion.amount, conversion.fromCurrency, false)}
                      </span>
                      <ArrowRight className="h-4 w-4 mx-2 text-neutral-400" />
                      <span className="font-semibold text-primary font-mono">
                        {formatCurrency(conversion.result, conversion.toCurrency, false)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {new Date(conversion.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-400 hover:text-primary" 
                    onClick={() => handleRepeatConversion(conversion)}
                  >
                    <RefreshCcw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!showAll && conversions.length > 5 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline"
              className="inline-flex items-center px-4 py-2 text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary"
              onClick={() => window.dispatchEvent(new CustomEvent('show-all-history'))}
            >
              View All History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
