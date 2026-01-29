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
  
  // Available currencies
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  ];

  const [selectedCurrency, setSelectedCurrency] = React.useState(() => {
    return localStorage.getItem('currency') || 'USD';
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
    return localStorage.getItem('currency') || 'USD';
  });

  React.useEffect(() => {
    const handleCurrencyChange = (event) => {
      setCurrency(event.detail.currency);
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CHF: 'CHF'
  };

  return {
    currency,
    symbol: currencySymbols[currency] || '$',
    formatPrice: (amount) => {
      const symbol = currencySymbols[currency] || '$';
      return `${symbol}${amount}`;
    }
  };
};
