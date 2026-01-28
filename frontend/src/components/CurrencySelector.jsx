import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const CurrencySelector = () => {
  const { t } = useTranslation();
  
  // European currencies matching available languages
  const currencies = [
    { code: 'EUR', symbol: '€', name: t('currencies.EUR') },
    { code: 'GBP', symbol: '£', name: t('currencies.GBP') },
    { code: 'CHF', symbol: 'CHF', name: t('currencies.CHF') },
    { code: 'PLN', symbol: 'zł', name: t('currencies.PLN') },
    { code: 'CZK', symbol: 'Kč', name: t('currencies.CZK') },
    { code: 'SEK', symbol: 'kr', name: t('currencies.SEK') },
    { code: 'NOK', symbol: 'kr', name: t('currencies.NOK') },
    { code: 'DKK', symbol: 'kr', name: t('currencies.DKK') },
  ];

  const [selectedCurrency, setSelectedCurrency] = React.useState(() => {
    return localStorage.getItem('currency') || 'EUR';
  });

  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  const changeCurrency = (code) => {
    setSelectedCurrency(code);
    localStorage.setItem('currency', code);
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: { currency: code } }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCurrency.symbol} {currentCurrency.code}</span>
          <span className="sm:hidden">{currentCurrency.symbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => changeCurrency(currency.code)}
            className={`cursor-pointer ${selectedCurrency === currency.code ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
          >
            <span className="mr-2 font-mono">{currency.symbol}</span>
            <span>{currency.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;

// Helper hook to get current currency
export const useCurrency = () => {
  const [currency, setCurrency] = React.useState(() => {
    return localStorage.getItem('currency') || 'EUR';
  });

  React.useEffect(() => {
    const handleCurrencyChange = (event) => {
      setCurrency(event.detail.currency);
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  const currencySymbols = {
    EUR: '€',
    GBP: '£',
    CHF: 'CHF',
    PLN: 'zł',
    CZK: 'Kč',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr'
  };

  return {
    currency,
    symbol: currencySymbols[currency] || '€',
    formatPrice: (amount) => {
      const symbol = currencySymbols[currency] || '€';
      if (['EUR', 'GBP'].includes(currency)) {
        return `${symbol}${amount}`;
      }
      return `${amount} ${symbol}`;
    }
  };
};
