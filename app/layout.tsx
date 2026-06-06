// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

import '@/app/globals.css';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import MissingEnvVars from '@/app/components/MissingEnvVars';
import { getMissingEnvVars, type MissingEnvVarInfo } from '@/app/envChecker';
import { ThemeLangProvider } from '@/app/components/ThemeLanguageProvider';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PixelPage Chat',
  description: 'Plataforma de WhatsApp Business API - PixelPage',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const missingEnvVars: MissingEnvVarInfo[] = getMissingEnvVars();

  if (missingEnvVars.length > 0) {
    return (
      <html lang="pt-BR">
        <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
          <MissingEnvVars missingVars={missingEnvVars} />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" />
      <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeLangProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <footer className="text-center px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-6">
            <span>© {new Date().getFullYear()} PixelPage Chat. Todos os direitos reservados.</span>
            {' · '}
            <a href="/privacy" className="text-gray-500 dark:text-gray-400 underline">
              Política de Privacidade
            </a>
          </footer>
        </ThemeLangProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
