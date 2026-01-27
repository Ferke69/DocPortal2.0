import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇬🇧' },
    { code: 'sl', name: t('languages.sl'), flag: '🇸🇮' },
    { code: 'de', name: t('languages.de'), flag: '🇩🇪' },
    { code: 'fr', name: t('languages.fr'), flag: '🇫🇷' },
    { code: 'es', name: t('languages.es'), flag: '🇪🇸' },
    { code: 'it', name: t('languages.it'), flag: '🇮🇹' },
    { code: 'pt', name: t('languages.pt'), flag: '🇵🇹' },
    { code: 'nl', name: t('languages.nl'), flag: '🇳🇱' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer ${i18n.language === lang.code ? 'bg-blue-50' : ''}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
