/**
 * Format a number as currency with the appropriate currency code
 * @param amount Amount to format
 * @param currencyCode Currency code (e.g., USD, EUR)
 * @param includeSymbol Whether to include the currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string, includeSymbol = true): string {
  // Currency formatting options
  const options: Intl.NumberFormatOptions = {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };

  // Special handling for cryptocurrencies
  if (currencyCode === 'BTC') {
    options.maximumFractionDigits = 8;
    return includeSymbol 
      ? `₿${amount.toFixed(8)}`
      : amount.toFixed(8);
  }

  try {
    return new Intl.NumberFormat('en-US', options).format(amount);
  } catch (error) {
    // Fallback if currency code is not supported
    return includeSymbol 
      ? `${currencyCode} ${amount.toFixed(2)}`
      : amount.toFixed(2);
  }
}

/**
 * Get a country code from a currency code for flag display
 * @param currencyCode Currency code (e.g., USD, EUR)
 * @returns Country code for flag (e.g., us, eu)
 */
export function getCurrencyCountryCode(currencyCode: string): string {
  const map: Record<string, string> = {
    USD: 'us',
    EUR: 'eu',
    GBP: 'gb',
    JPY: 'jp',
    AUD: 'au',
    CAD: 'ca',
    CHF: 'ch',
    CNY: 'cn',
    HKD: 'hk',
    NZD: 'nz',
    SEK: 'se',
    KRW: 'kr',
    SGD: 'sg',
    NOK: 'no',
    MXN: 'mx',
    INR: 'in',
    RUB: 'ru',
    ZAR: 'za',
    TRY: 'tr',
    BRL: 'br',
    TWD: 'tw',
    DKK: 'dk',
    PLN: 'pl',
    THB: 'th',
    IDR: 'id',
    HUF: 'hu',
    CZK: 'cz',
    ILS: 'il',
    CLP: 'cl',
    PHP: 'ph',
    AED: 'ae',
    COP: 'co',
    SAR: 'sa',
    MYR: 'my',
    RON: 'ro',
  };

  return map[currencyCode] || currencyCode.toLowerCase().slice(0, 2);
}

/**
 * Get currency name from currency code
 * @param currencyCode Currency code (e.g., USD, EUR)
 * @returns Currency name (e.g., US Dollar, Euro)
 */
export function getCurrencyName(currencyCode: string): string {
  const map: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    HKD: 'Hong Kong Dollar',
    NZD: 'New Zealand Dollar',
    SEK: 'Swedish Krona',
    KRW: 'South Korean Won',
    SGD: 'Singapore Dollar',
    NOK: 'Norwegian Krone',
    MXN: 'Mexican Peso',
    INR: 'Indian Rupee',
    RUB: 'Russian Ruble',
    ZAR: 'South African Rand',
    TRY: 'Turkish Lira',
    BRL: 'Brazilian Real',
    TWD: 'Taiwan Dollar',
    DKK: 'Danish Krone',
    PLN: 'Polish Zloty',
    THB: 'Thai Baht',
    IDR: 'Indonesian Rupiah',
    HUF: 'Hungarian Forint',
    CZK: 'Czech Koruna',
    ILS: 'Israeli Shekel',
    CLP: 'Chilean Peso',
    PHP: 'Philippine Peso',
    AED: 'UAE Dirham',
    COP: 'Colombian Peso',
    SAR: 'Saudi Riyal',
    MYR: 'Malaysian Ringgit',
    RON: 'Romanian Leu',
    BTC: 'Bitcoin',
  };

  return map[currencyCode] || 'Unknown Currency';
}
