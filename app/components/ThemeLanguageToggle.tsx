'use client';

import { useThemeLang } from './ThemeLanguageProvider';

const flags: Record<string, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };

export default function ThemeLanguageToggle() {
  const { theme, language, toggleTheme, setLanguage, t } = useThemeLang();

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        className="flex items-center justify-center w-8 h-8 rounded-lg
          bg-gray-100 dark:bg-gray-700
          hover:bg-gray-200 dark:hover:bg-gray-600
          text-gray-600 dark:text-gray-300
          transition-colors duration-200"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Language selector */}
      <div className="flex gap-1">
        {(['pt', 'en', 'es'] as const).map(lang => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            title={lang.toUpperCase()}
            className={`text-sm w-7 h-7 rounded-md flex items-center justify-center
              transition-colors duration-200
              ${language === lang
                ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {flags[lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
