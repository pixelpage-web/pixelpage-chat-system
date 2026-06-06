'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark';
type Language = 'pt' | 'en' | 'es';

interface ThemeLangContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// ─── Translations ─────────────────────────────────────────────────────────────
const translations: Record<Language, Record<string, string>> = {
  pt: {
    'nav.configuration': 'Configuração',
    'nav.webhooks': 'Meus Webhooks',
    'nav.paidMessages': 'Mensagens Pagas',
    'nav.inbox': 'Minha Caixa',
    'nav.wabas': 'Meus WABAs',
    'nav.pages': 'Minhas Páginas',
    'nav.adAccounts': 'Contas de Anúncio',
    'nav.datasets': 'Datasets',
    'nav.catalogs': 'Catálogos',
    'nav.instagram': 'Instagram',
    'nav.devTools': 'FERRAMENTAS DEV',
    'nav.sampleProducts': 'PRODUTOS DE EXEMPLO',
    'nav.myAssets': 'MEUS ATIVOS',
    'theme.light': 'Modo Claro',
    'theme.dark': 'Modo Escuro',
    'lang.select': 'Idioma',
  },
  en: {
    'nav.configuration': 'Configuration',
    'nav.webhooks': 'My Webhooks',
    'nav.paidMessages': 'Send Paid Messages',
    'nav.inbox': 'My Inbox',
    'nav.wabas': 'My WABAs',
    'nav.pages': 'My Pages',
    'nav.adAccounts': 'My Ad Accounts',
    'nav.datasets': 'My Datasets',
    'nav.catalogs': 'My Catalogs',
    'nav.instagram': 'My Instagram Accounts',
    'nav.devTools': 'DEVELOPER TOOLS',
    'nav.sampleProducts': 'SAMPLE PRODUCTS',
    'nav.myAssets': 'MY ASSETS',
    'theme.light': 'Light Mode',
    'theme.dark': 'Dark Mode',
    'lang.select': 'Language',
  },
  es: {
    'nav.configuration': 'Configuración',
    'nav.webhooks': 'Mis Webhooks',
    'nav.paidMessages': 'Mensajes Pagados',
    'nav.inbox': 'Mi Bandeja',
    'nav.wabas': 'Mis WABAs',
    'nav.pages': 'Mis Páginas',
    'nav.adAccounts': 'Cuentas de Anuncios',
    'nav.datasets': 'Datasets',
    'nav.catalogs': 'Catálogos',
    'nav.instagram': 'Instagram',
    'nav.devTools': 'HERRAMIENTAS DEV',
    'nav.sampleProducts': 'PRODUCTOS DE EJEMPLO',
    'nav.myAssets': 'MIS ACTIVOS',
    'theme.light': 'Modo Claro',
    'theme.dark': 'Modo Oscuro',
    'lang.select': 'Idioma',
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeLangContext = createContext<ThemeLangContextType | undefined>(undefined);

export function ThemeLangProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    const savedTheme = localStorage.getItem('pixelpage-theme') as Theme;
    const savedLang = localStorage.getItem('pixelpage-lang') as Language;
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pixelpage-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pixelpage-lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleSetLanguage = (lang: Language) => setLanguage(lang);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <ThemeLangContext.Provider value={{ theme, language, toggleTheme, setLanguage: handleSetLanguage, t }}>
      {children}
    </ThemeLangContext.Provider>
  );
}

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext);
  if (!ctx) throw new Error('useThemeLang must be used within ThemeLangProvider');
  return ctx;
}
